
using AutoMapper;
using ASF.Core.Entities.Workflow;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using ASF.Api.Helpers;
using ASF.Core.Dtos;
using ASF.Core.Dtos.ConstructionResponse;
using ASF.Core.Dtos.EmergencyResponse;
using ASF.Core.Dtos.MaintenanceResponse;
using ASF.Core.Dtos.NewProjectResponse;
using ASF.Core.Dtos.PrivateResponse;
using ASF.Core.Entities;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities.Identity;
using ASF.Core.Entities.Maintenance;
using ASF.Core.Entities.NewProject;
using ASF.Core.Entities.PrivateProject;
using ASF.Core.Helpers;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;
using ASF.Service;
using System.Linq;
using System.Security.Claims;
using static ASF.Api.Controllers.AdminController;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ConstructionController : ControllerBase
    {
        private readonly IConstructionService _constructionService;
        private readonly IGenericRepository<ModelPhotoForConstruction> _modelPhotoSubRepository;
        private readonly IGenericRepository<SitePhotoForConstruction> _sitePhotoSubRepository;
        private readonly IGenericRepository<SafetyWastePhotoForConstruction> _safetyPhotoSubRepository;
        private readonly IGenericRepository<ModelTestForConstruction> _testModelSubRepository;
        private readonly ApplicationDbContext _context;
        private readonly AppIdentityDbContext _dbContext;
        private readonly UserManager<AppUser> _userManager;
        private readonly IMapper _mapper;
        private readonly INotificationRepository _notificationRepository;

        public ConstructionController(
            IConstructionService constructionService,
            IGenericRepository<ModelPhotoForConstruction> modelPhotoSubRepository,
            IGenericRepository<SitePhotoForConstruction> sitePhotoSubRepository,
            IGenericRepository<SafetyWastePhotoForConstruction> safetyPhotoSubRepository,
            IGenericRepository<ModelTestForConstruction> testModelSubRepository,
            ApplicationDbContext context,
            AppIdentityDbContext dbContext,
            UserManager<AppUser> userManager,
            IMapper mapper
            ,

            INotificationRepository notificationRepository
            )
        {
            _constructionService = constructionService;
            _modelPhotoSubRepository = modelPhotoSubRepository;
            _sitePhotoSubRepository = sitePhotoSubRepository;
            _safetyPhotoSubRepository = safetyPhotoSubRepository;
            _testModelSubRepository = testModelSubRepository;
            _context = context;
            _dbContext = dbContext;
            _userManager = userManager;
            _mapper = mapper;
            _notificationRepository = notificationRepository;
        }

        //[Authorize(Roles = "eng")]
        [HttpPost("create-construction")]
        public async Task<ActionResult<ApiResponse<Construction>>> CreateConstruction([FromForm] ConstructionDto constructionDto)
        {
            var validationErrors = new List<string>();

            ValidateConstructionDto(constructionDto, validationErrors);

            if (validationErrors.Any())
            {
                return BadRequest(new ApiResponse<List<string>>(400, "هناك أخطاء في البيانات المدخلة", validationErrors));
            }

            try
            {
                var project = await _constructionService.CreateConstructionAsync(constructionDto, constructionDto.isArchive);
                // إدخال أمر العمل مسار السلال تلقائياً. تُحلّ الخدمة من الطلب بدل
                // حقنها في المُنشئ، فلا يتغيّر توقيع المتحكّم. والدالة لا ترمي:
                // إنشاء أمر العمل نجح فعلاً ولا يجوز أن يُبطِله فشل تسجيل الموقع.
                await HttpContext.RequestServices
                    .GetRequiredService<IWorkOrderFlowService>()
                    .AutoEnterAsync(
                        ProjectTypeCodes.Construction,
                        project.Id,
                        project.ContractNumber,
                        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
                        User.FindFirstValue(ClaimTypes.GivenName));

                var response = new ApiResponse<Construction>(200, "تم إضافة المشروع بنجاح", project);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }
        [HttpPut("{id}/update-excavation-length")]
        public async Task<IActionResult> UpdateExcavationLength(int id, [FromBody] UpdateExcavationLengthDto dto)
        {
            var project = await _context.Constructions.FirstOrDefaultAsync(d => d.Id == id);
            if (project == null)
            {
                return NotFound(new { message = "المشروع غير موجود" });
            }

            // تحديث قيمة DailyExcavationLength
            project.DailyExcavationLength = dto.ProjectExcavationLengthEnd;

            // تحديث قيمة الحفر الإجمالية
            project.ExcavationLength += project.DailyExcavationLength;

            // حساب نسبة الإنجاز
            project.CompletionStatusReport = ((project.ExcavationLength / project.ProjectExcavationLength) * 100)
             .GetValueOrDefault().ToString("F2");

            // تحديث قيمة DailyExcavationLength
            project.DailyCableLength = dto.CableLengthEnd;

            // تحديث قيمة الحفر الإجمالية
            project.CableLength += project.DailyCableLength;

            // حساب نسبة الإنجاز
            project.CableCompletion = ((project.CableLength / project.ProjectCableLength) * 100)
             .GetValueOrDefault().ToString("F2");



            _context.Constructions.Update(project);
            await _context.SaveChangesAsync(); // حفظ التغييرات في قاعدة البيانات

            return Ok(new { message = "تم تحديث نسبة الإنجاز بنجاح", data = project });
        }


        private void ValidateConstructionDto(ConstructionDto dto, List<string> validationErrors)
        {
            // تاريخ الإنجاز وأطوال الحفر والكابل لم تعد إلزامية: القالب يحسب
            // تاريخ التسليم من الإسناد والمدة، والأطوال تُدخَل مع التحديث اليومي.

            if (dto.FaultNumber == null)
                validationErrors.Add("رقم أمر العمل مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.Contractor))
                validationErrors.Add("اسم المقاول مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.District))
                validationErrors.Add("اسم الحي مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.WorkOrderType))
                validationErrors.Add("نوع أمر العمل مطلوب.");
            if (dto.DurationOfImplementation == null)
                validationErrors.Add("مدة التنفيذ مطلوبة.");
            if (dto.isArchive == null)
                validationErrors.Add("يرجى تحديد هل المشروع مؤرشف أم لا.");
        }

        [HttpPost("create-or-update-construction")]
        public async Task<IActionResult> CreateOrUpdateConstruction([FromForm] ConstructionDto constructionDto, bool isArchive)
        {
            var validationErrors = new List<string>();

            if (constructionDto.FaultNumber == null)
            {
                validationErrors.Add("رقم العطل مطلوب.");
            }

            if (string.IsNullOrWhiteSpace(constructionDto.Contractor))
            {
                validationErrors.Add("اسم المقاول مطلوب.");
            }

            if (string.IsNullOrWhiteSpace(constructionDto.Contractor))
            {
                validationErrors.Add("اسم الحي مطلوب.");
            }


            if (validationErrors.Any())
            {
                return BadRequest(new ApiResponse<List<string>>(400, "هناك أخطاء في البيانات المدخلة", validationErrors));
            }

            try
            {
                var project = await _constructionService.CreateOrUpdateConstructionAsync(constructionDto, isArchive);
                return Ok(new ApiResponse<Construction>(200, "تم إنشاء أو تحديث المشروع", project));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"حدث خطأ: {ex.Message}");
            }
        }

        [HttpGet("get-all-construction")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<Construction>>>> GetAllConstructions()
        {
            var projects = await _constructionService.GetAllConstructionAsync();
            return Ok(new ApiResponse<IReadOnlyCollection<Construction>>(200, "تم العثور على المشاريع", projects));
        }
        [HttpGet("get-construction/{id}")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<Construction>>>> GetConstructionById(int id)
        {
            var project = await _constructionService.GetConstructionByIdAsync(id);
            return Ok(new { statusCode = 200, message = "تم العثور على المشاريع", data = project });
        }

        [HttpGet("get-construction-pagination")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<Construction>>>> GetConstructionsAsync([FromQuery] bool? isArchive, [FromQuery] int? sortByOrderNumber, [FromQuery] int pageSize = 5, [FromQuery] int pageIndex = 1)
        {
            var result = await _constructionService.GetConstructionWithPaginationAsync(isArchive, sortByOrderNumber, pageSize, pageIndex);
            if (result == null)
            {
                return NotFound(new ApiResponse<string>(404, "لا توجد مشاريع"));
            }

            return Ok(new ApiResponse<IReadOnlyCollection<Construction>>(200, "تم العثور على المشاريع", result));
        }

        [HttpGet("construction-changes")]
        public async Task<ActionResult<IReadOnlyCollection<Construction>>> GetConstructionChanges(int projectId)
        {
            var changes = await _constructionService.GetOperationChangesAsync(projectId);

            if (changes == null || !changes.Any())
            {
                return NotFound("لا توجد تغييرات لهذا المشروع.");
            }

            return Ok(changes);
        }

        [HttpGet("filter-orders")]
        public async Task<ActionResult<IReadOnlyCollection<object>>> FilterOrder(string? branchName, bool? isArchive)
        {
            var orders = await _constructionService.FilterConstructionByNameBranchAndIsArchive(branchName, isArchive);

            var result = orders.Where(d => d.IsApprove == true).Select(order => new
            {
                order.Id,
                order.WorkOrderType,
                order.WorkDescription,
                order.DurationOfImplementation,
                order.FaultNumber,
                order.District,
                order.Contractor,
                order.NumberOfEquipment,
                order.Consultant,
                order.BranchName,
                order.OrderDate,
                order.SafetyViolationsExist,
                order.Note,
                order.IsArchived,
                order.EstimatedValue,
                order.ActualValue,
                order.Situation,
                order.StationNumber,
                order.ExtractNumber,
                order.CreateAt,
                order.ProjectPlace,
                order.Office,
                order.ProjectValue,
                order.ReceiveDateTime,
                order.ImplementationPhase,
                order.Coordinates,
                order.OrderType,
                order.CompletionDate,
                order.DescriptionViolation,
                order.NumberOfDaysDelayed,
                order.NumberOfDaysRemaining,
                order.CompletionStatusReport,
                order.ProjectExcavationLength,
                order.DailyExcavationLength,
                order.ExcavationLength,
                order.CableCompletion,
                order.CableLength,
                order.DailyCableLength,
                order.ProjectCableLength,
                order.TypeOfStomachTest,


                TestModels = order.TestModels.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.ConstructionId
                }).ToList(),
                ModelPhotos = order.ModelPhotos.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.ConstructionId
                }).ToList(),

                SitePhotos = order.SitePhotos.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.ConstructionId
                }).ToList(),
                SafetyWastePhotos = order.SafetyWastePhotos.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.ConstructionId
                }).ToList()
            }).ToList();

            return Ok(result);
        }


        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromForm] UpdateConstructionDto constructionDto)
        {
            try
            {
                var updatedProject = await _constructionService.UpdateConstructionAsync(id, constructionDto, (bool)constructionDto.isArchive);
                if (updatedProject == null)
                {
                    return NotFound(new { message = "المشروع غير موجود أو لم يتم تحديثه." });
                }

                return Ok(new
                {
                    message = "تم تحديث المشروع بنجاح",
                    project = updatedProject
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return BadRequest(new { message = innerMessage });
            }

        }




        [HttpDelete("model-photo")]
        public async Task<IActionResult> DeleteModelPhoto(int photoId)
        {

            var photo = await _modelPhotoSubRepository.GetByIdAsync(photoId);
            if (photo == null)
                return NotFound("Photo not found");

            await _modelPhotoSubRepository.DeleteAsync(photo);

            return Ok("Photo deleted successfully");
        }



        [HttpDelete("site-photo")]
        public async Task<IActionResult> DeleteSitePhoto(int photoId)
        {

            var photo = await _sitePhotoSubRepository.GetByIdAsync(photoId);
            if (photo == null)
                return NotFound("Photo not found");

            await _sitePhotoSubRepository.DeleteAsync(photo);

            return Ok("Photo deleted successfully");
        }

        [HttpDelete("safety-photo")]
        public async Task<IActionResult> DeleteSafetyPhoto(int photoId)
        {

            var photo = await _safetyPhotoSubRepository.GetByIdAsync(photoId);
            if (photo == null)
                return NotFound("Photo not found");

            await _safetyPhotoSubRepository.DeleteAsync(photo);

            return Ok("Photo deleted successfully");
        }
        [HttpDelete("test-model")]
        public async Task<IActionResult> DeleteTestPhoto(int photoId)
        {

            var photo = await _testModelSubRepository.GetByIdAsync(photoId);
            if (photo == null)
                return NotFound("Photo not found");

            await _testModelSubRepository.DeleteAsync(photo);

            return Ok("Photo deleted successfully");
        }


        [HttpGet("{projectId}/changes")]
        public async Task<IActionResult> GetProjectChangesAsync(int projectId)
        {
            try
            {
                var changes = await _constructionService.GetProjectChangesAsync(projectId);
                return Ok(changes);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpPut("update-office")]
        public async Task<IActionResult> UpdateProjectsOffice([FromQuery] string oldOfficeName, [FromQuery] string newOfficeName)
        {
            try
            {
                await _constructionService.UpdateProjectsByOfficeWithContextAsync(oldOfficeName, newOfficeName);

                return Ok(new
                {
                    message = $"تم تحديث جميع الطلبات المرتبطة بالمكتب {oldOfficeName} إلى {newOfficeName} بنجاح."
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class UpdateExcavationLengthDto
        {
            public double? ProjectExcavationLengthEnd { get; set; }
            public double? CableLengthEnd { get; set; }
        }


        public class ApproveProjectDto
        {
            public int ProjectId { get; set; }
            public bool IsApprove { get; set; }
            public string ProjectType { get; set; } // مثال: "Construction", "Maintenance", ...

            public string? RejectionReason { get; set; }

        }

        [HttpPut("approveProject")]
        public async Task<IActionResult> ApproveOrRejectProject([FromBody] ApproveProjectDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { statusCode = 401, message = "لا يمكن تحديد هوية المستخدم." });

            object project = null;

            switch (dto.ProjectType.ToLower())
            {
                case "construction":
                    project = await _context.Constructions.FindAsync(dto.ProjectId);
                    break;
                case "maintenance":
                    project = await _context.Maintenances.FindAsync(dto.ProjectId);
                    break;
                case "rehabilitationworks":
                    project = await _context.NewProjects.FindAsync(dto.ProjectId);
                    break;
                case "privateproject":
                    project = await _context.PrivateProjects.FindAsync(dto.ProjectId);
                    break;
                case "emergency":
                    project = await _context.Emergencys.FindAsync(dto.ProjectId);
                    break;
                default:
                    return BadRequest(new { statusCode = 400, message = "نوع المشروع غير معروف." });
            }

            if (project == null)
                return NotFound(new { statusCode = 404, message = "المشروع غير موجود." });
            if (!dto.IsApprove && string.IsNullOrWhiteSpace(dto.RejectionReason))
            {
                return BadRequest(new { statusCode = 400, message = "يرجى إدخال سبب الرفض." });
            }
            // استخدم dynamic علشان تحدّث الخصائص المشتركة
            dynamic dynamicProject = project;
            dynamicProject.IsApprove = dto.IsApprove;
            dynamicProject.UserApproveId = userId;
            dynamicProject.RejectionReason = dto.IsApprove ? null : dto.RejectionReason;


            _context.Update(dynamicProject);
            await _context.SaveChangesAsync();


            if (!dto.IsApprove)
            {
                var appUserId = dynamicProject.AppUserId;
                var user = await _userManager.FindByIdAsync(appUserId);
                if (user != null)
                {
                    var notification = new Notification
                    {
                        Message = $"تم رفض مشروعك: ({dto.ProjectType}). السبب: {dto.RejectionReason}",
                        UserName = "الإدارة",
                        CreatedAt = DateTime.Now,
                        NotificationType = "رفض مشروع",
                        Target = user.Id,
                        ProjectId = dto.ProjectId,
                        ProjectType = dto.ProjectType,


                    };

                    await _notificationRepository.AddAsync(notification);
                }
            }


            string action = dto.IsApprove ? "الموافقة" : "الرفض";
            return Ok(new { statusCode = 200, message = $"تم {action} على مشروع {dto.ProjectType} بنجاح." });
        }

        [HttpPut("approveMultipleProjects")]
        public async Task<IActionResult> ApproveOrRejectMultipleProjects([FromBody] List<ApproveProjectDto> dtos)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { statusCode = 401, message = "لا يمكن تحديد هوية المستخدم." });

            if (dtos == null || dtos.Count == 0)
                return BadRequest(new { statusCode = 400, message = "يرجى تحديد المشاريع." });

            List<string> rejectedProjects = new List<string>();
            List<string> approvedProjects = new List<string>();

            foreach (var dto in dtos)
            {
                object project = null;

                switch (dto.ProjectType.ToLower())
                {
                    case "construction":
                        project = await _context.Constructions.FindAsync(dto.ProjectId);
                        break;
                    case "maintenance":
                        project = await _context.Maintenances.FindAsync(dto.ProjectId);
                        break;
                    case "rehabilitationworks":
                        project = await _context.NewProjects.FindAsync(dto.ProjectId);
                        break;
                    case "privateproject":
                        project = await _context.PrivateProjects.FindAsync(dto.ProjectId);
                        break;
                    case "emergency":
                        project = await _context.Emergencys.FindAsync(dto.ProjectId);
                        break;
                    default:
                        rejectedProjects.Add($"المشروع {dto.ProjectId} من نوع {dto.ProjectType} غير معروف.");
                        continue;
                }

                if (project == null)
                {
                    rejectedProjects.Add($"المشروع {dto.ProjectId} غير موجود.");
                    continue;
                }

                if (!dto.IsApprove && string.IsNullOrWhiteSpace(dto.RejectionReason))
                {
                    rejectedProjects.Add($"يرجى إدخال سبب الرفض للمشروع {dto.ProjectId}.");
                    continue;
                }

                dynamic dynamicProject = project;
                dynamicProject.IsApprove = dto.IsApprove;
                dynamicProject.UserApproveId = userId;
                dynamicProject.RejectionReason = dto.IsApprove ? null : dto.RejectionReason;

                _context.Update(dynamicProject);
                // ✅ تحسين أداء: شلنا الـ SaveChangesAsync من هنا (كان بيتنفذ لكل مشروع لوحده
                // = N نداءات منفصلة للـ DB). دلوقتي بنعمل Save واحد بعد ما اللوب يخلص كله.

                // إرسال إشعار في حالة الرفض
                if (!dto.IsApprove)
                {
                    var appUserId = dynamicProject.AppUserId;
                    var user = await _userManager.FindByIdAsync(appUserId);
                    if (user != null)
                    {
                        var notification = new Notification
                        {
                            Message = $"تم رفض مشروعك: ({dto.ProjectType}). السبب: {dto.RejectionReason}",
                            UserName = "الإدارة",
                            CreatedAt = DateTime.Now,
                            NotificationType = "رفض مشروع",
                            Target = user.Id,
                            ProjectId = dto.ProjectId,
                            ProjectType = dto.ProjectType,
                        };

                        await _notificationRepository.AddAsync(notification);
                    }

                    rejectedProjects.Add($"تم رفض المشروع {dto.ProjectId} بنجاح.");
                }
                else
                {
                    approvedProjects.Add($"تمت الموافقة على المشروع {dto.ProjectId} بنجاح.");
                }
            }

            // ✅ Save واحد بعد ما كل المشاريع في اللوب اتعدلت في الـ Context (بدل Save لكل واحدة)
            await _context.SaveChangesAsync();

            // إذا كانت هناك مشاريع تم رفضها أو الموافقة عليها
            var resultMessage = new
            {
                ApprovedProjects = approvedProjects,
                RejectedProjects = rejectedProjects
            };

            return Ok(resultMessage);
        }

        [HttpGet("getAllProjectsByUserOffice")]
        public async Task<IActionResult> GetAllProjectsByUserOffice()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { statusCode = 401, message = "لا يمكن تحديد هوية المستخدم." });

            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || user.OfficeId == null)
                return NotFound(new { statusCode = 404, message = "المستخدم أو المكتب غير موجود." });

            var office = await _context.Offices.FirstOrDefaultAsync(d => d.Id == user.OfficeId);
            if (office == null)
                return NotFound(new { statusCode = 404, message = "المكتب غير موجود في قاعدة البيانات." });
            var officeName = office.Name;

            // Construction
            var constructions = await _context.Constructions.Include(d => d.TestModels).Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos)
        .Where(p => p.Office == officeName)
        .ToListAsync();

            // Maintenance
            var maintenances = await _context.Maintenances.Include(d => d.TestModels).Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos)
                .Where(p => p.Office == officeName)
                .ToListAsync();

            // RehabilitationWorks (NewProjects)
            var rehabilitationWorks = await _context.NewProjects.Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos)
                .Where(p => p.Office == officeName)
                .ToListAsync();

            // EmergencyProjects
            var emergencyProjects = await _context.Emergencys.Include(d => d.TestModels).Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos)
                .Where(p => p.Office == officeName)
                .ToListAsync();

            // Combine all
            var allProjects = new
            {
                Constructions = constructions,
                Maintenances = maintenances,
                RehabilitationWorks = rehabilitationWorks,
                EmergencyProjects = emergencyProjects
            };

            return Ok(new
            {
                statusCode = 200,
                message = "تم جلب المشاريع الخاصة بالمكتب بنجاح.",
                data = allProjects
            });
        }
        [HttpGet("getUnapprovedProjects")]
        public async Task<IActionResult> GetUnapprovedProjects()
        {
            var user = await _userManager.GetUserAsync(User);
            var userRoles = await _userManager.GetRolesAsync(user);
            var role = userRoles.FirstOrDefault();

            string officeFilter = null;
            string branchFilter = null;

            // Determine filters based on role
            if (role == "officeManager")
            {
                var officeId = (int)user.OfficeId;
                officeFilter = (await _context.Offices.FirstOrDefaultAsync(d => d.Id == officeId))?.Name;
                if (string.IsNullOrEmpty(officeFilter))
                    return BadRequest("Office name is missing.");
            }
            else if (role == "supervisor")
            {
                var branchId = (int)user.BranchId;
                branchFilter = (await _context.Branchs.FirstOrDefaultAsync(d => d.Id == branchId))?.Name;
                if (string.IsNullOrEmpty(branchFilter))
                    return BadRequest("Branch name is missing.");
            }
            else if (role != "admin")
            {
                return Unauthorized(new { statusCode = 401, message = "ليس لديك الصلاحيات للوصول إلى هذه البيانات." });
            }

            // Query 1: NewProjects
            var newProjectsQuery = _context.NewProjects
                .AsNoTracking()
                .Where(p => p.IsApprove == false);

            if (!string.IsNullOrEmpty(officeFilter))
                newProjectsQuery = newProjectsQuery.Where(p => p.Office == officeFilter);
            if (!string.IsNullOrEmpty(branchFilter))
                newProjectsQuery = newProjectsQuery.Where(p => p.BranchName == branchFilter);

            var newProjects = await newProjectsQuery
                .OrderByDescending(n => n.CreateAt)
                .Select(p => new
                {
                    p.Id,
                    p.WorkOrderType,
                    p.WorkDescription,
                    p.DurationOfImplementation,
                    p.Type,
                    p.FaultNumber,
                    p.QualificationClassification,
                    p.District,
                    p.Contractor,
                    p.StationNumber,
                    p.Consultant,
                    p.OrderType,
                    p.AppUserId,
                    p.UserName,
                    p.UserImage,
                    p.BranchName,
                    p.OrderDate,
                    p.SafetyViolationsExist,
                    p.Note,
                    p.IsArchived,
                    p.EstimatedValue,
                    p.ActualValue,
                    p.ExtractNumber,
                    p.CreateAt,
                    p.ProjectPlace,
                    p.Office,
                    p.ProjectValue,
                    p.Situation,
                    p.ReceiveDateTime,
                    p.Coordinates,
                    p.IsApprove,
                    p.UserApproveId,
                    ModelPhotos = p.ModelPhotos.Select(m => new { m.Id, m.Url }).ToList(),
                    SafetyWastePhotos = p.SafetyWastePhotos.Select(s => new { s.Id, s.Url }).ToList(),
                    SitePhotos = p.SitePhotos.Select(s => new { s.Id, s.Url }).ToList()
                })
                .ToListAsync();

            // Query 2: PrivateProjects
            var privateProjectsQuery = _context.PrivateProjects
                .AsNoTracking()
                .Where(p => p.IsApprove == false);

            if (!string.IsNullOrEmpty(branchFilter))
                privateProjectsQuery = privateProjectsQuery.Where(p => p.BranchName == branchFilter);

            var privateProjects = await privateProjectsQuery
                .OrderByDescending(n => n.CreateAt)
                .Select(p => new
                {
                    p.Id,
                    p.WorkDescription,
                    p.ProjectName,
                    p.Type,
                    p.ProjectPlace,
                    p.ProjectValue,
                    p.TimeOfProject,
                    p.Customer,
                    p.Consultant,
                    p.Contractor,
                    p.AppUserId,
                    p.UserName,
                    p.UserImage,
                    p.BranchName,
                    p.OrderDate,
                    p.SafetyViolationsExist,
                    p.Note,
                    p.IsArchived,
                    p.CreateAt,
                    p.StationNumber,
                    p.Coordinates,
                    p.IsApprove,
                    p.UserApproveId,
                    ModelPhotos = p.ModelPhotos.Select(m => new { m.Id, m.Url }).ToList(),
                    SafetyWastePhotos = p.SafetyWastePhotos.Select(s => new { s.Id, s.Url }).ToList(),
                    SitePhotos = p.SitePhotos.Select(s => new { s.Id, s.Url }).ToList()
                })
                .ToListAsync();

            // Query 3: Constructions
            var constructionsQuery = _context.Constructions
                .AsNoTracking()
                .Where(p => p.IsApprove == false);

            if (!string.IsNullOrEmpty(officeFilter))
                constructionsQuery = constructionsQuery.Where(p => p.Office == officeFilter);
            if (!string.IsNullOrEmpty(branchFilter))
                constructionsQuery = constructionsQuery.Where(p => p.BranchName == branchFilter);

            var constructions = await constructionsQuery
                .OrderByDescending(n => n.CreateAt)
                .Select(c => new
                {
                    c.Id,
                    c.WorkOrderType,
                    c.WorkDescription,
                    c.DurationOfImplementation,
                    c.Type,
                    c.OrderType,
                    c.FaultNumber,
                    c.StationNumber,
                    c.District,
                    c.Contractor,
                    c.Consultant,
                    c.AppUserId,
                    c.UserName,
                    c.UserImage,
                    c.BranchName,
                    c.OrderDate,
                    c.SafetyViolationsExist,
                    c.Note,
                    c.IsArchived,
                    c.EstimatedValue,
                    c.ActualValue,
                    c.ExtractNumber,
                    c.CreateAt,
                    c.ProjectPlace,
                    c.Office,
                    c.ProjectValue,
                    c.Situation,
                    c.ReceiveDateTime,
                    c.Coordinates,
                    c.CompletionDate,
                    c.NumberOfDaysDelayed,
                    c.NumberOfDaysRemaining,
                    c.CompletionStatusReport,
                    c.ProjectExcavationLength,
                    c.DailyExcavationLength,
                    c.ExcavationLength,
                    c.ImplementationPhase,
                    c.DescriptionViolation,
                    c.TypeOfStomachTest,
                    c.NumberOfEquipment,
                    c.CableCompletion,
                    c.ProjectCableLength,
                    c.DailyCableLength,
                    c.CableLength,
                    c.IsApprove,
                    c.UserApproveId,
                    ModelPhotos = c.ModelPhotos.Select(m => new { m.Id, m.Url }).ToList(),
                    SafetyWastePhotos = c.SafetyWastePhotos.Select(s => new { s.Id, s.Url }).ToList(),
                    SitePhotos = c.SitePhotos.Select(s => new { s.Id, s.Url }).ToList(),
                    TestModels = c.TestModels.Select(t => new { t.Id, t.Url }).ToList()
                })
                .ToListAsync();

            // Query 4: Emergencies
            var emergenciesQuery = _context.Emergencys
                .AsNoTracking()
                .Where(p => p.IsApprove == false);

            if (!string.IsNullOrEmpty(officeFilter))
                emergenciesQuery = emergenciesQuery.Where(p => p.Office == officeFilter);
            if (!string.IsNullOrEmpty(branchFilter))
                emergenciesQuery = emergenciesQuery.Where(p => p.BranchName == branchFilter);

            var emergencies = await emergenciesQuery
                .OrderByDescending(n => n.CreateAt)
                .Select(e => new
                {
                    e.Id,
                    e.WorkOrderType,
                    e.WorkDescription,
                    e.StationNumber,
                    e.DurationOfImplementation,
                    e.Type,
                    e.OrderType,
                    e.FaultNumber,
                    e.District,
                    e.Contractor,
                    e.Consultant,
                    e.AppUserId,
                    e.UserName,
                    e.UserImage,
                    e.BranchName,
                    e.OrderDate,
                    e.SafetyViolationsExist,
                    e.Note,
                    e.IsArchived,
                    e.EstimatedValue,
                    e.ActualValue,
                    e.ExtractNumber,
                    e.CreateAt,
                    e.ProjectPlace,
                    e.Office,
                    e.ProjectValue,
                    e.Situation,
                    e.ReceiveDateTime,
                    e.Coordinates,
                    e.DescriptionViolation,
                    e.ImplementationPhase,
                    e.NotificationNumber,
                    e.TaskNumber,
                    e.TypeOfStomachTest,
                    e.NumberOfEquipment,
                    e.IsApprove,
                    e.UserApproveId,
                    ModelPhotos = e.ModelPhotos.Select(m => new { m.Id, m.Url }).ToList(),
                    SafetyWastePhotos = e.SafetyWastePhotos.Select(s => new { s.Id, s.Url }).ToList(),
                    SitePhotos = e.SitePhotos.Select(s => new { s.Id, s.Url }).ToList(),
                    TestModels = e.TestModels.Select(t => new { t.Id, t.Url }).ToList()
                })
                .ToListAsync();

            // Query 5: Maintenances
            var maintenancesQuery = _context.Maintenances
                .AsNoTracking()
                .Where(p => p.IsApprove == false);

            if (!string.IsNullOrEmpty(officeFilter))
                maintenancesQuery = maintenancesQuery.Where(p => p.Office == officeFilter);
            if (!string.IsNullOrEmpty(branchFilter))
                maintenancesQuery = maintenancesQuery.Where(p => p.BranchName == branchFilter);

            var maintenances = await maintenancesQuery
                .OrderByDescending(n => n.CreateAt)
                .Select(m => new
                {
                    m.Id,
                    m.WorkOrderType,
                    m.WorkDescription,
                    m.DurationOfImplementation,
                    m.Type,
                    m.FaultNumber,
                    m.District,
                    m.OrderType,
                    m.StationNumber,
                    m.Contractor,
                    m.Consultant,
                    m.AppUserId,
                    m.UserName,
                    m.UserImage,
                    m.BranchName,
                    m.OrderDate,
                    m.SafetyViolationsExist,
                    m.Note,
                    m.IsArchived,
                    m.ImplementationPhase,
                    m.NotificationNumber,
                    m.TaskNumber,
                    m.TypeOfStomachTest,
                    m.DescriptionViolation,
                    m.NumberOfEquipment,
                    m.EstimatedValue,
                    m.ActualValue,
                    m.ExtractNumber,
                    m.CreateAt,
                    m.ProjectPlace,
                    m.Office,
                    m.ProjectValue,
                    m.Situation,
                    m.ReceiveDateTime,
                    m.Coordinates,
                    m.IsApprove,
                    m.UserApproveId,
                    ModelPhotos = m.ModelPhotos.Select(ph => new { ph.Id, ph.Url }).ToList(),
                    SafetyWastePhotos = m.SafetyWastePhotos.Select(s => new { s.Id, s.Url }).ToList(),
                    SitePhotos = m.SitePhotos.Select(s => new { s.Id, s.Url }).ToList(),
                    TestModels = m.TestModels.Select(t => new { t.Id, t.Url }).ToList()
                })
                .ToListAsync();

            var result = new
            {
                PrivateProjects = privateProjects,
                RehabilitationWorks = newProjects,
                Constructions = constructions,
                Emergencies = emergencies,
                Maintenances = maintenances
            };

            return Ok(result);
        }

        [HttpPut("approveAllProjects")]
        public async Task<IActionResult> ApproveAllProjects()
        {
            // Construction
            var constructions = await _context.Constructions.ToListAsync();
            foreach (var project in constructions)
            {
                project.IsApprove = true;
            }

            // Maintenance
            var maintenances = await _context.Maintenances.ToListAsync();
            foreach (var project in maintenances)
            {
                project.IsApprove = true;
            }

            // RehabilitationWorks (NewProjects)
            var newProjects = await _context.NewProjects.ToListAsync();
            foreach (var project in newProjects)
            {
                project.IsApprove = true;
            }

            // PrivateProjects
            var privateProjects = await _context.PrivateProjects.ToListAsync();
            foreach (var project in privateProjects)
            {
                project.IsApprove = true;
            }

            // EmergencyProjects
            var emergencyProjects = await _context.Emergencys.ToListAsync();
            foreach (var project in emergencyProjects)
            {
                project.IsApprove = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                statusCode = 200,
                message = "تمت الموافقة على جميع المشاريع بنجاح."
            });
        }

        [HttpPut("{constructionId}/pricing-items/executed-quantity")]
        public async Task<IActionResult> UpdateExecutedQuantity(
    int constructionId,
    [FromBody] UpdateExecutedQuantityDto dto)
        {
            try
            {
                await _constructionService.UpdateExecutedQuantityAsync(constructionId, dto);
                return Ok(new ApiResponse<string>(200, "تم تحديث الكمية المنفذة بنجاح", null));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<string>(404, ex.Message, null));
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }

        /// <summary>
        /// تحديث الكميات المنفذة لعدة بنود دفعة واحدة مع تسجيل سجل تاريخي
        /// </summary>
        [HttpPut("{constructionId}/pricing-items/executed-quantities")]
        public async Task<IActionResult> UpdateExecutedQuantities(
            int constructionId,
            [FromBody] UpdateExecutedQuantitiesDto dto)
        {
            try
            {
                await _constructionService.UpdateExecutedQuantitiesAsync(constructionId, dto);
                return Ok(new ApiResponse<string>(200, "تم تحديث الكميات المنفذة بنجاح", null));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<string>(404, ex.Message, null));
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }

        /// <summary>
        /// جلب سجل تحديثات الكميات المنفذة لمشروع معين
        /// يمكن الفلترة ببند معين عبر pricingItemId
        /// </summary>
        [HttpGet("{constructionId}/pricing-items/executed-quantity-logs")]
        public async Task<IActionResult> GetExecutedQuantityLogs(
            int constructionId,
            [FromQuery] int? pricingItemId = null)
        {
            try
            {
                var logs = await _constructionService.GetExecutedQuantityLogsAsync(constructionId, pricingItemId);
                return Ok(new
                {
                    statusCode = 200,
                    totalCount = logs.Count,
                    logs = logs.Select(l => new
                    {
                        l.Id,
                        l.ConstructionId,
                        l.PricingItemId,
                        l.UpdatedByUserName,
                        UpdatedAt = l.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                        l.OldExecutedQuantity,
                        l.NewExecutedQuantity,
                        l.NewExecutedWorksValue,
                        l.NewExecutionPercentage,
                        l.NewEstimatedQuantity,
                        l.Note
                    })
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmergency(int id)
        {
            try
            {
                var deleted = await _constructionService.DeleteConstructionAsync(id);
                if (!deleted)
                    return NotFound(new ApiResponse<string>(404, "المشروع غير موجود", null));

                return Ok(new ApiResponse<string>(200, "تم حذف المشروع وكل الصور والبيانات المرتبطة به بنجاح", null));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ApiResponse<string>(404, ex.Message, null));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ApiResponse<string>(401, ex.Message, null));
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }


    }

}
