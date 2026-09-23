using ASF.Core.Dtos.PrivateProjectDto;
using ASF.Core.Entities;
using ASF.Core.Entities.PrivateProject;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace ASF.Core.Services
{
    public interface IPrivateProject
    {
        public Task<PrivateProject> CreatePrivateProjectAsync(PrivateProjectDto ProjectDto, bool isArchive);

        public Task<IReadOnlyCollection<PrivateProject>> GetAllPrivateProjectsAsync();

        public Task<PrivateProject> GetPrivateProjectById(int id);
        public Task<IReadOnlyCollection<PrivateProject>> GetOperationChangesAsync(int orderId);

        public Task<PrivateProject> UpdatePrivateProjectAsync(UpdatePrivateProjectDto ProjectDto, bool isArchive);

        public Task<IReadOnlyCollection<PrivateProject>> FilterPrivateProjectByNameBranchAndIsArchive(string? branchName, bool? isArchive);
        Task<List<OperationChangeForPrivateProject>> GetProjectChangesAsync(int projectId);
        Task<IReadOnlyCollection<PrivateProject>> GetAllPrivateProjectsWithBranchNameAsync(string? branchName);
        Task<bool> DeleteConstructionAsync(int projectId);
    }
}
