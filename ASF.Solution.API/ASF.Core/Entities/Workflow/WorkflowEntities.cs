using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ASF.Core.Entities.Workflow
{
    /// <summary>
    /// العقد. كان رقم العقد نصاً حراً على كل نوع مشروع، فلا يمكن تعليق إعدادات
    /// عليه. صار كياناً ليحمل أقسامه ومسارات سلاله.
    /// </summary>
    public class Contract
    {
        public int Id { get; set; }

        [Required, MaxLength(64)]
        public string ContractNumber { get; set; }

        [Required, MaxLength(256)]
        public string Name { get; set; }

        /// <summary>Unified العقد الموحد · Private عقد خاص · Other أعمال أخرى.</summary>
        [Required, MaxLength(16)]
        public string Kind { get; set; } = ContractKinds.Unified;

        /// <summary>الجهة المالكة أو صاحبة العقد.</summary>
        [MaxLength(256)]
        public string? ClientName { get; set; }

        public int? BranchId { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(450)]
        public string? CreatedByUserId { get; set; }

        public List<WorkflowDepartment> Departments { get; set; } = new();
        public List<ContractWorkOrderType> WorkOrderTypes { get; set; } = new();
    }

    /// <summary>
    /// قسم داخل العقد: الإنشاءات أو الصيانة أو الطوارئ أو غيرها.
    /// لكل قسم مسار سلال مستقل (البند 1).
    /// </summary>
    public class WorkflowDepartment
    {
        public int Id { get; set; }

        public int ContractId { get; set; }
        public Contract Contract { get; set; }

        [Required, MaxLength(128)]
        public string Name { get; set; }

        /// <summary>
        /// كود ثابت يربط القسم بنوع المشروع في النظام:
        /// Construction | Maintenance | Emergency | NewProject | PrivateProject
        /// وقد يكون فارغاً لقسم لا يقابله نوع مشروع.
        /// </summary>
        [MaxLength(64)]
        public string? ProjectTypeCode { get; set; }

        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;

        public List<Workflow> Workflows { get; set; } = new();
    }

    /// <summary>
    /// مسار السلال لقسم في عقد.
    ///
    /// يُحفظ بنسخ: النسخة المنشورة هي التي تعمل عليها أوامر العمل، والمسودة
    /// تُحرَّر بحرّية ولا تؤثر على شيء حتى تُعتمد (البند 11). وبهذا لا يفقد أمر
    /// عمل قائم موقعه عند تعديل الإعدادات (البند 12).
    /// </summary>
    public class Workflow
    {
        public int Id { get; set; }

        public int DepartmentId { get; set; }
        public WorkflowDepartment Department { get; set; }

        public int Version { get; set; } = 1;

        /// <summary>Draft | Published | Archived</summary>
        [Required, MaxLength(16)]
        public string Status { get; set; } = WorkflowStatus.Draft;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(450)]
        public string? CreatedByUserId { get; set; }

        public DateTime? PublishedAt { get; set; }

        [MaxLength(450)]
        public string? PublishedByUserId { get; set; }

        public List<WorkflowBasket> Baskets { get; set; } = new();
    }

    public static class WorkflowStatus
    {
        public const string Draft = "Draft";
        public const string Published = "Published";
        public const string Archived = "Archived";
    }

    /// <summary>
    /// سلة رئيسية في المسار.
    ///
    /// المعرّف هو المرجع الثابت: إعادة التسمية لا تكسر أي ارتباط لأن أوامر العمل
    /// تشير إلى المعرّف لا إلى الاسم (البند 7).
    /// </summary>
    public class WorkflowBasket
    {
        public int Id { get; set; }

        public int WorkflowId { get; set; }
        public Workflow Workflow { get; set; }

        /// <summary>
        /// معرّف السلة الثابت عبر نسخ المسار. حين تُنسخ المسودة من نسخة منشورة
        /// تحتفظ كل سلة بهذا المفتاح، فيبقى أمر العمل في سلته بعد الاعتماد.
        /// </summary>
        public int StableKey { get; set; }

        [Required, MaxLength(160)]
        public string Name { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        /// <summary>الهدف من السلة — يظهر في علامة المعلومات (البند 9).</summary>
        [MaxLength(1000)]
        public string? Purpose { get; set; }

        public int SortOrder { get; set; }

        public bool IsActive { get; set; } = true;

        /// <summary>شروط الانتقال منها، نصاً حراً بجانب الشرطين المحسوبين أدناه.</summary>
        [MaxLength(1000)]
        public string? TransitionRequirements { get; set; }

        /// <summary>يمنع الانتقال قبل إنجاز كل المهام الإلزامية.</summary>
        public bool RequireMandatoryTasks { get; set; } = true;

        /// <summary>يمنع الانتقال قبل استكمال المرفقات المطلوبة.</summary>
        public bool RequireAttachments { get; set; }

        public List<BasketTask> Tasks { get; set; } = new();
    }

    /// <summary>
    /// مهمة داخل سلة. ليست سلة فرعية: هي عمل مطلوب تنفيذه أثناء وجود أمر العمل
    /// في السلة (البند 8).
    /// </summary>
    public class BasketTask
    {
        public int Id { get; set; }

        public int BasketId { get; set; }
        public WorkflowBasket Basket { get; set; }

        /// <summary>
        /// معرّف المهمة الثابت داخل سلتها، يُورَّث عند نسخ المسودة.
        /// بدونه كان اعتماد نسخة جديدة من المسار يمحو ما أُنجز من مهام،
        /// لأن معرّف الصف يتغيّر مع كل نسخة.
        /// </summary>
        public int StableKey { get; set; }

        [Required, MaxLength(256)]
        public string Name { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        public int SortOrder { get; set; }

        public bool IsMandatory { get; set; }

        public bool IsActive { get; set; } = true;

        /// <summary>الدور المسؤول افتراضياً عن المهمة.</summary>
        [MaxLength(128)]
        public string? DefaultAssigneeRole { get; set; }

        /// <summary>المدة المتوقعة بالأيام.</summary>
        public int? DurationDays { get; set; }

        /// <summary>المرفقات المطلوبة، مفصولة بفاصلة.</summary>
        [MaxLength(1000)]
        public string? RequiredAttachments { get; set; }

        /// <summary>النماذج المطلوبة، مفصولة بفاصلة.</summary>
        [MaxLength(1000)]
        public string? RequiredForms { get; set; }
    }

    /// <summary>
    /// سجل تعديلات المسار (البند 13): ما تغيّر ومن غيّره ومتى، بالقيمة قبل وبعد.
    /// </summary>
    public class WorkflowAuditLog
    {
        public int Id { get; set; }

        /// <summary>فارغ = تعديل على قيمة عامة لا تخصّ عقداً بعينه.</summary>
        public int? ContractId { get; set; }
        public int? DepartmentId { get; set; }
        public int? WorkflowId { get; set; }
        public int? BasketId { get; set; }

        /// <summary>
        /// نوع التعديل: CreateDepartment | RenameBasket | ReorderBasket |
        /// DisableBasket | AddTask | PublishWorkflow …
        /// </summary>
        [Required, MaxLength(64)]
        public string ChangeType { get; set; }

        [MaxLength(2000)]
        public string? OldValue { get; set; }

        [MaxLength(2000)]
        public string? NewValue { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }

        [Required, MaxLength(450)]
        public string ChangedByUserId { get; set; }

        [MaxLength(256)]
        public string? ChangedByUserName { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
