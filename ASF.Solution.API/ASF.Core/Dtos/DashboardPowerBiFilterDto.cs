using System;
using System.Collections.Generic;

namespace ASF.Core.Dtos.Dashboard
{
    public class DashboardFilterDto
    {
        /// <summary>اسم الفرع (جدة / الرياض) - اختياري، لو فاضي بيرجع كل الفروع</summary>
        public string? BranchName { get; set; }

        /// <summary>اسم المكتب الفرعي (مثال: وسط جدة، جنوب جدة) - اختياري</summary>
        public string? Office { get; set; }

        /// <summary>قيمة مرحلة التنفيذ (Situation) - اختياري</summary>
        public string? Situation { get; set; }

        /// <summary>هل العمل منتهي (IsArchived) - null = الاتنين، true = المنتهية فقط، false = الغير منتهية فقط</summary>
        public bool? IsFinished { get; set; }

        /// <summary>بداية الفترة الزمنية (شامل) / تاريخ الاستلام</summary>
        public DateTime? FromDate { get; set; }

        /// <summary>نهاية الفترة الزمنية (شامل) / تاريخ الاستلام</summary>
        public DateTime? ToDate { get; set; }

        /// <summary>نوعية تجميع الفترة في الرسم البياني للاتجاه الزمني</summary>
        public PeriodGroupType PeriodType { get; set; } = PeriodGroupType.Month;

        /// <summary>نوع الإنشاء (مشاريع / توصيلات) - بيتفعل بس لو الفئة إنشاءات</summary>
        public string? ConstructionType { get; set; }

        /// <summary>رقم العقد / رقم العطل / رقم المستخلص - اختياري</summary>
        public string? ContractNumber { get; set; }

        /// <summary>المشترك / مالك المشروع / العميل (pdc / الكهرباء / خاص) - اختياري</summary>
        public string? Subscriber { get; set; }

        /// <summary>نوع الأعمال (إيصال / إحلال / ربط / تعزيز / عمليات وصيانة / طوارئ) - اختياري</summary>
        public string? WorkType { get; set; }

        /// <summary>قائمة أرقام العقود المحددة للفلترة التعددية</summary>
        public List<string>? ContractNumbers { get; set; }
    }

    public enum PeriodGroupType
    {
        Day = 1,
        Month = 2,
        Year = 3
    }

    // ==========================================================
    //  الإحصائيات الأساسية القابلة لإعادة الاستخدام
    // ==========================================================
    public class ValueStatsDto
    {
        public int Count { get; set; }
        public decimal EstimatedValue { get; set; }
        public decimal ActualValue { get; set; }
    }

    public class FinishedStatsDto
    {
        public ValueStatsDto Finished { get; set; } = new();
        public ValueStatsDto Unfinished { get; set; } = new();
        public ValueStatsDto Total { get; set; } = new();
    }

    // إحصائية مرتبطة بقيمة نصية (مرحلة / فرع / مكتب / فترة ...)
    public class LabeledStatDto
    {
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal EstimatedValue { get; set; }
        public decimal ActualValue { get; set; }
    }

    // ==========================================================
    //  عنصر جدول الملخص الرئيسي (مطابق للجدول في الصورة)
    // ==========================================================
    public class CategorySummaryItemDto
    {
        public string CategoryKey { get; set; } = string.Empty;   // constructions, emergency, operationsMaintenance, privateProjects, total
        public string CategoryName { get; set; } = string.Empty;  // الإنشاءات، الطوارئ، صيانة وعمليات، خاص، الإجمالي
        public int TotalRequests { get; set; }                    // إجمالي عدد الطلبات
        public decimal EstimatedValue { get; set; }               // القيمة التقديرية
        public decimal ActualValue { get; set; }                  // القيمة الفعلية
        public decimal TotalWorksValue { get; set; }              // إجمالي قيمة الأعمال
    }

    /// <summary>
    /// مصفوفة الملخص الرئيسي المطابقة للجدول الإحصائي (الإنشاءات، الطوارئ، صيانة وعمليات، خاص، الإجمالي)
    /// </summary>
    public class SummaryMatrixDto
    {
        /// <summary>الإنشاءات</summary>
        public CategorySummaryItemDto Constructions { get; set; } = new();

        /// <summary>الطوارئ</summary>
        public CategorySummaryItemDto Emergency { get; set; } = new();

        /// <summary>صيانة وعمليات</summary>
        public CategorySummaryItemDto OperationsMaintenance { get; set; } = new();

        /// <summary>خاص (المشاريع الخاصة)</summary>
        public CategorySummaryItemDto PrivateProjects { get; set; } = new();

