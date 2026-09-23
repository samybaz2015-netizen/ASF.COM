using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ASF.Core.Entities.Construction;
using ASF.Core.Services;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class ConstructionUpdateService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public ConstructionUpdateService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var constructionService = scope.ServiceProvider.GetRequiredService<IConstructionService>();

                        var constructions = await constructionService.GetAllConstructionAsync();
                        foreach (var construction in constructions)
                        {
                            UpdateDays(construction);
                        }

                        await constructionService.SaveChangesAsync();
                    }
                }
                catch
                {
                    // Prevent background task exception from crashing application startup
                }

                // تشغيل الخدمة مرة كل يوم
                await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
            }
        }
        private void UpdateDays(Construction construction)
        {
            if (DateTime.TryParse(construction.CompletionDate, out DateTime completionDate) &&
                int.TryParse(construction.DurationOfImplementation, out int duration))
            {
                DateTime endDate = completionDate.AddDays(duration); // تاريخ الانتهاء الفعلي للمشروع
                DateTime today = DateTime.Today;

                if (today > endDate)
                {
                    // إذا تجاوزنا تاريخ الانتهاء نحسب التأخير
                    construction.NumberOfDaysDelayed = (today - endDate).Days.ToString();
                    construction.NumberOfDaysRemaining = "0"; // لا يوجد أيام متبقية بعد انتهاء المشروع
                }
                else if (today < completionDate)
                {
                    // إذا لم يبدأ المشروع بعد، تبقى الأيام كما هي
                    construction.NumberOfDaysDelayed = "0";
                    construction.NumberOfDaysRemaining = duration.ToString(); // المدة الأصلية بالكامل
                }
                else
                {
                    // إذا بدأ المشروع ولكنه لم ينتهِ بعد، نحسب الأيام المتبقية
                    construction.NumberOfDaysDelayed = "0";
                    construction.NumberOfDaysRemaining = (endDate - today).Days.ToString();
                }
            }
            else
            {
                construction.NumberOfDaysDelayed = "غير متوفر";
                construction.NumberOfDaysRemaining = "غير متوفر";
            }
        }

    }
}
