using ASF.Core.DTOs.Pricing;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.NewProject;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos.ConstructionResponse
{
    public class ConstructionResponse
    {
        public string? EstimatedValue { get; set; }
        public string? ActualValue { get; set; }
        public string? ExtractNumber { get; set; }
        public string? ProjectPlace { get; set; }
        public string? Office { get; set; }
        public string? ProjectValue { get; set; }
        public string? ContractNumber { get; set; } // لازم تتأكد إنها موجودة هنا
        public string Situation { get; set; }
        public DateTime ReceiveDateTime { get; set; }
        public string WorkOrderType { get; set; }// نوع امر العمل
        public string WorkDescription { get; set; }// وصف العمل
        public string DurationOfImplementation { get; set; }// مدة التنفيذ
        public string? ImplementationPhase { get; set; }

        public string OrderType { get; set; }
        [NotMapped]
        public string Type { get; set; } = "الإنشاءات";
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

        public string CompletionDate { get; set; }
        public string NumberOfDaysDelayed { get; set; }
        public string NumberOfDaysRemaining { get; set; }
        public string? CompletionStatusReport { get; set; }
        public double? ProjectExcavationLength { get; set; }
        public double? DailyExcavationLength { get; set; }
        public double? ExcavationLength { get; set; }
        public string? DescriptionViolation { get; set; }
        public string? TypeOfStomachTest { get; set; }
        public string? StationNumber { get; set; }
        public string? Coordinates { get; set; }
        public int? NumberOfEquipment { get; set; }


        public string? CableCompletion { get; set; }
        public double? ProjectCableLength { get; set; }
        public double? DailyCableLength { get; set; }
        public double? CableLength { get; set; }


        public bool? IsApprove { get; set; } = true;
        public string? UserApproveId { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreateAt { get; set; }
        public List<ModelTestForConstruction>? TestModels { get; set; }
        public List<ModelPhotoForConstruction>? ModelPhotos { get; set; }
        public List<SitePhotoForConstruction>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForConstruction>? SafetyWastePhotos { get; set; }
        public List<PricingItemResponseDto> PricingItems { get; set; } = new();
        public List<OperationChangeDto> Logs { get; set; } = new();
    }
}
