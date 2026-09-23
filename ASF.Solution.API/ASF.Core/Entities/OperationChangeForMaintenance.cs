using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities
{
    public class OperationChangeForMaintenance : IOperationChange
    {
        public int Id { get; set; }
        public int OperationId { get; set; } // المعرف الخاص بالطلب
        public string UserName { get; set; } // معرف المستخدم الذي أجرى التغيير
        public DateTime ChangeDate { get; set; }
        public string UserProfileImage { get; set; }
        public string ChangeDescription { get; set; }
        public string? ItemNumber { get; set; }       // رقم البند (إن وُجد)
        public string? ItemDescription { get; set; }  // وصف البند (إن وُجد)
    }
}
