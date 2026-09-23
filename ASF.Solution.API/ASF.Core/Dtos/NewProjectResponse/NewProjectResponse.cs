using ASF.Core.DTOs.Pricing;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.NewProject;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos.NewProjectResponse
{
    public class NewProjectResponse
    {

        public string? EstimatedValue { get; set; }
        public string? ActualValue { get; set; }
        public string? ExtractNumber { get; set; }
        public string? ProjectPlace { get; set; }
        public double? CableLength { get; set; }
        public string? CableCompletion { get; set; }
        public string? Office { get; set; }
        public string? ProjectValue { get; set; }
        public string Situation { get; set; }
        public string? ContractNumber { get; set; } // لازم تتأكد إنها موجودة هنا

        public DateTime ReceiveDateTime { get; set; }
        public string WorkOrderType { get; set; }// نوع امر العمل
        public string? WorkDescription { get; set; }// وصف العمل
        public int? StationNumber { get; set; }// رقم المحطة
        public int DurationOfImplementation { get; set; }// مدة التنفيذ

        public string OrderType { get; set; }
        [NotMapped]
        public string Type { get; set; } = "أعمال التاهيل";
        public int Id { get; set; }
        public string ProjectType { get; set; }
        public string OrderNumber { get; set; }
        public string FaultNumber { get; set; }
        public string District { get; set; }
        public string Contractor { get; set; }
        public string Consultant { get; set; }
        public string? ProjectOwner { get; set; }
        public string? ProjectParty { get; set; }
        public string AppUserId { get; set; }
        public string UserName { get; set; }
        public string UserImage { get; set; }
        public string BranchName { get; set; }
        public DateTime? OrderDate { get; set; }
        public bool SafetyViolationsExist { get; set; }
        public string? Note { get; set; }
        public bool IsArchived { get; set; }
        public string? QualificationClassification { get; set; }
        public string? Coordinates { get; set; }
        public bool? IsApprove { get; set; } = true;
        public string? UserApproveId { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreateAt { get; set; }

        public List<ModelPhotoForNew>? ModelPhotos { get; set; }
        public List<SitePhotoForNew>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForNew>? SafetyWastePhotos { get; set; }
        public List<PricingItemResponseDto> PricingItems { get; set; } = new();
        public List<OperationChangeDto> Logs { get; set; } = new();
    }
}
