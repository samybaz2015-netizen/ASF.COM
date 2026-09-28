using System;
using ASF.Core.Entities.Identity;

namespace ASF.Core.Entities.WorkOrderActivity
{
    /// <summary>
    /// تتبع الذكرات (@mentions) في التعليقات
    /// تربط بين التعليق والمستخدمين المذكورين والإشعارات الخاصة بهم
    /// </summary>
    public class WorkOrderMention
    {
        public int Id { get; set; }

        /// <summary>
        /// معرّف التعليق الذي يحتوي على الذكر
        /// </summary>
        public int CommentId { get; set; }

        /// <summary>
        /// معرّف أمر العمل
        /// </summary>
        public int WorkOrderId { get; set; }

        /// <summary>
        /// معرّف المستخدم المذكور
        /// </summary>
        public string MentionedUserId { get; set; }

        /// <summary>
        /// معرّف المستخدم الذي قام بالذكر
        /// </summary>
        public string CreatedByUserId { get; set; }

        /// <summary>
        /// تاريخ الذكر
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// معرّف الإشعار المرتبط
        /// </summary>
        public int? NotificationId { get; set; }

        /// <summary>
        /// هل تمت قراءة هذه الإشعار من قبل المستخدم المذكور
        /// </summary>
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// تاريخ قراءة الإشعار
        /// </summary>
        public DateTime? ReadAt { get; set; }

        // ─── الملاحات ────────────────────────────────────────────
        /// <summary>
        /// التعليق الذي يحتوي على الذكر
        /// </summary>
        public virtual WorkOrderComment Comment { get; set; }

        /// <summary>
        /// المستخدم المذكور
        /// </summary>
        public virtual AppUser MentionedUser { get; set; }

        /// <summary>
        /// المستخدم الذي قام بالذكر
        /// </summary>
        public virtual AppUser CreatedByUser { get; set; }

        /// <summary>
        /// الإشعار المرتبط
        /// </summary>
        public virtual Notification Notification { get; set; }
    }
}
