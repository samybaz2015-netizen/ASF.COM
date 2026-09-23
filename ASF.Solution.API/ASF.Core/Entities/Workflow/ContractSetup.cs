using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace ASF.Core.Entities.Workflow
{
    /// <summary>
    /// نوع العقد. الاستشاري يشرف على العقد الموحد وعلى عقود خاصة وأعمال أخرى،
    /// ولكلٍّ إعداداته المستقلة.
    /// </summary>
    public static class ContractKinds
    {
        public const string Unified = "Unified";   // العقد الموحد
        public const string Private = "Private";   // عقد خاص
        public const string Other = "Other";       // أعمال أخرى

        public static readonly string[] All = { Unified, Private, Other };

        public static bool IsValid(string? kind) =>
            kind is not null && Array.IndexOf(All, kind) >= 0;
    }

    /// <summary>
    /// نوع أمر العمل داخل قسم من عقد.
    ///
    /// مثال: قسم الإنشاءات في العقد الموحد يضم «إيصال» و«حلال» و«ربط» و«تعزيز».
    /// كان نوع أمر العمل جدولاً عاماً بلا عقد ولا قسم، فلا يمكن أن يختلف من عقد
    /// إلى آخر. صار تابعاً للعقد يُضاف من إعداداته.
    /// </summary>
    /// <summary>
    /// تصنيفات قوائم العقد. القوائم الأربع تتشارك نفس البنية — اسم ورمز
    /// وإدارة تابعة وترتيب — فتُحفظ في جدول واحد بتصنيف، لا أربعة جداول
    /// متطابقة بأربع شاشات.
    /// </summary>
    public static class ContractListCategories
    {
        public const string WorkOrderType = "WorkOrderType";
        public const string WorkOrderCode = "WorkOrderCode";
        public const string District = "District";
        public const string Contractor = "Contractor";
        public const string Consultant = "Consultant";
        public const string Office = "Office";
        public const string ProjectOwner = "ProjectOwner";
        public const string ProjectParty = "ProjectParty";

        public static readonly string[] All =
        {
            WorkOrderType, WorkOrderCode, District, Contractor,
            Consultant, Office, ProjectOwner, ProjectParty
        };

        public static bool IsValid(string? value) =>
            !string.IsNullOrWhiteSpace(value) && All.Contains(value);
    }

    public class ContractWorkOrderType
    {
        /// <summary>
        /// أيّ قائمة ينتمي إليها هذا الصف. الافتراضي نوع أمر العمل حتى تبقى
        /// الصفوف القائمة على حالها بعد الترقية.
        /// </summary>
        [Required, MaxLength(32)]
        public string Category { get; set; } = ContractListCategories.WorkOrderType;

        public int Id { get; set; }

        /// <summary>
        /// فارغ = قيمة عامة متاحة في كل العقود.
        ///
        /// الأحياء والمقاولون لا يخصّان عقداً بعينه، ونسخها في كل عقد يجعل
        /// تعديل الاسم تعديلات متفرّقة يُنسى بعضها. القيمة العامة تُكتب مرّة
        /// وتُرى في الجميع.
        /// </summary>
        public int? ContractId { get; set; }
        public Contract? Contract { get; set; }

        /// <summary>فارغ = النوع متاح لكل أقسام العقد.</summary>
        public int? DepartmentId { get; set; }
        public WorkflowDepartment? Department { get; set; }

        [Required, MaxLength(128)]
        public string Name { get; set; }

        /// <summary>رمز مختصر يظهر بجانب الاسم، مثل RUH. اختياري.</summary>
        [MaxLength(32)]
        public string? Code { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// صلاحية موظف على عقد ونوع أمر عمل.
    ///
    /// أبسط ما يفي بالغرض: صف واحد يقول «فلان على هذا العقد وهذا النوع يستطيع
    /// الاطلاع والإنشاء والتعديل والحذف». لا شجرة صلاحيات ولا استثناءات
    /// متشابكة.
    ///
    /// WorkOrderTypeId فارغ = كل أنواع العقد.
    /// DepartmentId فارغ    = كل أقسام العقد.
    /// </summary>
    public class ContractTeamPermission
    {
        public int Id { get; set; }

        [Required, MaxLength(450)]
        public string UserId { get; set; }

        /// <summary>يُحفظ وقت الإسناد ليُعرض بلا نداء إضافي على قاعدة الهوية.</summary>
        [MaxLength(256)]
        public string? UserName { get; set; }

        public int ContractId { get; set; }
        public Contract Contract { get; set; }

        /// <summary>فارغ = كل أقسام العقد.</summary>
        public int? DepartmentId { get; set; }
        public WorkflowDepartment? Department { get; set; }

        /// <summary>فارغ = كل أنواع أوامر العمل في العقد.</summary>
        public int? WorkOrderTypeId { get; set; }
        public ContractWorkOrderType? WorkOrderType { get; set; }

        public bool CanView { get; set; } = true;
        public bool CanCreate { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(450)]
        public string? GrantedByUserId { get; set; }
    }
}
