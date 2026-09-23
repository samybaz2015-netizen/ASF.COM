using ASF.Core.Dtos;
using ASF.Core.Entities.NewProject;
using ASF.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ASF.Core.Entities.Construction;
using ASF.Core.Dtos.ConstructionResponse;

namespace ASF.Core.Services
{
    public interface IConstructionService
    {
        public Task<Construction> CreateConstructionAsync(ConstructionDto constructionDto, bool? isArchive);

        public Task<IReadOnlyCollection<Construction>> GetAllConstructionAsync();
        public Task<Construction> CreateOrUpdateConstructionAsync(ConstructionDto constructionDto, bool isArchive);

        public Task<IReadOnlyCollection<Construction>> GetConstructionWithPaginationAsync(bool? isArchive, int? sortByOrderNumber, int pageSize, int pageIndex);
        public Task<IReadOnlyCollection<Construction>> GetOperationChangesAsync(int orderId);

        public Task<Construction> UpdateConstructionAsync(int constructionId, UpdateConstructionDto constructionDto, bool isArchive);

        public Task<IReadOnlyCollection<Construction>> FilterConstructionByNameBranchAndIsArchive(string? branchName, bool? isArchive);
        Task<ConstructionResponse> GetConstructionByIdAsync(int Id);



        Task<List<OperationChangeForConstruction>> GetProjectChangesAsync(int projectId);


        Task UpdateProjectsByOfficeWithContextAsync(string oldOfficeName, string newOfficeName);
        Task<IReadOnlyCollection<Construction>> GetConstructionWithBranchNameAsync(string projectName);
        Task UpdateExecutedQuantityAsync(int constructionId, UpdateExecutedQuantityDto dto);

        /// <summary>تحديث الكميات المنفذة لعدة بنود دفعة واحدة مع تسجيل سجل تاريخي</summary>
        Task UpdateExecutedQuantitiesAsync(int constructionId, UpdateExecutedQuantitiesDto dto);

        /// <summary>جلب سجل تحديثات الكميات المنفذة لمشروع معين</summary>
        Task<List<ConstructionPricingItemUpdateLog>> GetExecutedQuantityLogsAsync(int constructionId, int? pricingItemId = null);
        //Task<Construction> UpdateAsync(int id, UpdateConstructionDto dto, string userId, bool isAdmin);
        Task SaveChangesAsync();
        Task<bool> DeleteConstructionAsync(int projectId);


    }
}
