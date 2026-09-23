using ASF.Core.Entities.Pricing;

namespace ASF.Core.Services
{
    public interface IPricingItemService
    {
        // ─── PricingItem CRUD ─────────────────────────────────────
        Task<IEnumerable<PricingItem>> GetAllAsync(PricingItemFilterParams filter);
        Task<PricingItem?> GetByIdAsync(int id);
        Task<PricingItem> AddAsync(PricingItem item);
        Task UpdateAsync(PricingItem item);
        Task DeleteAsync(int id);
        Task<int> CountAsync(PricingItemFilterParams filter);

        // ─── ProjectPricingItem ───────────────────────────────────
        Task<IEnumerable<ProjectPricingItem>> GetProjectItemsAsync(string projectType, int projectId);
        Task<ProjectPricingItem> AddProjectItemAsync(ProjectPricingItem item);
        Task RemoveProjectItemAsync(int id);
        Task<IEnumerable<ProjectPricingItem>> AddProjectItemsRangeAsync(IEnumerable<ProjectPricingItem> items);
    }

    public class PricingItemFilterParams
    {
        public int? BranchId { get; set; }
        public string? Search { get; set; }       // يبحث في ShortDescription + ItemNumber
        public string? ItemNumber { get; set; }
        public string? UOM { get; set; }
        public decimal? MinUnitPrice { get; set; }
        public decimal? MaxUnitPrice { get; set; }
        public bool? IsActive { get; set; } = true;

        // Pagination
        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}