using System.ComponentModel.DataAnnotations;

namespace ASF.Core.DTOs.Workflow
{
    /// <summary>موقع أمر العمل الحالي في المسار، بكل ما يلزم لعرضه وتحريكه.</summary>
    public class PlacementDto
    {
        public int Id { get; set; }
        public string ProjectTypeCode { get; set; }
        public int WorkOrderId { get; set; }

        public int ContractId { get; set; }
        public string ContractName { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; }

        public int BasketStableKey { get; set; }

        /// <summary>
        /// بيانات السلة من النسخة المنشورة. تكون فارغة إن حُذفت السلة من المسار
        /// المعتمد — وهي الحالة التي يحرسها منع الحذف.
        /// </summary>
        public int? CurrentBasketId { get; set; }
        public string? CurrentBasketName { get; set; }
        public string? CurrentBasketPurpose { get; set; }
        public int CurrentBasketOrder { get; set; }

        public DateTime EnteredBasketAt { get; set; }

        /// <summary>أيام مكوث أمر العمل في السلة الحالية.</summary>
        public int DaysInBasket { get; set; }

        public List<PlacementTaskDto> Tasks { get; set; } = new();

        /// <summary>السلال التي يجوز الانتقال إليها الآن، وسبب المنع إن وُجد.</summary>
        public List<TransitionOptionDto> Transitions { get; set; } = new();

        /// <summary>أسباب منع التقدّم إلى الأمام، فارغة إن كان مسموحاً.</summary>
        public List<string> Blockers { get; set; } = new();
    }

    public class PlacementTaskDto
    {
        public int TaskStableKey { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public bool IsMandatory { get; set; }
        public string? DefaultAssigneeRole { get; set; }
        public int? DurationDays { get; set; }
        public string? RequiredAttachments { get; set; }
        public string? RequiredForms { get; set; }

        public bool IsDone { get; set; }
        public DateTime? DoneAt { get; set; }
        public string? DoneByUserName { get; set; }
        public string? Note { get; set; }
    }

    public class TransitionOptionDto
    {
        public int BasketStableKey { get; set; }
        public int BasketId { get; set; }
        public string BasketName { get; set; }
        public int Order { get; set; }

        /// <summary>Forward | Backward | Current</summary>
        public string Direction { get; set; }

        public bool IsAllowed { get; set; }

        /// <summary>سبب المنع، فارغ إن كان مسموحاً.</summary>
        public string? BlockedReason { get; set; }
    }

    public class EnterWorkflowDto
    {
        [Required, MaxLength(32)]
        public string ProjectTypeCode { get; set; }

        public int WorkOrderId { get; set; }

        public int DepartmentId { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }
    }

    public class MoveWorkOrderDto
    {
        public int ToBasketStableKey { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }
    }

    public class SetTaskStateDto
    {
        public int TaskStableKey { get; set; }
        public bool IsDone { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }
    }

    public class BasketHistoryDto
    {
        public int Id { get; set; }
        public int? FromBasketStableKey { get; set; }
        public string? FromBasketName { get; set; }
        public int ToBasketStableKey { get; set; }
        public string? ToBasketName { get; set; }
        public DateTime MovedAt { get; set; }
        public string MovedByUserId { get; set; }
        public string? MovedByUserName { get; set; }
        public string? Note { get; set; }
    }

    /// <summary>عدد أوامر العمل في كل سلة من سلال مسار قسم.</summary>
    public class BasketLoadDto
    {
        public int BasketStableKey { get; set; }
        public int BasketId { get; set; }
        public string BasketName { get; set; }
        public int Order { get; set; }
        public int WorkOrdersCount { get; set; }
    }

    // ───────────── متابعة التنفيذ ─────────────

    /// <summary>
    /// قسم واحد في شاشة متابعة التنفيذ، بسلاله وعدد أوامر العمل في كل سلة.
    /// </summary>
    public class TrackingDepartmentDto
    {
        public int ContractId { get; set; }
        public string ContractNumber { get; set; }
        public string ContractName { get; set; }

        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; }
        public string? ProjectTypeCode { get; set; }

        public bool HasPublishedWorkflow { get; set; }
        public int TotalWorkOrders { get; set; }

        /// <summary>
        /// مسودة بسلال في انتظار الاعتماد — سبب شائع لرؤية القسم بلا سلال.
        /// </summary>
        public bool HasUnpublishedDraft { get; set; }
        public int DraftBasketsCount { get; set; }
        public int DraftWorkflowId { get; set; }

        /// <summary>أوامر عمل لم تدخل أي سلة بعد.</summary>
        public int UnplacedWorkOrders { get; set; }

        public List<BasketLoadDto> Baskets { get; set; } = new();
    }

