using System.ComponentModel.DataAnnotations;

namespace ASF.Core.DTOs.Workflow
{
    // ───────────── العقود ─────────────

    public class ContractDto
    {
        public int Id { get; set; }
        public string ContractNumber { get; set; }
        public string Name { get; set; }

        /// <summary>Unified | Private | Other</summary>
        public string Kind { get; set; }

        public string? ClientName { get; set; }
        public int WorkOrderTypesCount { get; set; }
        public int TeamMembersCount { get; set; }
        public int? BranchId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; }
        public int DepartmentsCount { get; set; }
    }

    public class ContractUpsertDto
    {
        [Required, MaxLength(64)]
        public string ContractNumber { get; set; }

        [Required, MaxLength(256)]
        public string Name { get; set; }

        /// <summary>Unified | Private | Other — الافتراضي العقد الموحد.</summary>
        [MaxLength(16)]
        public string? Kind { get; set; }

        [MaxLength(256)]
        public string? ClientName { get; set; }

        public int? BranchId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; } = true;
    }

    // ───────────── الأقسام ─────────────

    public class DepartmentDto
    {
        public int Id { get; set; }
        public int ContractId { get; set; }
        public string Name { get; set; }
        public string? ProjectTypeCode { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }

        /// <summary>عدد السلال في النسخة المنشورة، أو في المسودة إن لم يُنشر بعد.</summary>
        public int BasketsCount { get; set; }

        public bool HasPublishedWorkflow { get; set; }
        public bool HasDraftWorkflow { get; set; }
    }

    public class DepartmentUpsertDto
    {
        [Required, MaxLength(128)]
        public string Name { get; set; }

        [MaxLength(64)]
        public string? ProjectTypeCode { get; set; }

        public bool IsActive { get; set; } = true;
    }

    // ───────────── المسار والسلال ─────────────

    public class WorkflowDto
    {
        public int Id { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; }
        public int ContractId { get; set; }
        public string ContractName { get; set; }
        public int Version { get; set; }
        public string Status { get; set; }
        public DateTime? PublishedAt { get; set; }
        public List<BasketDto> Baskets { get; set; } = new();
    }

    public class BasketDto
    {
        public int Id { get; set; }
        public int StableKey { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? Purpose { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public string? TransitionRequirements { get; set; }
        public bool RequireMandatoryTasks { get; set; }
        public bool RequireAttachments { get; set; }

        /// <summary>
        /// عدد أوامر العمل الموجودة حالياً في السلة. يمنع إخفاءها أو حذفها وهو أكبر
        /// من صفر، حمايةً للسجل التاريخي.
        /// </summary>
        public int WorkOrdersCount { get; set; }

        public List<BasketTaskDto> Tasks { get; set; } = new();
    }

    public class BasketUpsertDto
    {
        [Required, MaxLength(160)]
        public string Name { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(1000)]
        public string? Purpose { get; set; }

        [MaxLength(1000)]
        public string? TransitionRequirements { get; set; }

        public bool RequireMandatoryTasks { get; set; } = true;
        public bool RequireAttachments { get; set; }
        public bool IsActive { get; set; } = true;
    }

    // ───────────── مهام السلة ─────────────

    public class BasketTaskDto
    {
        public int Id { get; set; }
        public int BasketId { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public bool IsMandatory { get; set; }
        public bool IsActive { get; set; }
        public string? DefaultAssigneeRole { get; set; }
        public int? DurationDays { get; set; }
        public string? RequiredAttachments { get; set; }
        public string? RequiredForms { get; set; }
    }

    public class BasketTaskUpsertDto
    {
        [Required, MaxLength(256)]
        public string Name { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        public bool IsMandatory { get; set; }
        public bool IsActive { get; set; } = true;

        [MaxLength(128)]
        public string? DefaultAssigneeRole { get; set; }

        public int? DurationDays { get; set; }

        [MaxLength(1000)]
        public string? RequiredAttachments { get; set; }

        [MaxLength(1000)]
        public string? RequiredForms { get; set; }
    }

    // ───────────── إعادة الترتيب ─────────────

    /// <summary>
    /// ترتيب جديد بالمعرّفات. الترتيب المرسل هو الترتيب النهائي، فلا حاجة لإرسال
    /// رقم لكل عنصر.
    /// </summary>
    public class ReorderDto
    {
        [Required]
        public List<int> OrderedIds { get; set; } = new();
    }

    // ───────────── معاينة المسار ─────────────

    /// <summary>
    /// معاينة المسار قبل الاعتماد (البند 11): السلال المفعّلة بترتيبها النهائي.
    /// </summary>
    public class WorkflowPreviewDto
    {
        public int WorkflowId { get; set; }
        public string DepartmentName { get; set; }
        public int Version { get; set; }
        public string Status { get; set; }
        public List<WorkflowPreviewStepDto> Steps { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    public class WorkflowPreviewStepDto
    {
        public int Order { get; set; }
        public int BasketId { get; set; }
        public string BasketName { get; set; }
        public string? Purpose { get; set; }
        public int MandatoryTasksCount { get; set; }
        public int TasksCount { get; set; }
        public string? TransitionRequirements { get; set; }
    }

    // ───────────── السلال المقترحة ─────────────

    /// <summary>
    /// قالب السلال المقترحة لقسم. اقتراح يُطبَّق بضغطة ثم يُعدَّل بحرّية، ولا
    /// يعتمد عليه منطق التشغيل.
    /// </summary>
    public class BasketTemplateDto
    {
        public string ProjectTypeCode { get; set; }
        public string DepartmentName { get; set; }

        /// <summary>Spec = منصوص عليه في المواصفة · Suggested = اقتراح.</summary>
        public string Source { get; set; }

        /// <summary>هل المسودة فارغة فيمكن تطبيق القالب عليها؟</summary>
        public bool CanApply { get; set; }

        /// <summary>سبب تعذّر التطبيق، إن وُجد.</summary>
        public string? BlockedReason { get; set; }

        public List<BasketTemplateItemDto> Baskets { get; set; } = new();
    }

    public class BasketTemplateItemDto
    {
        public int Order { get; set; }
        public string Name { get; set; }
        public string? Purpose { get; set; }
        public List<string> Tasks { get; set; } = new();
        public int MandatoryTasksCount { get; set; }
    }

    // ───────────── أنواع أوامر العمل ─────────────

    public class WorkOrderTypeDto
    {
        public int Id { get; set; }

        /// <summary>فارغ = قيمة عامة تظهر في كل العقود.</summary>
        public int? ContractId { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public string Category { get; set; }
        public string Name { get; set; }
        public string? Code { get; set; }
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
    }

    public class WorkOrderTypeUpsertDto
    {
        /// <summary>أيّ قائمة: WorkOrderType | WorkOrderCode | District | Contractor.</summary>
        [MaxLength(32)]
        public string? Category { get; set; }

        [Required, MaxLength(128)]
        public string Name { get; set; }

        [MaxLength(32)]
        public string? Code { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        /// <summary>فارغ = متاح لكل أقسام العقد.</summary>
        public int? DepartmentId { get; set; }

        public bool IsActive { get; set; } = true;
    }

    /// <summary>ترتيب القيم: القائمة كاملة بالترتيب الجديد.</summary>
    public class ReorderTypesDto
    {
        public List<int> Ids { get; set; } = new();

        /// <summary>القائمة التي يخصّها الترتيب.</summary>
        [MaxLength(32)]
        public string? Category { get; set; }
    }

    // ───────────── فريق العمل والصلاحيات ─────────────

    public class TeamPermissionDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string? UserName { get; set; }

        public int ContractId { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public int? WorkOrderTypeId { get; set; }
        public string? WorkOrderTypeName { get; set; }

        public bool CanView { get; set; }
        public bool CanCreate { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
    }

    public class TeamPermissionUpsertDto
    {
        [Required, MaxLength(450)]
        public string UserId { get; set; }

        [MaxLength(256)]
        public string? UserName { get; set; }

        /// <summary>فارغ = كل أقسام العقد.</summary>
        public int? DepartmentId { get; set; }

        /// <summary>فارغ = كل أنواع أوامر العمل في العقد.</summary>
        public int? WorkOrderTypeId { get; set; }

        public bool CanView { get; set; } = true;
        public bool CanCreate { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
    }

    // ───────────── سجل التغييرات ─────────────

    public class WorkflowAuditLogDto
    {
        public int Id { get; set; }
        public int? ContractId { get; set; }
        public int? DepartmentId { get; set; }
        public int? WorkflowId { get; set; }
        public int? BasketId { get; set; }
        public string ChangeType { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string? Note { get; set; }
        public string ChangedByUserId { get; set; }
        public string? ChangedByUserName { get; set; }
        public DateTime ChangedAt { get; set; }
    }
}
