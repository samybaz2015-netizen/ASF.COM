using ASF.Core.Dtos;
using ASF.Core.Dtos.ConstructionResponse;
using ASF.Core.Dtos.EmergencyResponse;
using ASF.Core.Dtos.MaintenanceResponse;
using ASF.Core.Dtos.NewProjectResponse;
using ASF.Core.Dtos.PrivateResponse;

namespace ASF.Core.Services
{
    public interface IAdminService
    {
        // ✅ الميثودز الجديدة بتاعة AllOrders - بترجع Data + TotalCount
        Task<(IReadOnlyCollection<NewProjectResponse> Data, int TotalCount)> GetAllNewProjectsAsync(OrderFilterDto filter, string? scopeBranch, string? scopeOffice);
        Task<(IReadOnlyCollection<ConstructionResponse> Data, int TotalCount)> GetAllConstructionAsync(OrderFilterDto filter, string? scopeBranch, string? scopeOffice);
        Task<(IReadOnlyCollection<EmergencyResponse> Data, int TotalCount)> GetAllEmergencyAsync(OrderFilterDto filter, string? scopeBranch, string? scopeOffice);
        Task<(IReadOnlyCollection<MaintenanceResponse> Data, int TotalCount)> GetAllMaintenanceAsync(OrderFilterDto filter, string? scopeBranch, string? scopeOffice);

        // ✅ باقي الميثودز زي ما هي
        Task<IReadOnlyCollection<NewProjectResponse>> GetNewProjectsByCurrentDateAndBranchAsync(string? branchName);
        Task<IReadOnlyCollection<PrivateResponse>> GetAllPrivateProjectsAsync(string? branchName);
        Task<IReadOnlyCollection<PrivateResponse>> GetPrivateProjectsByCurrentDateAndBranchAsync(string? branchName);
        Task<IReadOnlyCollection<ConstructionResponse>> GetConstructionByCurrentDateAndBranchAsync(string? branchName);
        Task<IReadOnlyCollection<EmergencyResponse>> GetEmergencyByCurrentDateAndBranchAsync(string? branchName);
        Task<IReadOnlyCollection<MaintenanceResponse>> GetMaintenanceByCurrentDateAndBranchAsync(string? branchName);
        Task<OrderCompleteOrNoDto> GetOrderStatisticsAsync();
        Task<ProjectSituationFilterDto> GetProjectsWithSituationsAsync();
        Task<ProjectSituationStatisticsDto> GetSituationCountsAsync();
        Task<List<ProjectDetailsDto>> GetProjectsBySituationAsync(string situation, string projectType = null);
        Task UpdateProjectSituationsAsync();
        Task<int> MarkPaidProjectsAsDisbursedAsync();
    }
}