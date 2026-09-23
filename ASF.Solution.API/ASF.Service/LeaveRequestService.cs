//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.EntityFrameworkCore;
//using ASF.Core.Dtos;
//using ASF.Core.Entities;
//using ASF.Core.Entities.Identity;
//using ASF.Core.Services;
//using ASF.Repository.AppDbContext;
//using ASF.Repository.Identity;
//using System;
//using System.Collections.Generic;
//using System.IO;
//using System.Linq;
//using System.Threading.Tasks;

//namespace ASF.Service
//{
//    public class LeaveRequestService : ILeaveRequestService
//    {
//        private readonly ApplicationDbContext _context;
//        private readonly AppIdentityDbContext _user;
//        private readonly UserManager<AppUser> _userManager;
//        private readonly IHttpContextAccessor _httpContextAccessor;

//        public LeaveRequestService(
//            ApplicationDbContext context,
//            AppIdentityDbContext user,
//            UserManager<AppUser> userManager,
//            IHttpContextAccessor httpContextAccessor)
//        {
//            _context = context;
//            _user = user;
//            _userManager = userManager;
//            _httpContextAccessor = httpContextAccessor;
//        }

//        public async Task<bool> RequestLeaveAsync(string employeeId, LeaveRequestDto leaveRequestDto)
//        {
//            var user = await _user.Users.FirstOrDefaultAsync(d => d.Id == employeeId);

//            string fullFileUrl = null;
//            if (leaveRequestDto.File != null && leaveRequestDto.File.Length > 0)
//            {
//                var folderPath = Path.Combine("wwwroot", "LeaveFiles");
//                if (!Directory.Exists(folderPath))
//                    Directory.CreateDirectory(folderPath);

//                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(leaveRequestDto.File.FileName)}";
//                var filePath = Path.Combine(folderPath, fileName);

//                using (var stream = new FileStream(filePath, FileMode.Create))
//                    await leaveRequestDto.File.CopyToAsync(stream);

//                var request = _httpContextAccessor.HttpContext?.Request;
//                if (request != null)
//                {
//                    var baseUrl = $"{request.Scheme}://{request.Host}";
//                    var relativePath = Path.Combine("LeaveFiles", fileName).Replace("\\", "/");
//                    fullFileUrl = $"{baseUrl}/{relativePath}";
//                }
//            }

//            var leaveRequest = new LeaveRequest
//            {
//                EmployeeId = employeeId,
//                EmployeeName = user?.DisplayName,
//                NumberOfDays = leaveRequestDto.NumberOfDays,
//                Reason = leaveRequestDto.Reason,
//                From = leaveRequestDto.From,
//                To = leaveRequestDto.To,
//                Status = "Pending",
//                File = fullFileUrl,
//                RequestDate = DateTime.UtcNow,
//                EndReminderSent = false
//            };

//            await _context.LeaveRequests.AddAsync(leaveRequest);

//            var admins = await _userManager.GetUsersInRoleAsync("admin");
//            var notifications = admins.Select(admin => new Notification
//            {
//                Message = $"تم تقديم طلب إجازة جديد من {user?.DisplayName}.",
//                UserName = user?.DisplayName,
//                UserImage = user?.UserImage,
//                CreatedAt = DateTime.UtcNow,
//                NotificationType = "طلب اجازة",
//                Target = admin.Id,
//            }).ToList();

//            await _context.Notifications.AddRangeAsync(notifications);
//            await _context.SaveChangesAsync();
//            return true;
//        }

//        public async Task<IEnumerable<LeaveRequest>> GetAllRequestsAsync(
//          string? employeeName = null,
//          int? branchId = null)
//        {
//            var currentUser = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
//            var userRoles = await _userManager.GetRolesAsync(currentUser);

//            // ---- 1. جيب كل الـ EmployeeIds المسموح بيها حسب الرول ----
//            IQueryable<AppUser> allowedUsersQuery = _user.Users;

//            if (userRoles.Contains("admin"))
//            {
//                // Admin يشوف الكل - مش محتاج فلترة على اليوزرز
//            }
//            else if (userRoles.Contains("officeManager"))
//            {
//                if (!currentUser.OfficeId.HasValue)
//                    return new List<LeaveRequest>();

