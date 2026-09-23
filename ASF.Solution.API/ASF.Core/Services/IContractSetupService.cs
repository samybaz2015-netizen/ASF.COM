using ASF.Core.DTOs.Workflow;

namespace ASF.Core.Services
{
    /// <summary>
    /// إعدادات العقد التي لا تخصّ المسار: أنواع أوامر العمل، وفريق العمل
    /// وصلاحياته.
    /// </summary>
    public interface IContractSetupService
    {
        // أنواع أوامر العمل
        Task<List<WorkOrderTypeDto>> GetWorkOrderTypesAsync(
            int contractId, bool includeInactive, string? category = null);

        Task<List<WorkOrderTypeDto>> GetListValuesAsync(
            string category, int? contractId, int? departmentId);

        Task<(WorkOrderTypeDto? type, string? error)> AddWorkOrderTypeAsync(
            int contractId, WorkOrderTypeUpsertDto dto, string userId, string? userName);

        Task<(List<WorkOrderTypeDto>? types, string? error)> ReorderWorkOrderTypesAsync(
            int contractId, List<int> ids, string? category, string userId, string? userName);

        Task<(WorkOrderTypeDto? type, string? error)> UpdateWorkOrderTypeAsync(
            int typeId, WorkOrderTypeUpsertDto dto, string userId, string? userName);

        Task<(bool ok, string? error)> DeleteWorkOrderTypeAsync(int typeId, string userId, string? userName);

        /// <summary>يضيف أنواع قسم الإنشاءات المعتادة دفعةً واحدة.</summary>
        Task<(List<WorkOrderTypeDto>? types, string? error)> SeedDefaultTypesAsync(
            int contractId, int departmentId, string userId, string? userName);

        // فريق العمل والصلاحيات
        Task<List<TeamPermissionDto>> GetTeamAsync(int contractId);

        Task<(TeamPermissionDto? row, string? error)> UpsertTeamPermissionAsync(
            int contractId, TeamPermissionUpsertDto dto, string adminUserId);

        Task<bool> RemoveTeamPermissionAsync(int id);

        /// <summary>
        /// صلاحيات المستخدم الحالي على عقد ونوع، لتخفي الواجهة ما لا يملكه.
        /// </summary>
        Task<TeamPermissionDto> GetEffectiveAsync(string userId, int contractId, int? workOrderTypeId);
    }
}
