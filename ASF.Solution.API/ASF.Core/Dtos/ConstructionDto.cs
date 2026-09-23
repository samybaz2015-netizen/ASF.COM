using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class ConstructionDto
    {
        [RegularExpression("^[0-9]+$", ErrorMessage = "رقم المستخلص يجب أن يحتوي على أرقام فقط.")]
        public string? ExtractNumber { get; set; }    // رقم المستخلص
        [RegularExpression("^[0-9]+$", ErrorMessage = "رقم امر العمل يجب أن يحتوي على أرقام فقط.")]
        public string? FaultNumber { get; set; }
        public DateTime? OrderDate { get; set; }
        public string? District { get; set; }
        public string? Contractor { get; set; }
        public string? Consultant { get; set; }
        public string? ProjectOwner { get; set; }
        public string? ProjectParty { get; set; }
        public string? WorkDescription { get; set; }
        public string? StationNumber { get; set; }

        public bool? SafetyViolationsExist { get; set; }
        public bool? isArchive { get; set; }

        public string? Note { get; set; }
        public string? OrderType { get; set; }

        public List<IFormFile>? ModelPhotos { get; set; }
        public List<IFormFile>? SitePhotos { get; set; }
        public List<IFormFile>? SafetyWastePhotos { get; set; }
        public List<IFormFile>? TestModels { get; set; }
        public string? ImplementationPhase { get; set; }
        public string? TypeOfStomachTest { get; set; }
        public int? NumberOfEquipment { get; set; }

        public string? Office { get; set; }
        public string? ProjectPlace { get; set; }
        public string? ContractNumber { get; set; }
        public string? WorkOrderType { get; set; }// نوع امر العمل
       
        [RegularExpression("^[0-9]+$", ErrorMessage = "مدة التنفيذ يجب أن يحتوي على أرقام فقط.")]
        public string? DurationOfImplementation { get; set; }// مدة التنفيذ
        public string? Situation { get; set; }
        public DateTime? ReceiveDateTime { get; set; }
        public string? Coordinates { get; set; }

        //جديد 
        /// <summary>
        /// تاريخ الإنجاز. صار اختيارياً لأن القالب يحسب تاريخ التسليم
        /// المتوقّع من تاريخ الإسناد ومدة التنفيذ، فلا يُطلب من المدخِل مرتين.
        /// </summary>
        public string? CompletionDate { get; set; }
        public string? DescriptionViolation { get; set; }



        // أطوال الحفر والكابل لا ترد في قالب الإنشاء الجديد، فصارت اختيارية
        // وتُدخَل من شاشة أمر العمل أو التحديث اليومي.
        public double? ProjectExcavationLength { get; set; }
        public double? DailyExcavationLength { get; set; }


        public double? ProjectCableLength { get; set; }
        public double? DailyCableLength { get; set; }

        // ───── حقول قالب إنشاء أمر العمل ─────

        public string? TaskNumber { get; set; }          // رقم الطلب / رقم المهمة
        public string? WorkOrderCode { get; set; }       // رمز أمر العمل
        public string? Priority { get; set; }            // الأولوية
        public string? VoltageLevel { get; set; }        // الجهد LV / MV
        public string? PlotNumber { get; set; }          // رقم القطعة
        public string? PlanNumber { get; set; }          // رقم المخطط
        public string? SubscriberName { get; set; }      // اسم المشترك
        public DateTime? ApprovalDate { get; set; }      // تاريخ الاعتماد

        /// <summary>
        /// حفظ كمسودة: لا يدخل المسار ولا يظهر في المتابعة حتى يُرسَل.
        /// </summary>
        public bool IsDraft { get; set; }

        public List<ConstructionPricingItemDto>? PricingItems { get; set; }

        public int? BranchId { get; set; }
        public string? BranchName { get; set; }
    }
    public class ConstructionPricingItemDto
    {
        public int PricingItemId { get; set; }
        public double? EstimatedQuantity { get; set; }      // الكمية التقديرية
        public double? TotalPrice { get; set; }             // اجمالي السعر
        public double? ExecutedQuantity { get; set; }       // الكمية المنفذة
        public double? ExecutionPercentage { get; set; }    // نسبة التنفيذ
        public double? ExecutedWorksValue { get; set; }     // قيمة الاعمال المنفذة
    }
    // DTO لتحديث الكميات المنفذة على مشروع (batch)
    public class UpdateExecutedQuantitiesDto
    {
        /// <summary>ملاحظة / سبب هذا التحديث (اختياري)</summary>
        public string? Note { get; set; }

        /// <summary>قائمة البنود المراد تحديثها</summary>
        public List<UpdateExecutedQuantityItemDto> Items { get; set; } = new();
    }

    public class UpdateExecutedQuantityItemDto
    {
        public int PricingItemId { get; set; }
        public double ExecutedQuantity { get; set; }  // الكمية المنفذة الجديدة
    }

    // نبقي الـ DTO القديم للتوافق مع الكود الموجود (single-item)
    public class UpdateExecutedQuantityDto
    {
        public int PricingItemId { get; set; }
        public double ExecutedQuantity { get; set; }  // الكمية المنفذة الجديدة
        public string? Note { get; set; }             // ملاحظة / سبب التحديث
    }
}