//                allowedUsersQuery = allowedUsersQuery
//                    .Where(u => u.OfficeId == currentUser.OfficeId);
//            }
//            else if (userRoles.Contains("supervisor"))
//            {
//                if (currentUser.BranchId == 0)
//                    return new List<LeaveRequest>();

//                allowedUsersQuery = allowedUsersQuery
//                    .Where(u => u.BranchId == currentUser.BranchId);
//            }
//            else
//            {
//                return new List<LeaveRequest>();
//            }

//            // ---- 2. فلترة إضافية بالاسم أو الفرع (Query Params) ----
//            if (!string.IsNullOrWhiteSpace(employeeName))
//                allowedUsersQuery = allowedUsersQuery
//                    .Where(u => u.DisplayName.Contains(employeeName));

//            if (branchId.HasValue && branchId.Value > 0)
//                allowedUsersQuery = allowedUsersQuery
//                    .Where(u => u.BranchId == branchId.Value);

//            var allowedUserIds = await allowedUsersQuery
//                .Select(u => u.Id)
//                .ToListAsync();

//            // ---- 3. جيب الـ LeaveRequests الخاصة بالـ IDs دي ----
//            return await _context.LeaveRequests
//                .Where(r => allowedUserIds.Contains(r.EmployeeId))
//                .OrderByDescending(r => r.RequestDate)
//                .ToListAsync();
//        }
//        public async Task<bool> DeleteLeaveRequestAsync(int requestId)
//        {
//            var leaveRequest = await _context.LeaveRequests.FindAsync(requestId);
//            if (leaveRequest == null) return false;

//            _context.LeaveRequests.Remove(leaveRequest);
//            await _context.SaveChangesAsync();
//            return true;
//        }

//        public async Task<LeaveRequest> GetLeaveRequestByIdAsync(int requestId)
//        {
//            return await _context.LeaveRequests.FindAsync(requestId);
//        }

//        public async Task<bool> UpdateLeaveStatusAsync(int requestId, string status, string? reason)
//        {
//            var leaveRequest = await _context.LeaveRequests.FindAsync(requestId)
//                ?? throw new KeyNotFoundException("Leave request not found.");

//            if (!string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase) &&
//                !string.Equals(status, "Rejected", StringComparison.OrdinalIgnoreCase))
//                throw new ArgumentException("Status must be either 'Approved' or 'Rejected'.");

//            var employee = await _userManager.FindByIdAsync(leaveRequest.EmployeeId)
//                ?? throw new KeyNotFoundException("Employee not found for this leave request.");

//            if (string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase))
//            {
//                var daysToDeduct = leaveRequest.NumberOfDays > 0
//                    ? leaveRequest.NumberOfDays
//                    : CalcDaysFromRange(leaveRequest.From, leaveRequest.To);

//                if (daysToDeduct <= 0)
//                    throw new InvalidOperationException("Leave days must be greater than zero.");

//                if (employee.AnnualLeaveBalance < daysToDeduct)
//                    throw new InvalidOperationException(
//                        $"Insufficient leave balance. Current: {employee.AnnualLeaveBalance}, required: {daysToDeduct}.");

//                employee.AnnualLeaveBalance -= daysToDeduct;
//                var updateUserRes = await _userManager.UpdateAsync(employee);
//                if (!updateUserRes.Succeeded)
//                    throw new InvalidOperationException("Failed to update employee leave balance.");
//            }

//            leaveRequest.Status = status;
//            leaveRequest.EndReminderSent = false;
//            _context.LeaveRequests.Update(leaveRequest);

//            var notification = new Notification
//            {
//                Message = string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase)
//                    ? "تمت الموافقة على طلب الإجازة الخاص بك."
//                    : $"تم رفض طلب الإجازة الخاص بك. السبب: {reason}",
//                UserName = employee.DisplayName,
//                UserImage = employee.UserImage,
//                CreatedAt = DateTime.UtcNow,
//                NotificationType = "تحديث طلب الاجازة",
//                Target = employee.Id,
//            };

