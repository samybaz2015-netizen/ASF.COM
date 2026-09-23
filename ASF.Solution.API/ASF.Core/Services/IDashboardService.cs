using ASF.Core.Dtos;

namespace ASF.Core.Services
{
    public interface IDashboardService
    {
        Task<DashboardStatsDto> GetFullStatsAsync();
        Task<FilteredDashboardStatsDto> GetFilteredStatsAsync(DashboardFilterDto filter);
    }
}
