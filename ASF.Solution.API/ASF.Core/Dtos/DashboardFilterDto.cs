namespace ASF.Core.Dtos
{
    /// <summary>
    /// معامِلات الفلترة الشاملة للـ Dashboard
    /// كل الحقول اختيارية — ما يُرسلش = مش بيُفلتر عليه
    /// </summary>
    public class DashboardFilterDto
    {
        // ── فلترة زمنية ──────────────────────────────────────────────────────
        /// <summary>سنة محددة (مثال: 2024)</summary>
        public int? Year { get; set; }

        /// <summary>شهر محدد 1-12 (يُستخدم مع Year فقط)</summary>
        public int? Month { get; set; }
        public int? Day { get; set; }

        /// <summary>تاريخ البداية (فترة مخصصة)</summary>
        public DateTime? DateFrom { get; set; }

        /// <summary>تاريخ النهاية (فترة مخصصة)</summary>
        public DateTime? DateTo { get; set; }

        // ── فلترة جغرافية / تنظيمية ─────────────────────────────────────────
        /// <summary>اسم الفرع (مثال: الرياض، جدة)</summary>
        public string? BranchName { get; set; }

        /// <summary>اسم المكتب</summary>
        public string? Office { get; set; }

        /// <summary>الحي / المنطقة</summary>
        public string? District { get; set; }

        // ── فلترة بالأطراف ───────────────────────────────────────────────────
        /// <summary>اسم المقاول</summary>
        public string? Contractor { get; set; }

        /// <summary>اسم الاستشاري</summary>
        public string? Consultant { get; set; }

        /// <summary>اسم المهندس / المستخدم المنشئ</summary>
        public string? UserName { get; set; }

        // ── فلترة بنوع المشروع ──────────────────────────────────────────────
        /// <summary>نوع المشروع: Construction, Maintenance, Emergency, NewProject, PrivateProject</summary>
        public string? ProjectType { get; set; }

        // ── فلترة بالحالة ───────────────────────────────────────────────────
        /// <summary>الحالة (Situation)</summary>
        public string? Situation { get; set; }

        /// <summary>نوع أمر العمل (WorkOrderType)</summary>
        public string? WorkOrderType { get; set; }

        /// <summary>true = معتمد، false = مرفوض، null = في انتظار الاعتماد</summary>
        public bool? IsApprove { get; set; }

        /// <summary>true = مؤرشف، false = نشط</summary>
        public bool? IsArchived { get; set; }

        /// <summary>فلترة المشاريع التي عندها مخالفات سلامة فقط</summary>
        public bool? HasSafetyViolation { get; set; }

        public string? ContractNumber { get; set; }
        public List<string>? ContractNumbers { get; set; }
    }


    public class FilteredDashboardStatsDto
    {
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        // ── إجماليات عامة ────────────────────────────────────────────────────
        public int TotalWorkOrders { get; set; }
        public int TotalActive { get; set; }
        public int TotalArchived { get; set; }
        public int TotalApproved { get; set; }
        public int TotalRejected { get; set; }
        public int TotalPendingApproval { get; set; }
        public int TotalSafetyViolations { get; set; }
        // ── القيم المالية الإجمالية (من بنود الأعمال) ──────────────────────
        public double TotalEstimatedValue { get; set; }   // إجمالي القيمة التقديرية
        public double TotalActualValue { get; set; }   // إجمالي القيمة الفعلية
        // ── تفصيل حسب نوع المشروع ────────────────────────────────────────────
        public ProjectTypeFilterResultDto Construction { get; set; } = new();
        public ProjectTypeFilterResultDto Maintenance { get; set; } = new();
        public ProjectTypeFilterResultDto Emergency { get; set; } = new();
        public ProjectTypeFilterResultDto NewProject { get; set; } = new();
        public ProjectTypeFilterResultDto PrivateProject { get; set; } = new();
        // ── توزيعات تحليلية ───────────────────────────────────────────────────
        public List<StatusCountDto> PerBranch { get; set; } = new();
        public List<MonthlyTrendDto> MonthlyTrend { get; set; } = new();
        public List<ValuePerBranchDto> ValuePerBranch { get; set; } = new();

        public List<BranchedStatusCountDto> PerContractor { get; set; } = new();
        public List<BranchedStatusCountDto> PerConsultant { get; set; } = new();
        public List<BranchedStatusCountDto> PerOffice { get; set; } = new();
        public List<BranchedStatusCountDto> PerDistrict { get; set; } = new();
        public List<BranchedStatusCountDto> PerSituation { get; set; } = new();
        public List<BranchedStatusCountDto> PerWorkOrderType { get; set; } = new();
        // في FilteredDashboardStatsDto
        public List<ConsultantBreakdownDto> ConsultantBreakdown { get; set; } = new();
        public List<ContractorBreakdownDto> ContractorBreakdown { get; set; } = new();
        // قيم الأعمال المالية مفلترة لكل مقاول / استشاري / فرع
        public List<ValuePerEntityDto> ValuePerContractor { get; set; } = new();
        public List<ValuePerEntityDto> ValuePerConsultant { get; set; } = new();
        // ── إحصائيات الموظفين والمستخدمين (مفلترة بالفرع) ────────────────────
        public FilteredUsersStatsDto Users { get; set; } = new();
        public FilteredEmployeesStatsDto Employees { get; set; } = new();
    }
    /// <summary>نتيجة فلترة نوع مشروع واحد</summary>
    public class ProjectTypeFilterResultDto
    {
        public int Total { get; set; }
        public int Active { get; set; }
        public int Archived { get; set; }
        public int Approved { get; set; }
        public int Rejected { get; set; }
        public int PendingApproval { get; set; }
        public int WithSafetyViolations { get; set; }
        public double EstimatedValue { get; set; }   // القيمة التقديرية (من بنود الأعمال)
        public double ActualValue { get; set; }   // القيمة الفعلية (من بنود الأعمال)
    }
    /// <summary>القيمة التقديرية والفعلية لكل فرع</summary>
    public class ValuePerBranchDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }
        public string? MonthName { get; set; }
        public string BranchName { get; set; } = string.Empty;
        public double EstimatedValue { get; set; }   // إجمالي قيمة بنود الأعمال (TotalPrice)
        public double ActualValue { get; set; }   // إجمالي الأعمال المنفذة (ExecutedWorksValue)
        public int TotalProjects { get; set; }
    }

    /// <summary>قيمة الأعمال (من بنود الأعمال الفعلية) لكل طرف (مقاول / استشاري)</summary>
    public class ValuePerEntityDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }
        public string? MonthName { get; set; }
        public string BranchName     { get; set; } = "غير محدد";
        public string EntityName     { get; set; } = string.Empty;   // اسم المقاول أو الاستشاري
        public int    TotalOrders    { get; set; }   // عدد أوامر العمل
        public double EstimatedValue { get; set; }   // إجمالي قيمة بنود الأعمال (TotalPrice)
        public double ActualValue    { get; set; }   // إجمالي الأعمال المنفذة (ExecutedWorksValue)
    }

    /// <summary>إحصائيات المستخدمين مفلترة بالفرع</summary>
    public class FilteredUsersStatsDto
    {
        public int Total { get; set; }
        public int WithCanCreateOutsideCity { get; set; }
        public List<StatusCountDto> PerUserType { get; set; } = new();
        public List<BranchedStatusCountDto> PerUserTypeBranched { get; set; } = new();
    }

    /// <summary>إحصائيات الموظفين والمهندسين مفلترة بالفرع</summary>
    public class FilteredEmployeesStatsDto
    {
        public int Total { get; set; }
        public int EngineersTotal { get; set; }
        public int EngineersWithExpiredResidence { get; set; }
        public int EngineersWithExpiringResidence { get; set; }
        public List<StatusCountDto> EngineersPerSpecialization { get; set; } = new();
        public List<StatusCountDto> EngineersPerJobTitle { get; set; } = new();
    }

}
