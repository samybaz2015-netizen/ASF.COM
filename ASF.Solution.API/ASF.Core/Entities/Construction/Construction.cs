using ASF.Core.Entities.NewProject;
using ASF.Core.Entities.Pricing;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace ASF.Core.Entities.Construction
{
    public class Construction : IProjectEntity, IListLinkedWorkOrder
    {
        private static int _orderCodeCounter = 1;
        public string WorkOrderType { get; set; }// نوع امر العمل
        public string WorkDescription { get; set; }// وصف العمل

        public string DurationOfImplementation { get; set; }// مدة التنفيذ
        [NotMapped]
        public string Type { get; set; } = "الإنشاءات";
        public string? OrderType { get; set; }
        public int Id { get; set; }
        [NotMapped]
        public string OrderCode => $"P{Id}";
        public string FaultNumber { get; set; }
        public string? StationNumber { get; set; }
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
        // ───── حقول قالب إنشاء أمر العمل ─────
        // أُضيفت لنموذج الإدخال الجديد، وكلها اختيارية فلا تُبطل أوامر العمل القائمة.

        /// <summary>رقم الطلب أو رقم المهمة لدى الجهة المالكة.</summary>
        public string? TaskNumber { get; set; }

        /// <summary>رمز أمر العمل المعتمد.</summary>
        public string? WorkOrderCode { get; set; }

        /// <summary>عادية | عاجلة | حرجة.</summary>
        public string? Priority { get; set; }

        /// <summary>
        /// الجهد: LV أو MV. يحدّد أي سلة تطبيقات تظهر لأمر العمل في المسار.
        /// </summary>
        public string? VoltageLevel { get; set; }

        /// <summary>رقم القطعة.</summary>
        public string? PlotNumber { get; set; }

        /// <summary>رقم المخطط.</summary>
        public string? PlanNumber { get; set; }

        /// <summary>اسم المشترك.</summary>
        public string? SubscriberName { get; set; }

        /// <summary>تاريخ اعتماد أمر العمل — اختياري عند الإنشاء.</summary>
        public DateTime? ApprovalDate { get; set; }

        /// <summary>
        /// مسودة لم تُرسَل بعد. المسودة لا تدخل مسار السلال ولا تظهر في المتابعة.
        /// </summary>
        public bool IsDraft { get; set; }

        public string? ContractNumber { get; set; }
        public string? ProjectValue { get; set; }
        public string Situation { get; set; }
        public DateTime ReceiveDateTime { get; set; }
        public string? Coordinates { get; set; }
        //الجديد 
        public string CompletionDate { get; set; }
        public string NumberOfDaysDelayed { get; set; }
        public string NumberOfDaysRemaining { get; set; }
        public string? CompletionStatusReport { get; set; }
        public double? ProjectExcavationLength { get; set; }
        public double? DailyExcavationLength { get; set; }
        public double? ExcavationLength { get; set; }
        public string? ImplementationPhase { get; set; }
        public string? DescriptionViolation { get; set; }
        public string? TypeOfStomachTest { get; set; }
        public int? NumberOfEquipment { get; set; }


        public string? CableCompletion { get; set; }
        public double? ProjectCableLength { get; set; }
        public double? DailyCableLength { get; set; }
        public double? CableLength { get; set; }


        public bool? IsApprove {  get; set; } = true;
        public string? UserApproveId {  get; set; }
        public string? RejectionReason { get; set; }



        public List<ModelTestForConstruction>? TestModels { get; set; }
        public List<ModelPhotoForConstruction>? ModelPhotos { get; set; }
        public List<SitePhotoForConstruction>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForConstruction>? SafetyWastePhotos { get; set; }
        public Construction()
        {
            ModelPhotos = new List<ModelPhotoForConstruction>();
            SitePhotos = new List<SitePhotoForConstruction>();
            SafetyWastePhotos = new List<SafetyWastePhotoForConstruction>();
            TestModels = new List<ModelTestForConstruction>();
            ConstructionPricingItems = new List<ConstructionPricingItem>();

        }

        public List<ConstructionPricingItem>? ConstructionPricingItems { get; set; }


    }
    // ASF.Core.Entities.Construction
    public class ConstructionPricingItem : IProjectPricingItem
    {
        public int ConstructionId { get; set; }
        [JsonIgnore]
        public Construction Construction { get; set; }

        public int PricingItemId { get; set; }
        public PricingItem PricingItem { get; set; }

        // الحقول الجديدة
        public double? EstimatedQuantity { get; set; }      // الكمية التقديرية
        public double? ExecutedQuantity { get; set; }       // الكمية المنفذة
        public double? TotalPrice { get; set; }             // اجمالي السعر
        public double? ExecutionPercentage { get; set; }    // نسبة التنفيذ
        public double? ExecutedWorksValue { get; set; }     // قيمة الاعمال المنفذة
    }
}
