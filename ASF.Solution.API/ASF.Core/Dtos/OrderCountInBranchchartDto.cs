using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class OrderCountInBranchchartDto
    {
        public int[] OrderCountRiyadh { get; set; } // عدد الطلبات في فرع الرياض
        public int[] OrderCountHail { get; set; }   // عدد الطلبات في فرع حائل
    }
}
