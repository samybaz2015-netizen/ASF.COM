
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using ASF.Core.Entities.Workflow;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ASF.Api.Helpers;
using ASF.Core.Dtos;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Maintenance;
using ASF.Core.Helpers;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Service;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MaintenanceController : ControllerBase
    {
        private readonly IMaintenanceService _maintenanceService;
        private readonly IGenericRepository<ModelPhotoForMaintenance> _modelPhotoSubRepository;
        private readonly IGenericRepository<SitePhotoForMaintenance> _sitePhotoSubRepository;
        private readonly IGenericRepository<SafetyWastePhotoForMaintenance> _safetyPhotoSubRepository;
        private readonly IGenericRepository<ModelTestForMaintenance> _testModelSubRepository;

        public MaintenanceController(
            IMaintenanceService maintenanceService,
            IGenericRepository<ModelPhotoForMaintenance> modelPhotoSubRepository,
            IGenericRepository<SitePhotoForMaintenance> sitePhotoSubRepository,
            IGenericRepository<SafetyWastePhotoForMaintenance> safetyPhotoSubRepository,
            IGenericRepository<ModelTestForMaintenance> testModelSubRepository
            )
        {
            _maintenanceService = maintenanceService;
            _modelPhotoSubRepository = modelPhotoSubRepository;
            _sitePhotoSubRepository = sitePhotoSubRepository;
            _safetyPhotoSubRepository = safetyPhotoSubRepository;
            _testModelSubRepository = testModelSubRepository;
        }

        //[Authorize(Roles = "eng")]
        [HttpPost("create-maintenance")]
        public async Task<ActionResult<ApiResponse<Maintenance>>> CreateMaintenance([FromForm] MaintenanceDto maintenanceDto)
        {
            var validationErrors = new List<string>();

            ValidateMaintenanceDto(maintenanceDto, validationErrors);

            if (validationErrors.Any())
            {
                return BadRequest(new ApiResponse<List<string>>(400, "هناك أخطاء في البيانات المدخلة", validationErrors));
            }

            try
            {
                var project = await _maintenanceService.CreateMaintenanceAsync(maintenanceDto, maintenanceDto.isArchive);
                // إدخال أمر العمل مسار السلال تلقائياً. تُحلّ الخدمة من الطلب بدل
                // حقنها في المُنشئ، فلا يتغيّر توقيع المتحكّم. والدالة لا ترمي:
                // إنشاء أمر العمل نجح فعلاً ولا يجوز أن يُبطِله فشل تسجيل الموقع.
                await HttpContext.RequestServices
                    .GetRequiredService<IWorkOrderFlowService>()
                    .AutoEnterAsync(
                        ProjectTypeCodes.Maintenance,
                        project.Id,
                        project.ContractNumber,
                        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
                        User.FindFirstValue(ClaimTypes.GivenName));

                var response = new ApiResponse<Maintenance>(200, "تم إضافة المشروع بنجاح", project);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }

        private void ValidateMaintenanceDto(MaintenanceDto dto, List<string> validationErrors)
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


        [HttpPost("create-or-update-maintenance")]
        public async Task<IActionResult> CreateOrUpdateMaintenance([FromForm] MaintenanceDto maintenanceDto, bool isArchive)
        {
            var validationErrors = new List<string>();

            if (maintenanceDto.FaultNumber == null)
            {
                validationErrors.Add("رقم العطل مطلوب.");
            }

            if (string.IsNullOrWhiteSpace(maintenanceDto.Contractor))
            {
                validationErrors.Add("اسم المقاول مطلوب.");
            }

            if (string.IsNullOrWhiteSpace(maintenanceDto.Contractor))
            {
                validationErrors.Add("اسم الحي مطلوب.");
            }


            //if ( maintenanceDto.ModelPhotos==null||!maintenanceDto.ModelPhotos.Any() )
            //{
            //    validationErrors.Add("صور النموذج مطلوبة.");
            //}

            //if ( maintenanceDto.SitePhotos==null||!maintenanceDto.SitePhotos.Any() )
            //{
            //    validationErrors.Add("صور الموقع مطلوبة.");
            //}


            if (validationErrors.Any())
            {
                return BadRequest(new ApiResponse<List<string>>(400, "هناك أخطاء في البيانات المدخلة", validationErrors));
            }

            try
            {
                var project = await _maintenanceService.CreateOrUpdateMaintenanceAsync(maintenanceDto, isArchive);
                return Ok(new ApiResponse<Maintenance>(200, "تم إنشاء أو تحديث المشروع", project));
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>(400, ex.Message, null));
            }
        }

        [HttpGet("get-all-maintenances")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<Maintenance>>>> GetAllMaintenances()
        {
            var projects = await _maintenanceService.GetAllMaintenancesAsync();
            return Ok(new ApiResponse<IReadOnlyCollection<Maintenance>>(200, "تم العثور على المشاريع", projects));
        }

        [HttpGet("get-maintenance-pagination")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<Maintenance>>>> GetMaintenancesAsync([FromQuery] bool? isArchive, [FromQuery] int? sortByOrderNumber, [FromQuery] int pageSize = 5, [FromQuery] int pageIndex = 1)
        {
            var result = await _maintenanceService.GetMaintenanceWithPaginationAsync(isArchive, sortByOrderNumber, pageSize, pageIndex);
            if (result == null)
            {
                return NotFound(new ApiResponse<string>(404, "لا توجد مشاريع"));
            }

            return Ok(new ApiResponse<IReadOnlyCollection<Maintenance>>(200, "تم العثور على المشاريع", result));
        }

        [HttpGet("get-maintenance/{id}")]
        public async Task<ActionResult<ApiResponse<IReadOnlyCollection<Maintenance>>>> GetMaintenanceById(int id)
        {
            var project = await _maintenanceService.GetMaintenanceByIdAsync(id);
            return Ok(new { statusCode = 200, message = "تم العثور على المشاريع", data = project });
        }

        [HttpGet("maintenance-changes")]
        public async Task<ActionResult<IReadOnlyCollection<Maintenance>>> GetMaintenanceChanges(int projectId)
        {
            var changes = await _maintenanceService.GetOperationChangesAsync(projectId);

            if (changes == null || !changes.Any())
            {
                return NotFound("لا توجد تغييرات لهذا المشروع.");
            }

            return Ok(changes);
        }

        [HttpGet("filter-orders")]
        public async Task<ActionResult<IReadOnlyCollection<object>>> FilterOrder(string? branchName, bool? isArchive)
        {
            var orders = await _maintenanceService.FilterMaintenanceByNameBranchAndIsArchive(branchName, isArchive);

            var result = orders.Where(d => d.IsApprove == true).Select(order => new
            {
                order.Id,
                order.WorkOrderType,
                order.WorkDescription,
                order.NumberOfEquipment,
                order.DurationOfImplementation,
                order.DescriptionViolation,
                order.FaultNumber,
                order.District,
                order.Contractor,
                order.Consultant,
                order.BranchName,
                order.StationNumber,
                order.OrderDate,
                order.SafetyViolationsExist,
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
                    mp.MaintenanceId
                }).ToList(),
                TestModels = order.TestModels.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.MaintenanceId
                }).ToList(),

                SitePhotos = order.SitePhotos.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.MaintenanceId
                }).ToList(),
                SafetyWastePhotos = order.SafetyWastePhotos.Select(mp => new
                {
                    mp.Id,
                    mp.Url,
                    mp.MaintenanceId
                }).ToList()
            }).ToList();

            return Ok(result);
        }


        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromForm] UpdateMaintenanceDto maintenanceDto)
        {
            try
            {
                var updatedProject = await _maintenanceService.UpdateMaintenanceAsync(id, maintenanceDto, (bool)maintenanceDto.isArchive);
                if (updatedProject == null)
                    return NotFound(new ApiResponse<string>(404, "المشروع غير موجود أو لم يتم تحديثه.", null));

                return Ok(new ApiResponse<Maintenance>(200, "تم تحديث المشروع بنجاح", updatedProject));
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
        public async Task<IActionResult> TestPhoto(int photoId)
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
                var changes = await _maintenanceService.GetProjectChangesAsync(projectId);
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
                await _maintenanceService.UpdateProjectsByOfficeWithContextAsync(oldOfficeName, newOfficeName);

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
                await _maintenanceService.UpdateExecutedQuantityAsync(projectId, dto);
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
                await _maintenanceService.UpdateExecutedQuantitiesAsync(projectId, dto);
                return Ok(new { statusCode = 200, message = "تم تحديث الكميات المنفذة بنجاح" });
            }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("{projectId}/executed-quantity-logs")]
        public async Task<IActionResult> GetExecutedQuantityLogs(int projectId, [FromQuery] int? pricingItemId)
        {
            var logs = await _maintenanceService.GetExecutedQuantityLogsAsync(projectId, pricingItemId);
            return Ok(new { statusCode = 200, message = "تم جلب السجلات", data = logs });
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmergency(int id)
        {
            try
            {
                var deleted = await _maintenanceService.DeleteMaintenanceAsync(id);
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
