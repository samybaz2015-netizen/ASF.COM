using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
   
        public class ContractorDTO
        {
            public string Name { get; set; }
        }
        public class GetContractorsDTO
        {
            public int Id { get; set; }
            public string Name { get; set; }
        }

    
}
