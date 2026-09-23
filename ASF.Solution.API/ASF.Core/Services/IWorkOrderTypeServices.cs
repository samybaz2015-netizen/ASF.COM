using ASF.Core.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IWorkOrderTypeServices
    {
        Task<IEnumerable<GetWorkOrderTypeDTO>> GetAllWorkOrderTypes();
        Task<GetWorkOrderTypeDTO> GetWorkOrderTypeById(int id);
        Task<WorkOrderTypeDTO> CreateWorkOrderType(WorkOrderTypeDTO workOrderTypeDTO);
        Task<WorkOrderTypeDTO> UpdateWorkOrderType(int id, WorkOrderTypeDTO workOrderTypeDTO);
        Task<bool> DeleteWorkOrderType(int id);
    }
}
