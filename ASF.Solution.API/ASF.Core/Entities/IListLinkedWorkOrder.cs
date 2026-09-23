namespace ASF.Core.Entities
{
    /// <summary>
    /// أمر عمل تُقرأ بعض حقوله من قوائم العقد.
    ///
    /// الحقول النصّية تبقى — هي ما تقرأه الشاشات والتقارير — ويُحفظ بجانبها
    /// معرّف القيمة، فتسري إعادة التسمية عليها لاحقاً.
    /// </summary>
    public interface IListLinkedWorkOrder
    {
        string District { get; set; }
        string Contractor { get; set; }
        string WorkOrderType { get; set; }

        int? DistrictRefId { get; set; }
        int? ContractorRefId { get; set; }
        int? WorkOrderTypeRefId { get; set; }

        /// <summary>نوع أمر العمل المركّب (FaultNumber-WorkOrderType) — يُستخدم لفحص التكرار.</summary>
        string? OrderType { get; set; }

        /// <summary>القيمتان المالية كما كتبهما المستخدم — نصّاً.</summary>
        string? EstimatedValue { get; set; }
        string? ActualValue { get; set; }

        /// <summary>وكما تُقرأ رقماً، للجمع والمقارنة.</summary>
        decimal? EstimatedAmount { get; set; }
        decimal? ActualAmount { get; set; }
    }
}
