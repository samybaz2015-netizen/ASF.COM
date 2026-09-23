namespace ASF.Core.Entities.Construction
{
    /// <summary>
    /// سجل تاريخي لكل تحديث يتم على الكمية المنفذة لبند في مشروع إنشاءات
    /// </summary>
    public class ConstructionPricingItemUpdateLog : IPricingItemUpdateLog
    {
        public int Id { get; set; }

        public int ConstructionId { get; set; }
        public int PricingItemId { get; set; }

        // تفاصيل البند
        public string? ItemNumber { get; set; }
        public string? ItemDescription { get; set; }

        // من قام بالتحديث
        public string UpdatedByUserId { get; set; }
        public string UpdatedByUserName { get; set; }

        // توقيت التحديث
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // الكميات قبل وبعد
        public double? OldExecutedQuantity { get; set; }
        public double? NewExecutedQuantity { get; set; }

        // قيم إضافية محسوبة عند التحديث
        public double? NewExecutedWorksValue { get; set; }      // قيمة الأعمال المنفذة الجديدة
        public double? NewExecutionPercentage { get; set; }     // نسبة التنفيذ الجديدة
        public double? NewEstimatedQuantity { get; set; }       // التقديرية بعد التحديث (إذا تغيرت)

        // ملاحظة / سبب التحديث
        public string? Note { get; set; }
    }
}
