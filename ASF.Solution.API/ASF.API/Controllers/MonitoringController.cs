using ASF.Api.Attributes;
using ASF.Core.Dtos.Monitoring;
using ASF.Core.Entities;
using ASF.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    /// <summary>
    /// لوحة المتابعة والمؤشّرات.
    ///
    /// الصلاحية تُطبَّق داخل الخدمة على الاستعلام نفسه لا على الناتج، فلا
    /// يُحمَّل صفٌّ لا يحقّ للقارئ رؤيته ثم يُخفى في الواجهة.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MonitoringController : ControllerBase
    {
        private readonly IMonitoringService _service;

        public MonitoringController(IMonitoringService service)
        {
            _service = service;
        }

        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        /// <summary>اللوحة كاملة: المراحل، والمال، ومؤشّرات الموظفين.</summary>
        [HttpPost("board")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetBoard([FromBody] MonitoringFilterDto filter)
            => Ok(await _service.GetBoardAsync(filter ?? new MonitoringFilterDto(), UserId));

        /// <summary>
        /// إعادة قراءة المبالغ النصّية أرقاماً.
        ///
        /// تُشغَّل مرّة بعد النشر، ثم عند الحاجة. الحفظ العادي يتكفّل بالجديد.
        /// </summary>
        [HttpPost("recompute-amounts")]
        [HasPermission(Permissions.ContractWorkflow.ManageContracts)]
        public async Task<IActionResult> RecomputeAmounts()
            => Ok(await _service.RecomputeAmountsAsync());

        /// <summary>خيارات الفلاتر.</summary>
        [HttpGet("options")]
        [HasPermission(Permissions.ContractWorkflow.View)]
        public async Task<IActionResult> GetOptions()
            => Ok(await _service.GetOptionsAsync(UserId));
    }
}
