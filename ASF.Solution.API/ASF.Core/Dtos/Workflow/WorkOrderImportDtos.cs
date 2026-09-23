using System.ComponentModel.DataAnnotations;

namespace ASF.Core.DTOs.Workflow
{
    /// <summary>
    /// صف واحد من ملف الإكسل، كما قرأته الواجهة.
    ///
    /// كل الحقول نصوص: الملف قد يحمل تاريخاً بصيغة غير متوقّعة أو رقماً مكتوباً
    /// نصاً، والتحقّق هنا يقرّر ما يصلح بدل أن ينهار التحويل عند القراءة.
    /// </summary>
    public class WorkOrderImportRowDto
    {
        /// <summary>رقم الصف في الملف، ليشير إليه تقرير الأخطاء.</summary>
        public int RowNumber { get; set; }

        public string? OrderNumber { get; set; }      // رقم أمر العمل
        public string? WorkOrderType { get; set; }    // نوع أمر العمل
        public string? Description { get; set; }      // وصف العمل
        public string? District { get; set; }         // الحي
        public string? Contractor { get; set; }       // المقاول
        public string? Duration { get; set; }         // مدة التنفيذ
        public string? ReceivedAt { get; set; }       // تاريخ الاستلام
        public string? CompletionDate { get; set; }   // تاريخ الإنجاز
        public string? ContractNumber { get; set; }   // رقم العقد
        public string? StationNumber { get; set; }    // رقم المحطة
        public string? EstimatedValue { get; set; }   // القيمة التقديرية
        public string? Consultant { get; set; }       // الاستشاري
        public string? Note { get; set; }             // ملاحظات
    }

    public class WorkOrderImportRequestDto
    {
        public int ContractId { get; set; }

        /// <summary>القسم يحدّد نوع المشروع الذي تُكتب فيه الصفوف.</summary>
        public int DepartmentId { get; set; }

        public List<WorkOrderImportRowDto> Rows { get; set; } = new();

        /// <summary>true = تحقّق بلا كتابة. هو الافتراضي.</summary>
        public bool DryRun { get; set; } = true;

        /// <summary>تخطّي الصفوف التي يوجد أمر عمل بنفس رقمها بدل رفضها.</summary>
        public bool SkipDuplicates { get; set; } = true;
    }

    /// <summary>نتيجة صف واحد بعد التحقّق أو الكتابة.</summary>
    public class WorkOrderImportRowResultDto
    {
        public int RowNumber { get; set; }
        public string? OrderNumber { get; set; }

        /// <summary>Valid | Duplicate | Error | Created</summary>
        public string Status { get; set; }

        public List<string> Errors { get; set; } = new();

        /// <summary>
        /// ملاحظات لا تمنع الاستيراد: حقل غير متوفّر في الملف فتُرك فارغاً.
        /// تُفصل عن الأخطاء لأن الصف يُنشأ رغمها.
        /// </summary>
        public List<string> Notes { get; set; } = new();

        /// <summary>معرّف أمر العمل بعد إنشائه.</summary>
        public int? WorkOrderId { get; set; }

        /// <summary>السلة التي دخلها بعد الإنشاء.</summary>
        public string? BasketName { get; set; }
    }

    public class WorkOrderImportResultDto
    {
        public bool DryRun { get; set; }
        public string ProjectTypeCode { get; set; }
        public string DepartmentName { get; set; }
        public string ContractName { get; set; }

        public int TotalRows { get; set; }
        public int ValidRows { get; set; }
        public int DuplicateRows { get; set; }
        public int ErrorRows { get; set; }
        public int CreatedRows { get; set; }

        /// <summary>اسم أول سلة في المسار المعتمد، حيث ستدخل أوامر العمل.</summary>
        public string? EntryBasketName { get; set; }

        /// <summary>تحذير عام يمنع الاستيراد، مثل غياب مسار معتمد.</summary>
        public string? Blocker { get; set; }

        public List<WorkOrderImportRowResultDto> Rows { get; set; } = new();
    }
}
