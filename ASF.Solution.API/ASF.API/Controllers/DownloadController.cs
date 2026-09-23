//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using ASF.Repository.AppDbContext;
//using System.IO.Compression;

//namespace ASF.Api.Controllers
//{
//    public class DownloadFilesRequest
//    {
//        public string ProjectType { get; set; }
//        public List<SelectedFile> SelectedFiles { get; set; } = new();
//    }

//    public class SelectedFile
//    {
//        public int Id { get; set; }
//        /// <summary>model | site | safety | test</summary>
//        public string PhotoType { get; set; }
//    }

//    [Route("api/[controller]")]
//    [ApiController]
//    public class DownloadController : ControllerBase
//    {
//        private readonly ApplicationDbContext _context;
//        private readonly HttpClient _httpClient;
//        private readonly string _baseUrl;

//        public DownloadController(
//            ApplicationDbContext context,
//            IHttpClientFactory httpClientFactory,
//            IConfiguration configuration)
//        {
//            _context = context;
//            _httpClient = httpClientFactory.CreateClient();
//            // ضيف في appsettings.json: "AppBaseUrl": "https://asfconsult-001-site1.ltempurl.com"
//            _baseUrl = (configuration["AppBaseUrl"] ?? "https://asfconsult-001-site1.ltempurl.com").TrimEnd('/');
//        }

//        // ─── Debug: تأكد إن الـ URL صح وبيتحمل ──────────────────────────────
//        [HttpPost("debug-urls")]
//        public async Task<IActionResult> DebugUrls([FromBody] DownloadFilesRequest request)
//        {
//            var entries = await GetFileEntries(request);
//            var results = new List<object>();

//            foreach (var entry in entries)
//            {
//                var fullUrl = BuildFullUrl(entry.Url);
//                try
//                {
//                    var response = await _httpClient.GetAsync(fullUrl);
//                    results.Add(new
//                    {
//                        entry.FileName,
//                        storedUrl = entry.Url,
//                        fullUrl,
//                        statusCode = (int)response.StatusCode,
//                        contentLength = response.Content.Headers.ContentLength
//                    });
//                }
//                catch (Exception ex)
//                {
//                    results.Add(new { entry.FileName, storedUrl = entry.Url, fullUrl, error = ex.Message });
//                }
//            }

//            return Ok(new { baseUrl = _baseUrl, results });
//        }

//        // ─── Endpoint الرئيسي ─────────────────────────────────────────────────
//        [HttpPost("download-selected")]
//        public async Task<IActionResult> DownloadSelectedFiles([FromBody] DownloadFilesRequest request)
//        {
//            if (request.SelectedFiles == null || !request.SelectedFiles.Any())
//                return BadRequest(new { message = "يرجى تحديد ملف واحد على الأقل" });

//            var fileEntries = await GetFileEntries(request);

//            if (!fileEntries.Any())
//                return NotFound(new { message = "لم يتم العثور على الملفات في قاعدة البيانات" });

//            var zipStream = new MemoryStream();
//            int addedCount = 0;
//            var errors = new List<string>();

//            using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: true))
//            {
//                foreach (var entry in fileEntries)
//                {
//                    try
//                    {
//                        var fullUrl = BuildFullUrl(entry.Url);
//                        var bytes = await _httpClient.GetByteArrayAsync(fullUrl);

//                        if (bytes.Length == 0)
//                        {
//                            errors.Add($"ملف فارغ: {fullUrl}");
//                            continue;
//                        }

//                        var zipEntry = archive.CreateEntry(entry.FileName, CompressionLevel.Fastest);
//                        using var entryStream = zipEntry.Open();
//                        await entryStream.WriteAsync(bytes);
//                        addedCount++;
//                    }
//                    catch (Exception ex)
//                    {
//                        errors.Add($"فشل تحميل {entry.Url}: {ex.Message}");
//                    }
//                }
//            }

//            if (addedCount == 0)
//                return StatusCode(500, new { message = "فشل تحميل جميع الملفات", errors });

//            zipStream.Position = 0;
//            return File(zipStream, "application/zip", $"{request.ProjectType}_selected_files.zip");
//        }

