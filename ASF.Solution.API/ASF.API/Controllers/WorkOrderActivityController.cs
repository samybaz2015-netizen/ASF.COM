using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Entities.WorkOrderActivity;
using ASF.Service;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    /// <summary>
    /// API للتعامل مع سجل نشاطات أمر العمل والتعليقات والذكرات
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WorkOrderActivityController : ControllerBase
    {
        private readonly WorkOrderActivityService _activityService;

        public WorkOrderActivityController(WorkOrderActivityService activityService)
        {
            _activityService = activityService;
        }

        /// <summary>
        /// الحصول على سجل النشاطات لأمر عمل
        /// </summary>
        [HttpGet("activities/{workOrderId}")]
        public async Task<ActionResult<List<WorkOrderActivity>>> GetActivities(
            int workOrderId,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 50)
        {
            try
            {
                var activities = await _activityService.GetActivitiesAsync(workOrderId, skip, take);
                return Ok(activities);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// الحصول على التعليقات لأمر عمل
        /// </summary>
        [HttpGet("comments/{workOrderId}")]
        public async Task<ActionResult<List<WorkOrderComment>>> GetComments(
            int workOrderId,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 50)
        {
            try
            {
                var comments = await _activityService.GetCommentsAsync(workOrderId, skip, take);
                return Ok(comments);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// إضافة تعليق جديد على أمر عمل
        /// </summary>
        [HttpPost("add-comment")]
        public async Task<ActionResult<WorkOrderComment>> AddComment(
            [FromBody] AddCommentRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var comment = await _activityService.AddCommentAsync(
                    request.WorkOrderId,
                    request.Content,
                    userId,
                    request.ParentCommentId
                );

                return Ok(comment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// تعديل تعليق موجود
        /// </summary>
        [HttpPut("update-comment/{commentId}")]
        public async Task<ActionResult<WorkOrderComment>> UpdateComment(
            int commentId,
            [FromBody] UpdateCommentRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var comment = await _activityService.UpdateCommentAsync(
                    commentId,
                    request.Content,
                    userId
                );

                return Ok(comment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// حذف تعليق
        /// </summary>
        [HttpDelete("delete-comment/{commentId}")]
        public async Task<ActionResult> DeleteComment(int commentId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                await _activityService.DeleteCommentAsync(commentId, userId);
                return Ok(new { message = "تم حذف التعليق بنجاح" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// تثبيت تعليق مهم
        /// </summary>
        [HttpPost("pin-comment/{commentId}")]
        public async Task<ActionResult<WorkOrderComment>> PinComment(int commentId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var comment = await _activityService.PinCommentAsync(commentId, userId);
                return Ok(comment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// إزالة تثبيت التعليق
        /// </summary>
        [HttpPost("unpin-comment/{commentId}")]
        public async Task<ActionResult<WorkOrderComment>> UnpinComment(int commentId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var comment = await _activityService.UnpinCommentAsync(commentId, userId);
                return Ok(comment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// إضافة ذكر (@mention) على تعليق
        /// </summary>
        [HttpPost("add-mention")]
        public async Task<ActionResult<WorkOrderMention>> AddMention(
            [FromBody] AddMentionRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var mention = await _activityService.AddMentionAsync(
                    request.CommentId,
                    request.WorkOrderId,
                    request.MentionedUserId,
                    userId,
                    request.NotificationId
                );

                return Ok(mention);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// الحصول على إشعارات الذكرات غير المقروءة
        /// </summary>
        [HttpGet("unread-mentions")]
        public async Task<ActionResult<List<WorkOrderMention>>> GetUnreadMentions()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var mentions = await _activityService.GetUnreadMentionsAsync(userId);
                return Ok(mentions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// وضع علامة على الذكرات كمقروءة
        /// </summary>
        [HttpPost("mark-mentions-as-read")]
        public async Task<ActionResult> MarkMentionsAsRead(
            [FromBody] MarkMentionsAsReadRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                await _activityService.MarkMentionsAsReadAsync(userId, request.MentionIds);
                return Ok(new { message = "تم تحديث حالة القراءة بنجاح" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// إضافة ملف مرفق إلى تعليق
        /// </summary>
        [HttpPost("add-attachment")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<WorkOrderCommentAttachment>> AddAttachment(
            [FromForm] int commentId,
            [FromForm] int workOrderId,
            [FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "يجب تحديد ملف" });

                // حفظ الملف وإرجاع المسار والـ URL
                var fileName = Path.GetFileName(file.FileName);
                var filePath = Path.Combine("uploads", "attachments", $"{Guid.NewGuid()}_{fileName}");
                var fileDirectory = Path.Combine("wwwroot", filePath);

                // التأكد من وجود المجلد
                Directory.CreateDirectory(Path.GetDirectoryName(fileDirectory));

                // حفظ الملف
                using (var stream = new FileStream(fileDirectory, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // تسجيل المرفق في قاعدة البيانات
                var attachment = await _activityService.AddAttachmentAsync(
                    commentId,
                    workOrderId,
                    fileName,
                    file.ContentType,
                    file.Length,
                    filePath,
                    $"/uploads/attachments/{Path.GetFileName(fileDirectory)}"
                );

                return Ok(attachment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    // ─── DTOs ──────────────────────────────────────────────────────────
    public class AddCommentRequest
    {
        public int WorkOrderId { get; set; }
        public string Content { get; set; }
        public int? ParentCommentId { get; set; }
    }

    public class UpdateCommentRequest
    {
        public string Content { get; set; }
    }

    public class AddMentionRequest
    {
        public int CommentId { get; set; }
        public int WorkOrderId { get; set; }
        public string MentionedUserId { get; set; }
        public int? NotificationId { get; set; }
    }

    public class MarkMentionsAsReadRequest
    {
        public List<int> MentionIds { get; set; }
    }
}
