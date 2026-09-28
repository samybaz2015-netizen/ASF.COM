using System;
using System.Collections.Generic;
using ASF.Core.Entities.Identity;

namespace ASF.Core.Entities.WorkOrderActivity
{
    /// <summary>
    /// تعليقات المستخدمين على أمر العمل
    /// تدعم المحادثات والردود والذكر (@mention)
    /// </summary>
    public class WorkOrderComment
    {
        public int Id { get; set; }

        /// <summary>
        /// معرّف أمر العمل
        /// </summary>
        public int WorkOrderId { get; set; }

        /// <summary>
        /// معرّف التعليق الأب (في حالة الردود)
        /// </summary>
        public int? ParentCommentId { get; set; }

        /// <summary>
        /// نص التعليق
        /// </summary>
        public string Content { get; set; }

        /// <summary>
        /// معرّف المستخدم الذي كتب التعليق
        /// </summary>
        public string CreatedByUserId { get; set; }

        /// <summary>
        /// تاريخ إنشاء التعليق
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// معرّف المستخدم الذي عدّل التعليق (اختياري)
        /// </summary>
        public string UpdatedByUserId { get; set; }

        /// <summary>
        /// تاريخ آخر تحديث للتعليق
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// هل تم حذف التعليق (soft delete)
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// هل التعليق مُثبّت (أهم تعليقات)
        /// </summary>
        public bool IsPinned { get; set; } = false;

        /// <summary>
        /// عدد الإعجابات
        /// </summary>
        public int LikesCount { get; set; } = 0;

        // ─── الملاحات ────────────────────────────────────────────
        /// <summary>
        /// المستخدم الذي أنشأ التعليق
        /// </summary>
        public virtual AppUser CreatedByUser { get; set; }

        /// <summary>
        /// المستخدم الذي عدّل التعليق
        /// </summary>
        public virtual AppUser UpdatedByUser { get; set; }

        /// <summary>
        /// التعليق الأب (للردود)
        /// </summary>
        public virtual WorkOrderComment ParentComment { get; set; }

        /// <summary>
        /// الردود على هذا التعليق
        /// </summary>
        public virtual ICollection<WorkOrderComment> Replies { get; set; } = new List<WorkOrderComment>();

        /// <summary>
        /// الذكرات (@mentions) في هذا التعليق
        /// </summary>
        public virtual ICollection<WorkOrderMention> Mentions { get; set; } = new List<WorkOrderMention>();

        /// <summary>
        /// المرفقات المرتبطة بهذا التعليق
        /// </summary>
        public virtual ICollection<WorkOrderCommentAttachment> Attachments { get; set; } = new List<WorkOrderCommentAttachment>();
    }
}
