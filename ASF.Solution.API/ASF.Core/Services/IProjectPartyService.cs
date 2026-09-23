using ASF.Core.Dtos;
using ASF.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IProjectPartyService
    {
        Task<IEnumerable<GetProjectPartyDto>> GetAllProjectParties(
    string? type = null,
    int? branchId = null);
        Task<GetProjectPartyDto?> GetProjectPartyById(int id);
        Task<GetProjectPartyDto> CreateProjectParty(ProjectPartyDto dto);
        Task<GetProjectPartyDto?> UpdateProjectParty(int id, ProjectPartyDto dto);
        Task<bool> DeleteProjectParty(int id);
        Task AssignBranchToAll(int branchId);
    }
}
