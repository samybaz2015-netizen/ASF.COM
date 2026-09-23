using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities.PrivateProject
{
    public class PrivateProjectDeleted
    {
        public int Id { get; set; }
        public string ProjectName { get; set; }
        public string ProjectPlace { get; set; }
        public string? ContractNumber { get; set; }
        public string? ProjectValue { get; set; }
        public string TimeOfProject { get; set; }
        public string Customer { get; set; }
        public string? Consultant { get; set; }
        public string Contractor { get; set; }
        public string AppUserId { get; set; }
        public string UserName { get; set; }
        public string UserImage { get; set; }
        public string BranchName { get; set; }
        public DateTime? OrderDate { get; set; }
        public bool SafetyViolationsExist { get; set; }
        public string? Note { get; set; }
        public bool IsArchived { get; set; }
        public DateTime CreateAt { get; set; }
        public string? StationNumber { get; set; }
        public DateTime DeletedAt { get; set; } // تاريخ الحذف
        public string? Coordinates { get; set; }
        public string? WorkDescription { get; set; }
        public bool? IsApprove { get; set; } = true;
        public string? UserApproveId { get; set; }
        public List<ModelPhotoForPrivateDeleted> ModelPhotos { get; set; }
        public List<SitePhotoForPrivateDeleted>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForPrivateDeleted>? SafetyWastePhotos { get; set; }



        public PrivateProjectDeleted()
        {
            ModelPhotos = new List<ModelPhotoForPrivateDeleted>();
            SitePhotos = new List<SitePhotoForPrivateDeleted>();
            SafetyWastePhotos = new List<SafetyWastePhotoForPrivateDeleted>();
        }
    }
}
