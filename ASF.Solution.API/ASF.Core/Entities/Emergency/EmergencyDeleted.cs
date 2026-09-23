using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities.Emergency
{
    public class EmergencyDeleted
    {
        public int Id { get; set; }
        public string WorkOrderType { get; set; }
        public string WorkDescription { get; set; }
        public string? StationNumber { get; set; }
        public string DurationOfImplementation { get; set; }
        public string FaultNumber { get; set; }

        public string District { get; set; }
        [NotMapped]
        public string Type { get; set; } = "الطوارئ";
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
        public string? DescriptionViolation { get; set; }

        public int? NumberOfEquipment { get; set; }

        public bool? IsApprove { get; set; } = true;
        public string? UserApproveId { get; set; }

        public string? ImplementationPhase { get; set; }
        public string? NotificationNumber { get; set; }
        public string? TaskNumber { get; set; }
        public string? TypeOfStomachTest { get; set; }

        public DateTime ReceiveDateTime { get; set; }
        public List<ModelPhotoForDeletedEmergency> ModelPhotos { get; set; }
        public List<ModelTestForDeletedEmergency> TestModels { get; set; }
        public List<SitePhotoForDeletedEmergency>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForDeletedEmergency>? SafetyWastePhotos { get; set; }
        public EmergencyDeleted()
        {
            TestModels = new List<ModelTestForDeletedEmergency>();
            ModelPhotos = new List<ModelPhotoForDeletedEmergency>();
            SitePhotos = new List<SitePhotoForDeletedEmergency>();
            SafetyWastePhotos = new List<SafetyWastePhotoForDeletedEmergency>();
        }
    }
}
