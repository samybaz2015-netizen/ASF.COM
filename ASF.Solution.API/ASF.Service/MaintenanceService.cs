using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Core.Entities.Maintenance;
using ASF.Core.HandleSpecification;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System.Linq.Expressions;

namespace ASF.Service
{
    public class MaintenanceService : BaseProjectService<Maintenance, OperationChangeForMaintenance, MaintenancePricingItem, MaintenancePricingItemUpdateLog>, IMaintenanceService
    {
        // ── Abstract overrides ──────────────────────────────────────────
        protected override string ProjectTypeName => "الصيانة";

        protected override Expression<Func<MaintenancePricingItem, bool>> PricingItemProjectFilter(int projectId)
            => x => x.MaintenanceId == projectId;

        protected override void SetPricingItemProjectId(MaintenancePricingItem item, int projectId)
            => item.MaintenanceId = projectId;

        protected override Expression<Func<MaintenancePricingItemUpdateLog, bool>> PricingLogProjectFilter(int projectId)
            => l => l.MaintenanceId == projectId;

        protected override void SetPricingLogProjectId(MaintenancePricingItemUpdateLog log, int projectId)
            => log.MaintenanceId = projectId;

        protected override IQueryable<Maintenance> FilterByOffice(string officeName)
            => Context.Maintenances.Where(p => p.Office == officeName);

        // ── Constructor ─────────────────────────────────────────────────
        public MaintenanceService(IGenericRepository<Maintenance> maintenanceRepository,
            IGenericRepository<OperationChangeForMaintenance> changeRepository,
                                 UserManager<AppUser> userManager,
                                 IMapper mapper,
                                 IHttpContextAccessor httpContextAccessor,
                                 INotificationRepository notificationRepository,
                                 IBranchService branchService,
                                 ApplicationDbContext context,
                                 GoogleDriveOAuthService googleDrive)
            : base(maintenanceRepository, changeRepository, userManager, mapper,
                   httpContextAccessor, notificationRepository, branchService, context, googleDrive)
        {
        }

        public async Task<Maintenance> CreateMaintenanceAsync(MaintenanceDto maintenanceDto, bool? isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();
            var branch = await ResolveBranchAsync(user, maintenanceDto.BranchId, maintenanceDto.BranchName);

            await EnsureUniqueOrderTypeAsync(maintenanceDto.FaultNumber, maintenanceDto.WorkOrderType);

            var newProject = Mapper.Map<Maintenance>(maintenanceDto);
            newProject.ProjectOwner = maintenanceDto.ProjectOwner;
            newProject.ProjectParty = maintenanceDto.ProjectParty;
            newProject.IsArchived = (bool)isArchive;
            newProject.AppUserId = userId;
            newProject.BranchName = branch?.Name;
            newProject.UserName = user.UserName;
            newProject.OrderType = maintenanceDto.OrderType;
            newProject.OrderDate = maintenanceDto.OrderDate ?? null;
            newProject.UserImage = user.UserImage!;
            newProject.CreateAt = DateTime.Now;
            newProject.ContractNumber = ResolveContractNumber(
                maintenanceDto.ContractNumber, null,
                newProject.BranchName, maintenanceDto.Office, maintenanceDto.ProjectPlace,
                maintenanceDto.ReceiveDateTime, maintenanceDto.OrderDate);
            newProject.Coordinates = maintenanceDto.Coordinates;
            newProject.StationNumber = maintenanceDto.StationNumber;
            newProject.ImplementationPhase = maintenanceDto.ImplementationPhase;
            newProject.NotificationNumber = maintenanceDto.NotificationNumber;
            newProject.TaskNumber = maintenanceDto.TaskNumber;
            newProject.TypeOfStomachTest = maintenanceDto.TypeOfStomachTest;
            newProject.DescriptionViolation = maintenanceDto.DescriptionViolation;
            newProject.NumberOfEquipment = maintenanceDto.NumberOfEquipment;
            newProject.IsApprove = false;

            // رفع الصور على Google Drive بالتوازي
            await UploadPhotosAsync<ModelPhotoForMaintenance>(newProject.ModelPhotos, maintenanceDto.ModelPhotos, "ModelPhotosForMaintenance");
            await UploadPhotosAsync<SafetyWastePhotoForMaintenance>(newProject.SafetyWastePhotos, maintenanceDto.SafetyWastePhotos, "SafetyWastePhotosForMaintenance");
            await UploadPhotosAsync<SitePhotoForMaintenance>(newProject.SitePhotos, maintenanceDto.SitePhotos, "SitePhotosForMaintenance");
            await UploadPhotosAsync<ModelTestForMaintenance>(newProject.TestModels, maintenanceDto.TestModels, "ModelTestForMaintenance");

            // الإشعارات
            await SendNotificationsAsync(user, maintenanceDto.FaultNumber, newProject.Office, newProject.BranchName, "إنشاء مشروع جديد");

            // 1. حفظ المشروع عشان يتولد الـ Id
            await ProjectRepository.AddAsync(newProject);

            // 2. إضافة البنود التسعيرية مع الكميات والحسابات
            await CreatePricingItemsAsync(newProject, maintenanceDto.PricingItems);

            // 3. تسجيل التغيير
            await AddChangeAsync(
                newProject.Id,
                user.UserName,
                user.UserImage ?? "default-image.png",
                $"{user.UserName} :تم تغيير في الطلب من خلال "
            );

            return newProject;
        }

