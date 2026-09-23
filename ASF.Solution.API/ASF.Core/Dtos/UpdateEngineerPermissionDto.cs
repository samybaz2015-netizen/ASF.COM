using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class UpdateEngineerPermissionDto
    {
        public string EngineerId { get; set; }
        public bool CanCreateOutsideCity { get; set; }
    }

}
