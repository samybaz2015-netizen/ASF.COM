using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;

namespace ASF.Api.Controllers
{
    /// <summary>
    /// يستقبل الـ URLs القديمة بصيغة /Photos/{folder}/{filename}
    /// ويبحث عنها في Google Drive ثم يعمل Redirect للرابط الصحيح.
    /// هذا يضمن توافق الملفات القديمة المنقولة للـ Drive مع الـ API.
    /// </summary>
    [ApiController]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly GoogleDriveOAuthService _googleDrive;
        private readonly ApplicationDbContext _context;
        private readonly AppIdentityDbContext _identityDb;
        private readonly ILogger<FilesController> _logger;

        public FilesController(
            GoogleDriveOAuthService googleDrive, 
            ApplicationDbContext context, 
            AppIdentityDbContext identityDb, 
            ILogger<FilesController> logger)
        {
            _googleDrive = googleDrive;
            _context = context;
            _identityDb = identityDb;
            _logger = logger;
        }


        /// <summary>
        /// Proxy للملفات القديمة: GET /Photos/{folder}/{filename}
        /// يبحث عن الملف في Google Drive ويعمل Redirect لرابط Drive.
        /// </summary>
        [HttpGet("Photos/{folder}/{filename}")]
        public async Task<IActionResult> GetPhoto(string folder, string filename)
        {
            try
            {
                var driveUrl = await _googleDrive.GetPhotosDriveUrlAsync(folder, filename);

                if (driveUrl == null)
                {
                    _logger.LogWarning("File not found in Drive: Photos/{Folder}/{Filename}", folder, filename);
                    return NotFound(new { message = $"الملف غير موجود: Photos/{folder}/{filename}" });
                }

                return Redirect(driveUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error looking up file in Drive: Photos/{Folder}/{Filename}", folder, filename);
                return StatusCode(500, new { message = "خطأ في البحث عن الملف" });
            }
        }

        /// <summary>
        /// يشتغل مرة واحدة فقط: يسكان كل URLs الصور القديمة والملفات المرفوعة في الـ DB
        /// ويحدّثها بـ Google Drive URLs المناسبة من جميع المجلدات (Photos, uploads, TestModels, إلخ).
        /// POST /api/files/migrate-to-drive
        /// </summary>
        [HttpPost("api/files/migrate-to-drive")]
        public async Task<IActionResult> MigratePhotosToDrive()
        {
            int updated = 0;
            int notFound = 0;
            int skipped = 0;
            var errors = new List<string>();

            // ===== 1. بناء Cache لكل الملفات الموجودة في Drive في جميع المجلدات =====
            // fileCache[folderName] = Dictionary<fileName, driveFileId>
            var fileCache = new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);

            try
            {
                var driveService = _googleDrive.GetDriveService();
                var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
                var rootFolderId = configuration["GoogleDrive:RootFolderId"]
                    ?? throw new InvalidOperationException("GoogleDrive:RootFolderId is missing");

                // 1. جيب كل المجلدات في المستوى الأول تحت الـ Root (مثل Photos, uploads, TestModels, LeaveFiles)
                var topFolders = await ListAllFilesAsync(driveService, 
                    $"mimeType='application/vnd.google-apps.folder' and '{rootFolderId}' in parents and trashed=false", 
                    "files(id,name)");

                foreach (var topFolder in topFolders)
                {
                    // لو المجلد هو Photos، نجيب المجلدات الفرعية اللي جواه (مثل UserImage, SitePhotosForEmergency...)
                    if (topFolder.Name.Equals("Photos", StringComparison.OrdinalIgnoreCase))
                    {
                        var subFolders = await ListAllFilesAsync(driveService, 
                            $"mimeType='application/vnd.google-apps.folder' and '{topFolder.Id}' in parents and trashed=false", 
                            "files(id,name)");

                        foreach (var subFolder in subFolders)
                        {
                            await CacheFolderFilesAsync(driveService, subFolder.Id, subFolder.Name, fileCache);
                        }
                    }
                    else
                    {
                        // لو مجلد رئيسي تاني زي uploads أو TestModels، نعمل كاش لملفاته مباشرة باسم المجلد
                        await CacheFolderFilesAsync(driveService, topFolder.Id, topFolder.Name, fileCache);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"فشل تحميل ملفات Drive: {ex.Message}" });
            }

            // دالة مساعدة عامة لجلب كل الملفات مع التعامل مع ترقيم الصفحات (Pagination)
            async Task<List<Google.Apis.Drive.v3.Data.File>> ListAllFilesAsync(Google.Apis.Drive.v3.DriveService service, string query, string fields)
            {
                var files = new List<Google.Apis.Drive.v3.Data.File>();
                string? nextPageToken = null;
                do
                {
                    var req = service.Files.List();
                    req.Q = query;
                    req.Fields = $"nextPageToken, {fields}";
                    req.PageSize = 1000;
                    req.PageToken = nextPageToken;

                    var result = await req.ExecuteAsync();
                    if (result.Files != null)
                    {
                        files.AddRange(result.Files);
                    }
                    nextPageToken = result.NextPageToken;
                } while (nextPageToken != null);
                return files;
            }

            // دالة مساعدة لجلب ملفات مجلد معين وحفظها في الكاش
            async Task CacheFolderFilesAsync(Google.Apis.Drive.v3.DriveService service, string folderId, string folderName, Dictionary<string, Dictionary<string, string>> cache)
            {
                var files = await ListAllFilesAsync(service, $"'{folderId}' in parents and trashed=false", "files(id,name)");

                var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                foreach (var file in files)
                {
                    if (!dict.ContainsKey(file.Name))
                    {
                        dict[file.Name] = file.Id;
                    }
                }

                cache[folderName] = dict;
            }

            // ===== 2. دالة مساعدة لترجمة الـ URLs القديمة لروابط Drive =====
            string? LookupDriveUrl(string? url)
            {
                if (string.IsNullOrWhiteSpace(url)) return null;

                // 1. لو الرابط فيه uc?id= بالفعل، نقدر نستخلص الـ fileId مباشرة ونحوله لرابط view
                if (url.Contains("drive.google.com/uc?id="))
                {
                    var match = System.Text.RegularExpressions.Regex.Match(url, @"[-\w]{25,}");
                    if (match.Success)
                    {
                        return $"https://drive.google.com/file/d/{match.Value}/view";
                    }
                }

                // 2. لو الرابط مسار Drive صحيح، نتخطاه
                if (url.StartsWith("https://drive.google.com")) return null;

                // 3. تحليل مسارات الصور والملفات
                string folder = "";
                string filename = "";

                // حالة 1: /Photos/folder/filename
                if (url.StartsWith("/Photos/", StringComparison.OrdinalIgnoreCase))
                {
                    var parts = url.TrimStart('/').Split('/');
                    if (parts.Length >= 3)
                    {
                        folder = parts[1];
                        filename = parts[2];
                    }
                }
                // حالة 2: /uploads/filename أو رابط uploads الكامل http://api.asf-consulting.com/uploads/...
                else if (url.Contains("/uploads/", StringComparison.OrdinalIgnoreCase))
                {
                    folder = "uploads";
                    filename = url.Substring(url.LastIndexOf('/') + 1);
                }
                // حالة 3: /TestModels/filename
                else if (url.Contains("/TestModels/", StringComparison.OrdinalIgnoreCase))
                {
                    folder = "TestModels";
                    filename = url.Substring(url.LastIndexOf('/') + 1);
                }
                else
                {
                    // لو اسم ملف فقط بدون مسارات
                    filename = url.Substring(url.LastIndexOf('/') + 1);
                    // هنجرب ندور عليه في كل الكاش لو موجود
                    foreach (var pair in fileCache)
                    {
                        if (pair.Value.TryGetValue(filename, out var fId))
                        {
                            return $"https://drive.google.com/file/d/{fId}/view";
                        }
                    }
                    return null;
                }

                if (string.IsNullOrEmpty(folder) || string.IsNullOrEmpty(filename)) return null;

                folder = Uri.UnescapeDataString(folder);
                filename = Uri.UnescapeDataString(filename);

                if (!fileCache.TryGetValue(folder, out var folderFiles)) return null;
                if (!folderFiles.TryGetValue(filename, out var fileId)) return null;

                return $"https://drive.google.com/file/d/{fileId}/view";
            }

            void TryMigrate(string? url, Action<string> setter)
            {
                if (string.IsNullOrWhiteSpace(url)) return;

                // لو الرابط فيه uc?id= القديم، نصلحه لـ view
                if (url.Contains("drive.google.com/uc?id="))
                {
                    var viewUrl = LookupDriveUrl(url);
                    if (viewUrl != null)
                    {
                        setter(viewUrl);
                        updated++;
                        return;
                    }
                }

                if (url.StartsWith("https://drive.google.com")) { skipped++; return; }

                var driveUrl = LookupDriveUrl(url);
                if (driveUrl == null) { notFound++; return; }

                setter(driveUrl);
                updated++;
            }

            // ===== 3. تحديث الكيانات وقواعد البيانات =====

            // 1. تحديث مستخدمين النظام (AppUsers)
            var users = await _identityDb.Users.ToListAsync();
            foreach (var u in users)
            {
                TryMigrate(u.UserImage, val => u.UserImage = val);
            }


            // 2. تحديث Emergency
            var emergencies = await _context.Emergencys.ToListAsync();
            foreach (var e in emergencies)
            {
                TryMigrate(e.UserImage, val => e.UserImage = val);
                TryMigrate(e.OrderType, val => e.OrderType = val);
            }

            // 3. تحديث NewProjects
            var newProjects = await _context.NewProjects.ToListAsync();
            foreach (var np in newProjects)
            {
                TryMigrate(np.UserImage, val => np.UserImage = val);
                TryMigrate(np.OrderType, val => np.OrderType = val);
            }

            // 4. تحديث PrivateProjects
            var privProjects = await _context.PrivateProjects.ToListAsync();
            foreach (var pp in privProjects)
            {
                TryMigrate(pp.UserImage, val => pp.UserImage = val);
            }


            // 5. تحديث Construction
            var constructions = await _context.Constructions.ToListAsync();
            foreach (var c in constructions)
            {
                TryMigrate(c.UserImage, val => c.UserImage = val);
                TryMigrate(c.OrderType, val => c.OrderType = val);
            }

            // 6. تحديث Maintenance
            var maintenances = await _context.Maintenances.ToListAsync();
            foreach (var m in maintenances)
            {
                TryMigrate(m.UserImage, val => m.UserImage = val);
                TryMigrate(m.OrderType, val => m.OrderType = val);
            }

            // 7. تحديث جداول الصور الفرعية (Emergency)
            foreach (var p in await _context.ModelPhotosForEmergency.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.SitePhotosForEmergency.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.SafetyWastesForEmergency.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);

            // 8. تحديث جداول الصور الفرعية (NewProject)
            foreach (var p in await _context.ModelPhotosForNew.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.SitePhotosForNew.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.SafetyWastesNew.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);

            // 9. تحديث جداول الصور الفرعية (Construction)
            foreach (var p in await _context.ModelPhotosForConstruction.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.SitePhotosForConstruction.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.SafetyWastesForConstruction.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);

            // 10. تحديث جداول الصور الفرعية (Maintenance)
            foreach (var p in await _context.ModelPhotosForMaintenance.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.SitePhotosForMaintenance.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.SafetyWastesForMaintenance.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);

            // 11. تحديث جداول الصور الفرعية (Private)
            foreach (var p in await _context.ModelPhotosForPrivate.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.SitePhotosForPrivate.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.SafetyWastesForPrivate.ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);

            // 12. تحديث جداول الموديلات التجريبية (ModelTests)
            foreach (var p in await _context.Set<ASF.Core.Entities.Emergency.ModelTestForEmergency>().ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.Set<ASF.Core.Entities.Construction.ModelTestForConstruction>().ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);
            foreach (var p in await _context.Set<ASF.Core.Entities.Maintenance.ModelTestForMaintenance>().ToListAsync())
                TryMigrate(p.Url, u => p.Url = u);

            await _context.SaveChangesAsync();
            await _identityDb.SaveChangesAsync();


            return Ok(new
            {
                message = "تم الترحيل الشامل بنجاح ✅",
                updatedCount = updated,
                notFoundInDrive = notFound,
                alreadyDriveUrls = skipped,
                mappedFolders = fileCache.Keys.ToList(),
                errors
            });
        }

