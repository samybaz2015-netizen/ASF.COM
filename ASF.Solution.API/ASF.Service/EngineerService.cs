//using Microsoft.EntityFrameworkCore;
using ASF.Repository.Identity;
//using ASF.Core.Entities;
//using ASF.Repository.AppDbContext;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace ASF.Service
//{
//    public class EngineerService
//    {
//        private readonly ApplicationDbContext _context;

//        public EngineerService(ApplicationDbContext context)
//        {
//            _context = context;
//        }

//        public async Task CheckResidenceExpiry()
//        {
//            var today = DateTime.UtcNow;
//            var engineers = await _context.EngineerProfiles
//                .Where(e => e.ResidenceExpiryDate != null && e.ResidenceExpiryDate < today)
//                .ToListAsync();

//            foreach (var engineer in engineers)
//            {
//                await SendNotification(engineer.UserId, "انتهت صلاحية إقامتك. يرجى التجديد في أقرب وقت.");
//            }
//        }

//        private async Task SendNotification(string userId, string message)
//        {
//            var notification = new Notification
//            {
//                Target = userId,
//                Message = message,
//                CreatedAt = DateTime.UtcNow
//            };

//            _context.Notifications.Add(notification);
//            await _context.SaveChangesAsync();
//        }
//    }
//}
using Microsoft.EntityFrameworkCore;
using ASF.Core.Entities;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class EngineerService
    {
        private readonly ApplicationDbContext _context;
        private readonly AppIdentityDbContext _identityDb;

        public EngineerService(ApplicationDbContext context, AppIdentityDbContext identityDb)
        {
            _context = context;
            _identityDb = identityDb;
        }

        public async Task CheckResidenceExpiry()
        {
            var today = DateTime.UtcNow;
            // الإقامة على سجل الحساب، فالتنبيه يُبنى منه لا من نسخة مكرّرة قد
            // تحمل تاريخاً أقدم.
            var expired = await _identityDb.Users.AsNoTracking()
                .Where(u => u.IsActiveEmployee
                            && u.ResidenceExpiryDate != null
                            && u.ResidenceExpiryDate < today)
                .Select(u => u.Id)
                .ToListAsync();

            foreach (var userId in expired)
            {
                await SendNotification(userId, "انتهت صلاحية إقامتك. يرجى التجديد في أقرب وقت.");
            }
        }

        private async Task SendNotification(string userId, string message)
        {
            var notification = new Notification
            {
                Target = userId,
                Message = message,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }
    }
}