        /// <summary>الإجمالي العام</summary>
        public CategorySummaryItemDto Total { get; set; } = new();
    }

    // ==========================================================
    //  تفاصيل فئة عمل (إنشاءات / عمليات وصيانة / أعمال أخرى)
    // ==========================================================
    public class CategoryDashboardDto
    {
        public string CategoryName { get; set; } = string.Empty; // "الإنشاءات" / "عمليات وصيانة" / "أعمال أخرى"
        public FinishedStatsDto Stats { get; set; } = new();

        /// <summary>تقسيم فرعي: نوع الإنشاء (مشاريع/توصيلات) أو نوع الكيان (صيانة/طوارئ) أو (تأهيل/خاص)</summary>
        public List<LabeledStatDto> SubTypes { get; set; } = new();

        /// <summary>توزيع الفئة على مراحل التنفيذ (Situation)</summary>
        public List<LabeledStatDto> StageBreakdown { get; set; } = new();
    }

    // ==========================================================
    //  صفحة الداشبورد الرئيسية (كل الشركة / كل الفروع)
    // ==========================================================
    public class OverviewDashboardDto
    {
        /// <summary>معلومات التاريخ الحالي (اليوم/الشهر/السنة) بتوقيت السيرفر</summary>
        public CurrentPeriodDto CurrentPeriod { get; set; } = new();

        /// <summary>مصفوفة الملخص الرئيسي (مطابقة للجدول الإحصائي بالألوان في الداشبورد)</summary>
        public SummaryMatrixDto SummaryMatrix { get; set; } = new();

        /// <summary>قائمة مسطحة بالملخص الرئيسي لسهولة ربطه وعرضه في Power BI أو أي شاشة</summary>
        public List<CategorySummaryItemDto> SummaryMatrixList { get; set; } = new();

        public FinishedStatsDto Overall { get; set; } = new();

        /// <summary>توزيع إجمالي حسب مراحل التنفيذ - ده اللي بيغذي الرسم البياني المتفق عليه</summary>
        public List<LabeledStatDto> StageBreakdown { get; set; } = new();

        /// <summary>توزيع حسب الفروع (جدة / الرياض / ...)</summary>
        public List<LabeledStatDto> BranchBreakdown { get; set; } = new();

        /// <summary>توزيع حسب الفئات الرئيسية</summary>
        public List<CategoryDashboardDto> Categories { get; set; } = new();

        /// <summary>الاتجاه الزمني حسب PeriodType المختار (يوم/شهر/سنة)</summary>
        public List<LabeledStatDto> PeriodTrend { get; set; } = new();
    }

    // ==========================================================
    //  صفحة داشبورد فرع مُحدد (جدة أو الرياض)
    // ==========================================================
    public class BranchDashboardDto
    {
        public CurrentPeriodDto CurrentPeriod { get; set; } = new();

        public string BranchName { get; set; } = string.Empty;
        public FinishedStatsDto Overall { get; set; } = new();

        /// <summary>توزيع حسب المكاتب الفرعية داخل الفرع</summary>
        public List<LabeledStatDto> OfficeBreakdown { get; set; } = new();

        public List<LabeledStatDto> StageBreakdown { get; set; } = new();

        public List<CategoryDashboardDto> Categories { get; set; } = new();

        public List<LabeledStatDto> PeriodTrend { get; set; } = new();
    }

    // ==========================================================
    //  خيارات الفلاتر (تتجاب مرة عشان تتعرض في Power BI Slicers)
    // ==========================================================
    public class DashboardFilterOptionsDto
    {
        public List<string> Branches { get; set; } = new();
        public List<string> Offices { get; set; } = new();
        public List<string> Situations { get; set; } = new();
        public List<string> ConstructionTypes { get; set; } = new();
        public List<string> Subscribers { get; set; } = new();
        public List<string> WorkTypes { get; set; } = new();
        public List<string> ContractNumbers { get; set; } = new();
    }

    // ==========================================================
    //  التاريخ/الفترة الحالية - مفيدة لضبط قيم افتراضية للفلاتر
    // ==========================================================
    public class CurrentPeriodDto
    {
        public DateTime Today { get; set; }

        public int Day { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }

        public string MonthNameArabic { get; set; } = string.Empty;

        public DateTime StartOfToday { get; set; }
        public DateTime EndOfToday { get; set; }

        public DateTime StartOfMonth { get; set; }
        public DateTime EndOfMonth { get; set; }

        public DateTime StartOfYear { get; set; }
        public DateTime EndOfYear { get; set; }

        public DateTime StartOfWeek { get; set; }
        public DateTime EndOfWeek { get; set; }
    }
}