        public async Task<Maintenance> UpdateMaintenanceAsync(int projectId, UpdateMaintenanceDto maintenanceDto, bool isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();

            var existingProject = await ProjectRepository.GetByIdAsync(projectId);
            if (existingProject == null)
                throw new KeyNotFoundException("المشروع غير موجود");

            await EnsureUniqueOrderTypeAsync(maintenanceDto.FaultNumber, maintenanceDto.WorkOrderType, existingProject.Id);

            // تحديث البيانات
            existingProject.IsArchived = isArchive;
            existingProject.Consultant = maintenanceDto.Consultant ?? existingProject.Consultant;
            existingProject.Contractor = maintenanceDto.Contractor ?? existingProject.Contractor;
            existingProject.ProjectOwner = maintenanceDto.ProjectOwner ?? existingProject.ProjectOwner;
            existingProject.ProjectParty = maintenanceDto.ProjectParty ?? existingProject.ProjectParty;
            existingProject.District = maintenanceDto.District ?? existingProject.District;
            existingProject.ExtractNumber = maintenanceDto.ExtractNumber ?? existingProject.ExtractNumber;
            existingProject.ProjectValue = maintenanceDto.ProjectValue ?? existingProject.ProjectValue;
            existingProject.Office = maintenanceDto.Office ?? existingProject.Office;
            existingProject.ProjectPlace = maintenanceDto.ProjectPlace ?? existingProject.ProjectPlace;
            existingProject.WorkOrderType = maintenanceDto.WorkOrderType ?? existingProject.WorkOrderType;
            existingProject.WorkDescription = maintenanceDto.WorkDescription ?? existingProject.WorkDescription;
            existingProject.Situation = maintenanceDto.Situation ?? existingProject.Situation;
            existingProject.Note = maintenanceDto.Note ?? existingProject.Note;
            existingProject.SafetyViolationsExist = maintenanceDto.SafetyViolationsExist ?? existingProject.SafetyViolationsExist;
            existingProject.Coordinates = maintenanceDto.Coordinates ?? existingProject.Coordinates;
            existingProject.DescriptionViolation = maintenanceDto.DescriptionViolation ?? existingProject.DescriptionViolation;
            existingProject.NumberOfEquipment = maintenanceDto.NumberOfEquipment ?? existingProject.NumberOfEquipment;
            existingProject.TypeOfStomachTest = maintenanceDto.TypeOfStomachTest ?? existingProject.TypeOfStomachTest;
            existingProject.StationNumber = maintenanceDto.StationNumber ?? existingProject.StationNumber;
            existingProject.FaultNumber = maintenanceDto.FaultNumber ?? existingProject.FaultNumber;
            existingProject.ImplementationPhase = maintenanceDto.ImplementationPhase ?? existingProject.ImplementationPhase;
            existingProject.NotificationNumber = maintenanceDto.NotificationNumber ?? existingProject.NotificationNumber;
            existingProject.TaskNumber = maintenanceDto.TaskNumber ?? existingProject.TaskNumber;

            if (maintenanceDto.ReceiveDateTime != null)
                existingProject.ReceiveDateTime = maintenanceDto.ReceiveDateTime.Value;
            if (maintenanceDto.OrderDate != null)
                existingProject.OrderDate = maintenanceDto.OrderDate.Value;

            existingProject.ContractNumber = ResolveContractNumber(
                maintenanceDto.ContractNumber, existingProject.ContractNumber,
                existingProject.BranchName, existingProject.Office, existingProject.ProjectPlace,
                existingProject.ReceiveDateTime, existingProject.OrderDate);

            // الصور
            if (maintenanceDto.ModelPhotos?.Count > 0)
            {
                existingProject.ModelPhotos = new List<ModelPhotoForMaintenance>();
                await UploadPhotosAsync<ModelPhotoForMaintenance>(existingProject.ModelPhotos, maintenanceDto.ModelPhotos, "ModelPhotosForMaintenance");
            }
            if (maintenanceDto.SafetyWastePhotos?.Count > 0)
            {
                existingProject.SafetyWastePhotos = new List<SafetyWastePhotoForMaintenance>();
                await UploadPhotosAsync<SafetyWastePhotoForMaintenance>(existingProject.SafetyWastePhotos, maintenanceDto.SafetyWastePhotos, "SafetyWastePhotosForMaintenance");
            }
            if (maintenanceDto.SitePhotos?.Count > 0)
            {
                existingProject.SitePhotos = new List<SitePhotoForMaintenance>();
                await UploadPhotosAsync<SitePhotoForMaintenance>(existingProject.SitePhotos, maintenanceDto.SitePhotos, "SitePhotosForMaintenance");
            }
            if (maintenanceDto.TestModels?.Count > 0)
            {
                existingProject.TestModels = new List<ModelTestForMaintenance>();
                await UploadPhotosAsync<ModelTestForMaintenance>(existingProject.TestModels, maintenanceDto.TestModels, "ModelTestForMaintenance");
            }

            // 1. حفظ تحديث المشروع
            await ProjectRepository.UpdateAsync(existingProject);

            // 2. تحديث البنود التسعيرية
            await ReplacePricingItemsAsync(existingProject, maintenanceDto.PricingItems);
            // 3. تسجيل التغيير مع التفاصيل الكاملة للتعديلات (مين وعمل ايه)
            var changesList = BuildCommonChangesList(
                isArchive, existingProject.IsArchived,
                maintenanceDto.SafetyViolationsExist, existingProject.SafetyViolationsExist,
                maintenanceDto.OrderDate, existingProject.OrderDate,
                maintenanceDto.PricingItems?.Count,
                maintenanceDto.ModelPhotos?.Count > 0,
                maintenanceDto.SitePhotos?.Count > 0,
                maintenanceDto.SafetyWastePhotos?.Count > 0,
                ("الاستشاري", maintenanceDto.Consultant, existingProject.Consultant),
                ("مالك المشروع", maintenanceDto.ProjectOwner, existingProject.ProjectOwner),
                ("الطرف المسؤول", maintenanceDto.ProjectParty, existingProject.ProjectParty),
                ("المقاول", maintenanceDto.Contractor, existingProject.Contractor),
                ("الحي", maintenanceDto.District, existingProject.District),
                ("المكتب", maintenanceDto.Office, existingProject.Office),
                ("نوع أمر العمل", maintenanceDto.WorkOrderType, existingProject.WorkOrderType),
                ("الحالة", maintenanceDto.Situation, existingProject.Situation),
                ("رقم العطل", maintenanceDto.FaultNumber, existingProject.FaultNumber),
                ("وصف العمل", maintenanceDto.WorkDescription, existingProject.WorkDescription),
                ("ملاحظات", maintenanceDto.Note, existingProject.Note),
                ("مرحلة التنفيذ", maintenanceDto.ImplementationPhase, existingProject.ImplementationPhase));

            if (maintenanceDto.TestModels?.Count > 0) changesList.Add("تحديث نماذج الاختبار");

            await RecordUpdateChangesAsync(existingProject.Id, user.UserName, user.UserImage, changesList);

            // 4. الإشعارات
            if (existingProject.IsApprove == false)
            {
                await SendUpdateNotificationsAsync(user, maintenanceDto.FaultNumber, existingProject.Office, existingProject.Id);
            }

            return existingProject;
        }

