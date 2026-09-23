using ASF.Core.Entities.Maintenance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
   
    public interface IMaintenanceDeletedRepository
    {
        Task AddAsync(MaintenanceDeleted project);
        Task<List<MaintenanceDeleted>> GetAllAsync();
        Task DeleteAsync(MaintenanceDeleted entity);
        Task<MaintenanceDeleted> GetByIdAsync(int id); // لجلب عنصر حسب المعرف



    }
}
