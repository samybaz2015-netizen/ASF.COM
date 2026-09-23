using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using ASF.Core.Dtos.PrivateProjectDto;
using ASF.Core.Entities.Identity;
using ASF.Core.Entities;
using ASF.Core.Entities.PrivateProject;
using ASF.Core.Repository;
using ASF.Core.Services;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using ASF.Core.HandleSpecification;
using Microsoft.IdentityModel.Tokens;
using ASF.Core.Entities.NewProject;
using ASF.Core.Dtos;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities.Pricing;
using ASF.Repository.AppDbContext;


namespace ASF.Service
{
    public class PrivateProjectService : IPrivateProject
    {
        private readonly IGenericRepository<PrivateProject> _privateProjectRepository;
        private readonly IGenericRepository<OperationChangeForPrivateProject> _changeRepository;
        private readonly UserManager<AppUser> _userManager;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly INotificationRepository _notificationRepository;
        private readonly IBranchService _branchService; private readonly ApplicationDbContext _context;
        private readonly GoogleDriveOAuthService _googleDrive;



        public PrivateProjectService(IGenericRepository<PrivateProject> PrivateProjectRepository,
            IGenericRepository<OperationChangeForPrivateProject> changeRepository,
                                 UserManager<AppUser> userManager,
                                 IMapper mapper,
                                 IHttpContextAccessor httpContextAccessor,
                                 IBranchService branchService,
                                 INotificationRepository notificationRepository,
                                 ApplicationDbContext context,
                                 GoogleDriveOAuthService googleDrive)
        {
            _privateProjectRepository = PrivateProjectRepository;
            _changeRepository = changeRepository;
            _userManager = userManager;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _notificationRepository = notificationRepository;
            _branchService = branchService;
            _context = context;
            _googleDrive = googleDrive;
        }
        public async Task<PrivateProject> CreatePrivateProjectAsync(PrivateProjectDto ProjectDto, bool isArchive)
        {

            if (_httpContextAccessor == null)
            {
                throw new InvalidOperationException("_httpContextAccessor is not initialized");
            }

            var userClaims = _httpContextAccessor.HttpContext?.User;

            if (userClaims == null)
            {
                throw new Exception("المطالبات غير موجودة");
            }

            var userId = userClaims.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!userClaims.Identity?.IsAuthenticated == true)
            {
                throw new UnauthorizedAccessException("المستخدم غير مصرح له");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new Exception($"المستخدم غير موجود، userId: {userId}");
            }

            var existingProject = await _privateProjectRepository.GetTableNoTracking()
               .Where(p => p.ProjectName == ProjectDto.ProjectName)
               .Select(p => p.ProjectName) // استخراج اسم المشروع
               .FirstOrDefaultAsync();
            ASF.Core.Dtos.BranchsDTO branch = null;
            if (user.CanCreateProjectOutsideCity || user.UserType?.ToLower() == "admin")
            {
                if (ProjectDto.BranchId.HasValue && ProjectDto.BranchId.Value > 0)
                {
                    branch = await _branchService.GetByIdAsync(ProjectDto.BranchId.Value);
                }
                else if (!string.IsNullOrWhiteSpace(ProjectDto.BranchName))
                {
                    var allBranches = await _branchService.GetAllAsync();
                    branch = allBranches.FirstOrDefault(b => b.Name.Equals(ProjectDto.BranchName.Trim(), StringComparison.OrdinalIgnoreCase));
                }
            }
            if (branch == null && user.BranchId > 0)
            {
                branch = await _branchService.GetByIdAsync(user.BranchId);
            }

            if (existingProject != null)
            {
                throw new Exception($"اسم المشروع موجود بالفعل: {existingProject}");
            }

