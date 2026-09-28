using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using ASF.Core.Entities.Identity;
using ASF.Core.Entities.WorkOrderActivity;
using ASF.Repository.AppDbContext;

namespace ASF.Service
{
    /// <summary>
    /// الخدمة المركزية لتسجيل نشاطات أمر العمل
    /// تُستدعى من جميع الوحدات المرتبطة بأمر العمل
    /// </summary>
    public class WorkOrderActivityService
    {
        private readonly ApplicationDbContext _context;

        public WorkOrderActivityService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// تسجيل نشاط جديد لأمر العمل
        /// </summary>
        /// <param name="workOrderId">معرّف أمر العمل</param>
        /// <param name="activityType">نوع النشاط</param>
        /// <param name="userId">معرّف المستخدم</param>
        /// <param name="description">وصف النشاط</param>
        /// <param name="oldValues">البيانات القديمة (اختياري)</param>
        /// <param name="newValues">البيانات الجديدة (اختياري)</param>
        public async Task<WorkOrderActivity> LogActivityAsync(
            int workOrderId,
            ActivityType activityType,
            string userId,
            string description = null,
            object oldValues = null,
            object newValues = null)
        {
            var activity = new WorkOrderActivity
            {
                WorkOrderId = workOrderId,
                ActivityType = activityType,
                Description = description,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                OldValues = SerializeObject(oldValues),
                NewValues = SerializeObject(newValues),
                IsDeleted = false
            };

            _context.WorkOrderActivities.Add(activity);
            await _context.SaveChangesAsync();

            return activity;
        }

        /// <summary>
        /// إضافة تعليق على أمر العمل
        /// </summary>
        public async Task<WorkOrderComment> AddCommentAsync(
            int workOrderId,
            string content,
            string userId,
            int? parentCommentId = null)
        {
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("محتوى التعليق مطلوب", nameof(content));

            var comment = new WorkOrderComment
            {
                WorkOrderId = workOrderId,
                Content = content,
                CreatedByUserId = userId,
                ParentCommentId = parentCommentId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false,
                IsPinned = false
            };

            _context.WorkOrderComments.Add(comment);
            await _context.SaveChangesAsync();

            // تسجيل النشاط
            await LogActivityAsync(
                workOrderId,
                ActivityType.COMMENT_ADDED,
                userId,
                $"تم إضافة تعليق جديد",
                null,
                new { CommentId = comment.Id, Content = content }
            );

            return comment;
        }

        /// <summary>
        /// تعديل تعليق موجود
        /// </summary>
        public async Task<WorkOrderComment> UpdateCommentAsync(
            int commentId,
            string newContent,
            string userId)
        {
            var comment = _context.WorkOrderComments.FirstOrDefault(c => c.Id == commentId);
            if (comment == null)
                throw new InvalidOperationException($"التعليق برقم {commentId} غير موجود");

            var oldContent = comment.Content;
            comment.Content = newContent;
            comment.UpdatedByUserId = userId;
            comment.UpdatedAt = DateTime.UtcNow;

            _context.WorkOrderComments.Update(comment);
            await _context.SaveChangesAsync();

            // تسجيل النشاط
            await LogActivityAsync(
                comment.WorkOrderId,
                ActivityType.COMMENT_EDITED,
                userId,
                $"تم تعديل التعليق",
                new { OldContent = oldContent },
                new { NewContent = newContent }
            );

            return comment;
        }

        /// <summary>
        /// حذف تعليق (soft delete)
        /// </summary>
        public async Task DeleteCommentAsync(int commentId, string userId)
        {
            var comment = _context.WorkOrderComments.FirstOrDefault(c => c.Id == commentId);
            if (comment == null)
                throw new InvalidOperationException($"التعليق برقم {commentId} غير موجود");

            comment.IsDeleted = true;

            _context.WorkOrderComments.Update(comment);
            await _context.SaveChangesAsync();

            // تسجيل النشاط
            await LogActivityAsync(
                comment.WorkOrderId,
                ActivityType.COMMENT_DELETED,
                userId,
                $"تم حذف التعليق"
            );
        }

