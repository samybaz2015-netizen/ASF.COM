using System.ComponentModel.DataAnnotations;

namespace ASF.Core.Dtos.Monitoring
{
    /// <summary>
    /// فلاتر لوحة المتابعة.
    ///
    /// كلّها اختيارية: بلا فلتر تُعرض كل البيانات التي يحقّ للمستخدم رؤيتها.
    /// الفلتر يُضيّق ولا يوسّع، ولا يتجاوز صلاحيةً بحال.
    /// </summary>
    public class MonitoringFilterDto
    {
        public int? ContractId { get; set; }
        public int? DepartmentId { get; set; }

        [MaxLength(64)]
        public string? ProjectTypeCode { get; set; }

        /// <summary>معرّف قيمة القائمة، لا الاسم — فلا يُخطئه فرق مسافة.</summary>
        public int? WorkOrderTypeRefId { get; set; }
        public int? ContractorRefId { get; set; }
        public int? DistrictRefId { get; set; }

        /// <summary>فترة الاستلام.</summary>
        public DateTime? ReceivedFrom { get; set; }
        public DateTime? ReceivedTo { get; set; }

        /// <summary>فترة النشاط — تخصّ مؤشّرات الموظفين.</summary>
        public DateTime? ActivityFrom { get; set; }
        public DateTime? ActivityTo { get; set; }

        /// <summary>سلة بعينها.</summary>
        public int? BasketStableKey { get; set; }
    }

    // ───────────── مراحل الطلب ─────────────

    /// <summary>
    /// مرحلة (سلة) بعددها وقيمتيها.
    /// </summary>
    public class StageStatDto
    {
        public int BasketStableKey { get; set; }
        public string BasketName { get; set; }
        public int SortOrder { get; set; }

        public int DepartmentId { get; set; }
        public string? DepartmentName { get; set; }

        /// <summary>عدد أوامر العمل الواقفة في هذه المرحلة الآن.</summary>
        public int Count { get; set; }

        public decimal EstimatedValue { get; set; }
        public decimal ActualValue { get; set; }

        /// <summary>
        /// أوامر عمل قيمتها غير مقروءة رقماً.
        ///
        /// يُعرض صراحةً: مجموعٌ يُخفي أن نصف صفوفه بلا قيمة يُقرأ كأنه كامل.
        /// </summary>
        public int MissingEstimated { get; set; }
        public int MissingActual { get; set; }

        /// <summary>متوسّط أيام المكوث في هذه المرحلة.</summary>
        public double AverageDaysInStage { get; set; }

        /// <summary>أطول مكوث في المرحلة — يكشف أمر عمل متعثّراً يخفيه المتوسّط.</summary>
        public double LongestDaysInStage { get; set; }
    }

    // ───────────── المسند والمصروف والمتبقي ─────────────

    /// <summary>
    /// اللوحة المالية.
    ///
    /// المسند = مجموع القيم التقديرية لما أُسند.
    /// المصروف = مجموع القيم المنفّذة.
    /// المتبقي = الفرق بينهما.
    /// </summary>
    public class FinancialSummaryDto
    {
        public decimal Assigned { get; set; }
        public decimal Spent { get; set; }
        public decimal Remaining { get; set; }

        /// <summary>نسبة الصرف من المسند، صفر إن كان المسند صفراً.</summary>
        public double SpentPercent { get; set; }

        public int OrdersCount { get; set; }

        /// <summary>
        /// كم أمر عمل بلا قيمة مقروءة. بدونه تبدو الأرقام أشمل مما هي.
        /// </summary>
        public int OrdersWithoutEstimate { get; set; }
        public int OrdersWithoutActual { get; set; }

        public List<FinancialBreakdownDto> ByContract { get; set; } = new();
        public List<FinancialBreakdownDto> ByDepartment { get; set; } = new();
    }

    public class FinancialBreakdownDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Count { get; set; }
        public decimal Assigned { get; set; }
        public decimal Spent { get; set; }
        public decimal Remaining { get; set; }
    }

    // ───────────── مؤشّرات الموظفين ─────────────

    /// <summary>
    /// نشاط موظّف على أوامر العمل خلال الفترة.
    /// </summary>
    public class EmployeeActivityDto
    {
        public string UserId { get; set; }
        public string? UserName { get; set; }

        /// <summary>حركات نقل أمر عمل من سلة إلى أخرى.</summary>
        public int Moves { get; set; }

        /// <summary>مهام أُنجزت داخل السلال.</summary>
        public int TasksDone { get; set; }

        /// <summary>أوامر عمل أنشأها.</summary>
        public int Created { get; set; }

        /// <summary>عدد أوامر العمل المختلفة التي لمسها.</summary>
        public int OrdersTouched { get; set; }

        public DateTime? LastActivityAt { get; set; }

        /// <summary>مجموع الحركات والمهام والإنشاء — لترتيب اللوحة.</summary>
        public int TotalActions { get; set; }
    }

    // ───────────── الحركة عبر الزمن ─────────────

    public class ActivityPointDto
    {
        public DateTime Date { get; set; }
        public int Moves { get; set; }
        public int TasksDone { get; set; }
    }

    // ───────────── اللوحة كاملة ─────────────

    public class MonitoringBoardDto
    {
        public int TotalOrders { get; set; }

        /// <summary>
        /// متوسّط مدة الإنجاز بالأيام: من دخول أمر العمل المسار إلى وصوله
        /// المرحلة الأخيرة.
        ///
        /// يُقاس من سجلّ الحركة لا من حقل تاريخ نصّي، فهو تاريخٌ حقيقي لا
        /// يعتمد على ما كتبه أحد.
        /// </summary>
        public double AverageCompletionDays { get; set; }

        /// <summary>كم أمر عمل بلغ المرحلة الأخيرة — عليه حُسب المتوسّط.</summary>
        public int CompletedCount { get; set; }

        /// <summary>ما زال في الطريق.</summary>
        public int InProgressCount { get; set; }

        public List<StageStatDto> Stages { get; set; } = new();
        public FinancialSummaryDto Financial { get; set; } = new();
        public List<EmployeeActivityDto> Employees { get; set; } = new();
        public List<ActivityPointDto> Activity { get; set; } = new();

        /// <summary>
        /// ما تعذّر حسابه وسببه — يُعرض في الشاشة لا يُبتلع.
        /// </summary>
        public List<string> Notices { get; set; } = new();
    }

    /// <summary>خيارات الفلاتر، مقيّدة بصلاحية المستخدم.</summary>
    public class MonitoringOptionsDto
    {
        public List<OptionDto> Contracts { get; set; } = new();
        public List<OptionDto> Departments { get; set; } = new();
        public List<OptionDto> WorkOrderTypes { get; set; } = new();
        public List<OptionDto> Contractors { get; set; } = new();
        public List<OptionDto> Districts { get; set; } = new();
        public List<OptionDto> Baskets { get; set; } = new();
    }

    public class OptionDto
    {
        public int Id { get; set; }
        public string Name { get; set; }

        /// <summary>اسم المجموعة للعرض — مثل اسم العقد تحت القسم.</summary>
        public string? Group { get; set; }

        /// <summary>
        /// معرّف الأب، مثل عقد القسم.
        ///
        /// يُربط به لا بالاسم: مطابقة الأسماء نصّاً تكسرها مسافة أو تشابه.
        /// </summary>
        public int? ParentId { get; set; }
    }
}