//        // ─── بناء الـ URL الكامل ───────────────────────────────────────────────
//        private string BuildFullUrl(string url)
//        {
//            if (string.IsNullOrEmpty(url)) return url;
//            // لو URL كامل فعلاً (يبدأ بـ http) استخدمه مباشرة
//            if (url.StartsWith("http://") || url.StartsWith("https://"))
//                return url;
//            // لو relative ابدأه بالـ base URL
//            return $"{_baseUrl}/{url.TrimStart('/')}";
//        }

//        // ─── جمع الـ URLs من الداتابيز ────────────────────────────────────────
//        private async Task<List<(string FileName, string Url)>> GetFileEntries(DownloadFilesRequest request)
//        {
//            var fileEntries = new List<(string FileName, string Url)>();
//            var projectType = request.ProjectType?.ToLower().Trim();

//            var modelIds = request.SelectedFiles.Where(f => f.PhotoType?.ToLower() == "model").Select(f => f.Id).ToHashSet();
//            var siteIds = request.SelectedFiles.Where(f => f.PhotoType?.ToLower() == "site").Select(f => f.Id).ToHashSet();
//            var safetyIds = request.SelectedFiles.Where(f => f.PhotoType?.ToLower() == "safety").Select(f => f.Id).ToHashSet();
//            var testIds = request.SelectedFiles.Where(f => f.PhotoType?.ToLower() == "test").Select(f => f.Id).ToHashSet();

//            switch (projectType)
//            {
//                case "construction":
//                    if (modelIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Construction.ModelPhotoForConstruction>()
//                            .Where(p => modelIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"model_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (siteIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Construction.SitePhotoForConstruction>()
//                            .Where(p => siteIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"site_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (safetyIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Construction.SafetyWastePhotoForConstruction>()
//                            .Where(p => safetyIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"safety_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (testIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Construction.ModelTestForConstruction>()
//                            .Where(p => testIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"test_models/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    break;

//                case "maintenance":
//                    if (modelIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Maintenance.ModelPhotoForMaintenance>()
//                            .Where(p => modelIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"model_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (siteIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Maintenance.SitePhotoForMaintenance>()
//                            .Where(p => siteIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"site_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (safetyIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Maintenance.SafetyWastePhotoForMaintenance>()
//                            .Where(p => safetyIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"safety_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (testIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Maintenance.ModelTestForMaintenance>()
//                            .Where(p => testIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"test_models/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    break;

//                case "emergency":
//                    if (modelIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Emergency.ModelPhotoForEmergency>()
//                            .Where(p => modelIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"model_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (siteIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Emergency.SitePhotoForEmergency>()
//                            .Where(p => siteIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"site_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (safetyIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Emergency.SafetyWastePhotoForEmergency>()
//                            .Where(p => safetyIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"safety_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (testIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.Emergency.ModelTestForEmergency>()
//                            .Where(p => testIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"test_models/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    break;

//                case "newproject":
//                    if (modelIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.NewProject.ModelPhotoForNew>()
//                            .Where(p => modelIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"model_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (siteIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.NewProject.SitePhotoForNew>()
//                            .Where(p => siteIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"site_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (safetyIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.NewProject.SafetyWastePhotoForNew>()
//                            .Where(p => safetyIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"safety_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    break;

//                case "privateproject":
//                    if (modelIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.PrivateProject.ModelPhotoForPrivate>()
//                            .Where(p => modelIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"model_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (siteIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.PrivateProject.SitePhotoForPrivate>()
//                            .Where(p => siteIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"site_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    if (safetyIds.Any())
//                    {
//                        var photos = await _context.Set<ASF.Core.Entities.PrivateProject.SafetyWastePhotoForPrivate>()
//                            .Where(p => safetyIds.Contains(p.Id)).ToListAsync();
//                        fileEntries.AddRange(photos.Select(p => ($"safety_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
//                    }
//                    break;
//            }

//            return fileEntries;
//        }

//        private static string GetExtension(string url)
//        {
//            if (string.IsNullOrEmpty(url)) return ".jpg";
//            try
//            {
//                var path = url.Contains("?") ? url[..url.IndexOf('?')] : url;
//                var ext = Path.GetExtension(path);
//                return string.IsNullOrEmpty(ext) ? ".jpg" : ext;
//            }
//            catch { return ".jpg"; }
//        }
//    }
//}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ASF.Repository.AppDbContext;
using System.IO.Compression;

namespace ASF.Api.Controllers
{
    public class DownloadFilesRequest
    {
        public string ProjectType { get; set; }
        public List<SelectedFile> SelectedFiles { get; set; } = new();
    }