    /// <summary>
    /// فلتر متابعة التنفيذ. كل حقل اختياري، والفارغ لا يقيّد.
    /// </summary>
    public class TrackingFilterDto
    {
        public string? ProjectTypeCode { get; set; }
        public int? ContractId { get; set; }

        /// <summary>بحث جزئي في رقم العقد.</summary>
        public string? ContractNumber { get; set; }

        public int? WorkOrderTypeId { get; set; }

        /// <summary>تاريخ الاستلام من / إلى.</summary>
        public DateTime? ReceivedFrom { get; set; }
        public DateTime? ReceivedTo { get; set; }

        /// <summary>بحث حر في رقم أمر العمل أو وصفه أو المقاول أو الحي.</summary>
        public string? Search { get; set; }

        /// <summary>أوامر العمل التي تجاوز مكوثها في السلة هذا العدد من الأيام.</summary>
        public int? MinDaysInBasket { get; set; }
    }

    /// <summary>أمر عمل داخل سلة، بالقدر اللازم لعرضه في بطاقة.</summary>
    public class TrackedWorkOrderDto
    {
        public string ProjectTypeCode { get; set; }
        public int WorkOrderId { get; set; }
        public string? OrderNumber { get; set; }
        public string? Title { get; set; }
        public string? Contractor { get; set; }
        public string? District { get; set; }
        public DateTime EnteredBasketAt { get; set; }
        public int DaysInBasket { get; set; }

        /// <summary>مهام السلة المنجزة من إجمالي الإلزامية.</summary>
        public int MandatoryTasksDone { get; set; }
        public int MandatoryTasksTotal { get; set; }

        /// <summary>تاريخ استلام أمر العمل، لا تاريخ دخوله السلة.</summary>
        public DateTime? ReceivedAt { get; set; }

        /// <summary>تاريخ الإسناد.</summary>
        public DateTime? OrderDate { get; set; }

        public string? Office { get; set; }
        public string? Duration { get; set; }
        public string? EstimatedValue { get; set; }
        public string? ActualValue { get; set; }

        /// <summary>نسبة الإنجاز — متاحة للإنشاءات فقط.</summary>
        public string? CompletionPercent { get; set; }

        public int? WorkOrderTypeId { get; set; }
        public string? WorkOrderTypeName { get; set; }

        public string? DepartmentName { get; set; }
        public string? BasketName { get; set; }
        public int BasketStableKey { get; set; }
    }

    // ───────────── نطاق بيانات المستخدم ─────────────

    public class UserScopeDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public int ContractId { get; set; }
        public string ContractName { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
    }

    public class SetUserScopeDto
    {
        public int ContractId { get; set; }

        /// <summary>فارغ = كل أقسام العقد.</summary>
        public int? DepartmentId { get; set; }
    }

    // ───────────── ترحيل أوامر العمل القائمة ─────────────

    /// <summary>
    /// ترحيل أوامر العمل القائمة من حقل Situation النصّي إلى السلال.
    /// يُشغَّل بمعاينة أولاً (DryRun) فلا يُكتب شيء قبل مراجعة النتيجة.
    /// </summary>
    public class BackfillRequestDto
    {
        public int DepartmentId { get; set; }

        /// <summary>true = معاينة فقط بلا كتابة. هو الافتراضي.</summary>
        public bool DryRun { get; set; } = true;

        /// <summary>
        /// السلة التي تستقبل أوامر العمل التي لا تطابق قيمتها النصّية أي سلة.
        /// فارغة = تُترك بلا موقع وتُعدّ غير مطابقة.
        /// </summary>
        public int? FallbackBasketStableKey { get; set; }

        /// <summary>
        /// يضمّ أوامر العمل التي لا تحمل رقم عقد أصلاً.
        ///
        /// افتراضه false: نسبة أمر عمل بلا رقم عقد إلى هذا العقد تخمين، ولا
        /// يصحّ أن يقع بلا اختيار صريح.
        /// </summary>
        public bool IncludeUnassigned { get; set; }
    }

    public class BackfillResultDto
    {
        public bool DryRun { get; set; }
        public string ProjectTypeCode { get; set; }
        public string DepartmentName { get; set; }

        public int TotalWorkOrders { get; set; }
        public int AlreadyPlaced { get; set; }
        public int Matched { get; set; }
        public int FellBackToDefault { get; set; }
        public int Unmatched { get; set; }
        public int Written { get; set; }

        /// <summary>كل قيمة Situation وإلى أي سلة ذهبت وكم أمر عمل تحملها.</summary>
        public List<BackfillMappingDto> Mappings { get; set; } = new();
    }

    public class BackfillMappingDto
    {
        public string? Situation { get; set; }
        public int Count { get; set; }
        public int? BasketStableKey { get; set; }
        public string? BasketName { get; set; }

        /// <summary>ExactName | Fallback | NoMatch</summary>
        public string MatchKind { get; set; }
    }
}
