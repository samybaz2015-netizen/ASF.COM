using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class OfficeDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int BranchId { get; set; }
        public string BranchName { get; set; } 
    }
    public class CreateOfficeDTO
    {
        public string Name { get; set; }
        public int BranchId { get; set; }
    }

}