    public class SelectedFile
    {
        public int Id { get; set; }
        /// <summary>model | site | safety | test</summary>
        public string PhotoType { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DownloadController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;

        public DownloadController(
            ApplicationDbContext context,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
            // ضيف في appsettings.json: "AppBaseUrl": "https://asfconsult-001-site1.ltempurl.com"
            _baseUrl = (configuration["AppBaseUrl"] ?? "https://asfconsult-001-site1.ltempurl.com").TrimEnd('/');
        }

        // ─── Debug: تأكد إن الـ URL صح وبيتحمل ──────────────────────────────
        [HttpPost("debug-urls")]
        public async Task<IActionResult> DebugUrls([FromBody] DownloadFilesRequest request)
        {
            var entries = await GetFileEntries(request);
            var results = new List<object>();

            foreach (var entry in entries)
            {
                var fullUrl = BuildFullUrl(entry.Url);
                try
                {
                    var response = await _httpClient.GetAsync(fullUrl);
                    results.Add(new
                    {
                        entry.FileName,
                        storedUrl = entry.Url,
                        fullUrl,
                        statusCode = (int)response.StatusCode,
                        contentLength = response.Content.Headers.ContentLength
                    });
                }
                catch (Exception ex)
                {
                    results.Add(new { entry.FileName, storedUrl = entry.Url, fullUrl, error = ex.Message });
                }
            }

            return Ok(new { baseUrl = _baseUrl, results });
        }

        // ─── Endpoint الرئيسي ─────────────────────────────────────────────────
        [HttpPost("download-selected")]
        public async Task<IActionResult> DownloadSelectedFiles([FromBody] DownloadFilesRequest request)
        {
            if (request.SelectedFiles == null || !request.SelectedFiles.Any())
                return BadRequest(new { message = "يرجى تحديد ملف واحد على الأقل" });

            var fileEntries = await GetFileEntries(request);

            if (!fileEntries.Any())
                return NotFound(new { message = "لم يتم العثور على الملفات في قاعدة البيانات" });

            var zipStream = new MemoryStream();
            int addedCount = 0;
            var errors = new List<string>();

            // تحميل الملفات من الشبكة على التوازي (بحد أقصى 8 في نفس الوقت) بدل واحد ورا التاني بالتتابع
            // ده أكبر سبب لبطء تحميل الـ zip لما بيبقى فيه عدد كبير من الصور
            var downloadSemaphore = new SemaphoreSlim(8);
            var downloadResults = new (string FileName, byte[]? Bytes, string? Error)[fileEntries.Count];

            var downloadTasks = fileEntries.Select(async (entry, index) =>
            {
                await downloadSemaphore.WaitAsync();
                try
                {
                    var fullUrl = BuildFullUrl(entry.Url);
                    try
                    {
                        var bytes = await _httpClient.GetByteArrayAsync(fullUrl);
                        if (bytes.Length == 0)
                            downloadResults[index] = (entry.FileName, null, $"ملف فارغ: {fullUrl}");
                        else
                            downloadResults[index] = (entry.FileName, bytes, null);
                    }
                    catch (Exception ex)
                    {
                        downloadResults[index] = (entry.FileName, null, $"فشل تحميل {entry.Url}: {ex.Message}");
                    }
                }
                finally
                {
                    downloadSemaphore.Release();
                }
            });

            await Task.WhenAll(downloadTasks);

            // كتابة الملفات داخل الـ zip بالترتيب (ZipArchive مش Thread-safe فلازم تتكتب بالتتابع)
            using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                foreach (var result in downloadResults)
                {
                    if (result.Error != null)
                    {
                        errors.Add(result.Error);
                        continue;
                    }

                    var zipEntry = archive.CreateEntry(result.FileName, CompressionLevel.Fastest);
                    using var entryStream = zipEntry.Open();
                    await entryStream.WriteAsync(result.Bytes);
                    addedCount++;
                }
            }

            if (addedCount == 0)
                return StatusCode(500, new { message = "فشل تحميل جميع الملفات", errors });

            zipStream.Position = 0;
            return File(zipStream, "application/zip", $"{request.ProjectType}_selected_files.zip");
        }

