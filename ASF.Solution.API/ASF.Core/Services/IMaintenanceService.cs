using ASF.Core.Dtos;
using ASF.Core.Entities.Maintenance;
using ASF.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IMaintenanceService
    {
        public Task<Maintenance> CreateMaintenanceAsync(MaintenanceDto maintenanceDto, bool? isArchive);

        public Task<IReadOnlyCollection<Maintenance>> GetAllMaintenancesAsync();
        public Task<Maintenance> CreateOrUpdateMaintenanceAsync(MaintenanceDto maintenanceDto, bool isArchive);

        public Task<IReadOnlyCollection<Maintenance>> GetMaintenanceWithPaginationAsync(bool? isArchive, int? sortByOrderNumber, int pageSize, int pageIndex);
        public Task<IReadOnlyCollection<Maintenance>> GetOperationChangesAsync(int orderId);

        Task<Maintenance> UpdateMaintenanceAsync(int projectId, UpdateMaintenanceDto maintenanceDto, bool isArchive);
        public Task<IReadOnlyCollection<Maintenance>> FilterMaintenanceByNameBranchAndIsArchive(string? branchName, bool? isArchive);

        Task<Maintenance> GetMaintenanceByIdAsync(int Id);

        Task<List<OperationChangeForMaintenance>> GetProjectChangesAsync(int projectId);


        Task UpdateProjectsByOfficeWithContextAsync(string oldOfficeName, string newOfficeName);
        Task<IReadOnlyCollection<Maintenance>> GetMaintenanceWithBranchNameAsync(string projectName);

        Task UpdateExecutedQuantityAsync(int projectId, UpdateExecutedQuantityDto dto);
        Task UpdateExecutedQuantitiesAsync(int projectId, UpdateExecutedQuantitiesDto dto);
        Task<List<MaintenancePricingItemUpdateLog>> GetExecutedQuantityLogsAsync(int projectId, int? pricingItemId = null);
        Task<bool> DeleteMaintenanceAsync(int projectId);
    }
}