            else
            {
                var newProject = _mapper.Map<PrivateProject>(ProjectDto);
                newProject.ProjectOwner = ProjectDto.ProjectOwner;
                newProject.ProjectParty = ProjectDto.ProjectParty;
                newProject.IsArchived = isArchive;
                newProject.AppUserId = userId;
                newProject.BranchName = branch?.Name;
                newProject.UserName = user.UserName;
                newProject.OrderDate = ProjectDto.OrderDate ?? null;
                newProject.UserImage = user.UserImage!;
                newProject.CreateAt = DateTime.Now;
                newProject.ContractNumber = !string.IsNullOrWhiteSpace(ProjectDto.ContractNumber)
                    ? ProjectDto.ContractNumber
                    : ASF.Core.ContractHelper.GetContractNumber(newProject.BranchName, ProjectDto.ProjectPlace, ProjectDto.ProjectPlace, ProjectDto.OrderDate);
                newProject.Coordinates = ProjectDto.Coordinates;
                newProject.WorkDescription = ProjectDto.WorkDescription;
                newProject.IsApprove = false;

                // رفع الصور على Google Drive بالتوازي
                await UploadPhotosAsync<ModelPhotoForPrivate>(newProject.ModelPhotos, ProjectDto.ModelPhotos, "ModelPhotosForPrivate");
                await UploadPhotosAsync<SafetyWastePhotoForPrivate>(newProject.SafetyWastePhotos, ProjectDto.SafetyWastePhotos, "SafetyWastePhotosForPrivate");
                await UploadPhotosAsync<SitePhotoForPrivate>(newProject.SitePhotos, ProjectDto.SitePhotos, "SitePhotosForPrivate");

                var admins = await _userManager.Users.AsNoTracking()
                    .Where(u => u.UserType == "admin")
                    .ToListAsync();

                var notifications = admins.Select(admin => new Notification
                {
                    Message = $"تم إنشاء مشروع خاص: {newProject.ProjectName}",
                    UserName = user.UserName,
                    UserImage = user.UserImage!,
                    CreatedAt = DateTime.Now,
                    NotificationType = " إنشاء مشروع خاص",
                    Target = admin.Id
                }).ToList();

                await _notificationRepository.AddRangeAsync(notifications);

                await AddChangeAsync(newProject.Id, user.UserName, user.UserImage!, $"{user.UserName} :تم تغير في الطلب من خلال ");
                await _privateProjectRepository.AddAsync(newProject);
                return newProject;
            }
        }

        public Task<IReadOnlyCollection<PrivateProject>> FilterPrivateProjectByNameBranchAndIsArchive(string? branchName, bool? isArchive)
        {
            var spec = new PrivateProjectSpecification(branchName, isArchive);
            var orders = _privateProjectRepository.GetAllWithSpecAsync(spec);
            return orders;
        }

        public async Task<PrivateProject> GetPrivateProjectByIdAsync(int Id)
        {


            var project = await _context.PrivateProjects.AsNoTracking()
                .Include(d => d.SitePhotos)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .FirstOrDefaultAsync(d => d.Id == Id);
            return project;
        }



        public async Task<IReadOnlyCollection<PrivateProject>> GetAllPrivateProjectsAsync()
        {
            var spec = new PrivateProjectSpecification();
            var projects = await _privateProjectRepository.GetAllWithSpecAsync(spec);
            return projects;
        }
        public async Task<IReadOnlyCollection<PrivateProject>> GetAllPrivateProjectsWithBranchNameAsync(string? branchName)
        {
            IQueryable<PrivateProject> query = _privateProjectRepository.GetTableNoTracking().Include(d => d.SafetyWastePhotos).Include(d => d.ModelPhotos).Include(d => d.SitePhotos);

            // إذا كانت branchName موجودة، قم بتصفية المشاريع بناءً على اسم الفرع
            if (!string.IsNullOrEmpty(branchName))
            {
                query = query.Where(p => p.BranchName == branchName);
            }

            // جلب البيانات بعد التصفية أو بدون تصفية إذا لم يتم تمرير branchName
            var changes = await query.ToListAsync();

            return changes;
        }

        public async Task<IReadOnlyCollection<PrivateProject>> GetOperationChangesAsync(int orderId)
        {
            var changes = await _privateProjectRepository.GetTableNoTracking()
                .Where(p => p.Id == orderId)
                .ToListAsync();

            return changes;
        }




        public async Task AddChangeAsync(int operationId, string userName, string userProfileImage, string changeDescription, string? itemNumber = null, string? itemDescription = null)
        {
            var change = new OperationChangeForPrivateProject
            {
                OperationId = operationId,
                UserName = userName,
                ChangeDate = DateTime.Now,
                UserProfileImage = userProfileImage,
                ChangeDescription = changeDescription,
                ItemNumber = itemNumber,
                ItemDescription = itemDescription
            };

            await _changeRepository.AddAsync(change);
        }

