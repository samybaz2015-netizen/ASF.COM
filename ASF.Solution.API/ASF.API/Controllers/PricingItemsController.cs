
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ASF.Api.Attributes;
using ASF.Core.DTOs.Pricing;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Core.Entities.Pricing;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;

namespace ASF.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PricingItemsController : ControllerBase
    {
        private readonly IPricingItemService _repo;
        private readonly UserManager<AppUser> _userManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApplicationDbContext _context;

        public PricingItemsController(IPricingItemService repo, UserManager<AppUser> userManager,
            IHttpContextAccessor httpContextAccessor,ApplicationDbContext context)
        {
            _repo = repo;
            _userManager = userManager;
            _httpContextAccessor = httpContextAccessor;
            _context = context;
        }

        // ─────────────────────────────────────────────────────────
        // GET /api/pricingitems
        // Query params: branchId, search, itemNumber, uom, minPrice, maxPrice, isActive, pageIndex, pageSize
        // ─────────────────────────────────────────────────────────
        [HttpGet]
        public async Task<ActionResult<PricingItemPagedResult>> GetAll(
            [FromQuery] int? branchId,
            [FromQuery] string? search,
            [FromQuery] string? itemNumber,
            [FromQuery] string? uom,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] bool? isActive,
            [FromQuery] int pageIndex = 1,
            [FromQuery] int pageSize = 20)
        {
            var user = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
            if (user == null) return Unauthorized();

            var filter = new PricingItemFilterParams
            {
                BranchId = (user.BranchId != 0) ? user.BranchId : branchId,
                Search = search,
                ItemNumber = itemNumber,
                UOM = uom,
                MinUnitPrice = minPrice,
                MaxUnitPrice = maxPrice,
                IsActive = isActive ?? true,
                PageIndex = pageIndex < 1 ? 1 : pageIndex,
                PageSize = pageSize > 100 ? 100 : pageSize
            };
            var items = await _repo.GetAllAsync(filter);
            var count = await _repo.CountAsync(filter);

            var result = new PricingItemPagedResult
            {
                Items = items.Select(MapToDto),
                TotalCount = count,
                PageIndex = filter.PageIndex,
                PageSize = filter.PageSize
            };

            return Ok(result);
        }

        // ─────────────────────────────────────────────────────────
        // GET /api/pricingitems/{id}
        // ─────────────────────────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<ActionResult<PricingItemDto>> GetById(int id)
        {
            var item = await _repo.GetByIdAsync(id);
            if (item is null) return NotFound(new { message = "البند غير موجود" });
            return Ok(MapToDto(item));
        }

        // ─────────────────────────────────────────────────────────
        // POST /api/pricingitems
        // ─────────────────────────────────────────────────────────
        [HttpPost]
        public async Task<ActionResult<PricingItemDto>> Create([FromBody] CreatePricingItemDto dto)
        {
            var item = new PricingItem
            {
                ItemNumber = dto.ItemNumber,
                ShortDescription = dto.ShortDescription,
                LongDescription = dto.LongDescription,
                UOM = dto.UOM,
                UnitPrice = dto.UnitPrice,
                Currency = dto.Currency,
                BranchId = dto.BranchId,
                IsActive = true
            };

            var created = await _repo.AddAsync(item);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDto(created));
        }

        // ─────────────────────────────────────────────────────────
        // PUT /api/pricingitems/{id}
        // ─────────────────────────────────────────────────────────
        [HttpPut("{id}")]
        [HasPermission(Permissions.PricingItems.Update)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePricingItemDto dto)
        {
            var item = await _repo.GetByIdAsync(id);
            if (item is null) return NotFound(new { message = "البند غير موجود" });

            if (dto.ShortDescription is not null) item.ShortDescription = dto.ShortDescription;
            if (dto.LongDescription is not null) item.LongDescription = dto.LongDescription;
            if (dto.UOM is not null) item.UOM = dto.UOM;
            if (dto.UnitPrice.HasValue) item.UnitPrice = dto.UnitPrice.Value;
            if (dto.IsActive.HasValue) item.IsActive = dto.IsActive.Value;

            await _repo.UpdateAsync(item);
            return Ok(MapToDto(item));
        }

        // ─────────────────────────────────────────────────────────
        // DELETE /api/pricingitems/{id}
        // ─────────────────────────────────────────────────────────
        [HttpDelete("{id}")]
        [HasPermission(Permissions.PricingItems.Delete)]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _repo.GetByIdAsync(id);
            if (item is null) return NotFound(new { message = "البند غير موجود" });
            await _repo.DeleteAsync(id);
            return Ok(new { message = "تم الحذف بنجاح" });
        }

        // ─────────────────────────────────────────────────────────
        // GET /api/pricingitems/project?projectType=Construction&projectId=5
        // ─────────────────────────────────────────────────────────
        [HttpGet("project")]
        public async Task<ActionResult<IEnumerable<ProjectPricingItemDto>>> GetProjectItems(
            [FromQuery] string projectType,
            [FromQuery] int projectId)
        {
            var items = await _repo.GetProjectItemsAsync(projectType, projectId);
            return Ok(items.Select(MapProjectItemToDto));
        }

        // ─────────────────────────────────────────────────────────
        // POST /api/pricingitems/project
        // Add multiple pricing items to a project at once
        // ─────────────────────────────────────────────────────────
        [HttpPost("project")]
        public async Task<ActionResult<IEnumerable<ProjectPricingItemDto>>> AddProjectItems(
            [FromBody] AddProjectPricingItemsDto dto)
        {
            var projectItems = dto.Items.Select(x => new ProjectPricingItem
            {
                PricingItemId = x.PricingItemId,
                ProjectType = dto.ProjectType,
                ProjectId = dto.ProjectId,
                Quantity = x.Quantity,
                Note = x.Note,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            var created = await _repo.AddProjectItemsRangeAsync(projectItems);
            return Ok(created.Select(MapProjectItemToDto));
        }

        // ─────────────────────────────────────────────────────────
        // DELETE /api/pricingitems/project/{id}
        // ─────────────────────────────────────────────────────────
        [HttpDelete("project/{id}")]
        public async Task<IActionResult> RemoveProjectItem(int id)
        {
            await _repo.RemoveProjectItemAsync(id);
            return Ok(new { message = "تم الحذف بنجاح" });
        }

        // ─── Mappers ─────────────────────────────────────────────

        private static PricingItemDto MapToDto(PricingItem item) => new()
        {
            Id = item.Id,
            ItemNumber = item.ItemNumber,
            ShortDescription = item.ShortDescription,
            LongDescription = item.LongDescription,
            UOM = item.UOM,
            UnitPrice = item.UnitPrice,
            Currency = item.Currency,
            BranchId = item.BranchId,
            IsActive = item.IsActive
        };

        private static ProjectPricingItemDto MapProjectItemToDto(ProjectPricingItem p) => new()
        {
            Id = p.Id,
            PricingItemId = p.PricingItemId,
            ItemNumber = p.PricingItem?.ItemNumber ?? "",
            ShortDescription = p.PricingItem?.ShortDescription ?? "",
            UOM = p.PricingItem?.UOM,
            Quantity = p.Quantity,
            UnitPriceSnapshot = p.UnitPriceSnapshot,
            TotalPrice = p.Quantity * p.UnitPriceSnapshot,
            Note = p.Note
        };
    }
}