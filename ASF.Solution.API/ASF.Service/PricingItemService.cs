using ASF.Core.Entities.Pricing;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using Microsoft.EntityFrameworkCore;

namespace ASF.Repository.Services
{
    public class PricingItemService : IPricingItemService
    {
        private readonly ApplicationDbContext _context;

        public PricingItemService(ApplicationDbContext context)
        {
            _context = context;
        }

        // ─── PricingItem CRUD ─────────────────────────────────────

        public async Task<IEnumerable<PricingItem>> GetAllAsync(PricingItemFilterParams filter)
        {
            var query = BuildQuery(filter);

            var skip = (filter.PageIndex - 1) * filter.PageSize;
            return await query
                .OrderBy(x => x.ItemNumber)
                .Skip(skip)
                .Take(filter.PageSize)
                .ToListAsync();
        }

        public async Task<int> CountAsync(PricingItemFilterParams filter)
            => await BuildQuery(filter).CountAsync();

        public async Task<PricingItem?> GetByIdAsync(int id)
            => await _context.PricingItems.FindAsync(id);

        public async Task<PricingItem> AddAsync(PricingItem item)
        {
            await _context.PricingItems.AddAsync(item);
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task UpdateAsync(PricingItem item)
        {
            _context.PricingItems.Update(item);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var item = await _context.PricingItems.FindAsync(id);
            if (item is null) return;
            _context.PricingItems.Remove(item);
            await _context.SaveChangesAsync();
        }

        // ─── ProjectPricingItem ───────────────────────────────────

        public async Task<IEnumerable<ProjectPricingItem>> GetProjectItemsAsync(string projectType, int projectId)
            => await _context.ProjectPricingItems
                .Include(x => x.PricingItem)
                .Where(x => x.ProjectType == projectType && x.ProjectId == projectId)
                .ToListAsync();

        public async Task<ProjectPricingItem> AddProjectItemAsync(ProjectPricingItem item)
        {
            var pricingItem = await _context.PricingItems.FindAsync(item.PricingItemId);
            if (pricingItem is not null)
                item.UnitPriceSnapshot = pricingItem.UnitPrice;

            await _context.ProjectPricingItems.AddAsync(item);
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task<IEnumerable<ProjectPricingItem>> AddProjectItemsRangeAsync(IEnumerable<ProjectPricingItem> items)
        {
            var list = items.ToList();
            var ids = list.Select(x => x.PricingItemId).Distinct().ToList();

            var prices = await _context.PricingItems
                .Where(x => ids.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.UnitPrice);

            foreach (var item in list)
                if (prices.TryGetValue(item.PricingItemId, out var price))
                    item.UnitPriceSnapshot = price;

            await _context.ProjectPricingItems.AddRangeAsync(list);
            await _context.SaveChangesAsync();
            return list;
        }

        public async Task RemoveProjectItemAsync(int id)
        {
            var item = await _context.ProjectPricingItems.FindAsync(id);
            if (item is null) return;
            _context.ProjectPricingItems.Remove(item);
            await _context.SaveChangesAsync();
        }

        // ─── Private Helpers ──────────────────────────────────────

        private IQueryable<PricingItem> BuildQuery(PricingItemFilterParams filter)
        {
            var query = _context.PricingItems.AsQueryable();

            if (filter.BranchId.HasValue)
                query = query.Where(x => x.BranchId == filter.BranchId.Value);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var s = filter.Search.Trim();
                query = query.Where(x => x.ShortDescription.Contains(s) || x.ItemNumber.Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(filter.ItemNumber))
                query = query.Where(x => x.ItemNumber == filter.ItemNumber.Trim());

            if (!string.IsNullOrWhiteSpace(filter.UOM))
                query = query.Where(x => x.UOM == filter.UOM.Trim());

            if (filter.MinUnitPrice.HasValue)
                query = query.Where(x => x.UnitPrice >= filter.MinUnitPrice.Value);

            if (filter.MaxUnitPrice.HasValue)
                query = query.Where(x => x.UnitPrice <= filter.MaxUnitPrice.Value);

            if (filter.IsActive.HasValue)
                query = query.Where(x => x.IsActive == filter.IsActive.Value);

            return query;
        }
    }
}