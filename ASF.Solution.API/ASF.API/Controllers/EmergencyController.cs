using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using ASF.Core.Entities.Workflow;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ASF.Api.Helpers;
using ASF.Core.Dtos;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Emergency;
using ASF.Core.Helpers;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Service;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EmergencyController : ControllerBase
    {
        private readonly IEmergencyService _emergencyService;
        private readonly IGenericRepository<ModelPhotoForEmergency> _modelPhotoSubRepository;
        private readonly IGenericRepository<SitePhotoForEmergency> _sitePhotoSubRepository;
        private readonly IGenericRepository<SafetyWastePhotoForEmergency> _safetyPhotoSubRepository;
        private readonly IGenericRepository<ModelTestForEmergency> _testModelSubRepository;

        public EmergencyController(
            IEmergencyService emergencyService,
            IGenericRepository<ModelPhotoForEmergency> modelPhotoSubRepository,
            IGenericRepository<SitePhotoForEmergency> sitePhotoSubRepository,
            IGenericRepository<SafetyWastePhotoForEmergency> safetyPhotoSubRepository,
            IGenericRepository<ModelTestForEmergency> testModelSubRepository
            )
        {
            _emergencyService = emergencyService;
            _modelPhotoSubRepository = modelPhotoSubRepository;
            _sitePhotoSubRepository = sitePhotoSubRepository;
            _safetyPhotoSubRepository = safetyPhotoSubRepository;
            _testModelSubRepository = testModelSubRepository;
        }

        [HttpPost("create-emergency")]
        public async Task<ActionResult<ApiResponse<Emergency>>> CreateEmergency([FromForm] EmergencyDto emergencyDto)
        {
            var validationErrors = new List<string>();

            ValidateEmergencyDto(emergencyDto, validationErrors);

            if (validationErrors.Any())
            {
                return BadRequest(new ApiResponse<List<string>>(400, "هناك أخطاء في البيانات المدخلة", validationErrors));
            }

            try
            {
                var project = await _emergencyService.CreateEmergencyAsync(emergencyDto, emergencyDto.isArchive);
                // إدخال أمر العمل مسار السلال تلقائياً. تُحلّ الخدمة من الطلب بدل
                // حقنها في المُنشئ، فلا يتغيّر توقيع المتحكّم. والدالة لا ترمي:
                // إنشاء أمر العمل نجح فعلاً ولا يجوز أن يُبطِله فشل تسجيل الموقع.
                await HttpContext.RequestServices
                    .GetRequiredService<IWorkOrderFlowService>()
                    .AutoEnterAsync(
                        ProjectTypeCodes.Emergency,
                        project.Id,
                        project.ContractNumber,
                        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
                        User.FindFirstValue(ClaimTypes.GivenName));

                var response = new ApiResponse<Emergency>(200, "تم إضافة المشروع بنجاح", project);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }


        private void ValidateEmergencyDto(EmergencyDto dto, List<string> validationErrors)
        {
            if (dto.FaultNumber == null)
                validationErrors.Add("رقم العطل مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.Contractor))
                validationErrors.Add("اسم المقاول مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.District))
                validationErrors.Add("اسم الحي مطلوب.");
            if (string.IsNullOrWhiteSpace(dto.WorkOrderType))
                validationErrors.Add("نوع أمر العمل مطلوب");
            if (string.IsNullOrWhiteSpace(dto.WorkDescription))
                validationErrors.Add("وصف العمل مطلوب.");
            if (dto.DurationOfImplementation == null)
                validationErrors.Add("مدة التنفيذ مطلوبة.");
            if (dto.isArchive == null)
                validationErrors.Add("يرجى تحديد هل يوجد مخالفات سلامة.");
        }


        [HttpPost("create-or-update-emergency")]
        public async Task<IActionResult> CreateOrUpdateEmergency([FromForm] EmergencyDto emergencyDto, bool isArchive)
        {
            var validationErrors = new List<string>();

            if (emergencyDto.FaultNumber == null)
            {
                validationErrors.Add("رقم العطل مطلوب.");
            }

            if (string.IsNullOrWhiteSpace(emergencyDto.Contractor))
            {
                validationErrors.Add("اسم المقاول مطلوب.");
            }

            if (string.IsNullOrWhiteSpace(emergencyDto.Contractor))
            {
                validationErrors.Add("اسم الحي مطلوب.");
            }


            //if ( emergencyDto.ModelPhotos==null||!emergencyDto.ModelPhotos.Any() )
            //{
            //    validationErrors.Add("صور النموذج مطلوبة.");
            //}

            //if ( emergencyDto.SitePhotos==null||!emergencyDto.SitePhotos.Any() )
            //{
            //    validationErrors.Add("صور الموقع مطلوبة.");
            //}


            if (validationErrors.Any())
            {
                return BadRequest(new ApiResponse<List<string>>(400, "هناك أخطاء في البيانات المدخلة", validationErrors));
            }

            try
            {
                var project = await _emergencyService.CreateOrUpdateEmergencyAsync(emergencyDto, isArchive);
                return Ok(new ApiResponse<Emergency>(200, "تم إنشاء أو تحديث المشروع", project));
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }

        [HttpGet("get-all-emergency")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<Emergency>>>> GetAllEmergencys()
        {
            var projects = await _emergencyService.GetAllEmergencysAsync();
            return Ok(new ApiResponse<IReadOnlyCollection<Emergency>>(200, "تم العثور على المشاريع", projects));
        }

        [HttpGet("get-emergency/{id}")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<Emergency>>>> GetEmergencyById(int id)
        {
            var project = await _emergencyService.GetEmergencyByIdAsync(id);
            return Ok(new { statusCode = 200, message = "تم العثور على المشاريع", data = project });
        }
        [HttpGet("get-emergency-pagination")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<Emergency>>>> GetEmergencysAsync([FromQuery] bool? isArchive, [FromQuery] int? sortByOrderNumber, [FromQuery] int pageSize = 5, [FromQuery] int pageIndex = 1)
        {
            var result = await _emergencyService.GetEmergencyWithPaginationAsync(isArchive, sortByOrderNumber, pageSize, pageIndex);
            if (result == null)
            {
                return NotFound(new ApiResponse<string>(404, "لا توجد مشاريع"));
            }

            return Ok(new ApiResponse<IReadOnlyCollection<Emergency>>(200, "تم العثور على المشاريع", result));
        }

        [HttpGet("emergency-changes")]
        public async Task<ActionResult<IReadOnlyCollection<Emergency>>> GetEmergencyChanges(int projectId)
        {
            var changes = await _emergencyService.GetOperationChangesAsync(projectId);

            if (changes == null || !changes.Any())
            {
                return NotFound("لا توجد تغييرات لهذا المشروع.");
            }

            return Ok(changes);
        }

        [HttpGet("filter-orders")]
        public async Task<ActionResult<IReadOnlyCollection<object>>> FilterOrder(string? branchName, bool? isArchive)
        {
            var orders = await _emergencyService.FilterEmergencyByNameBranchAndIsArchive(branchName, isArchive);

            var result = orders.Where(d => d.IsApprove == true).Select(order => new
            {
                order.Id,
                order.WorkOrderType,
                order.WorkDescription,
                order.StationNumber,
                order.NumberOfEquipment,
                order.DurationOfImplementation,
                order.FaultNumber,
                order.District,
                order.Contractor,
                order.Consultant,
                order.BranchName,
                order.OrderDate,
                order.SafetyViolationsExist,
                order.DescriptionViolation,
                order.Note,
                order.IsArchived,
                order.EstimatedValue,
                order.ActualValue,
                order.ExtractNumber,
                order.CreateAt,
                order.ProjectPlace,
                order.Office,
                order.ProjectValue,
                order.Situation,
                order.ReceiveDateTime,
                order.Coordinates,
                order.ImplementationPhase,
                order.NotificationNumber,
                order.TaskNumber,
                order.TypeOfStomachTest,

                ModelPhotos = order.ModelPhotos.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.EmergencyId
                }).ToList(),
                TestModels = order.TestModels.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.EmergencyId
                }).ToList(),

                SitePhotos = order.SitePhotos.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.EmergencyId
                }).ToList(),
                SafetyWastePhotos = order.SafetyWastePhotos.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.EmergencyId
                }).ToList()
            }).ToList();

            return Ok(result);
        }


        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromForm] UpdateEmergencyDto emergencyDto)
        {
            try
            {
                var updatedProject = await _emergencyService.UpdateEmergencyAsync(id, emergencyDto, (bool)emergencyDto.isArchive);
                if (updatedProject == null)
                    return NotFound(new ApiResponse<string>(404, "المشروع غير موجود أو لم يتم تحديثه.", null));

                return Ok(new ApiResponse<Emergency>(200, "تم تحديث المشروع بنجاح", updatedProject));
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
                var changes = await _emergencyService.GetProjectChangesAsync(projectId);
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
                await _emergencyService.UpdateProjectsByOfficeWithContextAsync(oldOfficeName, newOfficeName);

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
                await _emergencyService.UpdateExecutedQuantityAsync(projectId, dto);
                return Ok(new { statusCode = 200, message = "تم تحديث الكمية المنفذة بنجاح" });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        // ─── تحديث كميات منفذة لعدة بنود (batch) ─────────────────────────
        [HttpPut("{projectId}/update-executed-quantities")]
        public async Task<IActionResult> UpdateExecutedQuantities(int projectId, [FromBody] UpdateExecutedQuantitiesDto dto)
        {
            try
            {
                await _emergencyService.UpdateExecutedQuantitiesAsync(projectId, dto);
                return Ok(new { statusCode = 200, message = "تم تحديث الكميات المنفذة بنجاح" });
            }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        // ─── جلب سجل التحديثات ─────────────────────────────────────────────
        [HttpGet("{projectId}/executed-quantity-logs")]
        public async Task<IActionResult> GetExecutedQuantityLogs(int projectId, [FromQuery] int? pricingItemId)
        {
            var logs = await _emergencyService.GetExecutedQuantityLogsAsync(projectId, pricingItemId);
            return Ok(new { statusCode = 200, message = "تم جلب السجلات", data = logs });
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmergency(int id)
        {
            try
            {
                var deleted = await _emergencyService.DeleteEmergencyAsync(id);
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
