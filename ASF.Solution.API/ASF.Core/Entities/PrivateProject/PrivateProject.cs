using ASF.Core.Entities.NewProject;
using ASF.Core.Entities.Pricing;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;


namespace ASF.Core.Entities.PrivateProject
{
    public class PrivateProject : IProjectEntity
    {
        private static int _orderCodeCounter = 1;

        public string WorkDescription { get; set; }// وصف العمل
        public int Id { get; set; }
        [NotMapped]
        public string OrderCode => $"T{Id}";
        public string ProjectName { get; set; }
        [NotMapped]
        public string Type { get; set; } = "المشاريع الخاصة";
        public string ProjectPlace { get; set; } // مدينه المشروع
        public string? ContractNumber { get; set; }
        public string? ProjectValue { get; set; } //قيمة المشروع
        public string TimeOfProject { get; set; }
        public string Customer { get; set; }
        public string? Consultant { get; set; }
        public string Contractor { get; set; }
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
        public DateTime CreateAt { get; set; }

        public List<ModelPhotoForPrivate>? ModelPhotos { get; set; }
        public List<SitePhotoForPrivate>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForPrivate>? SafetyWastePhotos { get; set; }
        public string? StationNumber { get; set; }// رقم المحطة
                                                  // public string DurationOfImplementation { get; set; }// مدة التنفيذ
        public string? Coordinates { get; set; }
        public bool? IsApprove { get; set; } = true;
        public string? UserApproveId { get; set; }

        // Pricing Items

        public PrivateProject()
        {
            ModelPhotos = new List<ModelPhotoForPrivate>();
            SitePhotos = new List<SitePhotoForPrivate>();
            SafetyWastePhotos = new List<SafetyWastePhotoForPrivate>();
        }


        public string? RejectionReason { get; set; }

    }
}