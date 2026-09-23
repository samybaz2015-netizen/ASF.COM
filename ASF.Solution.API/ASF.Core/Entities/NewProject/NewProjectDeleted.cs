using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities.NewProject
{
    public class NewProjectDeleted
    {
        public int Id { get; set; }
        public string WorkOrderType { get; set; }
        public string? WorkDescription { get; set; }
        public string? StationNumber { get; set; }
        public string DurationOfImplementation { get; set; }
        public string QualificationClassification { get; set; }
        public string FaultNumber { get; set; }
        public string Type { get; set; } = "أعمال التاهيل";
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
        public bool? IsApprove { get; set; } = true;
        public string? UserApproveId { get; set; }
        public DateTime ReceiveDateTime { get; set; }
        public List<ModelPhotoForDeletedNew> ModelPhotos { get; set; }
        public List<SitePhotoForDeletedNew>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForDeletedNew>? SafetyWastePhotos { get; set; }
        public NewProjectDeleted()
        {
            ModelPhotos = new List<ModelPhotoForDeletedNew>();
            SitePhotos = new List<SitePhotoForDeletedNew>();
            SafetyWastePhotos = new List<SafetyWastePhotoForDeletedNew>();
        }
    }

}
