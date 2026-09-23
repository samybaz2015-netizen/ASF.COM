using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Core.Entities.NewProject;
using ASF.Core.HandleSpecification;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System.Linq.Expressions;

namespace ASF.Service
{
    public class NewProjectService
        : BaseProjectService<NewProject, OperationChangeForNewProject, NewProjectPricingItem, NewProjectPricingItemUpdateLog>,
          INewProjectService
    {
        // ═══════════════════════════════════════════════════════════════
        //  التطبيقات المجردة المطلوبة من BaseProjectService
        // ═══════════════════════════════════════════════════════════════

        protected override string ProjectTypeName => "مشروع جديد";

        protected override Expression<Func<NewProjectPricingItem, bool>> PricingItemProjectFilter(int projectId)
            => x => x.NewProjectId == projectId;

        protected override void SetPricingItemProjectId(NewProjectPricingItem item, int projectId)
            => item.NewProjectId = projectId;

        protected override Expression<Func<NewProjectPricingItemUpdateLog, bool>> PricingLogProjectFilter(int projectId)
            => l => l.NewProjectId == projectId;

        protected override void SetPricingLogProjectId(NewProjectPricingItemUpdateLog log, int projectId)
            => log.NewProjectId = projectId;

        protected override IQueryable<NewProject> FilterByOffice(string officeName)
            => Context.NewProjects.Where(p => p.Office == officeName);

        public NewProjectService(
            IGenericRepository<NewProject> newProjectRepository,
            IGenericRepository<OperationChangeForNewProject> changeRepository,
            UserManager<AppUser> userManager,
            IMapper mapper,
            IHttpContextAccessor httpContextAccessor,
            INotificationRepository notificationRepository,
            IBranchService branchService,
            ApplicationDbContext context,
            GoogleDriveOAuthService googleDrive)
            : base(newProjectRepository, changeRepository, userManager, mapper,
                   httpContextAccessor, notificationRepository, branchService, context, googleDrive)
        { }

        public async Task<NewProject> CreateNewProjectAsync(NewProjectDto newProjectDto, bool? isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();
            var branch = await ResolveBranchAsync(user, newProjectDto.BranchId, newProjectDto.BranchName);

            await EnsureUniqueOrderTypeAsync(newProjectDto.FaultNumber, newProjectDto.WorkOrderType);

            var newProject = Mapper.Map<NewProject>(newProjectDto);
            newProject.ProjectOwner = newProjectDto.ProjectOwner;
            newProject.ProjectParty = newProjectDto.ProjectParty;
            newProject.IsArchived = (bool)isArchive;
            newProject.AppUserId = userId;
            newProject.BranchName = branch?.Name;
            newProject.UserName = user.UserName;
            newProject.OrderDate = newProjectDto.OrderDate ?? null;
            newProject.UserImage = user.UserImage!;
            newProject.CreateAt = DateTime.Now;
            newProject.ContractNumber = ResolveContractNumber(
                newProjectDto.ContractNumber, null,
                newProject.BranchName, newProjectDto.Office, newProjectDto.ProjectPlace,
                newProjectDto.ReceiveDateTime, newProjectDto.OrderDate);
            newProject.OrderType = newProjectDto.OrderType;
            newProject.Coordinates = newProjectDto.Coordinates;
            newProject.StationNumber = newProjectDto.StationNumber;
            newProject.QualificationClassification = newProjectDto.QualificationClassification;
            newProject.IsApprove = false;

            // رفع الصور على Google Drive بالتوازي
            await UploadPhotosAsync<ModelPhotoForNew>(newProject.ModelPhotos, newProjectDto.ModelPhotos, "ModelPhotosForNew");
            await UploadPhotosAsync<SafetyWastePhotoForNew>(newProject.SafetyWastePhotos, newProjectDto.SafetyWastePhotos, "SafetyWastePhotosForNew");
            await UploadPhotosAsync<SitePhotoForNew>(newProject.SitePhotos, newProjectDto.SitePhotos, "SitePhotosForNew");

            // الإشعارات
            await SendNotificationsAsync(user, newProjectDto.FaultNumber, newProject.Office, newProject.BranchName, "إنشاء مشروع جديد");

            // 1. حفظ المشروع عشان يتولد الـ Id
            await ProjectRepository.AddAsync(newProject);

            // 2. إضافة البنود التسعيرية مع الكميات والحسابات
            await CreatePricingItemsAsync(newProject, newProjectDto.PricingItems);

            // 3. تسجيل التغيير
            await AddChangeAsync(
                newProject.Id,
                user.UserName,
                user.UserImage ?? "default-image.png",
                $"{user.UserName} :تم تغيير في الطلب من خلال "
            );

            return newProject;
        }

        public async Task<NewProject> UpdateNewProjectAsync(int projectId, UpdateNewProjectDto newProjectDto, bool isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();

            var existingProject = await ProjectRepository.GetByIdAsync(projectId);
            if (existingProject == null)
                throw new KeyNotFoundException("المشروع غير موجود");

            await EnsureUniqueOrderTypeAsync(newProjectDto.FaultNumber, newProjectDto.WorkOrderType, existingProject.Id);

            // تحديث البيانات
            existingProject.IsArchived = isArchive;
            existingProject.Consultant = newProjectDto.Consultant ?? existingProject.Consultant;
            existingProject.Contractor = newProjectDto.Contractor ?? existingProject.Contractor;
            existingProject.ProjectOwner = newProjectDto.ProjectOwner ?? existingProject.ProjectOwner;
            existingProject.ProjectParty = newProjectDto.ProjectParty ?? existingProject.ProjectParty;
            existingProject.District = newProjectDto.District ?? existingProject.District;
            existingProject.ExtractNumber = newProjectDto.ExtractNumber ?? existingProject.ExtractNumber;
            existingProject.ProjectValue = newProjectDto.ProjectValue ?? existingProject.ProjectValue;
            existingProject.Office = newProjectDto.Office ?? existingProject.Office;
            existingProject.ProjectPlace = newProjectDto.ProjectPlace ?? existingProject.ProjectPlace;
            existingProject.WorkOrderType = newProjectDto.WorkOrderType ?? existingProject.WorkOrderType;
            existingProject.WorkDescription = newProjectDto.WorkDescription ?? existingProject.WorkDescription;
            existingProject.Situation = newProjectDto.Situation ?? existingProject.Situation;
            existingProject.Note = newProjectDto.Note ?? existingProject.Note;
            existingProject.SafetyViolationsExist = newProjectDto.SafetyViolationsExist ?? existingProject.SafetyViolationsExist;
            existingProject.Coordinates = newProjectDto.Coordinates ?? existingProject.Coordinates;
            existingProject.QualificationClassification = newProjectDto.QualificationClassification ?? existingProject.QualificationClassification;
            existingProject.FaultNumber = newProjectDto.FaultNumber ?? existingProject.FaultNumber;
            existingProject.StationNumber = newProjectDto.StationNumber ?? existingProject.StationNumber;

            if (newProjectDto.ReceiveDateTime != null)
                existingProject.ReceiveDateTime = newProjectDto.ReceiveDateTime.Value;
            if (newProjectDto.OrderDate != null)
                existingProject.OrderDate = newProjectDto.OrderDate.Value;

            existingProject.ContractNumber = ResolveContractNumber(
                newProjectDto.ContractNumber, existingProject.ContractNumber,
                existingProject.BranchName, existingProject.Office, existingProject.ProjectPlace,
                existingProject.ReceiveDateTime, existingProject.OrderDate);

            // الصور
            if (newProjectDto.ModelPhotos?.Count > 0)
            {
                existingProject.ModelPhotos = new List<ModelPhotoForNew>();
                await UploadPhotosAsync<ModelPhotoForNew>(existingProject.ModelPhotos, newProjectDto.ModelPhotos, "ModelPhotosForNew");
            }
            if (newProjectDto.SafetyWastePhotos?.Count > 0)
            {
                existingProject.SafetyWastePhotos = new List<SafetyWastePhotoForNew>();
                await UploadPhotosAsync<SafetyWastePhotoForNew>(existingProject.SafetyWastePhotos, newProjectDto.SafetyWastePhotos, "SafetyWastePhotosForNew");
            }
            if (newProjectDto.SitePhotos?.Count > 0)
            {
                existingProject.SitePhotos = new List<SitePhotoForNew>();
                await UploadPhotosAsync<SitePhotoForNew>(existingProject.SitePhotos, newProjectDto.SitePhotos, "SitePhotosForNew");
            }

            // 1. حفظ تحديث المشروع
            await ProjectRepository.UpdateAsync(existingProject);

            // 2. تحديث البنود التسعيرية
            await ReplacePricingItemsAsync(existingProject, newProjectDto.PricingItems);
            // 3. تسجيل التغيير مع التفاصيل الكاملة للتعديلات (مين وعمل ايه)
            var changesList = BuildCommonChangesList(
                isArchive, existingProject.IsArchived,
                newProjectDto.SafetyViolationsExist, existingProject.SafetyViolationsExist,
                newProjectDto.OrderDate, existingProject.OrderDate,
                newProjectDto.PricingItems?.Count,
                newProjectDto.ModelPhotos?.Count > 0,
                newProjectDto.SitePhotos?.Count > 0,
                newProjectDto.SafetyWastePhotos?.Count > 0,
                ("الاستشاري", newProjectDto.Consultant, existingProject.Consultant),
                ("مالك المشروع", newProjectDto.ProjectOwner, existingProject.ProjectOwner),
                ("الطرف المسؤول", newProjectDto.ProjectParty, existingProject.ProjectParty),
                ("المقاول", newProjectDto.Contractor, existingProject.Contractor),
                ("الحي", newProjectDto.District, existingProject.District),
                ("المكتب", newProjectDto.Office, existingProject.Office),
                ("نوع أمر العمل", newProjectDto.WorkOrderType, existingProject.WorkOrderType),
                ("الحالة", newProjectDto.Situation, existingProject.Situation),
                ("رقم العطل", newProjectDto.FaultNumber, existingProject.FaultNumber),
                ("وصف العمل", newProjectDto.WorkDescription, existingProject.WorkDescription),
                ("ملاحظات", newProjectDto.Note, existingProject.Note),
                ("تصنيف التأهيل", newProjectDto.QualificationClassification, existingProject.QualificationClassification));

            await RecordUpdateChangesAsync(existingProject.Id, user.UserName, user.UserImage, changesList);

            // 4. الإشعارات
            if (existingProject.IsApprove == false)
            {
                await SendUpdateNotificationsAsync(user, newProjectDto.FaultNumber, existingProject.Office, existingProject.Id);
            }

            return existingProject;
        }

        public async Task<NewProject> GetNewProjectByIdAsync(int Id)
        {
            var project = await Context.NewProjects
                .Include(d => d.SitePhotos)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.NewProjectPricingItems)
                    .ThenInclude(np => np.PricingItem)
                .FirstOrDefaultAsync(d => d.Id == Id);
            return project;
        }

