
//// ASF.Service/BackgroundServices/LeaveCarryOverService.cs

//using Microsoft.Extensions.DependencyInjection;
//using Microsoft.Extensions.Hosting;
//using Microsoft.Extensions.Logging;
//using ASF.Core.Services;

//namespace ASF.Service.BackgroundServices
//{
//    public class LeaveCarryOverService : BackgroundService
//    {
//        private readonly IServiceScopeFactory _scopeFactory;
//        private readonly ILogger<LeaveCarryOverService> _logger;

//        public LeaveCarryOverService(
//            IServiceScopeFactory scopeFactory,
//            ILogger<LeaveCarryOverService> logger)
//        {
//            _scopeFactory = scopeFactory;
//            _logger = logger;
//        }

//        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//        {
//            _logger.LogInformation("LeaveCarryOverService started.");

//            while (!stoppingToken.IsCancellationRequested)
//            {
//                var delay = GetDelayUntilNextJanuary();
//                _logger.LogInformation("Next carry-over scheduled in: {delay}", delay);

//                // ✅ نقسم الـ delay لأجزاء 24 ساعة عشان Task.Delay حده الأقصى ~49 يوم
//                var maxChunk = TimeSpan.FromHours(24);
//                while (delay > TimeSpan.Zero && !stoppingToken.IsCancellationRequested)
//                {
//                    var chunk = delay > maxChunk ? maxChunk : delay;
//                    await Task.Delay(chunk, stoppingToken);
//                    delay -= chunk;
//                }

//                if (stoppingToken.IsCancellationRequested) break;

//                await RunCarryOverAsync();
//            }
//        }
//        private async Task RunCarryOverAsync()
//        {
//            try
//            {
//                using var scope = _scopeFactory.CreateScope();
//                var leaveService = scope.ServiceProvider
//                    .GetRequiredService<ILeaveRequestService>();

//                var result = await leaveService.CarryOverLeaveBalancesAsync();

//                _logger.LogInformation(
//                    result
//                        ? "✅ تم ترحيل رصيد الإجازات بنجاح في {date}"
//                        : "⚠️ لم يتم العثور على موظفين للترحيل في {date}",
//                    DateTime.UtcNow);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "❌ خطأ أثناء ترحيل رصيد الإجازات");
//            }
//        }

//        /// <summary>
//        /// يحسب الوقت المتبقي حتى 1 يناير الساعة 00:00 بتوقيت السعودية
//        /// </summary>
//        private static TimeSpan GetDelayUntilNextJanuary()
//        {
//            TimeZoneInfo tz;
//            try { tz = TimeZoneInfo.FindSystemTimeZoneById("Arab Standard Time"); }
//            catch { tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Riyadh"); }

//            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);

//            // أول يناير السنة الجاية الساعة 00:01
//            var nextRun = new DateTime(nowLocal.Year + 1, 1, 1, 0, 1, 0);

//            // لو احنا في أول يناير قبل الوقت ده، شغّله النهارده
//            if (nowLocal.Month == 1 && nowLocal.Day == 1 && nowLocal < nextRun)
//                nextRun = new DateTime(nowLocal.Year, 1, 1, 0, 1, 0);

//            var localNextRun = TimeZoneInfo.ConvertTimeToUtc(nextRun, tz);
//            var delay = localNextRun - DateTime.UtcNow;

//            // لو الـ delay سالب أو صفر (فاتنا الوقت النهارده) شغّله بعد دقيقة
//            return delay > TimeSpan.Zero ? delay : TimeSpan.FromMinutes(1);
//        }
//    }
//}
// ASF.Service/BackgroundServices/LeaveCarryOverService.cs

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ASF.Core.Services;

namespace ASF.Service.BackgroundServices
{
    public class LeaveCarryOverService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<LeaveCarryOverService> _logger;

        public LeaveCarryOverService(
            IServiceScopeFactory scopeFactory,
            ILogger<LeaveCarryOverService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("LeaveCarryOverService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var delay = GetDelayUntilNextJanuary();
                _logger.LogInformation("Next carry-over scheduled in: {delay}", delay);

                // ✅ نقسم الـ delay لأجزاء 24 ساعة عشان Task.Delay حده الأقصى ~49 يوم
                var maxChunk = TimeSpan.FromHours(24);
                while (delay > TimeSpan.Zero && !stoppingToken.IsCancellationRequested)
                {
                    var chunk = delay > maxChunk ? maxChunk : delay;
                    await Task.Delay(chunk, stoppingToken);
                    delay -= chunk;
                }

                if (stoppingToken.IsCancellationRequested) break;

                await RunCarryOverAsync();
            }
        }
        private async Task RunCarryOverAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var leaveService = scope.ServiceProvider
                    .GetRequiredService<ILeaveRequestService>();

                var result = await leaveService.CarryOverLeaveBalancesAsync();

                _logger.LogInformation(
                    result
                        ? "✅ تم ترحيل رصيد الإجازات بنجاح في {date}"
                        : "⚠️ لم يتم العثور على موظفين للترحيل في {date}",
                    DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ خطأ أثناء ترحيل رصيد الإجازات");
            }
        }

        /// <summary>
        /// يحسب الوقت المتبقي حتى 1 يناير الساعة 00:00 بتوقيت السعودية
        /// </summary>
        private static TimeSpan GetDelayUntilNextJanuary()
        {
            TimeZoneInfo tz;
            try { tz = TimeZoneInfo.FindSystemTimeZoneById("Arab Standard Time"); }
            catch { tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Riyadh"); }

            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);

            // أول يناير السنة الجاية الساعة 00:01
            var nextRun = new DateTime(nowLocal.Year + 1, 1, 1, 0, 1, 0);

            // لو احنا في أول يناير قبل الوقت ده، شغّله النهارده
            if (nowLocal.Month == 1 && nowLocal.Day == 1 && nowLocal < nextRun)
                nextRun = new DateTime(nowLocal.Year, 1, 1, 0, 1, 0);

            var localNextRun = TimeZoneInfo.ConvertTimeToUtc(nextRun, tz);
            var delay = localNextRun - DateTime.UtcNow;

            // لو الـ delay سالب أو صفر (فاتنا الوقت النهارده) شغّله بعد دقيقة
            return delay > TimeSpan.Zero ? delay : TimeSpan.FromMinutes(1);
        }
    }
}