        public async Task<Maintenance> GetMaintenanceByIdAsync(int Id)
        {
            var project = await Context.Maintenances
                .Include(d => d.TestModels)
                .Include(d => d.SitePhotos)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.MaintenancePricingItems)
                    .ThenInclude(mp => mp.PricingItem)
                .FirstOrDefaultAsync(d => d.Id == Id);
            return project;
        }

        public async Task<Maintenance> CreateOrUpdateMaintenanceAsync(MaintenanceDto maintenanceDto, bool isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();

            if (string.IsNullOrEmpty(maintenanceDto.District))
                throw new ArgumentException("يجب إدخال المنطقة (District).");
            if (string.IsNullOrEmpty(maintenanceDto.WorkDescription))
                throw new ArgumentException("يجب إدخال وصف العمل (WorkDescription).");
            if (string.IsNullOrEmpty(maintenanceDto.WorkOrderType))
                throw new ArgumentException("يجب إدخال نوع امر العمل (WorkOrderType).");
            if (string.IsNullOrEmpty(maintenanceDto.Contractor))
                throw new ArgumentException("يجب إدخال المقاول (Contractor).");
            if (string.IsNullOrEmpty(maintenanceDto.Consultant))
                throw new ArgumentException("يجب إدخال الاستشاري (Consultant).");

            var existWorkOrderType = await ProjectRepository.GetTableNoTracking()
                .Where(p => p.WorkOrderType == maintenanceDto.WorkOrderType)
                .FirstOrDefaultAsync();
            if (existWorkOrderType != null)
                return null;

            var existingProject = await ProjectRepository.GetTableNoTracking()
                .Where(p => p.FaultNumber == maintenanceDto.FaultNumber)
                .FirstOrDefaultAsync();
            var branch = await ResolveBranchAsync(user, maintenanceDto.BranchId, maintenanceDto.BranchName);

            if (existingProject != null)
            {
                if (!string.IsNullOrEmpty(maintenanceDto.District)) existingProject.District = maintenanceDto.District;
                if (!string.IsNullOrEmpty(maintenanceDto.Contractor)) existingProject.Contractor = maintenanceDto.Contractor;
                if (!string.IsNullOrEmpty(maintenanceDto.Consultant)) existingProject.Consultant = maintenanceDto.Consultant;
                if (maintenanceDto.SafetyViolationsExist.HasValue) existingProject.SafetyViolationsExist = maintenanceDto.SafetyViolationsExist.Value;
                if (!string.IsNullOrEmpty(maintenanceDto.Note)) existingProject.Note = maintenanceDto.Note;

                existingProject.IsArchived = isArchive;
                existingProject.AppUserId = userId;
                existingProject.BranchName = branch?.Name;
                existingProject.UserName = user.UserName;

                await AddChangeAsync(existingProject.Id, user.UserName, user.UserImage!, $"{user.UserName} :تم تغير في الطلب من خلال ");
                await ProjectRepository.UpdateAsync(existingProject);
                return existingProject;
            }
            else
            {
                var newProject = Mapper.Map<Maintenance>(maintenanceDto);
                newProject.IsArchived = isArchive;
                newProject.AppUserId = userId;
                newProject.BranchName = branch?.Name;
                newProject.UserName = user.UserName;

                await AddChangeAsync(newProject.Id, user.UserName, user.UserImage!, $"{user.UserName} :تم إنشاء الطلب من خلال ");
                await ProjectRepository.AddAsync(newProject);
                return newProject;
            }
        }

