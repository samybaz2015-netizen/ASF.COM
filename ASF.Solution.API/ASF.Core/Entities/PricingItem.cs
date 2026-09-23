using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ASF.Core.Entities.Pricing
{
    public class PricingItem
    {
        public int Id { get; set; }

        [Required]
        public string ItemNumber { get; set; }

        [Required]
        public string ShortDescription { get; set; }

        public string? LongDescription { get; set; }

        public string? UOM { get; set; }

        [Column(TypeName = "decimal(18,4)")]
        public decimal UnitPrice { get; set; }

        public string Currency { get; set; } = "SAR";

        public int BranchId { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation - for project usage
        public List<ProjectPricingItem>? ProjectPricingItems { get; set; }
    }
    public class ProjectPricingItem
    {
        public int Id { get; set; }

        // FK to PricingItem
        public int PricingItemId { get; set; }
        public PricingItem PricingItem { get; set; }

        // Project type discriminator: "Construction" | "Maintenance" | "Emergency" | "NewProject"
        [Required]
        public string ProjectType { get; set; }

        // ID of the project in its own table
        public int ProjectId { get; set; }

        // Quantity used in this project
        [Column(TypeName = "decimal(18,4)")]
        public decimal Quantity { get; set; } = 1;

        // Unit price at time of selection (snapshot)
        [Column(TypeName = "decimal(18,4)")]
        public decimal UnitPriceSnapshot { get; set; }

        [Column(TypeName = "decimal(18,4)")]
        public decimal TotalPrice => Quantity * UnitPriceSnapshot;

        public string? Note { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}