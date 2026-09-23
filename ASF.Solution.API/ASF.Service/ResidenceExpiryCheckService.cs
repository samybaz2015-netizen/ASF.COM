using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class ResidenceExpiryCheckService : BackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;

        public ResidenceExpiryCheckService(IServiceScopeFactory serviceScopeFactory)
        {
            _serviceScopeFactory = serviceScopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceScopeFactory.CreateScope())
                    {
                        var engineerService = scope.ServiceProvider.GetRequiredService<EngineerService>();
                        await engineerService.CheckResidenceExpiry();
                    }
                }
                catch
                {
                    // Prevent background task exception from crashing application startup
                }

                await Task.Delay(TimeSpan.FromDays(1), stoppingToken); // يعمل يوميًا
            }
        }
    }
}