        /// <summary>
        /// إضافة ذكر (@mention) على تعليق
        /// </summary>
        public async Task<WorkOrderMention> AddMentionAsync(
            int commentId,
            int workOrderId,
            string mentionedUserId,
            string createdByUserId,
            int? notificationId = null)
        {
            var comment = _context.WorkOrderComments.FirstOrDefault(c => c.Id == commentId);
            if (comment == null)
                throw new InvalidOperationException($"التعليق برقم {commentId} غير موجود");

            // التحقق من عدم وجود ذكر مكرر
            var existingMention = _context.WorkOrderMentions
                .FirstOrDefault(m => m.CommentId == commentId && m.MentionedUserId == mentionedUserId);

            if (existingMention != null)
                return existingMention;

            var mention = new WorkOrderMention
            {
                CommentId = commentId,
                WorkOrderId = workOrderId,
                MentionedUserId = mentionedUserId,
                CreatedByUserId = createdByUserId,
                NotificationId = notificationId,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.WorkOrderMentions.Add(mention);
            await _context.SaveChangesAsync();

            // تسجيل النشاط
            await LogActivityAsync(
                workOrderId,
                ActivityType.MENTION_ADDED,
                createdByUserId,
                $"تم ذكر مستخدم",
                null,
                new { MentionedUserId = mentionedUserId, CommentId = commentId }
            );

            return mention;
        }

        /// <summary>
        /// إضافة ملف مرفق إلى تعليق
        /// </summary>
        public async Task<WorkOrderCommentAttachment> AddAttachmentAsync(
            int commentId,
            int workOrderId,
            string fileName,
            string fileType,
            long fileSize,
            string filePath,
            string fileUrl = null)
        {
            var comment = _context.WorkOrderComments.FirstOrDefault(c => c.Id == commentId);
            if (comment == null)
                throw new InvalidOperationException($"التعليق برقم {commentId} غير موجود");

            var attachment = new WorkOrderCommentAttachment
            {
                CommentId = commentId,
                WorkOrderId = workOrderId,
                FileName = fileName,
                FileType = fileType,
                FileSize = fileSize,
                FilePath = filePath,
                FileUrl = fileUrl,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            _context.WorkOrderCommentAttachments.Add(attachment);
            await _context.SaveChangesAsync();

            // تسجيل النشاط
            await LogActivityAsync(
                workOrderId,
                ActivityType.ATTACHMENT_ADDED,
                comment.CreatedByUserId,
                $"تم إضافة ملف مرفق",
                null,
                new { FileName = fileName, FileType = fileType, FileSize = fileSize }
            );

            return attachment;
        }

        /// <summary>
        /// تثبيت تعليق مهم
        /// </summary>
        public async Task<WorkOrderComment> PinCommentAsync(int commentId, string userId)
        {
            var comment = _context.WorkOrderComments.FirstOrDefault(c => c.Id == commentId);
            if (comment == null)
                throw new InvalidOperationException($"التعليق برقم {commentId} غير موجود");

            comment.IsPinned = true;

            _context.WorkOrderComments.Update(comment);
            await _context.SaveChangesAsync();

            // تسجيل النشاط
            await LogActivityAsync(
                comment.WorkOrderId,
                ActivityType.COMMENT_ADDED,
                userId,
                $"تم تثبيت التعليق"
            );

            return comment;
        }

        /// <summary>
        /// إزالة تثبيت التعليق
        /// </summary>
        public async Task<WorkOrderComment> UnpinCommentAsync(int commentId, string userId)
        {
            var comment = _context.WorkOrderComments.FirstOrDefault(c => c.Id == commentId);
            if (comment == null)
                throw new InvalidOperationException($"التعليق برقم {commentId} غير موجود");

            comment.IsPinned = false;

            _context.WorkOrderComments.Update(comment);
            await _context.SaveChangesAsync();

            return comment;
        }

        /// <summary>
        /// الحصول على سجل النشاطات لأمر عمل معين
        /// </summary>
        public async Task<List<WorkOrderActivity>> GetActivitiesAsync(
            int workOrderId,
            int skip = 0,
            int take = 50)
        {
            return await Task.FromResult(
                _context.WorkOrderActivities
                    .Where(a => a.WorkOrderId == workOrderId && !a.IsDeleted)
                    .OrderByDescending(a => a.CreatedAt)
                    .Skip(skip)
                    .Take(take)
                    .ToList()
            );
        }

        /// <summary>
        /// الحصول على التعليقات لأمر عمل معين
        /// </summary>
        public async Task<List<WorkOrderComment>> GetCommentsAsync(
            int workOrderId,
            int skip = 0,
            int take = 50)
        {
            return await Task.FromResult(
                _context.WorkOrderComments
                    .Where(c => c.WorkOrderId == workOrderId && !c.IsDeleted && c.ParentCommentId == null)
                    .OrderByDescending(c => c.CreatedAt)
                    .Skip(skip)
                    .Take(take)
                    .ToList()
            );
        }

        /// <summary>
        /// الحصول على إشعارات الذكرات لمستخدم معين
        /// </summary>
        public async Task<List<WorkOrderMention>> GetUnreadMentionsAsync(string userId)
        {
            return await Task.FromResult(
                _context.WorkOrderMentions
                    .Where(m => m.MentionedUserId == userId && !m.IsRead)
                    .OrderByDescending(m => m.CreatedAt)
                    .ToList()
            );
        }

        /// <summary>
        /// وضع علامة على الذكرات كمقروءة
        /// </summary>
        public async Task MarkMentionsAsReadAsync(string userId, List<int> mentionIds)
        {
            var mentions = _context.WorkOrderMentions
                .Where(m => mentionIds.Contains(m.Id) && m.MentionedUserId == userId)
                .ToList();

            foreach (var mention in mentions)
            {
                mention.IsRead = true;
                mention.ReadAt = DateTime.UtcNow;
            }

            _context.WorkOrderMentions.UpdateRange(mentions);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// تحويل الكائن إلى JSON
        /// </summary>
        private string SerializeObject(object obj)
        {
            if (obj == null)
                return null;

            try
            {
                return JsonSerializer.Serialize(obj);
            }
            catch
            {
                return obj.ToString();
            }
        }
    }
}