        public async Task<PrivateProject> GetPrivateProjectById(int id)
        {
            var project = await _privateProjectRepository.GetTableNoTracking()
                 .Include(p => p.SafetyWastePhotos)
                 .Include(p => p.ModelPhotos)
                 .Include(p => p.SitePhotos)
                 .Where(p => p.Id == id).FirstAsync();

            if (project == null) return null;
            return project;
        }

        public async Task<PrivateProject> UpdatePrivateProjectAsync(UpdatePrivateProjectDto ProjectDto, bool isArchive)
        {
            if (_httpContextAccessor == null)
            {
                throw new InvalidOperationException("_httpContextAccessor is not initialized");
            }

            var userClaims = _httpContextAccessor.HttpContext?.User;

            if (userClaims == null)
            {
                throw new Exception("المطالبات غير موجودة");
            }

            var userId = userClaims.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!userClaims.Identity?.IsAuthenticated == true)
            {
                throw new UnauthorizedAccessException("المستخدم غير مصرح له");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new Exception($"المستخدم غير موجود، userId: {userId}");
            }

            var existingProject = await _privateProjectRepository.GetTableNoTracking()
                .FirstOrDefaultAsync(p => p.ProjectName == ProjectDto.ProjectName);

            if (existingProject == null)
            {
                throw new Exception("المشروع غير موجود");
            }

            existingProject.IsArchived = isArchive;

            if (!string.IsNullOrEmpty(ProjectDto.Consultant))
            {
                existingProject.Consultant = ProjectDto.Consultant;
            }
            if (!string.IsNullOrEmpty(ProjectDto.WorkDescription))
            {
                existingProject.WorkDescription = ProjectDto.WorkDescription;
            }

            if (!string.IsNullOrEmpty(ProjectDto.Note))
            {
                existingProject.Note = ProjectDto.Note;
            }

            if (!string.IsNullOrEmpty(ProjectDto.Contractor))
            {
                existingProject.Contractor = ProjectDto.Contractor;
            }
            if (!string.IsNullOrEmpty(ProjectDto.ProjectOwner))
            {
                existingProject.ProjectOwner = ProjectDto.ProjectOwner;
            }
            if (!string.IsNullOrEmpty(ProjectDto.ProjectParty))
            {
                existingProject.ProjectParty = ProjectDto.ProjectParty;
            }



            if (!string.IsNullOrEmpty(ProjectDto.TimeOfProject))
            {
                existingProject.TimeOfProject = ProjectDto.TimeOfProject;
            }
            existingProject.SafetyViolationsExist = ProjectDto.SafetyViolationsExist;

            if (!string.IsNullOrEmpty(ProjectDto.ProjectValue))
            {
                existingProject.ProjectValue = ProjectDto.ProjectValue;
            }
            if (!string.IsNullOrEmpty(ProjectDto.Coordinates))
            {
                existingProject.Coordinates = ProjectDto.Coordinates;
            }


            if (!string.IsNullOrEmpty(ProjectDto.StationNumber))
            {
                existingProject.StationNumber = ProjectDto.StationNumber;
            }
            if (!string.IsNullOrEmpty(ProjectDto.ProjectPlace))
            {
                existingProject.ProjectPlace = ProjectDto.ProjectPlace;
            }
            if (!string.IsNullOrEmpty(ProjectDto.Customer))
            {
                existingProject.Customer = ProjectDto.Customer;
            }



            //if ((ProjectDto.DurationOfImplementation) != null)
            //{
            //    existingProject.DurationOfImplementation = ProjectDto.DurationOfImplementation;
            //}

            if ((ProjectDto.OrderDate) != null)
            {
                existingProject.OrderDate = ProjectDto.OrderDate;
            }

            existingProject.ContractNumber = !string.IsNullOrWhiteSpace(ProjectDto.ContractNumber)
                ? ProjectDto.ContractNumber
                : (existingProject.ContractNumber ?? ASF.Core.ContractHelper.GetContractNumber(existingProject.BranchName, existingProject.ProjectPlace, existingProject.ProjectPlace, existingProject.OrderDate));


