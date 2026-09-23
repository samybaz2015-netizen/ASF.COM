using ASF.Api.Attributes;
using ASF.Core.DTOs.Workflow;
using ASF.Core.Entities;
using ASF.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    /// <summary>استيراد أوامر العمل من إكسل.</summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WorkOrderImportController : ControllerBase
    {
        private readonly IWorkOrderImportService _service;

        public WorkOrderImportController(IWorkOrderImportService service)
        {
            _service = service;
        }

        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        private string? UserName =>
            User.FindFirstValue(ClaimTypes.GivenName)
            ?? User.Identity?.Name
            ?? User.FindFirstValue(ClaimTypes.Email);

        /// <summary>
        /// يتحقّق من الصفوف أو يكتبها. dryRun افتراضه true فلا يُكتب شيء
        /// ما لم يُطلب ذلك صراحةً.
        /// </summary>
        [HttpPost]
        [HasPermission(Permissions.ContractWorkflow.MoveWorkOrder)]
        public async Task<IActionResult> Import([FromBody] WorkOrderImportRequestDto request)
        {
            var (result, error) = await _service.ImportAsync(request, UserId, UserName);
            return error is null ? Ok(result) : BadRequest(new { message = error });
        }
    }
}
