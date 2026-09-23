using ASF.Api.Attributes;
using ASF.Core.DTOs.Workflow;
using ASF.Core.Entities;
using ASF.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    /// <summary>
    /// حركة أمر العمل داخل مسار السلال المعرَّف في إعدادات العقد.
    ///
    /// أمر العمل يُشار إليه بـ (نوع المشروع + معرّفه) لأنه لا يوجد في النظام
    /// جدول أوامر عمل موحّد، بل خمسة أنواع في خمسة جداول متوازية.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WorkOrderFlowController : ControllerBase
    {
        private readonly IWorkOrderFlowService _service;

        public WorkOrderFlowController(IWorkOrderFlowService service)
        {
            _service = service;
        }

        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        // الرمز يضع اسم المستخدم في GivenName لا في Name.
        private string? UserName =>
            User.FindFirstValue(ClaimTypes.GivenName)
            ?? User.Identity?.Name
            ?? User.FindFirstValue(ClaimTypes.Email);

        /// <summary>موقع أمر العمل ومهامه والانتقالات المتاحة.</summary>
        [HttpGet("{projectTypeCode}/{workOrderId:int}")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetPlacement(string projectTypeCode, int workOrderId)
        {
            var result = await _service.GetPlacementAsync(projectTypeCode, workOrderId);
            return result is null
                ? NotFound(new { message = "أمر العمل لم يدخل المسار بعد." })
                : Ok(result);
        }

        [HttpGet("{projectTypeCode}/{workOrderId:int}/history")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetHistory(string projectTypeCode, int workOrderId)
            => Ok(await _service.GetHistoryAsync(projectTypeCode, workOrderId));

        /// <summary>يُدخل أمر العمل المسار ويضعه في أول سلة.</summary>
        [HttpPost("enter")]
        [HasPermission(Permissions.ContractWorkflow.MoveWorkOrder)]
        public async Task<IActionResult> Enter([FromBody] EnterWorkflowDto dto)
        {
            var (placement, error) = await _service.EnterWorkflowAsync(dto, UserId, UserName);
            return error is null ? Ok(placement) : BadRequest(new { message = error });
        }

        /// <summary>ينقل أمر العمل إلى سلة أخرى.</summary>
        [HttpPost("{projectTypeCode}/{workOrderId:int}/move")]
        [HasPermission(Permissions.ContractWorkflow.MoveWorkOrder)]
        public async Task<IActionResult> Move(string projectTypeCode, int workOrderId,
            [FromBody] MoveWorkOrderDto dto)
        {
            var (placement, error) = await _service.MoveAsync(projectTypeCode, workOrderId, dto, UserId, UserName);
            return error is null ? Ok(placement) : BadRequest(new { message = error });
        }

        /// <summary>يعلّم مهمة منجزة أو يرفع الإنجاز عنها.</summary>
        [HttpPut("{projectTypeCode}/{workOrderId:int}/tasks")]
        [HasPermission(Permissions.ContractWorkflow.MoveWorkOrder)]
        public async Task<IActionResult> SetTaskState(string projectTypeCode, int workOrderId,
            [FromBody] SetTaskStateDto dto)
        {
            var (placement, error) = await _service.SetTaskStateAsync(projectTypeCode, workOrderId, dto, UserId, UserName);
            return error is null ? Ok(placement) : BadRequest(new { message = error });
        }

        /// <summary>توزيع أوامر العمل على سلال القسم.</summary>
        [HttpGet("departments/{departmentId:int}/load")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetBasketLoad(int departmentId)
            => Ok(await _service.GetBasketLoadAsync(departmentId));

        // ─────────── متابعة التنفيذ ───────────

        /// <summary>
        /// أقسام متابعة التنفيذ التي يراها المستخدم الحالي، بسلالها وأعدادها.
        /// مقيَّدة بنطاق بياناته.
        /// </summary>
        [HttpGet("tracking")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetTracking([FromQuery] string? projectTypeCode)
            => Ok(await _service.GetTrackingAsync(UserId, projectTypeCode));

        /// <summary>بحث أوامر العمل بفلتر عام عبر كل السلال.</summary>
        [HttpPost("search")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> Search([FromBody] TrackingFilterDto filter)
            => Ok(await _service.SearchAsync(filter ?? new TrackingFilterDto(), UserId));

        /// <summary>
        /// صفوف التصدير بكل التفاصيل، بنفس الصلاحية والنطاق والفلاتر.
        /// </summary>
        [HttpPost("export")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> Export([FromBody] TrackingFilterDto filter)
            => Ok(await _service.ExportAsync(filter ?? new TrackingFilterDto(), UserId));

        [HttpGet("departments/{departmentId:int}/baskets/{basketStableKey:int}/work-orders")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetBasketWorkOrders(int departmentId, int basketStableKey)
        {
            var (items, error) = await _service.GetBasketWorkOrdersAsync(departmentId, basketStableKey, UserId);
            return error is null ? Ok(items) : StatusCode(403, new { message = error });
        }

        /// <summary>عدد أوامر عمل القسم التي لم تدخل أي سلة بعد.</summary>
        [HttpGet("departments/{departmentId:int}/unplaced")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> CountUnplaced(int departmentId)
            => Ok(new { count = await _service.CountUnplacedAsync(departmentId) });

        /// <summary>يضع أوامر العمل غير المرتبطة في أول سلة من المسار المعتمد.</summary>
        [HttpPost("departments/{departmentId:int}/place-unplaced")]
        [HasPermission(Permissions.ContractWorkflow.MoveWorkOrder)]
        public async Task<IActionResult> PlaceUnplaced(int departmentId,
            [FromQuery] bool includeUnassigned = false)
        {
            var placed = await _service.PlaceUnplacedAsync(departmentId, includeUnassigned, UserId, UserName);
            return Ok(new { placed });
        }

        // ─────────── نطاق بيانات المستخدم ───────────

        [HttpGet("scopes/{targetUserId}")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> GetUserScopes(string targetUserId)
            => Ok(await _service.GetUserScopesAsync(targetUserId));

        [HttpPost("scopes/{targetUserId}")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> AddUserScope(string targetUserId, [FromBody] SetUserScopeDto dto)
        {
            var (scope, error) = await _service.AddUserScopeAsync(targetUserId, dto, UserId);
            return error is null ? Ok(scope) : BadRequest(new { message = error });
        }

        [HttpDelete("scopes/{scopeId:int}")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> RemoveUserScope(int scopeId)
            => await _service.RemoveUserScopeAsync(scopeId)
                ? NoContent()
                : NotFound(new { message = "النطاق غير موجود." });

        /// <summary>
        /// ترحيل أوامر العمل القائمة من الحالة النصّية إلى السلال.
        /// يعاين بلا كتابة ما لم يُرسل dryRun = false صراحةً.
        /// </summary>
        [HttpPost("backfill")]
        [HasPermission(Permissions.ContractWorkflow.Publish)]
        public async Task<IActionResult> Backfill([FromBody] BackfillRequestDto dto)
        {
            var (result, error) = await _service.BackfillAsync(dto, UserId, UserName);
            return error is null ? Ok(result) : BadRequest(new { message = error });
        }
    }
}
