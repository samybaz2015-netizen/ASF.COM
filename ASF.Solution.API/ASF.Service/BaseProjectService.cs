using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Core.Entities.Pricing;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System.Linq.Expressions;
using System.Security.Claims;

namespace ASF.Service
{
    /// <summary>
    /// كلاس أساسي مجرد يجمع المنطق المشترك بين خدمات المشاريع الأربع:
    /// NewProjectService, ConstructionService, EmergencyService, MaintenanceService.
    ///
    /// يستخرج ~85% من الكود المكرر (تتبع التغييرات، بنود التسعير،
    /// الكميات المنفذة، الإشعارات، رفع الملفات، تحديث المكاتب).
    ///
    /// TProject     — كيان المشروع (NewProject, Construction, …)
    /// TChange      — كيان تتبع التغييرات (OperationChangeFor*)
    /// TPricingItem — كيان ربط بند التسعير بالمشروع (*PricingItem)
    /// TPricingLog  — سجل تحديث الكميات المنفذة (*PricingItemUpdateLog)
    /// </summary>
    public abstract class BaseProjectService<TProject, TChange, TPricingItem, TPricingLog>
        where TProject : class, IProjectEntity, IListLinkedWorkOrder
        where TChange : class, IOperationChange, new()
        where TPricingItem : class, IProjectPricingItem, new()
        where TPricingLog : class, IPricingItemUpdateLog, new()
    {
        // ═══════════════════════════════════════════════════════════════
        //  التبعيات المشتركة — محمية لاستخدام الأبناء
        // ═══════════════════════════════════════════════════════════════

        protected readonly IGenericRepository<TProject> ProjectRepository;
        protected readonly IGenericRepository<TChange> ChangeRepository;
        protected readonly UserManager<AppUser> UserManager;
        protected readonly IMapper Mapper;
        protected readonly IHttpContextAccessor HttpContextAccessor;
        protected readonly INotificationRepository NotificationRepository;
        protected readonly IBranchService BranchService;
        protected readonly ApplicationDbContext Context;
        protected readonly GoogleDriveOAuthService GoogleDrive;

        protected BaseProjectService(
            IGenericRepository<TProject> projectRepository,
            IGenericRepository<TChange> changeRepository,
            UserManager<AppUser> userManager,
            IMapper mapper,
            IHttpContextAccessor httpContextAccessor,
            INotificationRepository notificationRepository,
            IBranchService branchService,
            ApplicationDbContext context,
            GoogleDriveOAuthService googleDrive)
        {
            ProjectRepository = projectRepository;
            ChangeRepository = changeRepository;
            UserManager = userManager;
            Mapper = mapper;
            HttpContextAccessor = httpContextAccessor;
            NotificationRepository = notificationRepository;
            BranchService = branchService;
            Context = context;
            GoogleDrive = googleDrive;
        }

        // ═══════════════════════════════════════════════════════════════
        //  أعضاء مجردة — يوفرها كل كلاس ابن (سطر واحد لكل منها)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>اسم نوع المشروع بالعربي للإشعارات (مثل "مشروع جديد"، "الانشاءات").</summary>
        protected abstract string ProjectTypeName { get; }

        /// <summary>فلتر بنود التسعير حسب معرف المشروع (x => x.NewProjectId == projectId).</summary>
        protected abstract Expression<Func<TPricingItem, bool>> PricingItemProjectFilter(int projectId);

        /// <summary>تعيين معرف المشروع في بند التسعير (item.NewProjectId = projectId).</summary>
        protected abstract void SetPricingItemProjectId(TPricingItem item, int projectId);

        /// <summary>فلتر سجلات التحديث حسب معرف المشروع (l => l.NewProjectId == projectId).</summary>
        protected abstract Expression<Func<TPricingLog, bool>> PricingLogProjectFilter(int projectId);

        /// <summary>تعيين معرف المشروع في سجل التحديث (log.NewProjectId = projectId).</summary>
        protected abstract void SetPricingLogProjectId(TPricingLog log, int projectId);

        /// <summary>استعلام المشاريع حسب اسم المكتب (Context.NewProjects.Where(p => p.Office == name)).</summary>
        protected abstract IQueryable<TProject> FilterByOffice(string officeName);

        // ═══════════════════════════════════════════════════════════════
        //  مساعدات مشتركة (protected)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// التحقق من عدم تكرار أمر العمل (OrderType = FaultNumber-WorkOrderType).
        /// يُستدعى في Create (بدون excludeProjectId) و Update (مع excludeProjectId).
        /// </summary>
        protected async Task EnsureUniqueOrderTypeAsync(
            string faultNumber, string workOrderType, int? excludeProjectId = null)
        {
            var faultOrderType = $"{faultNumber}-{workOrderType}".Trim().ToLower();
            var query = ProjectRepository.GetTableNoTracking()
                .Where(p => p.OrderType!.Trim().ToLower() == faultOrderType);

            if (excludeProjectId.HasValue)
                query = query.Where(p => p.Id != excludeProjectId.Value);

            var existing = await query.Select(p => p.OrderType).FirstOrDefaultAsync();
            if (existing != null)
                throw new ArgumentException($"أمر العمل موجود بالفعل: {existing}");
        }

        /// <summary>رفع ملف إلى Google Drive.</summary>
        protected async Task<string> SaveFileAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0) return null;
            return await GoogleDrive.UploadFileAsync(file, folderName);
        }

        /// <summary>
        /// رفع مجموعة ملفات صور إلى Google Drive وإضافتها ككيانات صور في قاعدة البيانات.
        /// يعمل مع أي كيان صور يطبّق IProjectPhoto ولديه constructor فارغ.
        /// </summary>
        protected async Task UploadPhotosAsync<TPhoto>(
            ICollection<TPhoto> targetCollection,
            List<IFormFile>? files,
            string folderName) where TPhoto : IProjectPhoto, new()
        {
            if (files == null || !files.Any()) return;

            var urls = await Task.WhenAll(files.Select(f => SaveFileAsync(f, folderName)));
            foreach (var url in urls)
                if (!string.IsNullOrEmpty(url))
                    targetCollection.Add(new TPhoto { Url = url });
        }

        /// <summary>
        /// حساب رقم العقد — إذا أرسل المستخدم رقمًا يُستخدم مباشرة،
        /// وإلا يُفضَّل الرقم المحفوظ (في التحديث)، وأخيرًا يُولَّد تلقائيًا.
        /// </summary>
        protected static string ResolveContractNumber(
            string? dtoContractNumber, string? existingContractNumber,
            string branchName, string? office, string? projectPlace,
            DateTime receiveDateTime, DateTime orderDate)
        {
            if (!string.IsNullOrWhiteSpace(dtoContractNumber))
                return dtoContractNumber;

            return existingContractNumber
                ?? ASF.Core.ContractHelper.GetContractNumber(
                    branchName, office, projectPlace,
                    receiveDateTime != default ? receiveDateTime : orderDate);
        }

        /// <summary>
        /// حذف ملفات الصور من Google Drive — يُستخدم في عمليات حذف المشاريع.
        /// يتجاهل فشل حذف ملف واحد حتى لا يوقف باقي العملية.
        /// </summary>
        protected async Task DeletePhotosFromDriveAsync(params IEnumerable<IProjectPhoto>?[] photoCollections)
        {
            var allUrls = photoCollections
                .Where(c => c != null)
                .SelectMany(c => c!.Select(p => p.Url))
                .Where(u => !string.IsNullOrEmpty(u));

            foreach (var url in allUrls)
            {
                try { await GoogleDrive.DeleteFileAsync(url); }
                catch { /* تجاهل فشل حذف ملف واحد عشان ميوقفش باقي العملية */ }
            }
        }

        /// <summary>
        /// حذف جميع صور المشروع — من Google Drive ومن قاعدة البيانات.
        /// يجمع بين DeletePhotosFromDriveAsync وحذف الصفوف.
        /// </summary>
        protected async Task DeleteProjectPhotosAsync(params IEnumerable<IProjectPhoto>?[] photoCollections)
        {
            await DeletePhotosFromDriveAsync(photoCollections);

            foreach (var collection in photoCollections)
            {
                if (collection?.Any() == true)
                    Context.RemoveRange(collection);
            }
        }

        /// <summary>
        /// حذف السجلات المشتركة المرتبطة بمشروع (سجل التغييرات + الإشعارات).
        /// يُستدعى داخل عمليات حذف المشاريع.
        /// </summary>
        protected async Task DeleteProjectRelatedRecordsAsync(int projectId)
        {
            var changes = await ChangeRepository.GetTableNoTracking()
                .Where(c => c.OperationId == projectId).ToListAsync();
            if (changes.Any()) Context.RemoveRange(changes);

            var notifications = await Context.Notifications
                .Where(n => n.ProjectId == projectId).ToListAsync();
            if (notifications.Any()) Context.Notifications.RemoveRange(notifications);
        }

        /// <summary>استخراج بيانات المستخدم الحالي من الـ Token.</summary>
        protected async Task<(string userId, AppUser user)> GetCurrentUserAsync()
        {
            if (HttpContextAccessor == null)
                throw new InvalidOperationException("_httpContextAccessor is not initialized");

            var userClaims = HttpContextAccessor.HttpContext?.User;
            if (userClaims == null)
                throw new Exception("المطالبات غير موجودة");

            var userId = userClaims.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!userClaims.Identity?.IsAuthenticated == true)
                throw new UnauthorizedAccessException("المستخدم غير مصرح له");

            var user = await UserManager.FindByIdAsync(userId);
            if (user == null)
                throw new Exception($"المستخدم غير موجود، userId: {userId}");

            return (userId, user);
        }

        /// <summary>
        /// تحديد الفرع حسب صلاحيات المستخدم:
        /// 1. إذا كان admin أو يمكنه الإنشاء خارج المدينة → يستخدم BranchId/BranchName من الطلب.
        /// 2. وإلا يرجع لفرع المستخدم الافتراضي.
        /// </summary>
        protected async Task<BranchsDTO> ResolveBranchAsync(AppUser user, int? branchId, string branchName)
        {
            BranchsDTO branch = null;
            if (user.CanCreateProjectOutsideCity || user.UserType?.ToLower() == "admin")
            {
                if (branchId.HasValue && branchId.Value > 0)
                {
                    branch = await BranchService.GetByIdAsync(branchId.Value);
                }
                else if (!string.IsNullOrWhiteSpace(branchName))
                {
                    var allBranches = await BranchService.GetAllAsync();
                    branch = allBranches.FirstOrDefault(b =>
                        b.Name.Equals(branchName.Trim(), StringComparison.OrdinalIgnoreCase));
                }
            }
            if (branch == null && user.BranchId > 0)
            {
                branch = await BranchService.GetByIdAsync(user.BranchId);
            }
            return branch;
        }

        /// <summary>
        /// إرسال إشعارات الإنشاء/التعديل للمشرفين والأدمن ومديري المكاتب.
        /// </summary>
        protected async Task SendNotificationsAsync(
            AppUser user,
            string faultNumber,
            string officeName,
            string branchName,
            string notificationType,
            int? projectId = null)
        {
            var notifications = new List<Notification>();
            string userImage = user.UserImage ?? "default-image.png";

            // إشعار الأدمن
            var admins = await UserManager.Users.AsNoTracking()
                .Where(u => u.UserType == "admin").ToListAsync();
            foreach (var admin in admins)
            {
                notifications.Add(new Notification
                {
                    Message = $"تم إنشاء {ProjectTypeName}: {faultNumber}",
                    UserName = user.UserName,
                    UserImage = userImage,
                    CreatedAt = DateTime.Now,
                    NotificationType = notificationType,
                    Target = admin.Id,
                    ProjectId = projectId
                });
            }

            // إشعار مديري المكتب
            if (!string.IsNullOrEmpty(officeName))
            {
                var officeObj = await Context.Offices.AsNoTracking()
                    .FirstOrDefaultAsync(d => d.Name == officeName);
                if (officeObj != null)
                {
                    var officeManagers = await UserManager.Users.AsNoTracking()
                        .Where(u => u.UserType == "officeManager" && u.OfficeId == officeObj.Id)
                        .ToListAsync();
                    foreach (var manager in officeManagers)
                    {
                        notifications.Add(new Notification
                        {
                            Message = $"تم إنشاء {ProjectTypeName} في مكتبك: {faultNumber}",
                            UserName = user.UserName,
                            UserImage = userImage,
                            CreatedAt = DateTime.Now,
                            NotificationType = notificationType,
                            Target = manager.Id,
                            ProjectId = projectId
                        });
                    }
                }
            }

            // إشعار المشرفين
            if (!string.IsNullOrEmpty(branchName))
            {
                var branchObj = await Context.Branchs.AsNoTracking()
                    .FirstOrDefaultAsync(d => d.Name == branchName);
                if (branchObj != null)
                {
                    var supervisors = await UserManager.Users.AsNoTracking()
                        .Where(u => u.UserType == "supervisor" && u.BranchId == branchObj.Id)
                        .ToListAsync();
                    foreach (var supervisor in supervisors)
                    {
                        notifications.Add(new Notification
                        {
                            Message = $"تم إنشاء {ProjectTypeName} في مكتبك: {faultNumber}",
                            UserName = user.UserName,
                            UserImage = userImage,
                            CreatedAt = DateTime.Now,
                            NotificationType = notificationType,
                            Target = supervisor.Id,
                            ProjectId = projectId
                        });
                    }
                }
            }

            if (notifications.Any())
            {
                await NotificationRepository.AddRangeAsync(notifications);
            }
        }

        /// <summary>
        /// إرسال إشعارات التعديل للأدمن ومديري المكاتب فقط (بدون المشرفين).
        /// يُستدعى في عمليات تحديث المشاريع عندما يكون المشروع غير معتمد.
        /// </summary>
        protected async Task SendUpdateNotificationsAsync(
            AppUser user,
            string faultNumber,
            string officeName,
            int projectId)
        {
            var notifications = new List<Notification>();
            string userImage = user.UserImage ?? "default-image.png";
            string message = $"تم التعديل علي مشروع جديد في مكتبك: {faultNumber}";

            // إشعار الأدمن
            var admins = await UserManager.Users.AsNoTracking()
                .Where(u => u.UserType == "admin").ToListAsync();
            foreach (var admin in admins)
            {
                notifications.Add(new Notification
                {
                    Message = message,
                    UserName = user.UserName,
                    UserImage = userImage,
                    CreatedAt = DateTime.Now,
                    NotificationType = "تعديل مشروع جديد",
                    Target = admin.Id,
                    ProjectId = projectId,
                });
            }

            // إشعار مديري المكتب
            if (!string.IsNullOrEmpty(officeName))
            {
                var officeObj = await Context.Offices.AsNoTracking()
                    .FirstOrDefaultAsync(d => d.Name == officeName);
                if (officeObj != null)
                {
                    var officeManagers = await UserManager.Users.AsNoTracking()
                        .Where(u => u.UserType == "officeManager" && u.OfficeId == officeObj.Id)
                        .ToListAsync();
                    foreach (var manager in officeManagers)
                    {
                        notifications.Add(new Notification
                        {
                            Message = message,
                            UserName = user.UserName,
                            UserImage = userImage,
                            CreatedAt = DateTime.Now,
                            NotificationType = "تعديل مشروع جديد",
                            Target = manager.Id,
                            ProjectId = projectId,
                        });
                    }
                }
            }

            if (notifications.Any())
                await NotificationRepository.AddRangeAsync(notifications);
        }

        // ═══════════════════════════════════════════════════════════════
        //  عمليات مشتركة — تُرث مباشرة من الكلاس الأساسي
        // ═══════════════════════════════════════════════════════════════

        /// <summary>تسجيل تغيير في سجل العمليات.</summary>
        public async Task AddChangeAsync(
            int operationId,
            string userName,
            string userProfileImage,
            string changeDescription,
            string? itemNumber = null,
            string? itemDescription = null)
        {
            var change = new TChange
            {
                OperationId = operationId,
                UserName = userName,
                ChangeDate = DateTime.Now,
                UserProfileImage = userProfileImage,
                ChangeDescription = changeDescription,
                ItemNumber = itemNumber,
                ItemDescription = itemDescription
            };
            await ChangeRepository.AddAsync(change);
        }

        /// <summary>جلب سجل التغييرات لمشروع معين.</summary>
        public async Task<List<TChange>> GetProjectChangesAsync(int projectId)
        {
            var existingProject = await ProjectRepository.GetTableNoTracking()
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (existingProject == null)
                throw new KeyNotFoundException($"المشروع بالـ Id {projectId} غير موجود");

            return await ChangeRepository.GetTableNoTracking()
                .Where(change => change.OperationId == projectId)
                .OrderByDescending(change => change.ChangeDate)
                .ToListAsync();
        }

        /// <summary>جلب المشروع حسب المعرف (يُستخدم في واجهة GetOperationChangesAsync).</summary>
        public async Task<IReadOnlyCollection<TProject>> GetOperationChangesAsync(int projectId)
        {
            return await ProjectRepository.GetTableNoTracking()
                .Where(p => p.Id == projectId)
                .ToListAsync();
        }

        /// <summary>تحديث اسم المكتب في جميع المشاريع المرتبطة.</summary>
        public async Task UpdateProjectsByOfficeWithContextAsync(string oldOfficeName, string newOfficeName)
        {
            var (userId, user) = await GetCurrentUserAsync();

            var projects = await FilterByOffice(oldOfficeName).ToListAsync();

            if (!projects.Any())
                throw new KeyNotFoundException($"لا توجد طلبات مرتبطة بالمكتب: {oldOfficeName}");

            foreach (var project in projects)
            {
                // تعيين اسم المكتب الجديد — نستخدم dynamic لأن Office ليس على الواجهة
                SetProjectOffice(project, newOfficeName);

                await AddChangeAsync(project.Id, user.UserName, user.UserImage!,
                    $"{user.UserName} :تم تعديل اسم المكتب من {oldOfficeName} إلى {newOfficeName}");
            }

            await Context.SaveChangesAsync();
        }

        /// <summary>تعيين المكتب الجديد — يمكن للأبناء تجاوزها إذا لزم الأمر.</summary>
        protected virtual void SetProjectOffice(TProject project, string officeName)
        {
            // Office ليست على IProjectEntity أو IListLinkedWorkOrder،
            // لكنها موجودة في كل الكيانات الأربعة.
            // نستخدم reflection كحل مؤقت حتى توحيد الكيانات في المرحلة 3.4.
            var prop = typeof(TProject).GetProperty("Office");
            prop?.SetValue(project, officeName);
        }

        // ─── تحديث الكمية المنفذة (بند واحد) ─────────────────────────

        /// <summary>تحديث الكمية المنفذة لبند تسعير واحد مع التراكم.</summary>
        public async Task UpdateExecutedQuantityAsync(int projectId, UpdateExecutedQuantityDto dto)
        {
            var userId = HttpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = userId != null ? await UserManager.FindByIdAsync(userId) : null;

            var link = await Context.Set<TPricingItem>()
                .Where(PricingItemProjectFilter(projectId))
                .FirstOrDefaultAsync(x => x.PricingItemId == dto.PricingItemId);

            if (link == null)
                throw new KeyNotFoundException("البند غير موجود في هذا المشروع");

            var pricingItem = await Context.PricingItems.FindAsync(dto.PricingItemId);
            double unitPrice = (double)(pricingItem?.UnitPrice ?? 0);
            double oldQty = link.ExecutedQuantity ?? 0;
            double execQty = oldQty + dto.ExecutedQuantity;   // تجميع تراكمي
            double estQty = link.EstimatedQuantity ?? 0;

            if (execQty > estQty)
            {
                estQty = execQty;
                link.EstimatedQuantity = estQty;
                link.TotalPrice = estQty * unitPrice;
            }

            link.ExecutedQuantity = execQty;
            link.ExecutionPercentage = estQty > 0 ? Math.Round((execQty / estQty) * 100, 2) : 0;
            link.ExecutedWorksValue = Math.Round(execQty * unitPrice, 2);

            Context.Set<TPricingItem>().Update(link);

            // سجل التحديث
            var log = new TPricingLog
            {
                PricingItemId = dto.PricingItemId,
                ItemNumber = pricingItem?.ItemNumber,
                ItemDescription = pricingItem?.ShortDescription ?? pricingItem?.LongDescription,
                UpdatedByUserId = userId ?? "unknown",
                UpdatedByUserName = user?.UserName ?? "unknown",
                UpdatedAt = DateTime.Now,
                OldExecutedQuantity = oldQty,
                NewExecutedQuantity = execQty,
                NewExecutedWorksValue = link.ExecutedWorksValue,
                NewExecutionPercentage = link.ExecutionPercentage,
                NewEstimatedQuantity = link.EstimatedQuantity,
                Note = dto.Note
            };
            SetPricingLogProjectId(log, projectId);
            await Context.Set<TPricingLog>().AddAsync(log);
            await Context.SaveChangesAsync();

            // تغيير في سجل العمليات
            var itemLabel = pricingItem != null
                ? $"رقم {pricingItem.ItemNumber} ({pricingItem.ShortDescription ?? pricingItem.LongDescription})"
                : $"#{dto.PricingItemId}";

            await AddChangeAsync(
                projectId,
                user?.UserName ?? "unknown",
                user?.UserImage ?? "default-image.png",
                $"{user?.UserName ?? "مستخدم"} :قام بتحديث الكمية المنفذة لبند التسعير {itemLabel} إلى {execQty}",
                pricingItem?.ItemNumber,
                pricingItem?.ShortDescription ?? pricingItem?.LongDescription
            );

            await RecalculateProjectValuesAsync(projectId);
        }

        // ─── تحديث الكميات المنفذة (batch) ────────────────────────────

        /// <summary>تحديث الكميات المنفذة لعدة بنود تسعير دفعة واحدة.</summary>
        public async Task UpdateExecutedQuantitiesAsync(int projectId, UpdateExecutedQuantitiesDto dto)
        {
            var userId = HttpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = userId != null ? await UserManager.FindByIdAsync(userId) : null;
            string userName = user?.UserName ?? "unknown";

            if (dto.Items == null || !dto.Items.Any())
                throw new ArgumentException("يجب تحديد بند واحد على الأقل");

            var ids = dto.Items.Select(x => x.PricingItemId).ToList();

            var links = await Context.Set<TPricingItem>()
                .Where(PricingItemProjectFilter(projectId))
                .Where(x => ids.Contains(x.PricingItemId))
                .ToListAsync();

            var pricingItemsDict = await Context.PricingItems
                .Where(p => ids.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p);

            var logs = new List<TPricingLog>();

            foreach (var item in dto.Items)
            {
                var link = links.FirstOrDefault(l => l.PricingItemId == item.PricingItemId);
                if (link == null) continue;

                pricingItemsDict.TryGetValue(item.PricingItemId, out var itemDetails);
                double up = itemDetails != null ? (double)itemDetails.UnitPrice : 0;
                double oldQty = link.ExecutedQuantity ?? 0;
                double execQty = oldQty + item.ExecutedQuantity;   // تراكمي
                double estQty = link.EstimatedQuantity ?? 0;

                if (execQty > estQty)
                {
                    estQty = execQty;
                    link.EstimatedQuantity = estQty;
                    link.TotalPrice = estQty * up;
                }

                link.ExecutedQuantity = execQty;
                link.ExecutionPercentage = estQty > 0 ? Math.Round((execQty / estQty) * 100, 2) : 0;
                link.ExecutedWorksValue = Math.Round(execQty * up, 2);

                Context.Set<TPricingItem>().Update(link);

                var log = new TPricingLog
                {
                    PricingItemId = item.PricingItemId,
                    ItemNumber = itemDetails?.ItemNumber,
                    ItemDescription = itemDetails?.ShortDescription ?? itemDetails?.LongDescription,
                    UpdatedByUserId = userId ?? "unknown",
                    UpdatedByUserName = userName,
                    UpdatedAt = DateTime.Now,
                    OldExecutedQuantity = oldQty,
                    NewExecutedQuantity = execQty,
                    NewExecutedWorksValue = link.ExecutedWorksValue,
                    NewExecutionPercentage = link.ExecutionPercentage,
                    NewEstimatedQuantity = link.EstimatedQuantity,
                    Note = dto.Note
                };
                SetPricingLogProjectId(log, projectId);
                logs.Add(log);
            }

            await Context.Set<TPricingLog>().AddRangeAsync(logs);
            await Context.SaveChangesAsync();

            await AddChangeAsync(
                projectId,
                userName,
                user?.UserImage ?? "default-image.png",
                $"{userName} :قام بتحديث الكميات المنفذة لعدد {dto.Items.Count} من بنود التسعير"
            );

            await RecalculateProjectValuesAsync(projectId);
        }

        // ─── سجلات تحديث الكميات ──────────────────────────────────────

        /// <summary>جلب سجلات تحديث الكميات المنفذة لمشروع (واختياريًا لبند معين).</summary>
        public async Task<List<TPricingLog>> GetExecutedQuantityLogsAsync(int projectId, int? pricingItemId = null)
        {
            var query = Context.Set<TPricingLog>().Where(PricingLogProjectFilter(projectId));

            if (pricingItemId.HasValue)
                query = query.Where(l => l.PricingItemId == pricingItemId.Value);

            return await query.OrderByDescending(l => l.UpdatedAt).ToListAsync();
        }

        // ─── إعادة حساب قيم المشروع ──────────────────────────────────

        /// <summary>إعادة حساب القيمة التقديرية والفعلية من بنود التسعير.</summary>
        protected virtual async Task RecalculateProjectValuesAsync(int projectId)
        {
            var project = await ProjectRepository.GetTableNoTracking()
                .FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return;

            var allLinks = await Context.Set<TPricingItem>()
                .Where(PricingItemProjectFilter(projectId))
                .ToListAsync();

            project.EstimatedValue = allLinks.Sum(x => x.TotalPrice ?? 0).ToString();
            project.ActualValue = allLinks.Sum(x => x.ExecutedWorksValue ?? 0).ToString();

            await ProjectRepository.UpdateAsync(project);
        }

        // ─── إنشاء بنود تسعيرية لمشروع جديد ──────────────────────────

        /// <summary>
        /// إنشاء بنود تسعيرية لمشروع — يحسب الأسعار من وحدة السعر المخزنة في قاعدة البيانات.
        /// يُستدعى بعد حفظ المشروع (بعد توليد الـ Id).
        /// </summary>
        protected async Task CreatePricingItemsAsync(TProject project, List<ConstructionPricingItemDto>? dtoItems)
        {
            if (dtoItems == null || !dtoItems.Any()) return;

            var pricingItemIds = dtoItems.Select(x => x.PricingItemId).ToList();
            var prices = await Context.PricingItems
                .Where(p => pricingItemIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => (double)p.UnitPrice);

            var pricingLinks = dtoItems
                .Where(x => prices.ContainsKey(x.PricingItemId))
                .Select(x =>
                {
                    double unitPrice = prices[x.PricingItemId];
                    double estQty = x.EstimatedQuantity ?? 0;
                    double execQty = x.ExecutedQuantity ?? 0;
                    if (execQty > estQty) estQty = execQty;

                    var item = new TPricingItem
                    {
                        PricingItemId = x.PricingItemId,
                        EstimatedQuantity = estQty,
                        ExecutedQuantity = execQty,
                        TotalPrice = estQty * unitPrice,
                        ExecutionPercentage = estQty > 0 ? Math.Round((execQty / estQty) * 100, 2) : 0,
                        ExecutedWorksValue = Math.Round(execQty * unitPrice, 2)
                    };
                    SetPricingItemProjectId(item, project.Id);
                    return item;
                }).ToList();

            await Context.Set<TPricingItem>().AddRangeAsync(pricingLinks);
            await Context.SaveChangesAsync();

            project.EstimatedValue = pricingLinks.Sum(x => x.TotalPrice ?? 0).ToString();
            project.ActualValue = pricingLinks.Sum(x => x.ExecutedWorksValue ?? 0).ToString();
            await ProjectRepository.UpdateAsync(project);
        }

        // ─── تحديث (استبدال) بنود تسعيرية لمشروع موجود ──────────────

        /// <summary>
        /// حذف البنود التسعيرية الحالية وإعادة إنشائها مع الحفاظ على الكميات المنفذة.
        /// يُستدعى في عمليات تحديث المشاريع.
        /// </summary>
        protected async Task ReplacePricingItemsAsync(TProject project, List<ConstructionPricingItemDto>? dtoItems)
        {
            if (dtoItems == null) return;

            var existingLinks = await Context.Set<TPricingItem>()
                .Where(PricingItemProjectFilter(project.Id))
                .ToListAsync();

            // حفظ الكميات المنفذة القديمة
            var oldExecutedMap = existingLinks.ToDictionary(
                x => x.PricingItemId,
                x => new { x.ExecutedQuantity, x.ExecutionPercentage, x.ExecutedWorksValue });

            Context.Set<TPricingItem>().RemoveRange(existingLinks);

            if (dtoItems.Any())
            {
                var pricingItemIds = dtoItems.Select(x => x.PricingItemId).ToList();
                var prices = await Context.PricingItems
                    .Where(p => pricingItemIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, p => (double)p.UnitPrice);

                var newLinks = dtoItems
                    .Where(x => prices.ContainsKey(x.PricingItemId))
                    .Select(x =>
                    {
                        oldExecutedMap.TryGetValue(x.PricingItemId, out var oldValues);

                        double unitPrice = prices[x.PricingItemId];
                        double estQty = x.EstimatedQuantity ?? 0;
                        double execQty = oldValues?.ExecutedQuantity ?? 0;
                        if (execQty > estQty) estQty = execQty;

                        var item = new TPricingItem
                        {
                            PricingItemId = x.PricingItemId,
                            EstimatedQuantity = estQty,
                            ExecutedQuantity = execQty,
                            TotalPrice = Math.Round(estQty * unitPrice, 2),
                            ExecutionPercentage = estQty > 0 ? Math.Round((execQty / estQty) * 100, 2) : 0,
                            ExecutedWorksValue = oldValues?.ExecutedWorksValue ?? 0
                        };
                        SetPricingItemProjectId(item, project.Id);
                        return item;
                    }).ToList();

                await Context.Set<TPricingItem>().AddRangeAsync(newLinks);
                await Context.SaveChangesAsync();

                project.EstimatedValue = newLinks.Sum(x => x.TotalPrice ?? 0).ToString();
                project.ActualValue = newLinks.Sum(x => x.ExecutedWorksValue ?? 0).ToString();
                await ProjectRepository.UpdateAsync(project);
            }
            else
            {
                project.EstimatedValue = "0";
                project.ActualValue = "0";
                await ProjectRepository.UpdateAsync(project);
                await Context.SaveChangesAsync();
            }
        }

        // ── حذف المشروع (القالب المشترك) ─────────────────────────────────

        /// <summary>ينفّذ خطوات الحذف المشتركة: صور، بنود تسعير، لوجات، سجلات، ثم المشروع نفسه.</summary>
        protected async Task<bool> DeleteProjectCoreAsync(
            TProject project,
            IEnumerable<TPricingItem>? pricingItems,
            params IEnumerable<IProjectPhoto>?[] photoCollections)
        {
            // 1+2. حذف الصور من Drive وقاعدة البيانات
            await DeleteProjectPhotosAsync(photoCollections);

            // 3. حذف بنود التسعير
            if (pricingItems?.Any() == true)
                Context.Set<TPricingItem>().RemoveRange(pricingItems);

            // 4. حذف لوجات تحديث الكميات المنفذة
            var executedLogs = await Context.Set<TPricingLog>()
                .Where(PricingLogProjectFilter(project.Id)).ToListAsync();
            if (executedLogs.Any())
                Context.Set<TPricingLog>().RemoveRange(executedLogs);

            // 5+6. حذف سجل التغييرات والإشعارات
            await DeleteProjectRelatedRecordsAsync(project.Id);

            await Context.SaveChangesAsync();

            // 7. حذف المشروع نفسه
            Context.Set<TProject>().Remove(project);
            await Context.SaveChangesAsync();

            return true;
        }

        // ── بناء قائمة التغييرات المشتركة ──────────────────────────────────

        /// <summary>يبني قائمة التغييرات المشتركة بين جميع أنواع المشاريع عند التعديل.</summary>
        protected List<string> BuildCommonChangesList(
            bool isArchive,
            bool existingIsArchived,
            bool? newSafetyViolationsExist,
            bool existingSafetyViolationsExist,
            DateTime? newOrderDate,
            DateTime? existingOrderDate,
            int? pricingItemsCount,
            bool hasModelPhotos,
            bool hasSitePhotos,
            bool hasSafetyWastePhotos,
            params (string Label, string? NewValue, string? OldValue)[] stringFields)
        {
            var changesList = new List<string>();

            if (isArchive != existingIsArchived)
                changesList.Add($"الأرشفة: من {(existingIsArchived ? "مؤرشف" : "نشط")} إلى {(isArchive ? "مؤرشف" : "نشط")}");

            foreach (var (label, newValue, oldValue) in stringFields)
            {
                if (!string.IsNullOrEmpty(newValue) && newValue != oldValue)
                    changesList.Add($"{label}: من '{oldValue ?? "لا يوجد"}' إلى '{newValue}'");
            }

            if (newSafetyViolationsExist.HasValue && newSafetyViolationsExist.Value != existingSafetyViolationsExist)
                changesList.Add($"مخالفات السلامة: من {(existingSafetyViolationsExist ? "يوجد" : "لا يوجد")} إلى {(newSafetyViolationsExist.Value ? "يوجد" : "لا يوجد")}");

            if (newOrderDate.HasValue && newOrderDate != existingOrderDate)
                changesList.Add($"تاريخ أمر العمل: من '{existingOrderDate?.ToString("yyyy-MM-dd") ?? "لا يوجد"}' إلى '{newOrderDate?.ToString("yyyy-MM-dd")}'");

            if (pricingItemsCount.HasValue)
                changesList.Add($"تحديث قائمة بنود التسعير ({pricingItemsCount.Value} بند)");

            if (hasModelPhotos) changesList.Add("تحديث صور النماذج");
            if (hasSitePhotos) changesList.Add("تحديث صور الموقع");
            if (hasSafetyWastePhotos) changesList.Add("تحديث صور مخلفات السلامة");

            return changesList;
        }

        /// <summary>يسجل تغييرات التعديل ويحفظها كسجل عملية.</summary>
        protected async Task RecordUpdateChangesAsync(
            int projectId,
            string userName,
            string? userImage,
            List<string> changesList)
        {
            string changeDesc = changesList.Any()
                ? $"{userName} قام بتعديل: " + string.Join(" | ", changesList)
                : $"{userName} :تم تعديل المشروع";

            await AddChangeAsync(projectId, userName, userImage ?? "default-image.png", changeDesc);
        }
    }
}