        public async Task<NewProject> CreateOrUpdateNewProjectAsync(NewProjectDto newProjectDto, bool isArchive)
        {
            var (userId, user) = await GetCurrentUserAsync();

            if (string.IsNullOrEmpty(newProjectDto.District))
                throw new ArgumentException("يجب إدخال المنطقة (District).");
            if (string.IsNullOrEmpty(newProjectDto.QualificationClassification))
                throw new ArgumentException("يجب إدخال تصنيف التاهيل.");
            if (string.IsNullOrEmpty(newProjectDto.WorkOrderType))
                throw new ArgumentException("يجب إدخال نوع امر العمل (WorkOrderType).");
            if (string.IsNullOrEmpty(newProjectDto.Contractor))
                throw new ArgumentException("يجب إدخال المقاول (Contractor).");
            if (string.IsNullOrEmpty(newProjectDto.Consultant))
                throw new ArgumentException("يجب إدخال الاستشاري (Consultant).");

            var existWorkOrderType = await ProjectRepository.GetTableNoTracking()
                .Where(p => p.WorkOrderType == newProjectDto.WorkOrderType)
                .FirstOrDefaultAsync();
            if (existWorkOrderType != null)
                return null;

            var existingProject = await ProjectRepository.GetTableNoTracking()
                .Where(p => p.FaultNumber == newProjectDto.FaultNumber)
                .FirstOrDefaultAsync();
            var branch = await ResolveBranchAsync(user, newProjectDto.BranchId, newProjectDto.BranchName);

            if (existingProject != null)
            {
                if (!string.IsNullOrEmpty(newProjectDto.District)) existingProject.District = newProjectDto.District;
                if (!string.IsNullOrEmpty(newProjectDto.Contractor)) existingProject.Contractor = newProjectDto.Contractor;
                if (!string.IsNullOrEmpty(newProjectDto.Consultant)) existingProject.Consultant = newProjectDto.Consultant;
                if (newProjectDto.SafetyViolationsExist.HasValue) existingProject.SafetyViolationsExist = newProjectDto.SafetyViolationsExist.Value;
                if (!string.IsNullOrEmpty(newProjectDto.Note)) existingProject.Note = newProjectDto.Note;

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
                var newProject = Mapper.Map<NewProject>(newProjectDto);
                newProject.IsArchived = isArchive;
                newProject.AppUserId = userId;
                newProject.BranchName = branch?.Name;
                newProject.UserName = user.UserName;

                await AddChangeAsync(newProject.Id, user.UserName, user.UserImage!, $"{user.UserName} :تم إنشاء الطلب من خلال ");
                await ProjectRepository.AddAsync(newProject);
                return newProject;
            }
        }

