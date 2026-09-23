using ASF.Core.DTOs.Employees;

namespace ASF.Core.Services
{
    /// <summary>
    /// قسم الموظفين: السجلّ والملف والمستندات والإجازات وتقويم الفريق.
    ///
    /// الموظف هو الحساب نفسه. الإجازات والحضور والصلاحيات تشير إلى الحساب،
    /// فلا سجلّ موظفين موازٍ يُحدَّث على حدة ويتضارب معه.
    /// </summary>
    public interface IEmployeeHubService
    {
        Task<List<EmployeeListItemDto>> GetEmployeesAsync(
            string? search, int? branchId, bool includeInactive);

        Task<EmployeeProfileDto?> GetProfileAsync(string userId);

        Task<(EmployeeProfileDto? profile, string? error)> UpdateProfileAsync(
            string userId, EmployeeUpsertDto dto);

        // المستندات
        Task<List<EmployeeDocumentDto>> GetDocumentsAsync(string userId);

        Task<(EmployeeDocumentDto? document, string? error)> AddDocumentAsync(
            string userId, string kind, string fileName, string storedPath,
            string? contentType, long sizeBytes, DateTime? expiresAt, string? note,
            string uploadedByUserId, string? uploadedByUserName);

        Task<(bool ok, string? storedPath)> DeleteDocumentAsync(int documentId);

        // الإجازات وتقويم الفريق
        Task<List<EmployeeLeaveDto>> GetLeavesAsync(string? userId, DateTime? from, DateTime? to);

        Task<List<TeamCalendarDayDto>> GetTeamCalendarAsync(DateTime from, DateTime to, int? branchId);

        // الاستيراد والتصدير
        Task<EmployeeImportResultDto> ImportAsync(EmployeeImportRequestDto request, string adminUserId);
    }
}
