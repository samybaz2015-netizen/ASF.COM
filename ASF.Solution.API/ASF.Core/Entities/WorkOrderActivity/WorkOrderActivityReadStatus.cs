using System;
using ASF.Core.Entities.Identity;

namespace ASF.Core.Entities.WorkOrderActivity
{
    /// <summary>
    /// حالة قراءة الأنشطة لكل مستخدم
    /// يتتبع أي الأنشطة قد قرأها كل مستخدم
    /// </summary>
    public class WorkOrderActivityReadStatus
    {
        public int Id { get; set; }

        /// <summary>
        /// معرّف النشاط
        /// </summary>
        public int ActivityId { get; set; }

        /// <summary>
        /// معرّف أمر العمل
        /// </summary>
        public int WorkOrderId { get; set; }

        /// <summary>
        /// معرّف المستخدم الذي قرأ النشاط
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        /// تاريخ ووقت قراءة النشاط
        /// </summary>
        public DateTime ReadAt { get; set; } = DateTime.UtcNow;

        // ─── الملاحات ────────────────────────────────────────────
        /// <summary>
        /// المستخدم الذي قرأ النشاط
        /// </summary>
        public virtual AppUser User { get; set; }

        /// <summary>
        /// النشاط الذي تمت قراءته
        /// </summary>
        public virtual WorkOrderActivity Activity { get; set; }
    }
}
