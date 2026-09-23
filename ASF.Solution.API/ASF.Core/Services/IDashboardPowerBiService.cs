using ASF.Core.Dtos.Dashboard;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{

    public interface IDashboardPowerBiService
    {
        /// <summary>الصفحة الرئيسية: كل أعمال الشركة بجميع الفروع</summary>
        Task<OverviewDashboardDto> GetOverviewAsync(DashboardFilterDto filter);

        /// <summary>صفحة فرع محدد (جدة أو الرياض) بكل أقسامه الفرعية</summary>
        Task<BranchDashboardDto> GetBranchDashboardAsync(string branchName, DashboardFilterDto filter);

        /// <summary>خيارات الفلاتر الديناميكية (فروع / مكاتب / مراحل تنفيذ / أنواع إنشاء)</summary>
        Task<DashboardFilterOptionsDto> GetFilterOptionsAsync();
    }
}
