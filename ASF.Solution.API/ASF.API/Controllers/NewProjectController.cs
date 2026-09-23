
using Microsoft.AspNetCore.Authorization;
using ASF.Core.Entities.Workflow;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ASF.Api.Helpers;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.NewProject;
using ASF.Core.Helpers;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Service;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RehabilitationWorksController : ControllerBase
    {
        private readonly INewProjectService _newProjectService;
        private readonly IGenericRepository<ModelPhotoForNew> _modelPhotoSubRepository;
        private readonly IGenericRepository<SitePhotoForNew> _sitePhotoSubRepository;
        private readonly IGenericRepository<SafetyWastePhotoForNew> _safetyPhotoSubRepository;
        private readonly ApplicationDbContext _context;

        public RehabilitationWorksController(
            INewProjectService newProjectService,
            IGenericRepository<ModelPhotoForNew> modelPhotoSubRepository,
            IGenericRepository<SitePhotoForNew> sitePhotoSubRepository,
            IGenericRepository<SafetyWastePhotoForNew> safetyPhotoSubRepository,
            ApplicationDbContext context
            )
        {
            _newProjectService = newProjectService;
            _modelPhotoSubRepository = modelPhotoSubRepository;
            _sitePhotoSubRepository = sitePhotoSubRepository;
            _safetyPhotoSubRepository = safetyPhotoSubRepository;
            _context = context;
        }

        //[Authorize(Roles = "eng")]
        [HttpPost("create-rehabilitationWorks")]
        public async Task<ActionResult<ApiResponse<NewProject>>> CreateNewProject([FromForm] NewProjectDto newProjectDto)
        {
            var validationErrors = new List<string>();

            ValidateNewProjectDto(newProjectDto, validationErrors);

            if (validationErrors.Any())
            {
                return BadRequest(new ApiResponse<List<string>>(400, "هناك أخطاء في البيانات المدخلة", validationErrors));
            }

            try
            {
                var project = await _newProjectService.CreateNewProjectAsync(newProjectDto, newProjectDto.isArchive);
                // إدخال أمر العمل مسار السلال تلقائياً. تُحلّ الخدمة من الطلب بدل
                // حقنها في المُنشئ، فلا يتغيّر توقيع المتحكّم. والدالة لا ترمي:
                // إنشاء أمر العمل نجح فعلاً ولا يجوز أن يُبطِله فشل تسجيل الموقع.
                await HttpContext.RequestServices
                    .GetRequiredService<IWorkOrderFlowService>()
                    .AutoEnterAsync(
                        ProjectTypeCodes.NewProject,
                        project.Id,
                        project.ContractNumber,
                        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
                        User.FindFirstValue(ClaimTypes.GivenName));

                var response = new ApiResponse<NewProject>(200, "تم إضافة المشروع بنجاح", project);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }

        private void ValidateNewProjectDto(NewProjectDto dto, List<string> validationErrors)
        {
            if (dto.FaultNumber == null)
                validationErrors.Add("رقم العطل مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.Contractor))
                validationErrors.Add("اسم المقاول مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.QualificationClassification))
                validationErrors.Add("تصنيف التاهيل مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.District))
                validationErrors.Add("اسم الحي مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.WorkOrderType))
                validationErrors.Add("نوع أمر العمل مطلوب");
            if (dto.DurationOfImplementation == null)
                validationErrors.Add("مدة التنفيذ مطلوبة.");
            if (dto.isArchive == null)
                validationErrors.Add("يرجى تحديد هل يوجد مخالفات سلامة.");
        }


        [HttpPost("create-or-update-rehabilitationWorks")]
        public async Task<IActionResult> CreateOrUpdateNewProject([FromForm] NewProjectDto newProjectDto, bool isArchive)
        {
            var validationErrors = new List<string>();

            if (newProjectDto.FaultNumber == null)
            {
                validationErrors.Add("رقم العطل مطلوب.");
            }

            if (string.IsNullOrWhiteSpace(newProjectDto.Contractor))
            {
                validationErrors.Add("اسم المقاول مطلوب.");
            }

            if (string.IsNullOrWhiteSpace(newProjectDto.Contractor))
            {
                validationErrors.Add("اسم الحي مطلوب.");
            }


            //if ( newProjectDto.ModelPhotos==null||!newProjectDto.ModelPhotos.Any() )
            //{
            //    validationErrors.Add("صور النموذج مطلوبة.");
            //}

            //if ( newProjectDto.SitePhotos==null||!newProjectDto.SitePhotos.Any() )
            //{
            //    validationErrors.Add("صور الموقع مطلوبة.");
            //}


            if (validationErrors.Any())
            {
                return BadRequest(new ApiResponse<List<string>>(400, "هناك أخطاء في البيانات المدخلة", validationErrors));
            }

            try
            {
                var project = await _newProjectService.CreateOrUpdateNewProjectAsync(newProjectDto, isArchive);
                return Ok(new ApiResponse<NewProject>(200, "تم إنشاء أو تحديث المشروع", project));
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }

        [HttpGet("get-all-rehabilitationWorks")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<NewProject>>>> GetAllNewProjects()
        {
            var projects = await _newProjectService.GetAllNewProjectsAsync();
            return Ok(new ApiResponse<IReadOnlyCollection<NewProject>>(200, "تم العثور على المشاريع", projects));
        }

        [HttpGet("get-rehabilitationWorks-pagination")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<NewProject>>>> GetNewProjectsAsync([FromQuery] bool? isArchive, [FromQuery] int? sortByOrderNumber, [FromQuery] int pageSize = 5, [FromQuery] int pageIndex = 1)
        {
            var result = await _newProjectService.GetNewProjectWithPaginationAsync(isArchive, sortByOrderNumber, pageSize, pageIndex);
            if (result == null)
            {
                return NotFound(new ApiResponse<string>(404, "لا توجد مشاريع"));
            }

            return Ok(new ApiResponse<IReadOnlyCollection<NewProject>>(200, "تم العثور على المشاريع", result));
        }
        [HttpGet("get-rehabilitationWork/{id}")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<NewProject>>>> GetConstructionById(int id)
        {
            var project = await _newProjectService.GetNewProjectByIdAsync(id);
            return Ok(new { statusCode = 200, message = "تم العثور على المشاريع", data = project });
        }
        [HttpGet("rehabilitationWorks-changes")]
        public async Task<ActionResult<IReadOnlyCollection<NewProject>>> GetNewProjectChanges(int projectId)
        {
            var changes = await _newProjectService.GetOperationChangesAsync(projectId);

            if (changes == null || !changes.Any())
            {
                return NotFound("لا توجد تغييرات لهذا المشروع.");
            }

            return Ok(changes);
        }

        [HttpGet("filter-orders")]
        public async Task<ActionResult<IReadOnlyCollection<NewProject>>> FilterOrder(string? branchName, bool? isArchive)
        {
            var o = await _newProjectService.FilterNewProjectByNameBranchAndIsArchive(branchName, isArchive);
            var orders = o.Where(d => d.IsApprove == true);

            return Ok(orders);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromForm] UpdateNewProjectDto newProjectDto)
        {
            try
            {
                var updatedProject = await _newProjectService.UpdateNewProjectAsync(id, newProjectDto, (bool)newProjectDto.isArchive);
                if (updatedProject == null)
                    return NotFound(new ApiResponse<string>(404, "المشروع غير موجود أو لم يتم تحديثه.", null));

                return Ok(new ApiResponse<NewProject>(200, "تم تحديث المشروع بنجاح", updatedProject));
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


        [HttpGet("{projectId}/changes")]
        public async Task<IActionResult> GetProjectChangesAsync(int projectId)
        {
            try
            {
                var changes = await _newProjectService.GetProjectChangesAsync(projectId);
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
                await _newProjectService.UpdateProjectsByOfficeWithContextAsync(oldOfficeName, newOfficeName);

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

        // ─── تحديث كمية منفذة لبند واحد ───────────────────────────────────
        [HttpPut("{projectId}/update-executed-quantity")]
        public async Task<IActionResult> UpdateExecutedQuantity(int projectId, [FromBody] UpdateExecutedQuantityDto dto)
        {
            try
            {
                await _newProjectService.UpdateExecutedQuantityAsync(projectId, dto);
                return Ok(new { statusCode = 200, message = "تم تحديث الكمية المنفذة بنجاح" });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("{projectId}/update-executed-quantities")]
        public async Task<IActionResult> UpdateExecutedQuantities(int projectId, [FromBody] UpdateExecutedQuantitiesDto dto)
        {
            try
            {
                await _newProjectService.UpdateExecutedQuantitiesAsync(projectId, dto);
                return Ok(new { statusCode = 200, message = "تم تحديث الكميات المنفذة بنجاح" });
            }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("{projectId}/executed-quantity-logs")]
        public async Task<IActionResult> GetExecutedQuantityLogs(int projectId, [FromQuery] int? pricingItemId)
        {
            var logs = await _newProjectService.GetExecutedQuantityLogsAsync(projectId, pricingItemId);
            return Ok(new { statusCode = 200, message = "تم جلب السجلات", data = logs });
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNewProject(int id)
        {
            try
            {
                var deleted = await _newProjectService.DeleteNewProjectAsync(id);
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
