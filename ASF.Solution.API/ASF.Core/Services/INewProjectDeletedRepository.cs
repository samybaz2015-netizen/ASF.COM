using ASF.Core.Entities.NewProject;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface INewProjectDeletedRepository
    {
        Task AddAsync(NewProjectDeleted project);
        Task<List<NewProjectDeleted>> GetAllAsync();
        Task DeleteAsync(NewProjectDeleted entity);
        Task<NewProjectDeleted> GetByIdAsync(int id); // لجلب عنصر حسب المعرف



    }

}
