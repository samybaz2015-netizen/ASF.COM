using ASF.Core.Entities.Construction;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IConstructionDeletedRepository
    {
        Task AddAsync(ConstructionDeleted project);
        Task<List<ConstructionDeleted>> GetAllAsync();
        Task DeleteAsync(ConstructionDeleted entity);
        Task<ConstructionDeleted> GetByIdAsync(int id);
    }
}
