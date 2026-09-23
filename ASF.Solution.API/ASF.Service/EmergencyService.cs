using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities.Identity;
using ASF.Core.HandleSpecification;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System.Linq.Expressions;

namespace ASF.Service
{
    public class EmergencyService : BaseProjectService<Emergency, OperationChangeForEmergency, EmergencyPricingItem, EmergencyPricingItemUpdateLog>, IEmergencyService
    {
        protected override string ProjectTypeName => "الطوارئ";

        protected override Expression<Func<EmergencyPricingItem, bool>> PricingItemProjectFilter(int projectId)
            => x => x.EmergencyId == projectId;

        protected override void SetPricingItemProjectId(EmergencyPricingItem item, int projectId)
            => item.EmergencyId = projectId;

        protected override Expression<Func<EmergencyPricingItemUpdateLog, bool>> PricingLogProjectFilter(int projectId)
            => l => l.EmergencyId == projectId;

        protected override void SetPricingLogProjectId(EmergencyPricingItemUpdateLog log, int projectId)
            => log.EmergencyId = projectId;

        protected override IQueryable<Emergency> FilterByOffice(string officeName)
            => Context.Emergencys.Where(p => p.Office == officeName);

        public EmergencyService(IGenericRepository<Emergency> emergencyRepository,
            IGenericRepository<OperationChangeForEmergency> changeRepository,
                                 UserManager<AppUser> userManager,
                                 IMapper mapper,
                                 IHttpContextAccessor httpContextAccessor,
                                 INotificationRepository notificationRepository,
                                 IBranchService branchService,
                                 ApplicationDbContext context,
                                 GoogleDriveOAuthService googleDrive)
            : base(emergencyRepository, changeRepository, userManager, mapper,
                   httpContextAccessor, notificationRepository, branchService, context, googleDrive)
        { }

        public async Task<Emergency> CreateEmergencyAsync(EmergencyDto emergencyDto, bool? isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();
            var branch = await ResolveBranchAsync(user, emergencyDto.BranchId, emergencyDto.BranchName);

            await EnsureUniqueOrderTypeAsync(emergencyDto.FaultNumber, emergencyDto.WorkOrderType);

            var emergency = Mapper.Map<Emergency>(emergencyDto);
            emergency.ProjectOwner = emergencyDto.ProjectOwner;
            emergency.ProjectParty = emergencyDto.ProjectParty;
            emergency.IsArchived = (bool)isArchive;
            emergency.AppUserId = userId;
            emergency.OrderType = emergencyDto.OrderType;
            emergency.BranchName = branch?.Name;
            emergency.UserName = user.UserName;
            emergency.OrderDate = emergencyDto.OrderDate ?? null;
            emergency.UserImage = user.UserImage!;
            emergency.CreateAt = DateTime.Now;
            emergency.ContractNumber = ResolveContractNumber(
                emergencyDto.ContractNumber, null,
                emergency.BranchName, emergencyDto.Office, emergencyDto.ProjectPlace,
                emergencyDto.ReceiveDateTime, emergencyDto.OrderDate);
            emergency.Coordinates = emergencyDto.Coordinates;
            emergency.StationNumber = emergencyDto.StationNumber;
            emergency.ImplementationPhase = emergencyDto.ImplementationPhase;
            emergency.NotificationNumber = emergencyDto.NotificationNumber;
            emergency.TaskNumber = emergencyDto.TaskNumber;
            emergency.TypeOfStomachTest = emergencyDto.TypeOfStomachTest;
            emergency.DescriptionViolation = emergencyDto.DescriptionViolation;
            emergency.NumberOfEquipment = emergencyDto.NumberOfEquipment;
            emergency.IsApprove = false;
            emergency.Situation = emergencyDto.Situation ?? "جديد";


            // رفع الصور على Google Drive بالتوازي
            await UploadPhotosAsync<ModelPhotoForEmergency>(emergency.ModelPhotos, emergencyDto.ModelPhotos, "ModelPhotosForEmergency");
            await UploadPhotosAsync<SafetyWastePhotoForEmergency>(emergency.SafetyWastePhotos, emergencyDto.SafetyWastePhotos, "SafetyWastePhotosForEmergency");
            await UploadPhotosAsync<SitePhotoForEmergency>(emergency.SitePhotos, emergencyDto.SitePhotos, "SitePhotosForEmergency");
            await UploadPhotosAsync<ModelTestForEmergency>(emergency.TestModels, emergencyDto.TestModels, "ModelTestForEmergency");

            // الإشعارات
            await SendNotificationsAsync(user, emergencyDto.FaultNumber, emergency.Office, emergency.BranchName, "إنشاء مشروع جديد");

            // 1. حفظ المشروع عشان يتولد الـ Id
            await ProjectRepository.AddAsync(emergency);

            // 2. إضافة البنود التسعيرية مع الكميات والحسابات
            await CreatePricingItemsAsync(emergency, emergencyDto.PricingItems);

            // 3. تسجيل التغيير
            await AddChangeAsync(
                emergency.Id,
                user.UserName,
                user.UserImage ?? "default-image.png",
                $"{user.UserName} :تم تغيير في الطلب من خلال "
            );

            return emergency;
        }

