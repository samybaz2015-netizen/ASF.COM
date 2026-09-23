using ASF.Core.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IBranchService
    {
        Task<List<BranchsDTO>> GetAllAsync();
        Task<BranchsDTO> GetByIdAsync(int? id);
        Task<AddBranchsDTO> CreateAsync(AddBranchsDTO branchsDTO);
        Task<AddBranchsDTO> UpdateAsync(int id, AddBranchsDTO branchsDTO);
        Task DeleteAsync(int id);
    }
}
