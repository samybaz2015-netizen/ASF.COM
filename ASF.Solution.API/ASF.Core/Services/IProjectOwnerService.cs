using ASF.Core.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IProjectOwnerService
    {
        Task<IEnumerable<GetProjectOwnerDto>> GetAllProjectOwners();
        Task<GetProjectOwnerDto?> GetProjectOwnerById(int id);
        Task<ProjectOwnerDto> CreateProjectOwner(ProjectOwnerDto dto);
        Task<ProjectOwnerDto?> UpdateProjectOwner(int id, ProjectOwnerDto dto);
        Task<bool> DeleteProjectOwner(int id);
    }
}