        /// <summary>
        /// يجعل جميع الملفات والمجلدات في Google Drive عامة للجميع للقراءة.
        /// POST /api/files/make-all-public
        /// </summary>
        [HttpPost("api/files/make-all-public")]
        public async Task<IActionResult> MakeAllFilesPublic()
        {
            try
            {
                // 1. Make all files under the root folder public on Google Drive
                await _googleDrive.MakeAllFilesPublicAsync();

                // 2. Scan all database tables for any Google Drive links and make them public
                int dbUrlsProcessed = 0;
                var urls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                // Helper to collect URLs
                void AddUrl(string? url)
                {
                    if (!string.IsNullOrWhiteSpace(url) && url.Contains("drive.google.com"))
                    {
                        urls.Add(url);
                    }
                }

                // Collect from AppUsers
                var users = await _identityDb.Users.Select(u => u.UserImage).ToListAsync();
                foreach (var u in users) AddUrl(u);

                // Collect from Emergency
                var emergencies = await _context.Emergencys.Select(e => new { e.UserImage, e.OrderType }).ToListAsync();
                foreach (var e in emergencies)
                {
                    AddUrl(e.UserImage);
                    AddUrl(e.OrderType);
                }

                // Collect from NewProjects
                var newProjects = await _context.NewProjects.Select(np => new { np.UserImage, np.OrderType }).ToListAsync();
                foreach (var np in newProjects)
                {
                    AddUrl(np.UserImage);
                    AddUrl(np.OrderType);
                }

                // Collect from PrivateProjects
                var privProjects = await _context.PrivateProjects.Select(pp => pp.UserImage).ToListAsync();
                foreach (var pp in privProjects) AddUrl(pp);

                // Collect from Construction
                var constructions = await _context.Constructions.Select(c => new { c.UserImage, c.OrderType }).ToListAsync();
                foreach (var c in constructions)
                {
                    AddUrl(c.UserImage);
                    AddUrl(c.OrderType);
                }

                // Collect from Maintenance
                var maintenances = await _context.Maintenances.Select(m => new { m.UserImage, m.OrderType }).ToListAsync();
                foreach (var m in maintenances)
                {
                    AddUrl(m.UserImage);
                    AddUrl(m.OrderType);
                }

                // Collect from photo tables
                var modelPhotosEmergency = await _context.ModelPhotosForEmergency.Select(p => p.Url).ToListAsync();
                foreach (var p in modelPhotosEmergency) AddUrl(p);
                var sitePhotosEmergency = await _context.SitePhotosForEmergency.Select(p => p.Url).ToListAsync();
                foreach (var p in sitePhotosEmergency) AddUrl(p);
                var safetyWastesEmergency = await _context.SafetyWastesForEmergency.Select(p => p.Url).ToListAsync();
                foreach (var p in safetyWastesEmergency) AddUrl(p);

                var modelPhotosNew = await _context.ModelPhotosForNew.Select(p => p.Url).ToListAsync();
                foreach (var p in modelPhotosNew) AddUrl(p);
                var sitePhotosNew = await _context.SitePhotosForNew.Select(p => p.Url).ToListAsync();
                foreach (var p in sitePhotosNew) AddUrl(p);
                var safetyWastesNew = await _context.SafetyWastesNew.Select(p => p.Url).ToListAsync();
                foreach (var p in safetyWastesNew) AddUrl(p);

                var modelPhotosConst = await _context.ModelPhotosForConstruction.Select(p => p.Url).ToListAsync();
                foreach (var p in modelPhotosConst) AddUrl(p);
                var sitePhotosConst = await _context.SitePhotosForConstruction.Select(p => p.Url).ToListAsync();
                foreach (var p in sitePhotosConst) AddUrl(p);
                var safetyWastesConst = await _context.SafetyWastesForConstruction.Select(p => p.Url).ToListAsync();
                foreach (var p in safetyWastesConst) AddUrl(p);

                var modelPhotosMaint = await _context.ModelPhotosForMaintenance.Select(p => p.Url).ToListAsync();
                foreach (var p in modelPhotosMaint) AddUrl(p);
                var sitePhotosMaint = await _context.SitePhotosForMaintenance.Select(p => p.Url).ToListAsync();
                foreach (var p in sitePhotosMaint) AddUrl(p);
                var safetyWastesMaint = await _context.SafetyWastesForMaintenance.Select(p => p.Url).ToListAsync();
                foreach (var p in safetyWastesMaint) AddUrl(p);

                var modelPhotosPriv = await _context.ModelPhotosForPrivate.Select(p => p.Url).ToListAsync();
                foreach (var p in modelPhotosPriv) AddUrl(p);
                var sitePhotosPriv = await _context.SitePhotosForPrivate.Select(p => p.Url).ToListAsync();
                foreach (var p in sitePhotosPriv) AddUrl(p);
                var safetyWastesPriv = await _context.SafetyWastesForPrivate.Select(p => p.Url).ToListAsync();
                foreach (var p in safetyWastesPriv) AddUrl(p);

                var modelTestsEmergency = await _context.Set<ASF.Core.Entities.Emergency.ModelTestForEmergency>().Select(p => p.Url).ToListAsync();
                foreach (var p in modelTestsEmergency) AddUrl(p);
                var modelTestsConst = await _context.Set<ASF.Core.Entities.Construction.ModelTestForConstruction>().Select(p => p.Url).ToListAsync();
                foreach (var p in modelTestsConst) AddUrl(p);
                var modelTestsMaint = await _context.Set<ASF.Core.Entities.Maintenance.ModelTestForMaintenance>().Select(p => p.Url).ToListAsync();
                foreach (var p in modelTestsMaint) AddUrl(p);

                // Process all collected URLs
                foreach (var url in urls)
                {
                    var fileId = _googleDrive.ExtractDriveFileId(url);
                    if (!string.IsNullOrEmpty(fileId))
                    {
                        await _googleDrive.MakeFilePublicAsync(fileId);
                        dbUrlsProcessed++;
                    }
                }

                return Ok(new { message = "تم جعل جميع الملفات والمجلدات عامة بنجاح ✅", dbUrlsProcessed });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error making all files public on Google Drive");
                return StatusCode(500, new { message = $"فشل جعل الملفات عامة: {ex.Message}" });
            }
        }
    }
}

