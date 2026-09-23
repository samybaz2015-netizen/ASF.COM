using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Entities.NewProject;

namespace ASF.Core.Services
{
    public interface INewProjectService
    {
        public Task<NewProject> CreateNewProjectAsync(NewProjectDto newProjectDto, bool? isArchive);

        public Task<IReadOnlyCollection<NewProject>> GetAllNewProjectsAsync();
        public Task<NewProject> CreateOrUpdateNewProjectAsync(NewProjectDto newProjectDto, bool isArchive);

        public Task<IReadOnlyCollection<NewProject>> GetNewProjectWithPaginationAsync(bool? isArchive, int? sortByOrderNumber, int pageSize, int pageIndex);
        public Task<IReadOnlyCollection<NewProject>> GetOperationChangesAsync(int orderId);
        Task<NewProject> GetNewProjectByIdAsync(int Id);
        public Task<NewProject> UpdateNewProjectAsync(int projectId,UpdateNewProjectDto newProjectDto, bool isArchive);

        public Task<IReadOnlyCollection<NewProject>> FilterNewProjectByNameBranchAndIsArchive(string? branchName, bool? isArchive);




        Task<List<OperationChangeForNewProject>> GetProjectChangesAsync(int projectId);


        Task UpdateProjectsByOfficeWithContextAsync(string oldOfficeName, string newOfficeName);
        Task<IReadOnlyCollection<NewProject>> GetNewProjectWithBranchNameAsync(string projectName);

        Task UpdateExecutedQuantityAsync(int projectId, UpdateExecutedQuantityDto dto);
        Task UpdateExecutedQuantitiesAsync(int projectId, UpdateExecutedQuantitiesDto dto);
        Task<List<NewProjectPricingItemUpdateLog>> GetExecutedQuantityLogsAsync(int projectId, int? pricingItemId = null);
        Task<bool> DeleteNewProjectAsync(int projectId);
    }
}
