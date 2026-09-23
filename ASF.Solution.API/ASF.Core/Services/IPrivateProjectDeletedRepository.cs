using ASF.Core.Entities.NewProject;
using ASF.Core.Entities.PrivateProject;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IPrivateProjectDeletedRepository
    {
        Task AddAsync(PrivateProjectDeleted deletedProject);
        Task<List<PrivateProjectDeleted>> GetAllAsync();
        Task DeleteAsync(PrivateProjectDeleted entity);
        Task<PrivateProjectDeleted> GetByIdAsync(int id);

    }
}