//            await _context.Notifications.AddAsync(notification);
//            await _context.SaveChangesAsync();
//            return true;
//        }

//        public async Task<bool> DeleteAllLeaveRequestsAsync()
//        {
//            var all = await _context.LeaveRequests.ToListAsync();
//            if (!all.Any()) return false;

//            _context.LeaveRequests.RemoveRange(all);
//            await _context.SaveChangesAsync();
//            return true;
//        }

//        // جديد: عدّادات الموظف (بدون تغيير)
//        public async Task<IEnumerable<MyLeaveRequestDto>> GetMyLeaveRequestsWithCountersAsync(string employeeId)
//        {
//            var leaves = await _context.LeaveRequests
//                .Where(l => l.EmployeeId == employeeId)
//                .OrderByDescending(l => l.RequestDate)
//                .ToListAsync();

//            var tz = GetSaudiTimeZone(); // زي ما هي عندك
//            var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;

//            var list = new List<MyLeaveRequestDto>();

//            foreach (var l in leaves)
//            {
//                var dto = new MyLeaveRequestDto
//                {
//                    Id = l.Id,
//                    From = l.From ?? default, // هنرجّع القيمة زي ما هي (حتى لو default)
//                    To = l.To ?? default,
//                    Status = l.Status,
//                  File = l.File,
//                  Reason = l.Reason,
//                    TotalDays = (l.From.HasValue && l.To.HasValue)
//                        ? (int)((l.To.Value.Date - l.From.Value.Date).TotalDays) + 1
//                        : 0
//                };

//                if (l.From.HasValue && l.To.HasValue)
//                {
//                    var fromDate = l.From.Value.Date;
//                    var toDate = l.To.Value.Date;

//                    if (todayLocal < fromDate)
//                    {
//                        dto.IsUpcoming = true;
//                        dto.DaysUntilStart = (int)(fromDate - todayLocal).TotalDays;
//                    }
//                    else if (todayLocal >= fromDate && todayLocal <= toDate)
//                    {
//                        dto.IsActive = true;
//                        dto.DaysUntilEnd = (int)(toDate - todayLocal).TotalDays; // 0 = آخر يوم
//                    }
//                    else
//                    {
//                        dto.IsFinished = true;
//                    }
//                }
//                else
//                {
//                    // لو التواريخ ناقصة: ما نحسبش عدادات زمنية
//                    dto.IsUpcoming = false;
//                    dto.IsActive = false;
//                    dto.IsFinished = false;
//                    dto.DaysUntilStart = null;
//                    dto.DaysUntilEnd = null;
//                }

//                list.Add(dto);
//            }

//            return list;
//        }

//        private static int CalcDaysFromRange(DateTime? from, DateTime? to)
//        {
//            if (from.HasValue && to.HasValue)
//            {
//                var days = (int)((to.Value.Date - from.Value.Date).TotalDays) + 1;
//                return days < 0 ? 0 : days;
//            }
//            return 0;
//        }

//        private static TimeZoneInfo GetSaudiTimeZone()
//        {
//            try { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Riyadh"); }
//            catch
//            {
//                try { return TimeZoneInfo.FindSystemTimeZoneById("Arabian Standard Time"); }
//                catch { return TimeZoneInfo.Local; }
//            }
//        }
//        public async Task<bool> UpdateLeaveRequestAsync(int requestId, UpdateLeaveRequestDto dto)
//        {
//            var leaveRequest = await _context.LeaveRequests.FindAsync(requestId);
//            if (leaveRequest == null) return false;

//            // تعديل القيم إذا متوفرة
//            if (dto.From.HasValue) leaveRequest.From = dto.From.Value;
//            if (dto.To.HasValue) leaveRequest.To = dto.To.Value;
//            if (dto.NumberOfDays.HasValue) leaveRequest.NumberOfDays = dto.NumberOfDays.Value;
//            if (!string.IsNullOrEmpty(dto.Reason)) leaveRequest.Reason = dto.Reason;

//            // تعديل الملف لو موجود
//            if (dto.File != null && dto.File.Length > 0)
//            {
//                var folderPath = Path.Combine("wwwroot", "LeaveFiles");
//                if (!Directory.Exists(folderPath))
//                    Directory.CreateDirectory(folderPath);

