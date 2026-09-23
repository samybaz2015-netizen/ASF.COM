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
    /// إعدادات العقد: أنواع أوامر العمل، وفريق العمل وصلاحياته.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContractSetupController : ControllerBase
    {
        private readonly IContractSetupService _service;

        public ContractSetupController(IContractSetupService service)
        {
            _service = service;
        }

        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        private string? UserName =>
            User.FindFirstValue(ClaimTypes.GivenName)
            ?? User.Identity?.Name
            ?? User.FindFirstValue(ClaimTypes.Email);

        // ─────────── أنواع أوامر العمل ───────────

        /// <summary>
        /// قيم قائمة للإدخال. تصلح لكل شاشات إنشاء أوامر العمل.
        ///
        /// الصلاحية هي «العرض» لا «إدارة العقود»: من يُدخل أمر عمل يحتاج
        /// القائمة ولا يملك تعديلها.
        /// </summary>
        [HttpGet("lists")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetListValues(
            [FromQuery] string category,
            [FromQuery] int? contractId = null,
            [FromQuery] int? departmentId = null)
            => Ok(await _service.GetListValuesAsync(category, contractId, departmentId));

        [HttpGet("contracts/{contractId:int}/types")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetTypes(
            int contractId,
            [FromQuery] bool includeInactive = false,
            [FromQuery] string? category = null)
            => Ok(await _service.GetWorkOrderTypesAsync(contractId, includeInactive, category));

        [HttpPost("contracts/{contractId:int}/types")]
        [HasPermission(Permissions.ContractWorkflow.ManageContracts)]
        public async Task<IActionResult> AddType(int contractId, [FromBody] WorkOrderTypeUpsertDto dto)
        {
            var (type, error) = await _service.AddWorkOrderTypeAsync(contractId, dto, UserId, UserName);
            return error is null ? Ok(type) : BadRequest(new { message = error });
        }

        [HttpPut("types/{typeId:int}")]
        [HasPermission(Permissions.ContractWorkflow.ManageContracts)]
        public async Task<IActionResult> UpdateType(int typeId, [FromBody] WorkOrderTypeUpsertDto dto)
        {
            var (type, error) = await _service.UpdateWorkOrderTypeAsync(typeId, dto, UserId, UserName);
            return error is null ? Ok(type) : BadRequest(new { message = error });
        }

        /// <summary>إعادة ترتيب القيم بالسحب أو بالأسهم.</summary>
        [HttpPost("contracts/{contractId:int}/types/reorder")]
        [HasPermission(Permissions.ContractWorkflow.ManageContracts)]
        public async Task<IActionResult> ReorderTypes(int contractId, [FromBody] ReorderTypesDto dto)
        {
            var (types, error) = await _service.ReorderWorkOrderTypesAsync(
                contractId, dto?.Ids ?? new List<int>(), dto?.Category, UserId, UserName);

            return error is null ? Ok(types) : BadRequest(new { message = error });
        }

        [HttpDelete("types/{typeId:int}")]
        [HasPermission(Permissions.ContractWorkflow.ManageContracts)]
        public async Task<IActionResult> DeleteType(int typeId)
        {
            var (ok, error) = await _service.DeleteWorkOrderTypeAsync(typeId, UserId, UserName);
            return ok ? NoContent() : BadRequest(new { message = error });
        }

        /// <summary>يضيف أنواع الإنشاءات المعتادة: إيصال · حلال · ربط · تعزيز.</summary>
        [HttpPost("contracts/{contractId:int}/departments/{departmentId:int}/seed-types")]
        [HasPermission(Permissions.ContractWorkflow.ManageContracts)]
        public async Task<IActionResult> SeedTypes(int contractId, int departmentId)
        {
            var (types, error) = await _service.SeedDefaultTypesAsync(contractId, departmentId, UserId, UserName);
            return error is null ? Ok(types) : BadRequest(new { message = error });
        }

        // ─────────── فريق العمل ───────────

        [HttpGet("contracts/{contractId:int}/team")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetTeam(int contractId)
            => Ok(await _service.GetTeamAsync(contractId));

        [HttpPost("contracts/{contractId:int}/team")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> UpsertTeam(int contractId, [FromBody] TeamPermissionUpsertDto dto)
        {
            var (row, error) = await _service.UpsertTeamPermissionAsync(contractId, dto, UserId);
            return error is null ? Ok(row) : BadRequest(new { message = error });
        }

        [HttpDelete("team/{id:int}")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> RemoveTeam(int id)
            => await _service.RemoveTeamPermissionAsync(id)
                ? NoContent()
                : NotFound(new { message = "الصلاحية غير موجودة." });

        /// <summary>صلاحيات المستخدم الحالي على عقد ونوع.</summary>
        [HttpGet("contracts/{contractId:int}/my-permissions")]
        public async Task<IActionResult> GetMine(int contractId, [FromQuery] int? workOrderTypeId)
            => Ok(await _service.GetEffectiveAsync(UserId, contractId, workOrderTypeId));
    }
}
