using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class JobDescriptionDTO
    {
        public string Name { get; set; }
    }
    public class GetJobDescriptionDTO
    {
        public int Id {  get; set; }
        public string Name { get; set; }
    }
}