            if (ProjectDto.ModelPhotos != null && ProjectDto.ModelPhotos.Count > 0)
            {
                existingProject.ModelPhotos = new List<ModelPhotoForPrivate>();
                await UploadPhotosAsync<ModelPhotoForPrivate>(existingProject.ModelPhotos, ProjectDto.ModelPhotos, "ModelPhotosForPrivate");
            }
            if (ProjectDto.SafetyWastePhotos != null && ProjectDto.SafetyWastePhotos.Count > 0)
            {
                existingProject.SafetyWastePhotos = new List<SafetyWastePhotoForPrivate>();
                await UploadPhotosAsync<SafetyWastePhotoForPrivate>(existingProject.SafetyWastePhotos, ProjectDto.SafetyWastePhotos, "SafetyWastePhotosForPrivate");
            }
            if (ProjectDto.SitePhotos != null && ProjectDto.SitePhotos.Count > 0)
            {
                existingProject.SitePhotos = new List<SitePhotoForPrivate>();
                await UploadPhotosAsync<SitePhotoForPrivate>(existingProject.SitePhotos, ProjectDto.SitePhotos, "SitePhotosForPrivate");
            }

            var changesList = new List<string>();

            if (isArchive != existingProject.IsArchived)
                changesList.Add($"الأرشفة: من {(existingProject.IsArchived ? "مؤرشف" : "نشط")} إلى {(isArchive ? "مؤرشف" : "نشط")}");

            if (!string.IsNullOrEmpty(ProjectDto.Consultant) && ProjectDto.Consultant != existingProject.Consultant)
                changesList.Add($"الاستشاري: من '{existingProject.Consultant ?? "لا يوجد"}' إلى '{ProjectDto.Consultant}'");

            if (!string.IsNullOrEmpty(ProjectDto.Contractor) && ProjectDto.Contractor != existingProject.Contractor)
                changesList.Add($"المقاول: من '{existingProject.Contractor ?? "لا يوجد"}' إلى '{ProjectDto.Contractor}'");

            if (!string.IsNullOrEmpty(ProjectDto.ProjectOwner) && ProjectDto.ProjectOwner != existingProject.ProjectOwner)
                changesList.Add($"مالك المشروع: من '{existingProject.ProjectOwner ?? "لا يوجد"}' إلى '{ProjectDto.ProjectOwner}'");

            if (!string.IsNullOrEmpty(ProjectDto.ProjectParty) && ProjectDto.ProjectParty != existingProject.ProjectParty)
                changesList.Add($"الطرف المسؤول: من '{existingProject.ProjectParty ?? "لا يوجد"}' إلى '{ProjectDto.ProjectParty}'");

            if (!string.IsNullOrEmpty(ProjectDto.Customer) && ProjectDto.Customer != existingProject.Customer)
                changesList.Add($"العميل: من '{existingProject.Customer ?? "لا يوجد"}' إلى '{ProjectDto.Customer}'");

            if (!string.IsNullOrEmpty(ProjectDto.ProjectValue) && ProjectDto.ProjectValue != existingProject.ProjectValue)
                changesList.Add($"قيمة المشروع: من '{existingProject.ProjectValue ?? "لا يوجد"}' إلى '{ProjectDto.ProjectValue}'");

            if (!string.IsNullOrEmpty(ProjectDto.WorkDescription) && ProjectDto.WorkDescription != existingProject.WorkDescription)
                changesList.Add($"وصف العمل: من '{existingProject.WorkDescription ?? "لا يوجد"}' إلى '{ProjectDto.WorkDescription}'");

            if (!string.IsNullOrEmpty(ProjectDto.TimeOfProject) && ProjectDto.TimeOfProject != existingProject.TimeOfProject)
                changesList.Add($"مدة المشروع: من '{existingProject.TimeOfProject ?? "لا يوجد"}' إلى '{ProjectDto.TimeOfProject}'");

            if (!string.IsNullOrEmpty(ProjectDto.Note) && ProjectDto.Note != existingProject.Note)
                changesList.Add($"ملاحظات: من '{existingProject.Note ?? "لا يوجد"}' إلى '{ProjectDto.Note}'");

            if (ProjectDto.OrderDate.HasValue && ProjectDto.OrderDate != existingProject.OrderDate)
                changesList.Add($"تاريخ أمر العمل: من '{existingProject.OrderDate?.ToString("yyyy-MM-dd") ?? "لا يوجد"}' إلى '{ProjectDto.OrderDate?.ToString("yyyy-MM-dd")}'");

