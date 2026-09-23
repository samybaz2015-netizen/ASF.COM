using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos.Dashboard;
using ASF.Core.Services;
using System;
using System.Threading.Tasks;

namespace ASF.Api.Controllers
{
    /// <summary>
    /// نقاط نهاية مخصصة لتغذية داشبورد Power BI.
    /// كل النقاط بترجع JSON بسيط ومسطّح (Flat) قدر الإمكان عشان يسهل ربطها كـ Web/OData Source في Power BI.
    /// </summary>
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardPowerBiController : ControllerBase
    {
        private readonly IDashboardPowerBiService _dashboardService;

        public DashboardPowerBiController(IDashboardPowerBiService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// الصفحة الرئيسية: كل أعمال الشركة بجميع الفروع والمكاتب.
        /// </summary>
        /// <param name="branchName">فلتر اختياري بالفرع (لو عايز تعرض فرع واحد بس من نفس نقطة النهاية)</param>
        /// <param name="office">فلتر اختياري بالمكتب</param>
        /// <param name="situation">فلتر اختياري بمرحلة التنفيذ - القيم من /api/dashboard/filters</param>
        /// <param name="contractNumber">فلتر اختياري برقم العقد / المستخلص / العطل</param>
        /// <param name="subscriber">فلتر اختياري بالمشترك / مالك المشروع / العميل</param>
        /// <param name="workType">فلتر اختياري بنوع الأعمال (إيصال / إحلال / ربط / تعزيز / عمليات وصيانة / طوارئ)</param>
        [HttpGet("overview")]
        [ProducesResponseType(typeof(OverviewDashboardDto), 200)]
        public async Task<ActionResult<OverviewDashboardDto>> GetOverview(
            [FromQuery] string? branchName,
            [FromQuery] string? office,
            [FromQuery] string? situation,
            [FromQuery] bool? isFinished,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] PeriodGroupType periodType = PeriodGroupType.Month,
            [FromQuery] string? constructionType = null,
            [FromQuery] string? contractNumber = null,
            [FromQuery] string? subscriber = null,
            [FromQuery] string? workType = null)
        {
            var filter = new DashboardFilterDto
            {
                BranchName = branchName,
                Office = office,
                Situation = situation,
                IsFinished = isFinished,
                FromDate = fromDate,
                ToDate = toDate?.Date.AddDays(1).AddTicks(-1), // شمول اليوم بالكامل لو تم إرسال تاريخ فقط بدون وقت
                PeriodType = periodType,
                ConstructionType = constructionType,
                ContractNumber = contractNumber,
                Subscriber = subscriber,
                WorkType = workType
            };

            var result = await _dashboardService.GetOverviewAsync(filter);
            result.CurrentPeriod = BuildCurrentPeriod();
            return Ok(result);
        }

        /// <summary>
        /// صفحة أعمال فرع جدة (إنشاءات + عمليات وصيانة بأقسامها الفرعية).
        /// </summary>
        [HttpGet("branch/jeddah")]
        [ProducesResponseType(typeof(BranchDashboardDto), 200)]
        public async Task<ActionResult<BranchDashboardDto>> GetJeddahDashboard(
            [FromQuery] string? office,
            [FromQuery] string? situation,
            [FromQuery] bool? isFinished,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] PeriodGroupType periodType = PeriodGroupType.Month,
            [FromQuery] string? constructionType = null,
            [FromQuery] string? contractNumber = null,
            [FromQuery] string? subscriber = null,
            [FromQuery] string? workType = null)
        {
            return await GetBranchDashboard("جدة", office, situation, isFinished, fromDate, toDate, periodType, constructionType, contractNumber, subscriber, workType);
        }