        public async Task<Emergency> UpdateEmergencyAsync(int projectId, UpdateEmergencyDto emergencyDto, bool isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();

            var existingProject = await ProjectRepository.GetByIdAsync(projectId);
            if (existingProject == null)
                throw new KeyNotFoundException("المشروع غير موجود");

            await EnsureUniqueOrderTypeAsync(emergencyDto.FaultNumber, emergencyDto.WorkOrderType, existingProject.Id);

            // تحديث البيانات
            existingProject.IsArchived = isArchive;
            existingProject.Consultant = emergencyDto.Consultant ?? existingProject.Consultant;
            existingProject.Contractor = emergencyDto.Contractor ?? existingProject.Contractor;
            existingProject.ProjectOwner = emergencyDto.ProjectOwner ?? existingProject.ProjectOwner;
            existingProject.ProjectParty = emergencyDto.ProjectParty ?? existingProject.ProjectParty;
            existingProject.District = emergencyDto.District ?? existingProject.District;
            existingProject.ExtractNumber = emergencyDto.ExtractNumber ?? existingProject.ExtractNumber;
            existingProject.StationNumber = emergencyDto.StationNumber ?? existingProject.StationNumber;
            existingProject.ProjectValue = emergencyDto.ProjectValue ?? existingProject.ProjectValue;
            existingProject.Office = emergencyDto.Office ?? existingProject.Office;
            existingProject.ProjectPlace = emergencyDto.ProjectPlace ?? existingProject.ProjectPlace;
            existingProject.WorkOrderType = emergencyDto.WorkOrderType ?? existingProject.WorkOrderType;
            existingProject.WorkDescription = emergencyDto.WorkDescription ?? existingProject.WorkDescription;
            existingProject.Situation = emergencyDto.Situation ?? existingProject.Situation;
            existingProject.Note = emergencyDto.Note ?? existingProject.Note;
            existingProject.SafetyViolationsExist = emergencyDto.SafetyViolationsExist ?? existingProject.SafetyViolationsExist;
            existingProject.Coordinates = emergencyDto.Coordinates ?? existingProject.Coordinates;
            existingProject.DescriptionViolation = emergencyDto.DescriptionViolation ?? existingProject.DescriptionViolation;
            existingProject.NumberOfEquipment = emergencyDto.NumberOfEquipment ?? existingProject.NumberOfEquipment;
            existingProject.TypeOfStomachTest = emergencyDto.TypeOfStomachTest ?? existingProject.TypeOfStomachTest;
            existingProject.FaultNumber = emergencyDto.FaultNumber ?? existingProject.FaultNumber;
            existingProject.ImplementationPhase = emergencyDto.ImplementationPhase ?? existingProject.ImplementationPhase;
            existingProject.NotificationNumber = emergencyDto.NotificationNumber ?? existingProject.NotificationNumber;
            existingProject.TaskNumber = emergencyDto.TaskNumber ?? existingProject.TaskNumber;

            if (emergencyDto.ReceiveDateTime != null)
                existingProject.ReceiveDateTime = emergencyDto.ReceiveDateTime.Value;
            if (emergencyDto.OrderDate != null)
                existingProject.OrderDate = emergencyDto.OrderDate.Value;

            existingProject.ContractNumber = ResolveContractNumber(
                emergencyDto.ContractNumber, existingProject.ContractNumber,
                existingProject.BranchName, existingProject.Office, existingProject.ProjectPlace,
                existingProject.ReceiveDateTime, existingProject.OrderDate);

            // الصور
            if (emergencyDto.ModelPhotos?.Count > 0)
            {
                existingProject.ModelPhotos = new List<ModelPhotoForEmergency>();
                await UploadPhotosAsync<ModelPhotoForEmergency>(existingProject.ModelPhotos, emergencyDto.ModelPhotos, "ModelPhotosForEmergency");
            }
            if (emergencyDto.SafetyWastePhotos?.Count > 0)
            {
                existingProject.SafetyWastePhotos = new List<SafetyWastePhotoForEmergency>();
                await UploadPhotosAsync<SafetyWastePhotoForEmergency>(existingProject.SafetyWastePhotos, emergencyDto.SafetyWastePhotos, "SafetyWastePhotosForEmergency");
            }
            if (emergencyDto.SitePhotos?.Count > 0)
            {
                existingProject.SitePhotos = new List<SitePhotoForEmergency>();
                await UploadPhotosAsync<SitePhotoForEmergency>(existingProject.SitePhotos, emergencyDto.SitePhotos, "SitePhotosForEmergency");
            }
            if (emergencyDto.TestModels?.Count > 0)
            {
                existingProject.TestModels = new List<ModelTestForEmergency>();
                await UploadPhotosAsync<ModelTestForEmergency>(existingProject.TestModels, emergencyDto.TestModels, "ModelTestForEmergency");
            }

            // 1. حفظ تحديث المشروع
            await ProjectRepository.UpdateAsync(existingProject);

            // 2. تحديث البنود التسعيرية
            await ReplacePricingItemsAsync(existingProject, emergencyDto.PricingItems);
            // 3. تسجيل التغيير مع التفاصيل الكاملة للتعديلات (مين وعمل ايه)
            var changesList = BuildCommonChangesList(
                isArchive, existingProject.IsArchived,
                emergencyDto.SafetyViolationsExist, existingProject.SafetyViolationsExist,
                emergencyDto.OrderDate, existingProject.OrderDate,
                emergencyDto.PricingItems?.Count,
                emergencyDto.ModelPhotos?.Count > 0,
                emergencyDto.SitePhotos?.Count > 0,
                emergencyDto.SafetyWastePhotos?.Count > 0,
                ("الاستشاري", emergencyDto.Consultant, existingProject.Consultant),
                ("مالك المشروع", emergencyDto.ProjectOwner, existingProject.ProjectOwner),
                ("الطرف المسؤول", emergencyDto.ProjectParty, existingProject.ProjectParty),
                ("المقاول", emergencyDto.Contractor, existingProject.Contractor),
                ("الحي", emergencyDto.District, existingProject.District),
                ("المكتب", emergencyDto.Office, existingProject.Office),
                ("نوع أمر العمل", emergencyDto.WorkOrderType, existingProject.WorkOrderType),
                ("الحالة", emergencyDto.Situation, existingProject.Situation),
                ("رقم العطل", emergencyDto.FaultNumber, existingProject.FaultNumber),
                ("وصف العمل", emergencyDto.WorkDescription, existingProject.WorkDescription),
                ("ملاحظات", emergencyDto.Note, existingProject.Note),
                ("مرحلة التنفيذ", emergencyDto.ImplementationPhase, existingProject.ImplementationPhase));

            if (emergencyDto.TestModels?.Count > 0) changesList.Add("تحديث نماذج الاختبار");

            await RecordUpdateChangesAsync(existingProject.Id, user.UserName, user.UserImage, changesList);

            // 4. الإشعارات
            if (existingProject.IsApprove == false)
            {
                await SendUpdateNotificationsAsync(user, emergencyDto.FaultNumber, existingProject.Office, existingProject.Id);
            }

            return existingProject;
        }

