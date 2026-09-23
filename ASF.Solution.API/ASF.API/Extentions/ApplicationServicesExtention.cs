using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using ASF.Api.Helpers;
using ASF.Core.Entities.Identity;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Services;
using ASF.Respository;
using ASF.Service;
using ASF.Service.Background;
using ASF.Service.BackgroundServices;
using System.Text;

namespace ASF.Api.Extentions
{
    public static class ApplicationServicesExtention
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection Services)
        {


            Services.AddSignalR();
            Services.AddHttpContextAccessor();
            Services.AddHttpClient();

            Services.AddScoped(typeof(IContactService), typeof(ContactService));

            Services.AddScoped(typeof(INewProjectService), typeof(NewProjectService));
            Services.AddScoped(typeof(INewProjectDeletedRepository), typeof(NewProjectDeletedRepository));

            Services.AddScoped(typeof(IPrivateProject), typeof(PrivateProjectService));
            Services.AddScoped(typeof(IPrivateProjectDeletedRepository), typeof(PrivateProjectDeletedRepository));

            Services.AddScoped(typeof(IConstructionService), typeof(ConstructionService));
            Services.AddScoped(typeof(IConstructionDeletedRepository), typeof(ConstructionDeletedRepository)); 
            
            Services.AddScoped(typeof(IEmergencyService), typeof(EmergencyService));
            Services.AddScoped(typeof(IEmergencyDeletedRepository), typeof(EmergencyDeletedRepository));

            Services.AddScoped(typeof(IMaintenanceService), typeof(MaintenanceService));
            Services.AddScoped(typeof(IMaintenanceDeletedRepository), typeof(MaintenanceDeletedRepository));

            Services.AddScoped(typeof(IConsultantService), typeof(ConsultantService));
           Services.AddScoped<INotificationRepository, NotificationRepository>();
            Services.AddScoped<INeighborhoodService, NeighborhoodService>();
            Services.AddScoped<IBranchService, BranchService>();
            Services.AddScoped<IContractorService, ContractorService>();
            Services.AddScoped<IOfficeService, OfficeService>();
            Services.AddScoped<IWorkOrderTypeServices, WorkOrderTypeServices>();
            Services.AddScoped<IJobDescriptionService, JobDescriptionServices>();
            Services.AddScoped<IAdminService, AdminService>();
            Services.AddScoped<IEmployeeService, EmployeeService>();
            Services.AddScoped<ILeaveRequestService, LeaveRequestService>();
            Services.AddScoped<IAttendanceService, AttendanceService>();
            Services.AddScoped<ICustodyService, CustodyService>();
            Services.AddScoped<EngineerService>();
            Services.AddHostedService<ResidenceExpiryCheckService>();
            Services.AddHostedService<LeaveEndReminderHostedService>();
            Services.AddScoped<IPermissionService, PermissionService>();
            Services.AddMemoryCache();
            Services.AddTransient<IEmailSender, EmailSender>();
            Services.AddHostedService<LeaveCarryOverService>();
            Services.AddScoped<IPricingItemService, PricingItemService>();
            Services.AddScoped<IDashboardService, DashboardService>();
            Services.AddScoped<IProjectOwnerService, ProjectOwnerService>();
            Services.AddScoped<IProjectPartyService, ProjectPartyService>();
            Services.AddScoped<IDashboardPowerBiService, DashboardPowerBiService>();
            Services.AddScoped<IContractWorkflowService, ContractWorkflowService>();
            Services.AddScoped<IWorkOrderFlowService, WorkOrderFlowService>();
            Services.AddScoped<IMonitoringService, MonitoringService>();
            Services.AddScoped<IContractSetupService, ContractSetupService>();
            Services.AddScoped<IWorkOrderImportService, WorkOrderImportService>();
            Services.AddScoped<IEmployeeHubService, EmployeeHubService>();

            Services.AddHostedService<ConstructionUpdateService>();


            #region Config AutoMapper 
            Services.AddAutoMapper(cfg => cfg.AddProfile(typeof(ProfilesMapping)));
            #endregion

            #region cfg igeneric
            Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            #endregion



           

            return Services;

        }
    }



}
