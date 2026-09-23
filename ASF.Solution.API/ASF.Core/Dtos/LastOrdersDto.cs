using ASF.Core.Entities.Construction;
using ASF.Core.Entities.NewProject;
using ASF.Core.Entities.PrivateProject;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class LastOrdersDto
    {
        public NewProject NewProject { get; set; }
        public PrivateProject PrivateProject { get; set; }
        public Construction Construction { get; set; }
    }

}