        public async Task<Emergency> GetEmergencyByIdAsync(int Id)
        {
            var project = await Context.Emergencys
                .Include(d => d.TestModels)
                .Include(d => d.SitePhotos)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.EmergencyPricingItems)
                    .ThenInclude(ep => ep.PricingItem)
                .FirstOrDefaultAsync(d => d.Id == Id);
            return project;
        }

        public async Task<Emergency> CreateOrUpdateEmergencyAsync(EmergencyDto emergencyDto, bool isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();

            if (string.IsNullOrEmpty(emergencyDto.District))
                throw new ArgumentException("يجب إدخال المنطقة (District).");
            if (string.IsNullOrEmpty(emergencyDto.WorkDescription))
                throw new ArgumentException("يجب إدخال وصف العمل (WorkDescription).");
            if (string.IsNullOrEmpty(emergencyDto.WorkOrderType))
                throw new ArgumentException("يجب إدخال نوع امر العمل (WorkOrderType).");
            if (string.IsNullOrEmpty(emergencyDto.Contractor))
                throw new ArgumentException("يجب إدخال المقاول (Contractor).");
            if (string.IsNullOrEmpty(emergencyDto.Consultant))
                throw new ArgumentException("يجب إدخال الاستشاري (Consultant).");

            var existWorkOrderType = await ProjectRepository.GetTableNoTracking()
                .Where(p => p.WorkOrderType == emergencyDto.WorkOrderType)
                .FirstOrDefaultAsync();
            if (existWorkOrderType != null)
                return null;

            var existingProject = await ProjectRepository.GetTableNoTracking()
                .Where(p => p.FaultNumber == emergencyDto.FaultNumber)
                .FirstOrDefaultAsync();
            var branch = await ResolveBranchAsync(user, emergencyDto.BranchId, emergencyDto.BranchName);

            if (existingProject != null)
            {
                if (!string.IsNullOrEmpty(emergencyDto.District)) existingProject.District = emergencyDto.District;
                if (!string.IsNullOrEmpty(emergencyDto.Contractor)) existingProject.Contractor = emergencyDto.Contractor;
                if (!string.IsNullOrEmpty(emergencyDto.Consultant)) existingProject.Consultant = emergencyDto.Consultant;
                if (emergencyDto.SafetyViolationsExist.HasValue) existingProject.SafetyViolationsExist = emergencyDto.SafetyViolationsExist.Value;
                if (!string.IsNullOrEmpty(emergencyDto.Note)) existingProject.Note = emergencyDto.Note;

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
                var emergency = Mapper.Map<Emergency>(emergencyDto);
                emergency.IsArchived = isArchive;
                emergency.AppUserId = userId;
                emergency.BranchName = branch?.Name;
                emergency.UserName = user.UserName;

                await AddChangeAsync(emergency.Id, user.UserName, user.UserImage!, $"{user.UserName} :تم إنشاء الطلب من خلال ");
                await ProjectRepository.AddAsync(emergency);
                return emergency;
            }
        }

