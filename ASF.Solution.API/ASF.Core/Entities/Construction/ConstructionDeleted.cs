using ASF.Core.Entities.NewProject;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities.Construction
{
    public class ConstructionDeleted
    {
        public int Id { get; set; }
        public string WorkOrderType { get; set; }
        public string WorkDescription { get; set; }
        [NotMapped]
        public string Type { get; set; } = "الإنشاءات";
        public string DurationOfImplementation { get; set; }
        public string FaultNumber { get; set; }
        public string? StationNumber { get; set; }

        public string District { get; set; }
        public string Contractor { get; set; }
        public string? Consultant { get; set; }
        public string AppUserId { get; set; }
        public string UserName { get; set; }
        public string UserImage { get; set; }
        public string BranchName { get; set; }
        public DateTime? OrderDate { get; set; }
        public bool SafetyViolationsExist { get; set; }
        public string? Note { get; set; }
        public bool IsArchived { get; set; }
        public DateTime CreateAt { get; set; }
        public string? EstimatedValue { get; set; }
        public string? ActualValue { get; set; }
        public string? ExtractNumber { get; set; }
        public string? ProjectPlace { get; set; }
        public string? Office { get; set; }
        public string? ContractNumber { get; set; }
        public string? ProjectValue { get; set; }
        public string Situation { get; set; }
        public string? Coordinates { get; set; }
        public string? ImplementationPhase { get; set; }


        public string CompletionDate { get; set; }
        public string NumberOfDaysDelayed { get; set; }
        public string NumberOfDaysRemaining { get; set; }
        public string CompletionStatusReport { get; set; }
        public double? ProjectExcavationLength { get; set; }
        public double? DailyExcavationLength { get; set; }
        public double? ExcavationLength { get; set; }
        public string? DescriptionViolation { get; set; }
        public string? TypeOfStomachTest { get; set; }
        public string? OrderType { get; set; }
        public int? NumberOfEquipment { get; set; }


        public string? CableCompletion { get; set; }
        public double? ProjectCableLength { get; set; }
        public double? DailyCableLength { get; set; }
        public double? CableLength { get; set; }


        public bool? IsApprove { get; set; }
        public string? UserApproveId { get; set; }

        public DateTime ReceiveDateTime { get; set; }
        public List<ModelPhotoForDeletedConstruction> ModelPhotos { get; set; }
        public List<ModelTestForDeletedConstruction> TestModels { get; set; }
        public List<SitePhotoForDeletedConstruction>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForDeletedConstruction>? SafetyWastePhotos { get; set; }
        public ConstructionDeleted()
        {
            ModelPhotos = new List<ModelPhotoForDeletedConstruction>();
            TestModels = new List<ModelTestForDeletedConstruction>();
            SitePhotos = new List<SitePhotoForDeletedConstruction>();
            SafetyWastePhotos = new List<SafetyWastePhotoForDeletedConstruction>();
        }
    }
}
