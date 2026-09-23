using ASF.Core.Dtos;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
   
    public interface IEmergencyService
    {
        public Task<Emergency> CreateEmergencyAsync(EmergencyDto emergencyDto, bool? isArchive);

        public Task<IReadOnlyCollection<Emergency>> GetAllEmergencysAsync();
        public Task<Emergency> CreateOrUpdateEmergencyAsync(EmergencyDto emergencyDto, bool isArchive);

        public Task<IReadOnlyCollection<Emergency>> GetEmergencyWithPaginationAsync(bool? isArchive, int? sortByOrderNumber, int pageSize, int pageIndex);
        public Task<IReadOnlyCollection<Emergency>> GetOperationChangesAsync(int orderId);

        public Task<Emergency> UpdateEmergencyAsync(int projectId, UpdateEmergencyDto emergencyDto, bool isArchive);

        public Task<IReadOnlyCollection<Emergency>> FilterEmergencyByNameBranchAndIsArchive(string? branchName, bool? isArchive);


        Task<Emergency> GetEmergencyByIdAsync(int Id);

        Task<List<OperationChangeForEmergency>> GetProjectChangesAsync(int projectId);


        Task UpdateProjectsByOfficeWithContextAsync(string oldOfficeName, string newOfficeName);
        Task<IReadOnlyCollection<Emergency>> GetEmergencyWithBranchNameAsync(string projectName);

        Task UpdateExecutedQuantityAsync(int projectId, UpdateExecutedQuantityDto dto);
        Task UpdateExecutedQuantitiesAsync(int projectId, UpdateExecutedQuantitiesDto dto);
        Task<List<EmergencyPricingItemUpdateLog>> GetExecutedQuantityLogsAsync(int projectId, int? pricingItemId = null);
        Task<bool> DeleteEmergencyAsync(int projectId);
    }
}
