using ASF.Core.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IContractorService
    {
        Task<IEnumerable<GetContractorsDTO>> GetAllContractors();
        Task<GetContractorsDTO> GetContractorById(int id);
        Task<ContractorDTO> CreateContractor(ContractorDTO contractorDTO);
        Task<ContractorDTO> UpdateContractor(int id, ContractorDTO contractorDTO);
        Task<bool> DeleteContractor(int id);

    }
}
