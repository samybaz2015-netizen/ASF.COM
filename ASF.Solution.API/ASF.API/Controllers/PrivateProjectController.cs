using Microsoft.AspNetCore.Authorization;
using ASF.Core.Entities.Workflow;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ASF.Api.Helpers;
using ASF.Core.Dtos;
using ASF.Core.Dtos.PrivateProjectDto;
using ASF.Core.Entities.NewProject;
using ASF.Core.Entities.PrivateProject;
using ASF.Core.Helpers;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Service;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    //  [ApiController]
    [Authorize]
    public class PrivateProjectController : ControllerBase
    {
        private readonly IPrivateProject _privateProject;
        private readonly IGenericRepository<ModelPhotoForPrivate> _modelPhotoSubRepository;
        private readonly IGenericRepository<SitePhotoForPrivate> _sitePhotoSubRepository;
        private readonly IGenericRepository<SafetyWastePhotoForPrivate> _safetyPhotoSubRepository;

        public PrivateProjectController(IPrivateProject privateProject,
             IGenericRepository<ModelPhotoForPrivate> modelPhotoSubRepository,
            IGenericRepository<SitePhotoForPrivate> sitePhotoSubRepository,
            IGenericRepository<SafetyWastePhotoForPrivate> safetyPhotoSubRepository)
        {
            _privateProject = privateProject;
            _modelPhotoSubRepository = modelPhotoSubRepository;
            _sitePhotoSubRepository = sitePhotoSubRepository;
            _safetyPhotoSubRepository = safetyPhotoSubRepository;
        }


        [HttpPost("CreatePrivateProject")]
        public async Task<ActionResult<ApiResponse<PrivateProject>>> CreatePrivateProject([FromForm] PrivateProjectDto newProjectDto)
        {
            var validationErrors = new List<string>();


            // التحقق من اسم المشروع
            if (string.IsNullOrWhiteSpace(newProjectDto.ProjectName))
            {
                validationErrors.Add("اسم المشروع مطلوب.");
            }

            // التحقق من مكان المشروع
            if (string.IsNullOrWhiteSpace(newProjectDto.ProjectPlace))
            {
                validationErrors.Add("مكان المشروع مطلوب.");
            }

            // التحقق من العميل
            if (string.IsNullOrWhiteSpace(newProjectDto.Customer))
            {
                validationErrors.Add("اسم العميل مطلوب.");
            }

            // التحقق من اسم المقاول
            if (string.IsNullOrWhiteSpace(newProjectDto.Contractor))
            {
                validationErrors.Add("اسم المقاول مطلوب.");
            }

            // التحقق من قيمة المشروع
            if (string.IsNullOrWhiteSpace(newProjectDto.ProjectValue))
            {
                validationErrors.Add("القيمة التقديرية للمشروع مطلوبة.");
            }



            if (newProjectDto.TimeOfProject == null)
            {
                validationErrors.Add("مدة المشروع مطلوبة.");
            }

            //if (newProjectDto.DurationOfImplementation == null)
            //{
            //    validationErrors.Add("مدة  تنفيذ المشروع مطلوبة.");
            //}
            if (newProjectDto.SafetyViolationsExist == null)
            {
                validationErrors.Add("يرجى تحديد ما إذا كانت هناك مخالفات سلامة.");
            }




            if (validationErrors.Any())
            {
                return BadRequest(new ApiResponse<List<string>>(400, "هناك أخطاء في البيانات المدخلة", validationErrors));
            }

            try
            {
                var project = await _privateProject.CreatePrivateProjectAsync(newProjectDto, newProjectDto.IsArchived);
                // إدخال أمر العمل مسار السلال تلقائياً. تُحلّ الخدمة من الطلب بدل
                // حقنها في المُنشئ، فلا يتغيّر توقيع المتحكّم. والدالة لا ترمي:
                // إنشاء أمر العمل نجح فعلاً ولا يجوز أن يُبطِله فشل تسجيل الموقع.
                await HttpContext.RequestServices
                    .GetRequiredService<IWorkOrderFlowService>()
                    .AutoEnterAsync(
                        ProjectTypeCodes.PrivateProject,
                        project.Id,
                        project.ContractNumber,
                        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
                        User.FindFirstValue(ClaimTypes.GivenName));

                var response = new ApiResponse<PrivateProject>(200, "تم إضافة المشروع بنجاح", project);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }


        [HttpGet("get-all-privateProjects")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<PrivateProject>>>> GetAllPrivateProjects()
        {
            var projects = await _privateProject.GetAllPrivateProjectsAsync();
            return Ok(new ApiResponse<IReadOnlyCollection<PrivateProject>>(200, "تم العثور على المشاريع", projects));
        }
        [HttpGet("get-privateProject/{id}")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<NewProject>>>> GetConstructionById(int id)
        {
            var project = await _privateProject.GetPrivateProjectById(id);
            return Ok(new { statusCode = 200, message = "تم العثور على المشاريع", data = project });
        }

        [HttpGet("get-privateProjectByid")]
        public async Task<ActionResult<ApiResponse<PrivateProject>>> GetPrivateProjectByid(int id)
        {
            var project = await _privateProject.GetPrivateProjectById(id);
            return Ok(new ApiResponse<PrivateProject>(200, "تم العثور على المشاريع", project));
        }


        [HttpPut("update")]
        public async Task<IActionResult> UpdateProject([FromForm] UpdatePrivateProjectDto newProjectDto)
        {
            try
            {
                var updatedProject = await _privateProject.UpdatePrivateProjectAsync(newProjectDto, newProjectDto.IsArchived);
                return Ok(new ApiResponse<PrivateProject>(200, "تم تحديث المشروع بنجاح", updatedProject));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ApiResponse<string>(401, ex.Message, null));
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


        [HttpGet("filter-orders-privateproject")]
        public async Task<ActionResult<IReadOnlyCollection<PrivateProject>>> FilterOrder(string? branchName, bool? isArchive)
        {
            var o = await _privateProject.FilterPrivateProjectByNameBranchAndIsArchive(branchName, isArchive);
            var orders = o.Where(d => d.IsApprove == true);
            return Ok(orders);
        }

        [HttpGet("{projectId}/changes")]
        public async Task<IActionResult> GetProjectChangesAsync(int projectId)
        {
            try
            {
                var changes = await _privateProject.GetProjectChangesAsync(projectId);
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
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmergency(int id)
        {
            try
            {
                var deleted = await _privateProject.DeleteConstructionAsync(id);
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
