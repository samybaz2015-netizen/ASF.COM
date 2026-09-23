using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities
{
    public class DeleteRequest
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string Type { get; set; }
        public string RequestedBy { get; set; } // معرف المستخدم الذي طلب الحذف
        public bool IsApproved { get; set; } = false; // يتم تعيينها من قبل الأدمن
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    }

}
