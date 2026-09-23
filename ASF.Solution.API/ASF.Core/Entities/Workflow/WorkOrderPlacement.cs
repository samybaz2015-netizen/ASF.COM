using System.ComponentModel.DataAnnotations;

namespace ASF.Core.Entities.Workflow
{
    /// <summary>
    /// أنواع المشاريع الخمسة، كما تُخزَّن في ProjectTypeCode.
    /// </summary>
    public static class ProjectTypeCodes
    {
        public const string Construction = "Construction";
        public const string Maintenance = "Maintenance";
        public const string Emergency = "Emergency";
        public const string NewProject = "NewProject";
        public const string PrivateProject = "PrivateProject";

        public static readonly string[] All =
        {
            Construction, Maintenance, Emergency, NewProject, PrivateProject
        };

        public static bool IsValid(string? code) =>
            code is not null && Array.IndexOf(All, code) >= 0;
    }

    /// <summary>
    /// موقع أمر العمل في مسار السلال.
    ///
    /// لا يوجد في النظام جدول أوامر عمل موحّد: هناك خمسة أنواع مشاريع في خمسة
    /// جداول متوازية. فبدل إضافة أعمدة إلى عشرة جداول تحمل بيانات إنتاج، يُربط
    /// أمر العمل من هنا بمفتاح مركّب (النوع + المعرّف). وبذلك يبقى عدّ أوامر
    /// العمل في سلة استعلاماً واحداً لا اتحاد خمسة استعلامات.
    ///
    /// الموقع يُخزَّن بـ DepartmentId + BasketStableKey، لا بمعرّف صف السلة:
    /// المفتاح الثابت يعبر نسخ المسار، فيبقى أمر العمل في سلته بعد أي اعتماد
    /// جديد مهما تغيّر الاسم أو الترتيب.
    /// </summary>
    public class WorkOrderPlacement
    {
        public int Id { get; set; }

        [Required, MaxLength(32)]
        public string ProjectTypeCode { get; set; }

        public int WorkOrderId { get; set; }

        public int ContractId { get; set; }
        public Contract Contract { get; set; }

        public int DepartmentId { get; set; }
        public WorkflowDepartment Department { get; set; }

        /// <summary>المفتاح الثابت للسلة التي يقف فيها أمر العمل الآن.</summary>
        public int BasketStableKey { get; set; }

        public DateTime EnteredBasketAt { get; set; } = DateTime.UtcNow;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// قيمة Situation التي وُلّد منها هذا الموقع عند الترحيل، إن وُجدت.
        /// تُحفظ للمراجعة فقط ولا يعتمد عليها التشغيل.
        /// </summary>
        [MaxLength(256)]
        public string? MigratedFromSituation { get; set; }

        public List<WorkOrderBasketHistory> History { get; set; } = new();
        public List<WorkOrderTaskState> TaskStates { get; set; } = new();
    }

    /// <summary>
    /// نطاق بيانات المستخدم: العقود والأقسام التي يراها.
    ///
    /// القاعدة: **مستخدم بلا أي سطر نطاق يرى كل شيء**. هذا يحافظ على سلوك
    /// النظام القائم ولا يقفل الباب في وجه أحد فجأة. وبمجرّد إضافة سطر واحد
    /// يصير المستخدم مقيَّداً بما أُسند إليه فقط.
    ///
    /// DepartmentId فارغ = كل أقسام العقد.
    /// </summary>
    public class UserDataScope
    {
        public int Id { get; set; }

        [Required, MaxLength(450)]
        public string UserId { get; set; }

        public int ContractId { get; set; }
        public Contract Contract { get; set; }

        /// <summary>فارغ = كل أقسام هذا العقد.</summary>
        public int? DepartmentId { get; set; }
        public WorkflowDepartment? Department { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(450)]
        public string? GrantedByUserId { get; set; }
    }

    /// <summary>
    /// حركة أمر العمل بين السلال: من أين وإلى أين ومتى وبيد من.
    /// </summary>
    public class WorkOrderBasketHistory
    {
        public int Id { get; set; }

        public int PlacementId { get; set; }
        public WorkOrderPlacement Placement { get; set; }

        /// <summary>فارغ عند أول دخول للمسار.</summary>
        public int? FromBasketStableKey { get; set; }

        public int ToBasketStableKey { get; set; }

        /// <summary>الاسمان وقت الحركة، حتى لو أُعيدت تسمية السلة لاحقاً.</summary>
        [MaxLength(160)]
        public string? FromBasketName { get; set; }

        [MaxLength(160)]
        public string? ToBasketName { get; set; }

        public DateTime MovedAt { get; set; } = DateTime.UtcNow;

        [Required, MaxLength(450)]
        public string MovedByUserId { get; set; }

        [MaxLength(256)]
        public string? MovedByUserName { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }
    }

    /// <summary>
    /// حالة إنجاز مهمة لأمر عمل بعينه.
    ///
    /// تُخزَّن بالمفتاح الثابت للمهمة لا بمعرّف صفها، فاعتماد نسخة جديدة من
    /// المسار لا يُلغي ما أُنجز.
    /// </summary>
    public class WorkOrderTaskState
    {
        public int Id { get; set; }

        public int PlacementId { get; set; }
        public WorkOrderPlacement Placement { get; set; }

        public int BasketStableKey { get; set; }
        public int TaskStableKey { get; set; }

        public bool IsDone { get; set; }

        public DateTime? DoneAt { get; set; }

        [MaxLength(450)]
        public string? DoneByUserId { get; set; }

        [MaxLength(256)]
        public string? DoneByUserName { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }
    }
}
