using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities
{
    public class Office
    {
        public int Id { get; set; }
        public string Name { get; set; }

        // العلاقة مع الفرع
        public int BranchId { get; set; }
        public Branchs Branch { get; set; }
    }

}
