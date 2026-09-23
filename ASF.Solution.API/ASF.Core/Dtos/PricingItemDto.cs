namespace ASF.Core.DTOs.Pricing
{
    // ─── Response DTOs ────────────────────────────────────────────

    public class PricingItemDto
    {
        public int Id { get; set; }
        public string ItemNumber { get; set; }
        public string ShortDescription { get; set; }
        public string? LongDescription { get; set; }
        public string? UOM { get; set; }
        public decimal UnitPrice { get; set; }
        public string Currency { get; set; }
        public int BranchId { get; set; }
        public bool IsActive { get; set; }
    }

    public class PricingItemPagedResult
    {
        public IEnumerable<PricingItemDto> Items { get; set; }
        public int TotalCount { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }

    public class ProjectPricingItemDto
    {
        public int Id { get; set; }
        public int PricingItemId { get; set; }
        public string ItemNumber { get; set; }
        public string ShortDescription { get; set; }
        public string? UOM { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPriceSnapshot { get; set; }
        public decimal TotalPrice { get; set; }
        public string? Note { get; set; }
    }

    // ─── Request DTOs ────────────────────────────────────────────

    public class CreatePricingItemDto
    {
        public string ItemNumber { get; set; }
        public string ShortDescription { get; set; }
        public string? LongDescription { get; set; }
        public string? UOM { get; set; }
        public decimal UnitPrice { get; set; }
        public string Currency { get; set; } = "SAR";
        public int BranchId { get; set; }
    }

    public class UpdatePricingItemDto
    {
        public string? ShortDescription { get; set; }
        public string? LongDescription { get; set; }
        public string? UOM { get; set; }
        public decimal? UnitPrice { get; set; }
        public bool? IsActive { get; set; }
    }

    public class AddProjectPricingItemDto
    {
        public int PricingItemId { get; set; }
        public decimal Quantity { get; set; } = 1;
        public string? Note { get; set; }
    }

    public class AddProjectPricingItemsDto
    {
        public string ProjectType { get; set; }  // "Construction" | "Maintenance" | "Emergency" | "NewProject"
        public int ProjectId { get; set; }
        public List<AddProjectPricingItemDto> Items { get; set; }
    }
    public class PricingItemResponseDto
    {
        public int Id { get; set; }
        public string ItemNumber { get; set; }
        public string ShortDescription { get; set; }
        public string LongDescription { get; set; }
        public string Uom { get; set; }
        public double UnitPrice { get; set; }
        public string Currency { get; set; }
        public double? EstimatedQuantity { get; set; }      // الكمية التقديرية
        public double? ExecutedQuantity { get; set; }       // الكمية المنفذة
        public double? TotalPrice { get; set; }             // اجمالي السعر
        public double? ExecutionPercentage { get; set; }    // نسبة التنفيذ
        public double? ExecutedWorksValue { get; set; }     // قيمة الاعمال المنفذة
    }
}