using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Repository.AppDbContext;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace ASF.Service.Background
{
    public class LeaveEndReminderHostedService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<LeaveEndReminderHostedService> _logger;

        // السعودية
        private const string LinuxTz = "Asia/Riyadh";
        private const string WindowsTz = "Arabian Standard Time";

        public LeaveEndReminderHostedService(IServiceProvider services, ILogger<LeaveEndReminderHostedService> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var delay = GetDelayUntilNextRun();
                    await Task.Delay(delay, stoppingToken);

                    using var scope = _services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

                    var tz = GetSaudiTimeZone();

                    // تاريخ اليوم (بتوقيت السعودية) بدون وقت
                    var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;

                    // نطاق "بكرة": [start, end)
                    var start = todayLocal.AddDays(1);
                    var end = start.AddDays(1);

                    // إجازات Approved وتنتهي خلال يوم "بكرة"
                    var toRemind = await db.LeaveRequests
                        .Where(l => l.Status == "Approved"
                                    && !l.EndReminderSent
                                    && l.To.HasValue
                                    && l.To.Value >= start
                                    && l.To.Value < end)
                        .ToListAsync(stoppingToken);

                    foreach (var leave in toRemind)
                    {
                        var employee = await userManager.FindByIdAsync(leave.EmployeeId);
                        if (employee == null) continue;

                        var notification = new Notification
                        {
                            Message = $"تنبيه: إجازتك تنتهي غدًا ({leave.To:yyyy/MM/dd}). نتمنى لك عودة موفقة 🌟",
                            UserName = employee.DisplayName,
                            UserImage = employee.UserImage,
                            CreatedAt = DateTime.UtcNow,
                            NotificationType = "تذكير نهاية الإجازة",
                            Target = employee.Id
                        };

                        await db.Notifications.AddAsync(notification, stoppingToken);
                        leave.EndReminderSent = true;
                        db.LeaveRequests.Update(leave);
                    }

                    if (toRemind.Any()) // بدّلنا Count>0 إلى Any()
                        await db.SaveChangesAsync(stoppingToken);
                }
                catch (TaskCanceledException) { /* عند الإيقاف */ }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in LeaveEndReminderHostedService");
                }
            }
        }

        private TimeSpan GetDelayUntilNextRun()
        {
            var tz = GetSaudiTimeZone();
            var nowUtc = DateTime.UtcNow;
            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, tz);

            // الساعة 09:00 صباحًا يوميًا (بتوقيت السعودية)
            var nextRunLocal = new DateTime(nowLocal.Year, nowLocal.Month, nowLocal.Day, 9, 0, 0, DateTimeKind.Unspecified);
            if (nowLocal >= nextRunLocal) nextRunLocal = nextRunLocal.AddDays(1);

            var nextRunUtc = TimeZoneInfo.ConvertTimeToUtc(nextRunLocal, tz);
            var delay = nextRunUtc - nowUtc;
            return delay < TimeSpan.Zero ? TimeSpan.Zero : delay;
        }

        private TimeZoneInfo GetSaudiTimeZone()
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(LinuxTz); }
            catch
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById(WindowsTz); }
                catch { return TimeZoneInfo.Local; }
            }
        }
    }
}
