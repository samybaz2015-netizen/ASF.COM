using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class WorkOrderTypeDTO
    {
        public string Name { get; set; }

    }
    public class GetWorkOrderTypeDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
