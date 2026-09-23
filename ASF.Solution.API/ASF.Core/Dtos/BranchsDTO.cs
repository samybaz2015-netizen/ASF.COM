using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class BranchsDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<OfficeDTO2> Offices { get; set; }

    }
    public class OfficeDTO2
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class AddBranchsDTO
    {

        public string Name { get; set; }
    }
}
