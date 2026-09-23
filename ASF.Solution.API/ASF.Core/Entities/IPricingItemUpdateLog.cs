namespace ASF.Core.Entities
{
    /// <summary>
    /// واجهة مشتركة لسجلات تحديث الكميات المنفذة (*PricingItemUpdateLog).
    /// لا تتضمن FK المشروع لأن اسم الخاصية يختلف بين الكيانات.
    /// </summary>
    public interface IPricingItemUpdateLog
    {
        int PricingItemId { get; set; }
        string? ItemNumber { get; set; }
        string? ItemDescription { get; set; }
        string UpdatedByUserId { get; set; }
        string UpdatedByUserName { get; set; }
        DateTime UpdatedAt { get; set; }
        double? OldExecutedQuantity { get; set; }
        double? NewExecutedQuantity { get; set; }
        double? NewExecutedWorksValue { get; set; }
        double? NewExecutionPercentage { get; set; }
        double? NewEstimatedQuantity { get; set; }
        string? Note { get; set; }
    }
}
