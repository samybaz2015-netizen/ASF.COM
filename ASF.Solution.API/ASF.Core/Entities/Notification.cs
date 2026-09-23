using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities
{
    public class Notification
    {
        public int Id { get; set; }
        public int? ProjectId { get; set; }
        public string? Message { get; set; }
        public string? UserName { get; set; }
        public string? UserImage { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? NotificationType { get; set; }  // يمكن استخدامه لتحديد نوع الإشعار (مثلاً "إنشاء مشروع")
        public string? Target { get; set; } // يمكن استخدامه لتحديد الجهة المستهدفة (مثل اسم المشروع)
        public string? ProjectType { get; set; } // يمكن استخدامه لتحديد الجهة المستهدفة (مثل اسم المشروع)
    }
}
