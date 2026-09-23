using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ASF.Api.Helpers;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Core.Helpers;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly UserManager<AppUser> _userManager;
        private readonly ApplicationDbContext _context;

        public NotificationController(INotificationRepository notificationRepository, UserManager<AppUser> userManager,ApplicationDbContext context)
        {
            _notificationRepository = notificationRepository;
            _userManager = userManager;
            _context = context;
        }

        // إضافة إشعار جديد
        [HttpPost("create")]
        public async Task<IActionResult> CreateNotification([FromBody] Notification notification)
        {
            if (notification == null)
            {
                return BadRequest("الإشعار غير صالح.");
            }

            // إضافة الإشعار إلى المستودع
            await _notificationRepository.AddAsync(notification);

            return Ok(new ApiResponse<Notification>(200, "تم إضافة الإشعار بنجاح", notification));
        }

        // استرجاع جميع الإشعارات
        [HttpGet("all")]
        public async Task<IActionResult> GetAllNotifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); // جلب معرف المستخدم من التوكن
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return Unauthorized(new ApiResponse<string>(401, "المستخدم غير مصرح له", null));
            }

            IList<string> roles = await _userManager.GetRolesAsync(user);

            IEnumerable<Notification> notifications;

            // ✅ إذا كان المستخدم Admin يجلب كل الإشعارات
           
                // 🔹 إذا كان المستخدم عادي يجلب الإشعارات الخاصة به فقط
                notifications = await _notificationRepository.GetByUserIdAsync(userId);
            

            if (notifications == null || !notifications.Any())
            {
                return NotFound(new ApiResponse<string>(404, "لا توجد إشعارات حالياً", null));
            }

            return Ok(new ApiResponse<IEnumerable<Notification>>(200, "تم جلب الإشعارات بنجاح", notifications));
        }
        [HttpGet("count")]
        public async Task<IActionResult> GetNotificationCount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<string>(401, "المستخدم غير مصرح له", null));
            }

            var count = await _context.Notifications
                                      .Where(n => n.Target == userId)
                                      .CountAsync();

            return Ok(new ApiResponse<int>(200, "تم جلب عدد الإشعارات بنجاح", count));
        }


        // استرجاع إشعار بناءً على ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetNotificationById(int id)
        {
            var notification = await _notificationRepository.GetByIdAsync(id);

            if (notification == null)
            {
                return NotFound(new ApiResponse<string>(404, "الإشعار غير موجود", null));
            }

            return Ok(new ApiResponse<Notification>(200, "تم جلب الإشعار بنجاح", notification));
        }
        [HttpPut("updateNotification/{id}")]
        public async Task<IActionResult> UpdateNotification(int id, [FromBody] UpdateNotificationDto dto)
        {
            // التحقق من وجود الإشعار
            var notification = await _notificationRepository.GetByIdAsync(id);

            if (notification == null)
            {
                return NotFound(new ApiResponse<string>(404, "الإشعار غير موجود", null));
            }

            // تحديث الإشعار بناءً على البيانات الواردة في الـ DTO
            notification.Message = dto.Message ?? notification.Message;
            notification.NotificationType = dto.NotificationType ?? notification.NotificationType;
            notification.ProjectId = dto.ProjectId ?? notification.ProjectId; // يمكنك تعديل هذه القيمة بناءً على المعايير
            notification.ProjectType = dto.ProjectType ?? notification.ProjectType;

            // حفظ التحديثات في قاعدة البيانات
            _context.Notifications.Update(notification);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<Notification>(200, "تم تحديث الإشعار بنجاح", notification));
        }
        public class UpdateNotificationDto
        {
            public string Message { get; set; }
            public string NotificationType { get; set; }
            public int? ProjectId { get; set; }  // استخدم Nullable إذا كنت لا تريد تغييره
            public string ProjectType { get; set; }
        }

        // حذف إشعار
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _notificationRepository.GetByIdAsync(id);

            if (notification == null)
            {
                return NotFound(new ApiResponse<string>(404, "الإشعار غير موجود", null));
            }

            // حذف الإشعار من المستودع
            await _notificationRepository.DeleteAsync(id);

            return Ok(new ApiResponse<string>(200, "تم حذف الإشعار بنجاح", "الإشعار تم حذفه."));
        }
    }

}