        public async Task<IReadOnlyCollection<Emergency>> GetAllEmergencysAsync()
        {
            var spec = new EmergencySpecification();
            return await ProjectRepository.GetAllWithSpecAsync(spec);
        }

        public async Task<IReadOnlyCollection<Emergency>> GetEmergencyWithBranchNameAsync(string? branchName)
        {
            IQueryable<Emergency> query = ProjectRepository.GetTableNoTracking()
                .Include(d => d.TestModels)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.SitePhotos)
                .Include(d => d.EmergencyPricingItems)
                    .ThenInclude(ep => ep.PricingItem);

            if (!string.IsNullOrEmpty(branchName))
                query = query.Where(p => p.BranchName == branchName);

            return await query.ToListAsync();
        }

        public async Task<IReadOnlyCollection<Emergency>> GetEmergencyWithPaginationAsync(bool? isArchive, int? sortByOrderNumber, int pageSize, int pageIndex)
        {
            var spec = new EmergencySpecification(isArchive, sortByOrderNumber, pageSize, pageIndex);
            return await ProjectRepository.GetAllWithSpecAsync(spec);
        }

        public Task<IReadOnlyCollection<Emergency>> FilterEmergencyByNameBranchAndIsArchive(string? branchName, bool? isArchive)
        {
            var spec = new EmergencySpecification(branchName, isArchive);
            return ProjectRepository.GetAllWithSpecAsync(spec);
        }







        public async Task<bool> DeleteEmergencyAsync(int projectId)
        {
            var project = await Context.Emergencys
                .Include(d => d.TestModels)
                .Include(d => d.SitePhotos)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.EmergencyPricingItems)
                .FirstOrDefaultAsync(d => d.Id == projectId);

            if (project == null)
                throw new KeyNotFoundException("المشروع غير موجود");

            return await DeleteProjectCoreAsync(project, project.EmergencyPricingItems,
                project.TestModels, project.SitePhotos,
                project.SafetyWastePhotos, project.ModelPhotos);
        }
    }
}