using System;

namespace ASF.Core.Entities.WorkOrderActivity
{
    /// <summary>
    /// المرفقات (الملفات) المرتبطة بتعليقات أمر العمل
    /// تدعم الصور والمستندات والملفات الأخرى
    /// </summary>
    public class WorkOrderCommentAttachment
    {
        public int Id { get; set; }

        /// <summary>
        /// معرّف التعليق المرتبط
        /// </summary>
        public int CommentId { get; set; }

        /// <summary>
        /// معرّف أمر العمل
        /// </summary>
        public int WorkOrderId { get; set; }

        /// <summary>
        /// اسم الملف الأصلي
        /// </summary>
        public string FileName { get; set; }

        /// <summary>
        /// نوع الملف (MIME type)
        /// </summary>
        public string FileType { get; set; }

        /// <summary>
        /// حجم الملف بالبايتات
        /// </summary>
        public long FileSize { get; set; }

        /// <summary>
        /// المسار أو الرابط لتخزين الملف
        /// </summary>
        public string FilePath { get; set; }

        /// <summary>
        /// URL العام للملف (إن أمكن)
        /// </summary>
        public string FileUrl { get; set; }

        /// <summary>
        /// تاريخ رفع الملف
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// هل تم حذف الملف (soft delete)
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        // ─── الملاحات ────────────────────────────────────────────
        /// <summary>
        /// التعليق المرتبط
        /// </summary>
        public virtual WorkOrderComment Comment { get; set; }
    }
}