        public async Task<IReadOnlyCollection<Maintenance>> GetAllMaintenancesAsync()
        {
            var spec = new MaintenanceSpecification();
            return await ProjectRepository.GetAllWithSpecAsync(spec);
        }

        public async Task<IReadOnlyCollection<Maintenance>> GetMaintenanceWithBranchNameAsync(string? branchName)
        {
            IQueryable<Maintenance> query = ProjectRepository.GetTableNoTracking()
                .Include(d => d.TestModels)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.SitePhotos)
                .Include(d => d.MaintenancePricingItems)
                    .ThenInclude(mp => mp.PricingItem);

            if (!string.IsNullOrEmpty(branchName))
                query = query.Where(p => p.BranchName == branchName);

            return await query.ToListAsync();
        }

        public async Task<IReadOnlyCollection<Maintenance>> GetMaintenanceWithPaginationAsync(bool? isArchive, int? sortByOrderNumber, int pageSize, int pageIndex)
        {
            var spec = new MaintenanceSpecification(isArchive, sortByOrderNumber, pageSize, pageIndex);
            return await ProjectRepository.GetAllWithSpecAsync(spec);
        }

        public Task<IReadOnlyCollection<Maintenance>> FilterMaintenanceByNameBranchAndIsArchive(string? branchName, bool? isArchive)
        {
            var spec = new MaintenanceSpecification(branchName, isArchive);
            return ProjectRepository.GetAllWithSpecAsync(spec);
        }

        public async Task<bool> DeleteMaintenanceAsync(int projectId)
        {
            var project = await Context.Maintenances
                .Include(d => d.TestModels)
                .Include(d => d.SitePhotos)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.MaintenancePricingItems)
                .FirstOrDefaultAsync(d => d.Id == projectId);

            if (project == null)
                throw new KeyNotFoundException("المشروع غير موجود");

            return await DeleteProjectCoreAsync(project, project.MaintenancePricingItems,
                project.TestModels, project.SitePhotos,
                project.SafetyWastePhotos, project.ModelPhotos);
        }

    }
}