using System;
using ASF.Core.Entities.Identity;

namespace ASF.Core.Entities.WorkOrderActivity
{
    /// <summary>
    /// سجل النشاط والأحداث الخاصة بأمر العمل
    /// يتتبع جميع التغييرات والعمليات على أمر العمل
    /// </summary>
    public class WorkOrderActivity
    {
        public int Id { get; set; }

        /// <summary>
        /// معرّف أمر العمل المرتبط
        /// </summary>
        public int WorkOrderId { get; set; }

        /// <summary>
        /// نوع النشاط (إنشاء، تعديل، حذف، إلخ)
        /// </summary>
        public ActivityType ActivityType { get; set; }

        /// <summary>
        /// وصف النشاط (اختياري) - يحتوي على تفاصيل إضافية حول التغيير
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// البيانات القديمة قبل التعديل (JSON)
        /// </summary>
        public string OldValues { get; set; }

        /// <summary>
        /// البيانات الجديدة بعد التعديل (JSON)
        /// </summary>
        public string NewValues { get; set; }

        /// <summary>
        /// معرّف المستخدم الذي قام بالعملية
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        /// تاريخ ووقت إنشاء النشاط
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// هل تم حذف هذا السجل (soft delete)
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        // ─── الملاحات ────────────────────────────────────────────
        /// <summary>
        /// المستخدم الذي قام بالعملية
        /// </summary>
        public virtual AppUser User { get; set; }
    }
}