        public async Task<IReadOnlyCollection<NewProject>> GetAllNewProjectsAsync()
        {
            var spec = new NewProjectSpecification();
            return await ProjectRepository.GetAllWithSpecAsync(spec);
        }

        public async Task<IReadOnlyCollection<NewProject>> GetNewProjectWithBranchNameAsync(string? branchName)
        {
            IQueryable<NewProject> query = ProjectRepository.GetTableNoTracking()
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.SitePhotos)
                .Include(d => d.NewProjectPricingItems)
                    .ThenInclude(np => np.PricingItem);

            if (!string.IsNullOrEmpty(branchName))
                query = query.Where(p => p.BranchName == branchName);

            return await query.ToListAsync();
        }

        public async Task<IReadOnlyCollection<NewProject>> GetNewProjectWithPaginationAsync(bool? isArchive, int? sortByOrderNumber, int pageSize, int pageIndex)
        {
            var spec = new NewProjectSpecification(isArchive, sortByOrderNumber, pageSize, pageIndex);
            return await ProjectRepository.GetAllWithSpecAsync(spec);
        }


        public Task<IReadOnlyCollection<NewProject>> FilterNewProjectByNameBranchAndIsArchive(string? branchName, bool? isArchive)
        {
            var spec = new NewProjectSpecification(branchName, isArchive);
            return ProjectRepository.GetAllWithSpecAsync(spec);
        }




        public async Task<bool> DeleteNewProjectAsync(int projectId)
        {
            var project = await Context.NewProjects
                .Include(d => d.SitePhotos)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .Include(d => d.NewProjectPricingItems)
                .FirstOrDefaultAsync(d => d.Id == projectId);

            if (project == null)
                throw new KeyNotFoundException("المشروع غير موجود");

            return await DeleteProjectCoreAsync(project, project.NewProjectPricingItems,
                project.SitePhotos, project.SafetyWastePhotos, project.ModelPhotos);
        }


    }
}