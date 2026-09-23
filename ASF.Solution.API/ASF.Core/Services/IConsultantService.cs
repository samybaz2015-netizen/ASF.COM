using ASF.Core.Dtos;
using ASF.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IConsultantService
    {
        Task<IEnumerable<GetConsultantDto>> GetAllConsultants();
        Task<GetConsultantDto> GetConsultantById(int id);
        Task<ConsultantDto> CreateConsultant(ConsultantDto consultantDto);
        Task<ConsultantDto> UpdateConsultant(int id, ConsultantDto consultantDto);
        Task<bool> DeleteConsultant(int id);
    }



}
