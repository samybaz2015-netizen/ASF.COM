using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class NeighborhoodDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int OfficeId { get; set; }
        public string OfficeName { get; set; }
    }
    public class CreateNeighborhoodDto
    {
        public string Name { get; set; }
        public int OfficeId { get; set; }

    }

}
