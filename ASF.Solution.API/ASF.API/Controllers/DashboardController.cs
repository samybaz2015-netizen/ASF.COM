using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos;
using ASF.Core.Services;

namespace ASF.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// يجيب كل إحصائيات الـ API المجمّعة للـ Power BI Dashboard.
        /// </summary>
        [HttpGet("stats")]
        [ProducesResponseType(typeof(DashboardStatsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
        {
            var result = await _dashboardService.GetFullStatsAsync();
            return Ok(result);
        }

        /// <summary>
        /// يجيب إحصائيات مفلترة حسب (السنة، الشهر، الفترة من-إلى، الفرع، المكتب، المهندس، المقاول، الاستشاري، نوع المشروع، الحالة...).
        /// كل الفلاتر اختيارية — ما يُرسلش = مش بيُفلتر عليه.
        /// </summary>
        [HttpGet("stats/filtered")]
        [ProducesResponseType(typeof(FilteredDashboardStatsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<FilteredDashboardStatsDto>> GetFilteredDashboardStats([FromQuery] DashboardFilterDto filter)
        {
            var result = await _dashboardService.GetFilteredStatsAsync(filter);
            return Ok(result);
        }
    }
}