        // ─── بناء الـ URL الكامل ───────────────────────────────────────────────
        private string BuildFullUrl(string url)
        {
            if (string.IsNullOrEmpty(url)) return url;
            // لو URL كامل فعلاً (يبدأ بـ http) استخدمه مباشرة
            if (url.StartsWith("http://") || url.StartsWith("https://"))
                return url;
            // لو relative ابدأه بالـ base URL
            return $"{_baseUrl}/{url.TrimStart('/')}";
        }

        // ─── جمع الـ URLs من الداتابيز ────────────────────────────────────────
        private async Task<List<(string FileName, string Url)>> GetFileEntries(DownloadFilesRequest request)
        {
            var fileEntries = new List<(string FileName, string Url)>();
            var projectType = request.ProjectType?.ToLower().Trim();

            var modelIds = request.SelectedFiles.Where(f => f.PhotoType?.ToLower() == "model").Select(f => f.Id).ToHashSet();
            var siteIds = request.SelectedFiles.Where(f => f.PhotoType?.ToLower() == "site").Select(f => f.Id).ToHashSet();
            var safetyIds = request.SelectedFiles.Where(f => f.PhotoType?.ToLower() == "safety").Select(f => f.Id).ToHashSet();
            var testIds = request.SelectedFiles.Where(f => f.PhotoType?.ToLower() == "test").Select(f => f.Id).ToHashSet();

            switch (projectType)
            {
                case "construction":
                    if (modelIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Construction.ModelPhotoForConstruction>()
                            .AsNoTracking().Where(p => modelIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"model_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (siteIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Construction.SitePhotoForConstruction>()
                            .AsNoTracking().Where(p => siteIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"site_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (safetyIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Construction.SafetyWastePhotoForConstruction>()
                            .AsNoTracking().Where(p => safetyIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"safety_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (testIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Construction.ModelTestForConstruction>()
                            .AsNoTracking().Where(p => testIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"test_models/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    break;

                case "maintenance":
                    if (modelIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Maintenance.ModelPhotoForMaintenance>()
                            .AsNoTracking().Where(p => modelIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"model_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (siteIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Maintenance.SitePhotoForMaintenance>()
                            .AsNoTracking().Where(p => siteIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"site_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (safetyIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Maintenance.SafetyWastePhotoForMaintenance>()
                            .AsNoTracking().Where(p => safetyIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"safety_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (testIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Maintenance.ModelTestForMaintenance>()
                            .AsNoTracking().Where(p => testIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"test_models/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    break;

                case "emergency":
                    if (modelIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Emergency.ModelPhotoForEmergency>()
                            .AsNoTracking().Where(p => modelIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"model_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (siteIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Emergency.SitePhotoForEmergency>()
                            .AsNoTracking().Where(p => siteIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"site_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (safetyIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Emergency.SafetyWastePhotoForEmergency>()
                            .AsNoTracking().Where(p => safetyIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"safety_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (testIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.Emergency.ModelTestForEmergency>()
                            .AsNoTracking().Where(p => testIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"test_models/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    break;

                case "newproject":
                    if (modelIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.NewProject.ModelPhotoForNew>()
                            .AsNoTracking().Where(p => modelIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"model_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (siteIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.NewProject.SitePhotoForNew>()
                            .AsNoTracking().Where(p => siteIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"site_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (safetyIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.NewProject.SafetyWastePhotoForNew>()
                            .AsNoTracking().Where(p => safetyIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"safety_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    break;

                case "privateproject":
                    if (modelIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.PrivateProject.ModelPhotoForPrivate>()
                            .AsNoTracking().Where(p => modelIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"model_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (siteIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.PrivateProject.SitePhotoForPrivate>()
                            .AsNoTracking().Where(p => siteIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"site_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    if (safetyIds.Any())
                    {
                        var photos = await _context.Set<ASF.Core.Entities.PrivateProject.SafetyWastePhotoForPrivate>()
                            .AsNoTracking().Where(p => safetyIds.Contains(p.Id)).ToListAsync();
                        fileEntries.AddRange(photos.Select(p => ($"safety_photos/{p.Id}{GetExtension(p.Url)}", p.Url)));
                    }
                    break;
            }

            return fileEntries;
        }

        private static string GetExtension(string url)
        {
            if (string.IsNullOrEmpty(url)) return ".jpg";
            try
            {
                var path = url.Contains("?") ? url[..url.IndexOf('?')] : url;
                var ext = Path.GetExtension(path);
                return string.IsNullOrEmpty(ext) ? ".jpg" : ext;
            }
            catch { return ".jpg"; }
        }
    }
}