//                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.File.FileName)}";
//                var filePath = Path.Combine(folderPath, fileName);

//                using (var stream = new FileStream(filePath, FileMode.Create))
//                    await dto.File.CopyToAsync(stream);

//                leaveRequest.File = $"/LeaveFiles/{fileName}";
//            }

//            _context.LeaveRequests.Update(leaveRequest);
//            await _context.SaveChangesAsync();

//            return true;
//        }
//        public async Task<bool> CarryOverLeaveBalancesAsync()
//        {
//            var users = await _user.Users.ToListAsync();
//            if (!users.Any()) return false;

//            const int defaultAnnualBalance = 21;

//            foreach (var user in users)
//            {
//                // الأيام المتبقية من السنة الحالية (لو سالبة خليها صفر)
//                int carried = Math.Max(0, user.AnnualLeaveBalance);

//                // الرصيد الجديد = 21 + المتبقي
//                user.AnnualLeaveBalance = defaultAnnualBalance + carried;
//            }

//            _user.Users.UpdateRange(users);
//            await _user.SaveChangesAsync();

//            return true;
//        }
//    }
//}
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class LeaveRequestService : ILeaveRequestService
    {
        private readonly ApplicationDbContext _context;
        private readonly AppIdentityDbContext _user;
        private readonly UserManager<AppUser> _userManager;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LeaveRequestService(
            ApplicationDbContext context,
            AppIdentityDbContext user,
            UserManager<AppUser> userManager,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _user = user;
            _userManager = userManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> RequestLeaveAsync(string employeeId, LeaveRequestDto leaveRequestDto)
        {
            var user = await _user.Users.FirstOrDefaultAsync(d => d.Id == employeeId);

            string fullFileUrl = null;
            if (leaveRequestDto.File != null && leaveRequestDto.File.Length > 0)
            {
                var folderPath = Path.Combine("wwwroot", "LeaveFiles");
                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(leaveRequestDto.File.FileName)}";
                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                    await leaveRequestDto.File.CopyToAsync(stream);

                var request = _httpContextAccessor.HttpContext?.Request;
                if (request != null)
                {
                    var baseUrl = $"{request.Scheme}://{request.Host}";
                    var relativePath = Path.Combine("LeaveFiles", fileName).Replace("\\", "/");
                    fullFileUrl = $"{baseUrl}/{relativePath}";
                }
            }

            var leaveRequest = new LeaveRequest
            {
                EmployeeId = employeeId,
                EmployeeName = user?.DisplayName,
                NumberOfDays = leaveRequestDto.NumberOfDays,
                Reason = leaveRequestDto.Reason,
                From = leaveRequestDto.From,
                To = leaveRequestDto.To,
                Status = "Pending",
                File = fullFileUrl,
                RequestDate = DateTime.UtcNow,
                EndReminderSent = false
            };

            await _context.LeaveRequests.AddAsync(leaveRequest);

            var admins = await _userManager.GetUsersInRoleAsync("admin");
            var notifications = admins.Select(admin => new Notification
            {
                Message = $"تم تقديم طلب إجازة جديد من {user?.DisplayName}.",
                UserName = user?.DisplayName,
                UserImage = user?.UserImage,
                CreatedAt = DateTime.UtcNow,
                NotificationType = "طلب اجازة",
                Target = admin.Id,
            }).ToList();

            await _context.Notifications.AddRangeAsync(notifications);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<LeaveRequest>> GetAllRequestsAsync(
          string? employeeName = null,
          int? branchId = null)
        {
            var currentUser = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
            var userRoles = await _userManager.GetRolesAsync(currentUser);

            // ---- 1. جيب كل الـ EmployeeIds المسموح بيها حسب الرول ----
            IQueryable<AppUser> allowedUsersQuery = _user.Users.AsNoTracking();

            if (userRoles.Contains("admin"))
            {
                // Admin يشوف الكل - مش محتاج فلترة على اليوزرز
            }
            else if (userRoles.Contains("officeManager"))
            {
                if (!currentUser.OfficeId.HasValue)
                    return new List<LeaveRequest>();

                allowedUsersQuery = allowedUsersQuery
                    .Where(u => u.OfficeId == currentUser.OfficeId);
            }
            else if (userRoles.Contains("supervisor"))
            {
                if (currentUser.BranchId == 0)
                    return new List<LeaveRequest>();

                allowedUsersQuery = allowedUsersQuery
                    .Where(u => u.BranchId == currentUser.BranchId);
            }
            else
            {
                return new List<LeaveRequest>();
            }

            // ---- 2. فلترة إضافية بالاسم أو الفرع (Query Params) ----
            if (!string.IsNullOrWhiteSpace(employeeName))
                allowedUsersQuery = allowedUsersQuery
                    .Where(u => u.DisplayName.Contains(employeeName));

            if (branchId.HasValue && branchId.Value > 0)
                allowedUsersQuery = allowedUsersQuery
                    .Where(u => u.BranchId == branchId.Value);

            var allowedUserIds = await allowedUsersQuery
                .Select(u => u.Id)
                .ToListAsync();

            // ---- 3. جيب الـ LeaveRequests الخاصة بالـ IDs دي ----
            return await _context.LeaveRequests
                .AsNoTracking()
                .Where(r => allowedUserIds.Contains(r.EmployeeId))
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();
        }
        public async Task<bool> DeleteLeaveRequestAsync(int requestId)
        {
            var leaveRequest = await _context.LeaveRequests.FindAsync(requestId);
            if (leaveRequest == null) return false;

            _context.LeaveRequests.Remove(leaveRequest);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<LeaveRequest> GetLeaveRequestByIdAsync(int requestId)
        {
            return await _context.LeaveRequests.FindAsync(requestId);
        }

        public async Task<bool> UpdateLeaveStatusAsync(int requestId, string status, string? reason)
        {
            var leaveRequest = await _context.LeaveRequests.FindAsync(requestId)
                ?? throw new KeyNotFoundException("Leave request not found.");

            if (!string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(status, "Rejected", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Status must be either 'Approved' or 'Rejected'.");

            var employee = await _userManager.FindByIdAsync(leaveRequest.EmployeeId)
                ?? throw new KeyNotFoundException("Employee not found for this leave request.");

            if (string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase))
            {
                var daysToDeduct = leaveRequest.NumberOfDays > 0
                    ? leaveRequest.NumberOfDays
                    : CalcDaysFromRange(leaveRequest.From, leaveRequest.To);

                if (daysToDeduct <= 0)
                    throw new InvalidOperationException("Leave days must be greater than zero.");

                if (employee.AnnualLeaveBalance < daysToDeduct)
                    throw new InvalidOperationException(
                        $"Insufficient leave balance. Current: {employee.AnnualLeaveBalance}, required: {daysToDeduct}.");

                employee.AnnualLeaveBalance -= daysToDeduct;
                var updateUserRes = await _userManager.UpdateAsync(employee);
                if (!updateUserRes.Succeeded)
                    throw new InvalidOperationException("Failed to update employee leave balance.");
            }

            leaveRequest.Status = status;
            leaveRequest.EndReminderSent = false;
            _context.LeaveRequests.Update(leaveRequest);

            var notification = new Notification
            {
                Message = string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase)
                    ? "تمت الموافقة على طلب الإجازة الخاص بك."
                    : $"تم رفض طلب الإجازة الخاص بك. السبب: {reason}",
                UserName = employee.DisplayName,
                UserImage = employee.UserImage,
                CreatedAt = DateTime.UtcNow,
                NotificationType = "تحديث طلب الاجازة",
                Target = employee.Id,
            };

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAllLeaveRequestsAsync()
        {
            var all = await _context.LeaveRequests.ToListAsync();
            if (!all.Any()) return false;

            _context.LeaveRequests.RemoveRange(all);
            await _context.SaveChangesAsync();
            return true;
        }

        // جديد: عدّادات الموظف (بدون تغيير)
        public async Task<IEnumerable<MyLeaveRequestDto>> GetMyLeaveRequestsWithCountersAsync(string employeeId)
        {
            var leaves = await _context.LeaveRequests
                .AsNoTracking()
                .Where(l => l.EmployeeId == employeeId)
                .OrderByDescending(l => l.RequestDate)
                .ToListAsync();

            var tz = GetSaudiTimeZone(); // زي ما هي عندك
            var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;

            var list = new List<MyLeaveRequestDto>();

            foreach (var l in leaves)
            {
                var dto = new MyLeaveRequestDto
                {
                    Id = l.Id,
                    From = l.From ?? default, // هنرجّع القيمة زي ما هي (حتى لو default)
                    To = l.To ?? default,
                    Status = l.Status,
                    File = l.File,
                    Reason = l.Reason,
                    TotalDays = (l.From.HasValue && l.To.HasValue)
                        ? (int)((l.To.Value.Date - l.From.Value.Date).TotalDays) + 1
                        : 0
                };

                if (l.From.HasValue && l.To.HasValue)
                {
                    var fromDate = l.From.Value.Date;
                    var toDate = l.To.Value.Date;

                    if (todayLocal < fromDate)
                    {
                        dto.IsUpcoming = true;
                        dto.DaysUntilStart = (int)(fromDate - todayLocal).TotalDays;
                    }
                    else if (todayLocal >= fromDate && todayLocal <= toDate)
                    {
                        dto.IsActive = true;
                        dto.DaysUntilEnd = (int)(toDate - todayLocal).TotalDays; // 0 = آخر يوم
                    }
                    else
                    {
                        dto.IsFinished = true;
                    }
                }
                else
                {
                    // لو التواريخ ناقصة: ما نحسبش عدادات زمنية
                    dto.IsUpcoming = false;
                    dto.IsActive = false;
                    dto.IsFinished = false;
                    dto.DaysUntilStart = null;
                    dto.DaysUntilEnd = null;
                }

                list.Add(dto);
            }

            return list;
        }

        private static int CalcDaysFromRange(DateTime? from, DateTime? to)
        {
            if (from.HasValue && to.HasValue)
            {
                var days = (int)((to.Value.Date - from.Value.Date).TotalDays) + 1;
                return days < 0 ? 0 : days;
            }
            return 0;
        }

        private static TimeZoneInfo GetSaudiTimeZone()
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Riyadh"); }
            catch
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById("Arabian Standard Time"); }
                catch { return TimeZoneInfo.Local; }
            }
        }
        public async Task<bool> UpdateLeaveRequestAsync(int requestId, UpdateLeaveRequestDto dto)
        {
            var leaveRequest = await _context.LeaveRequests.FindAsync(requestId);
            if (leaveRequest == null) return false;

            // تعديل القيم إذا متوفرة
            if (dto.From.HasValue) leaveRequest.From = dto.From.Value;
            if (dto.To.HasValue) leaveRequest.To = dto.To.Value;
            if (dto.NumberOfDays.HasValue) leaveRequest.NumberOfDays = dto.NumberOfDays.Value;
            if (!string.IsNullOrEmpty(dto.Reason)) leaveRequest.Reason = dto.Reason;

            // تعديل الملف لو موجود
            if (dto.File != null && dto.File.Length > 0)
            {
                var folderPath = Path.Combine("wwwroot", "LeaveFiles");
                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.File.FileName)}";
                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                    await dto.File.CopyToAsync(stream);

                leaveRequest.File = $"/LeaveFiles/{fileName}";
            }

            _context.LeaveRequests.Update(leaveRequest);
            await _context.SaveChangesAsync();

            return true;
        }
        public async Task<bool> CarryOverLeaveBalancesAsync()
        {
            var users = await _user.Users.ToListAsync();
            if (!users.Any()) return false;

            const int defaultAnnualBalance = 21;

            foreach (var user in users)
            {
                // الأيام المتبقية من السنة الحالية (لو سالبة خليها صفر)
                int carried = Math.Max(0, user.AnnualLeaveBalance);

                // الرصيد الجديد = 21 + المتبقي
                user.AnnualLeaveBalance = defaultAnnualBalance + carried;
            }

            _user.Users.UpdateRange(users);
            await _user.SaveChangesAsync();

            return true;
        }
    }
}