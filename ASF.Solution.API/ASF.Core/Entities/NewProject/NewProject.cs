using ASF.Core.Entities.Pricing;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities.NewProject
{
    public class NewProject : IProjectEntity, IListLinkedWorkOrder
    {
        private static int _orderCodeCounter = 1;
        public string WorkOrderType { get; set; }
        public string? WorkDescription { get; set; }
        public string DurationOfImplementation { get; set; }
        [NotMapped]
        public string Type { get; set; } = "أعمال التاهيل";
        public int Id { get; set; }
        [NotMapped]
        public string OrderCode => $"P{Id}";
        public string FaultNumber { get; set; }
        public string QualificationClassification { get; set; }
        public string District { get; set; }
        public string Contractor { get; set; }

        // ─────── الربط بقوائم العقد ───────
        //
        // الأعمدة النصّية أعلاه تبقى كما هي — كل شاشة وتقرير وتصدير يقرأ منها،
        // وتغييرها كلّها دفعةً واحدة خطرٌ بلا داعٍ. تُضاف بجانبها معرّفات تشير
        // إلى قيمة القائمة، فإذا أُعيدت تسمية القيمة حُدِّث النصّ هنا تبعاً لها.
        //
        // النتيجة: التسمية الجديدة تظهر في كل مكان فوراً، والمطابقة تجري
        // بالمعرّف لا بالنصّ — فلا يُخطئها فرق مسافة أو همزة.
        //
        // فارغ = أمر عمل أُنشئ قبل الربط، أو قيمة لا تقابلها قائمة.
        public int? DistrictRefId { get; set; }
        public int? ContractorRefId { get; set; }
        public int? WorkOrderTypeRefId { get; set; }

        public string? StationNumber { get; set; }
        public string? Consultant { get; set; }
        public string? ProjectOwner { get; set; } // مالك المشروع
        public string? ProjectParty { get; set; } // الطرف (مقاول/مهندس/مشرف)
        public string? OrderType { get; set; }
        public string AppUserId { get; set; }
        public string UserName { get; set; }
        public string? UserImage { get; set; }
        public string? BranchName { get; set; }
        public DateTime? OrderDate { get; set; }
        public bool SafetyViolationsExist { get; set; }
        public string? Note { get; set; }
        public bool IsArchived { get; set; }
        public string? EstimatedValue { get; set; }
        public string? ActualValue { get; set; }

        // ─────── القيم المالية كأرقام ───────
        //
        // العمودان النصّيان أعلاه يقبلان «١٢٬٠٠٠» و«12000 ريال» و«» — ولا
        // يُجمعان. تُشتقّ منهما قيمتان رقميتان عند الحفظ، فتكون المؤشّرات
        // قابلة للجمع والمقارنة دون تغيير ما يكتبه المستخدم.
        //
        // فارغ = النصّ فارغ أو غير قابل للقراءة رقماً.
        public decimal? EstimatedAmount { get; set; }
        public decimal? ActualAmount { get; set; }

        public string? ExtractNumber { get; set; }
        public DateTime CreateAt { get; set; }
        public string? ProjectPlace { get; set; }
        public string? Office { get; set; }
        public string? ContractNumber { get; set; }
        public string? ProjectValue { get; set; }
        public string Situation { get; set; }
        public DateTime ReceiveDateTime { get; set; }
        public string? Coordinates { get; set; }
        public bool? IsApprove { get; set; } = true;
        public string? UserApproveId { get; set; }
        public string? RejectionReason { get; set; }
        public List<ModelPhotoForNew>? ModelPhotos { get; set; }
        public List<SitePhotoForNew>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForNew>? SafetyWastePhotos { get; set; }

        // البنود التسعيرية
        public List<NewProjectPricingItem>? NewProjectPricingItems { get; set; }

        public NewProject()
        {
            ModelPhotos = new List<ModelPhotoForNew>();
            SitePhotos = new List<SitePhotoForNew>();
            SafetyWastePhotos = new List<SafetyWastePhotoForNew>();
            NewProjectPricingItems = new List<NewProjectPricingItem>();
        }
    }

    // جدول الربط
    public class NewProjectPricingItem : IProjectPricingItem
    {
        public int Id { get; set; }
        public int NewProjectId { get; set; }
        public NewProject NewProject { get; set; }
        public int PricingItemId { get; set; }
        public PricingItem PricingItem { get; set; }

        public double? EstimatedQuantity { get; set; }      // الكمية التقديرية
        public double? ExecutedQuantity { get; set; }       // الكمية المنفذة
        public double? TotalPrice { get; set; }             // اجمالي السعر
        public double? ExecutionPercentage { get; set; }    // نسبة التنفيذ
        public double? ExecutedWorksValue { get; set; }     // قيمة الاعمال المنفذة
    }
}