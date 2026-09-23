using ASF.Core.Entities.Maintenance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities.Maintenance
{
    public class MaintenanceDeleted
    {
        public int Id { get; set; }
        public string WorkOrderType { get; set; }
        public string WorkDescription { get; set; }
        public string DurationOfImplementation { get; set; }
        public string Type { get; set; } = "الصيانة ";
        public string FaultNumber { get; set; }
        public string District { get; set; }
        public string? StationNumber { get; set; }// رقم المحطة

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
        public string? NotificationNumber { get; set; }
        public string? TaskNumber { get; set; }
        public string? TypeOfStomachTest { get; set; }
        public string? DescriptionViolation { get; set; }
        public int? NumberOfEquipment { get; set; }

        public DateTime ReceiveDateTime { get; set; }

        public bool? IsApprove { get; set; } = true;
        public string? UserApproveId { get; set; }
        public List<ModelPhotoForMaintenanceDeleted> ModelPhotos { get; set; }
        public List<ModelTestForMaintenanceDeleted> TestModels { get; set; }
        public List<SitePhotoForMaintenanceDeleted>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForMaintenanceDeleted>? SafetyWastePhotos { get; set; }
        public MaintenanceDeleted()
        {
            ModelPhotos = new List<ModelPhotoForMaintenanceDeleted>();
            TestModels = new List<ModelTestForMaintenanceDeleted>();
            SitePhotos = new List<SitePhotoForMaintenanceDeleted>();
            SafetyWastePhotos = new List<SafetyWastePhotoForMaintenanceDeleted>();
        }
    }
}