            if (ProjectDto.ModelPhotos?.Count > 0) changesList.Add("تحديث صور النماذج");
            if (ProjectDto.SitePhotos?.Count > 0) changesList.Add("تحديث صور الموقع");
            if (ProjectDto.SafetyWastePhotos?.Count > 0) changesList.Add("تحديث صور مخلفات السلامة");

            string changeDesc = changesList.Any()
                ? $"{user.UserName} قام بتعديل: " + string.Join(" | ", changesList)
                : $"{user.UserName} :تم تعديل المشروع";

            await AddChangeAsync(
                existingProject.Id,
                user.UserName,
                user.UserImage ?? "default-image.png",
                changeDesc
            ); 
            await _privateProjectRepository.UpdateAsync(existingProject);

            return existingProject;
        }




        public async Task<IReadOnlyCollection<PrivateProject>> GetPrivateProjectWithPaginationAsync(bool? isArchive, int pageSize, int pageIndex)
        {
            var spec = new PrivateProjectSpecification(isArchive, pageSize, pageIndex);
            var projects = await _privateProjectRepository.GetAllWithSpecAsync(spec);
            return projects;
        }


        private async Task UploadPhotosAsync<TPhoto>(
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

        private async Task<string> SaveFileAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0)
                return null;

            return await _googleDrive.UploadFileAsync(file, folderName);
        }
        public async Task<List<OperationChangeForPrivateProject>> GetProjectChangesAsync(int projectId)
        {
            // التحقق من وجود المشروع
            var existingProject = await _privateProjectRepository.GetTableNoTracking()
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (existingProject == null)
            {
                throw new KeyNotFoundException($"المشروع بالـ Id {projectId} غير موجود");
            }

            // جلب التغييرات المتعلقة بالمشروع
            var changes = await _changeRepository.GetTableNoTracking()
                .Where(change => change.OperationId == projectId)
                .OrderByDescending(change => change.ChangeDate)  // ترتيب التغييرات من الأحدث للأقدم
                .ToListAsync();

            return changes;
        }
        public async Task<bool> DeleteConstructionAsync(int projectId)
        {
            var project = await _context.PrivateProjects
                .Include(d => d.SitePhotos)
                .Include(d => d.SafetyWastePhotos)
                .Include(d => d.ModelPhotos)
                .FirstOrDefaultAsync(d => d.Id == projectId);

            if (project == null)
                throw new KeyNotFoundException("المشروع غير موجود");

            // 1+2. حذف الصور من Drive وقاعدة البيانات
            await DeleteProjectPhotosAsync(
                project.SitePhotos, project.SafetyWastePhotos, project.ModelPhotos);

            // 5. حذف سجل التغييرات
            var changes = await _changeRepository.GetTableNoTracking()
                .Where(c => c.OperationId == projectId).ToListAsync();
            if (changes.Any()) _context.RemoveRange(changes);

            // 6. حذف الإشعارات المرتبطة بالمشروع
            var notifications = await _context.Notifications
                .Where(n => n.ProjectId == projectId).ToListAsync();
            if (notifications.Any()) _context.Notifications.RemoveRange(notifications);

            await _context.SaveChangesAsync();

            // 7. حذف المشروع نفسه
            _context.PrivateProjects.Remove(project);
            await _context.SaveChangesAsync();

            return true;
        }


        private async Task DeleteProjectPhotosAsync(params IEnumerable<IProjectPhoto>?[] photoCollections)
        {
            // حذف من Google Drive
            var allUrls = photoCollections
                .Where(c => c != null)
                .SelectMany(c => c!.Select(p => p.Url))
                .Where(u => !string.IsNullOrEmpty(u));

            foreach (var url in allUrls)
            {
                try { await _googleDrive.DeleteFileAsync(url); }
                catch { /* تجاهل فشل حذف ملف واحد عشان ميوقفش باقي العملية */ }
            }

            // حذف الصفوف من قاعدة البيانات
            foreach (var collection in photoCollections)
            {
                if (collection?.Any() == true)
                    _context.RemoveRange(collection);
            }
        }
    }
}