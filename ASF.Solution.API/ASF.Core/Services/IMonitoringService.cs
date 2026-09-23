using ASF.Core.Dtos.Monitoring;

namespace ASF.Core.Services
{
    /// <summary>لوحة المتابعة: المراحل والمال ومؤشّرات الموظفين.</summary>
    public interface IMonitoringService
    {
        Task<MonitoringBoardDto> GetBoardAsync(MonitoringFilterDto filter, string userId);

        /// <summary>خيارات الفلاتر، مقيّدة بصلاحية المستخدم.</summary>
        Task<MonitoringOptionsDto> GetOptionsAsync(string userId);

        /// <summary>يعيد قراءة المبالغ النصّية أرقاماً. يُشغَّل عند الطلب.</summary>
        Task<Dictionary<string, int>> RecomputeAmountsAsync();
    }
}
