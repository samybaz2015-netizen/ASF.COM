using ASF.Core.Entities.Emergency;
using ASF.Core.Entities.Pricing;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities.Emergency
{
    public class Emergency : IProjectEntity, IListLinkedWorkOrder
    {
        private static int _orderCodeCounter = 1;
        public string WorkOrderType { get; set; }
        public string WorkDescription { get; set; }
        public string? StationNumber { get; set; }
        public string DurationOfImplementation { get; set; }
        [NotMapped]
        public string Type { get; set; } = "الطوارئ";
        public string? OrderType { get; set; }
        public int Id { get; set; }
        [NotMapped]
        public string OrderCode => $"P{Id}";
        public string FaultNumber { get; set; }
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

        public string? Consultant { get; set; }
        public string? ProjectOwner { get; set; } // مالك المشروع
        public string? ProjectParty { get; set; } // الطرف (مقاول/مهندس/مشرف)
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
        public string? Situation { get; set; }
        public DateTime ReceiveDateTime { get; set; }
        public string? Coordinates { get; set; }
        public string? DescriptionViolation { get; set; }
        public string? ImplementationPhase { get; set; }
        public string? NotificationNumber { get; set; }
        public string? TaskNumber { get; set; }
        public string? TypeOfStomachTest { get; set; }
        public int? NumberOfEquipment { get; set; }
        public bool? IsApprove { get; set; } = true;
        public string? UserApproveId { get; set; }
        public List<ModelPhotoForEmergency>? ModelPhotos { get; set; }
        public List<ModelTestForEmergency>? TestModels { get; set; }
        public List<SitePhotoForEmergency>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForEmergency>? SafetyWastePhotos { get; set; }

        // البنود التسعيرية
        public List<EmergencyPricingItem>? EmergencyPricingItems { get; set; }

        public Emergency()
        {
            ModelPhotos = new List<ModelPhotoForEmergency>();
            SitePhotos = new List<SitePhotoForEmergency>();
            SafetyWastePhotos = new List<SafetyWastePhotoForEmergency>();
            TestModels = new List<ModelTestForEmergency>();
            EmergencyPricingItems = new List<EmergencyPricingItem>();
        }

        public string? RejectionReason { get; set; }
    }

    // جدول الربط
    public class EmergencyPricingItem : IProjectPricingItem
    {
        public int Id { get; set; }
        public int EmergencyId { get; set; }

        public Emergency Emergency { get; set; }
        public int PricingItemId { get; set; }
        public PricingItem PricingItem { get; set; }

        public double? EstimatedQuantity { get; set; }      // الكمية التقديرية
        public double? ExecutedQuantity { get; set; }       // الكمية المنفذة
        public double? TotalPrice { get; set; }             // اجمالي السعر
        public double? ExecutionPercentage { get; set; }    // نسبة التنفيذ
        public double? ExecutedWorksValue { get; set; }     // قيمة الاعمال المنفذة
    }
}