using Microsoft.EntityFrameworkCore;
using ASF.Core.Entities;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly ApplicationDbContext _context;

        public NotificationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // إضافة إشعار جديد
        public async Task AddAsync(Notification notification)
        {
            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        // إضافة مجموعة إشعارات دفعة واحدة
        public async Task AddRangeAsync(IEnumerable<Notification> notifications)
        {
            if (notifications == null || !notifications.Any()) return;
            await _context.Notifications.AddRangeAsync(notifications);
            await _context.SaveChangesAsync();
        }

        // استرجاع جميع الإشعارات
        public async Task<IEnumerable<Notification>> GetAllAsync()
        {
            return await _context.Notifications.OrderByDescending(n => n.CreatedAt)
                                .ToListAsync();
        }
        public async Task<IEnumerable<Notification>> GetByUserIdAsync(string userId)
        {
            return await _context.Notifications
                                 .Where(n => n.Target == userId) // تأكد من أن UserName يخزن الـ ID وليس الاسم
                                  .OrderByDescending(n => n.CreatedAt)
                                 .ToListAsync();
        }

        // استرجاع إشعار بناءً على ID
        public async Task<Notification> GetByIdAsync(int id)
        {
            return await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id);
        }

        // حذف إشعار
        public async Task DeleteAsync(int id)
        {
            var notification = await GetByIdAsync(id);
            if (notification != null)
            {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
            }
        }
    }


}
