namespace ASF.Core.Entities
{
    /// <summary>
    /// واجهة مشتركة لجميع كيانات ربط بنود التسعير بالمشاريع (*PricingItem).
    /// لا تتضمن Id لأن ConstructionPricingItem يستخدم مفتاح مركب.
    /// لا تتضمن FK المشروع لأن اسم الخاصية يختلف بين الكيانات (NewProjectId, ConstructionId, …).
    /// </summary>
    public interface IProjectPricingItem
    {
        int PricingItemId { get; set; }
        double? EstimatedQuantity { get; set; }
        double? ExecutedQuantity { get; set; }
        double? TotalPrice { get; set; }
        double? ExecutionPercentage { get; set; }
        double? ExecutedWorksValue { get; set; }
    }
}
