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
    /// إعدادات العقد: الأقسام والسلال والمهام.
    ///
    /// التعديل يجري على مسودة المسار فقط، ولا يسري على التشغيل حتى يُعتمد.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContractWorkflowController : ControllerBase
    {
        private readonly IContractWorkflowService _service;

        public ContractWorkflowController(IContractWorkflowService service)
        {
            _service = service;
        }

        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        // الرمز يحمل اسم المستخدم في GivenName لا في Name، فـ User.Identity.Name
        // يعود فارغاً ويظهر المعرّف الخام في سجل التغييرات.
        private string? UserName =>
            User.FindFirstValue(ClaimTypes.GivenName)
            ?? User.Identity?.Name
            ?? User.FindFirstValue(ClaimTypes.Email);

        // ─────────────────────────── العقود ───────────────────────────

        [HttpGet("contracts")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetContracts([FromQuery] bool includeInactive = false)
            => Ok(await _service.GetContractsAsync(includeInactive));

        [HttpGet("contracts/{contractId:int}")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetContract(int contractId)
        {
            var result = await _service.GetContractAsync(contractId);
            return result is null ? NotFound(new { message = "العقد غير موجود." }) : Ok(result);
        }

        [HttpPost("contracts")]
        [HasPermission(Permissions.ContractWorkflow.ManageContracts)]
        public async Task<IActionResult> CreateContract([FromBody] ContractUpsertDto dto)
        {
            var result = await _service.CreateContractAsync(dto, UserId, UserName);
            return CreatedAtAction(nameof(GetContract), new { contractId = result.Id }, result);
        }

        [HttpPut("contracts/{contractId:int}")]
        [HasPermission(Permissions.ContractWorkflow.ManageContracts)]
        public async Task<IActionResult> UpdateContract(int contractId, [FromBody] ContractUpsertDto dto)
        {
            var result = await _service.UpdateContractAsync(contractId, dto, UserId, UserName);
            return result is null ? NotFound(new { message = "العقد غير موجود." }) : Ok(result);
        }

        // ─────────────────────────── الأقسام ───────────────────────────

        [HttpGet("contracts/{contractId:int}/departments")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetDepartments(int contractId, [FromQuery] bool includeInactive = false)
            => Ok(await _service.GetDepartmentsAsync(contractId, includeInactive));

        [HttpPost("contracts/{contractId:int}/departments")]
        [HasPermission(Permissions.ContractWorkflow.ManageDepartments)]
        public async Task<IActionResult> CreateDepartment(int contractId, [FromBody] DepartmentUpsertDto dto)
            => Ok(await _service.CreateDepartmentAsync(contractId, dto, UserId, UserName));

        [HttpPut("departments/{departmentId:int}")]
        [HasPermission(Permissions.ContractWorkflow.ManageDepartments)]
        public async Task<IActionResult> UpdateDepartment(int departmentId, [FromBody] DepartmentUpsertDto dto)
        {
            var result = await _service.UpdateDepartmentAsync(departmentId, dto, UserId, UserName);
            return result is null ? NotFound(new { message = "القسم غير موجود." }) : Ok(result);
        }

        [HttpPut("contracts/{contractId:int}/departments/order")]
        [HasPermission(Permissions.ContractWorkflow.ManageDepartments)]
        public async Task<IActionResult> ReorderDepartments(int contractId, [FromBody] ReorderDto dto)
            => await _service.ReorderDepartmentsAsync(contractId, dto, UserId, UserName)
                ? NoContent()
                : BadRequest(new { message = "قائمة الترتيب لا تطابق أقسام العقد." });

        // ─────────────────────────── المسار ───────────────────────────

        /// <summary>المسودة القابلة للتحرير — تُنشأ من المنشور عند أول فتح.</summary>
        [HttpGet("departments/{departmentId:int}/draft")]
        [HasPermission(Permissions.ContractWorkflow.ManageBaskets)]
        public async Task<IActionResult> GetDraft(int departmentId)
        {
            var result = await _service.GetOrCreateDraftAsync(departmentId, UserId, UserName);
            return result is null ? NotFound(new { message = "القسم غير موجود." }) : Ok(result);
        }

        /// <summary>المسار المعتمد الذي يعمل عليه النظام.</summary>
        [HttpGet("departments/{departmentId:int}/published")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetPublished(int departmentId)
        {
            var result = await _service.GetPublishedAsync(departmentId);
            return result is null
                ? NotFound(new { message = "لا يوجد مسار معتمد لهذا القسم بعد." })
                : Ok(result);
        }

        [HttpGet("workflows/{workflowId:int}/preview")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> Preview(int workflowId)
        {
            var result = await _service.PreviewAsync(workflowId);
            return result is null ? NotFound(new { message = "المسار غير موجود." }) : Ok(result);
        }

        [HttpPost("workflows/{workflowId:int}/publish")]
        [HasPermission(Permissions.ContractWorkflow.Publish)]
        public async Task<IActionResult> Publish(int workflowId, [FromBody] PublishRequest? body)
        {
            var result = await _service.PublishAsync(workflowId, UserId, UserName, body?.Note);
            return result is null
                ? NotFound(new { message = "لا توجد مسودة بهذا المعرّف." })
                : Ok(result);
        }

        public class PublishRequest
        {
            public string? Note { get; set; }
        }

        // ─────────────────────────── السلال ───────────────────────────

        /// <summary>السلال المقترحة للقسم — قالب يُطبَّق ثم يُعدَّل بحرّية.</summary>
        [HttpGet("departments/{departmentId:int}/template")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetTemplate(int departmentId)
        {
            var result = await _service.GetTemplateAsync(departmentId);
            return result is null
                ? NotFound(new { message = "لا يوجد قالب مقترح لهذا القسم." })
                : Ok(result);
        }

        [HttpPost("departments/{departmentId:int}/apply-template")]
        [HasPermission(Permissions.ContractWorkflow.ManageBaskets)]
        public async Task<IActionResult> ApplyTemplate(int departmentId)
        {
            var (workflow, error) = await _service.ApplyTemplateAsync(departmentId, UserId, UserName);
            return error is null ? Ok(workflow) : BadRequest(new { message = error });
        }

        [HttpPost("workflows/{workflowId:int}/baskets")]
        [HasPermission(Permissions.ContractWorkflow.ManageBaskets)]
        public async Task<IActionResult> AddBasket(int workflowId, [FromBody] BasketUpsertDto dto)
        {
            var result = await _service.AddBasketAsync(workflowId, dto, UserId, UserName);
            return result is null ? NotFound(new { message = "المسار غير موجود." }) : Ok(result);
        }

        [HttpPut("baskets/{basketId:int}")]
        [HasPermission(Permissions.ContractWorkflow.ManageBaskets)]
        public async Task<IActionResult> UpdateBasket(int basketId, [FromBody] BasketUpsertDto dto)
        {
            var (basket, error) = await _service.UpdateBasketAsync(basketId, dto, UserId, UserName);
            return error is null ? Ok(basket) : BadRequest(new { message = error });
        }

        [HttpPut("workflows/{workflowId:int}/baskets/order")]
        [HasPermission(Permissions.ContractWorkflow.ReorderBaskets)]
        public async Task<IActionResult> ReorderBaskets(int workflowId, [FromBody] ReorderDto dto)
            => await _service.ReorderBasketsAsync(workflowId, dto, UserId, UserName)
                ? NoContent()
                : BadRequest(new { message = "قائمة الترتيب لا تطابق سلال المسار." });

        [HttpDelete("baskets/{basketId:int}")]
        [HasPermission(Permissions.ContractWorkflow.ManageBaskets)]
        public async Task<IActionResult> DeleteBasket(int basketId)
        {
            var (ok, error) = await _service.DeleteBasketAsync(basketId, UserId, UserName);
            return ok ? NoContent() : BadRequest(new { message = error });
        }

        // ─────────────────────────── مهام السلة ───────────────────────────

        [HttpPost("baskets/{basketId:int}/tasks")]
        [HasPermission(Permissions.ContractWorkflow.ManageTasks)]
        public async Task<IActionResult> AddTask(int basketId, [FromBody] BasketTaskUpsertDto dto)
        {
            var result = await _service.AddTaskAsync(basketId, dto, UserId, UserName);
            return result is null ? NotFound(new { message = "السلة غير موجودة." }) : Ok(result);
        }

        [HttpPut("tasks/{taskId:int}")]
        [HasPermission(Permissions.ContractWorkflow.ManageTasks)]
        public async Task<IActionResult> UpdateTask(int taskId, [FromBody] BasketTaskUpsertDto dto)
        {
            var result = await _service.UpdateTaskAsync(taskId, dto, UserId, UserName);
            return result is null ? NotFound(new { message = "المهمة غير موجودة." }) : Ok(result);
        }

        [HttpPut("baskets/{basketId:int}/tasks/order")]
        [HasPermission(Permissions.ContractWorkflow.ManageTasks)]
        public async Task<IActionResult> ReorderTasks(int basketId, [FromBody] ReorderDto dto)
            => await _service.ReorderTasksAsync(basketId, dto, UserId, UserName)
                ? NoContent()
                : BadRequest(new { message = "قائمة الترتيب لا تطابق مهام السلة." });

        [HttpDelete("tasks/{taskId:int}")]
        [HasPermission(Permissions.ContractWorkflow.ManageTasks)]
        public async Task<IActionResult> DeleteTask(int taskId)
            => await _service.DeleteTaskAsync(taskId, UserId, UserName)
                ? NoContent()
                : NotFound(new { message = "المهمة غير موجودة." });

        // ─────────────────────────── سجل التغييرات ───────────────────────────

        [HttpGet("contracts/{contractId:int}/audit")]
        [HasPermission(Permissions.ContractWorkflow.ViewAuditLog)]
        public async Task<IActionResult> GetAuditLog(int contractId,
            [FromQuery] int? departmentId, [FromQuery] int take = 100)
            => Ok(await _service.GetAuditLogAsync(contractId, departmentId, take));
    }
}