        /// <summary>
        /// صفحة أعمال فرع الرياض (إنشاءات + عمليات وصيانة بأقسامها الفرعية).
        /// </summary>
        [HttpGet("branch/riyadh")]
        [ProducesResponseType(typeof(BranchDashboardDto), 200)]
        public async Task<ActionResult<BranchDashboardDto>> GetRiyadhDashboard(
            [FromQuery] string? office,
            [FromQuery] string? situation,
            [FromQuery] bool? isFinished,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] PeriodGroupType periodType = PeriodGroupType.Month,
            [FromQuery] string? constructionType = null,
            [FromQuery] string? contractNumber = null,
            [FromQuery] string? subscriber = null,
            [FromQuery] string? workType = null)
        {
            return await GetBranchDashboard("منطقة الرياض", office, situation, isFinished, fromDate, toDate, periodType, constructionType, contractNumber, subscriber, workType);
        }

        /// <summary>
        /// نقطة نهاية عامة لأي فرع بالاسم.
        /// </summary>
        [HttpGet("branch/{branchName}")]
        [ProducesResponseType(typeof(BranchDashboardDto), 200)]
        [ProducesResponseType(400)]
        public async Task<ActionResult<BranchDashboardDto>> GetBranchDashboard(
            string branchName,
            [FromQuery] string? office,
            [FromQuery] string? situation,
            [FromQuery] bool? isFinished,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] PeriodGroupType periodType = PeriodGroupType.Month,
            [FromQuery] string? constructionType = null,
            [FromQuery] string? contractNumber = null,
            [FromQuery] string? subscriber = null,
            [FromQuery] string? workType = null)
        {
            if (string.IsNullOrWhiteSpace(branchName))
                return BadRequest("اسم الفرع مطلوب");

            var filter = new DashboardFilterDto
            {
                Office = office,
                Situation = situation,
                IsFinished = isFinished,
                FromDate = fromDate,
                ToDate = toDate?.Date.AddDays(1).AddTicks(-1),
                PeriodType = periodType,
                ConstructionType = constructionType,
                ContractNumber = contractNumber,
                Subscriber = subscriber,
                WorkType = workType
            };

            var result = await _dashboardService.GetBranchDashboardAsync(branchName, filter);
            result.CurrentPeriod = BuildCurrentPeriod();
            return Ok(result);
        }

        /// <summary>
        /// خيارات الفلاتر الديناميكية (فروع / مكاتب / مراحل تنفيذ / أنواع إنشاء) - استخدمها لتعبئة الـ Slicers في Power BI.
        /// </summary>
        [HttpGet("filters")]
        [ProducesResponseType(typeof(DashboardFilterOptionsDto), 200)]
        public async Task<ActionResult<DashboardFilterOptionsDto>> GetFilterOptions()
        {
            var result = await _dashboardService.GetFilterOptionsAsync();
            return Ok(result);
        }

        /// <summary>
        /// التاريخ الحالي (اليوم/الشهر/السنة) ونطاقات الفترات الجاهزة (بداية/نهاية اليوم - الشهر - السنة - الأسبوع)
        /// بتوقيت السيرفر. مفيدة لضبط قيم افتراضية لفلتر الفترة الزمنية من غير ما تحسبها يدوي في الفرونت.
        /// </summary>
        [HttpGet("current-period")]
        [ProducesResponseType(typeof(CurrentPeriodDto), 200)]
        public ActionResult<CurrentPeriodDto> GetCurrentPeriod()
        {
            return Ok(BuildCurrentPeriod());
        }

        /// <summary>يحسب اليوم/الشهر/السنة الحالية ونطاقاتها بتوقيت السيرفر - مُستخدمة في كل استجابات الداشبورد</summary>
        private static CurrentPeriodDto BuildCurrentPeriod()
        {
            var now = DateTime.Now;
            var today = now.Date;

            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

            var startOfYear = new DateTime(today.Year, 1, 1);
            var endOfYear = startOfYear.AddYears(1).AddTicks(-1);

            // الأسبوع في السعودية بيبدأ السبت وينتهي الجمعة
            var daysSinceSaturday = ((int)today.DayOfWeek + 1) % 7; // Saturday=6 -> 0, Sunday=0 -> 1, ... Friday=5 -> 6
            var startOfWeek = today.AddDays(-daysSinceSaturday);
            var endOfWeek = startOfWeek.AddDays(7).AddTicks(-1);

            var arabicMonthNames = new[]
            {
                "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
            };

            return new CurrentPeriodDto
            {
                Today = today,
                Day = today.Day,
                Month = today.Month,
                Year = today.Year,
                MonthNameArabic = arabicMonthNames[today.Month - 1],
                StartOfToday = today,
                EndOfToday = today.AddDays(1).AddTicks(-1),
                StartOfMonth = startOfMonth,
                EndOfMonth = endOfMonth,
                StartOfYear = startOfYear,
                EndOfYear = endOfYear,
                StartOfWeek = startOfWeek,
                EndOfWeek = endOfWeek
            };
        }
    }
}