using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities
{
    public class Branchs
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public ICollection<Office> Offices { get; set; }

    }
}
