using ASF.Core.Dtos;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ASF.Core.Entities.Emergency;

namespace ASF.Core.Services
{
    public interface IEmergencyDeletedRepository
    {
        Task AddAsync(EmergencyDeleted project);
        Task<List<EmergencyDeleted>> GetAllAsync();
        Task DeleteAsync(EmergencyDeleted entity);
        Task<EmergencyDeleted> GetByIdAsync(int id);
    }
}
