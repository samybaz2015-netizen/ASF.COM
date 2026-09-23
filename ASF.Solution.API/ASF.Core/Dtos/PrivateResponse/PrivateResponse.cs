using ASF.Core.Entities.PrivateProject;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos.PrivateResponse
{
    public class PrivateResponse
    {


        public int Id { get; set; } 
        public string Type { get; set; } = "المشاريع الخاصة";
        public string ProjectName { get; set; }

        public string ProjectPlace { get; set; }
        public string? ProjectValue { get; set; }
        public string TimeOfProject { get; set; }
        public string District { get; set; }

        public string Customer { get; set; }
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



        public List<ModelPhotoForPrivate>? ModelPhotos { get; set; }
        public List<SitePhotoForPrivate>? SitePhotos { get; set; }
        public List<SafetyWastePhotoForPrivate>? SafetyWastePhotos { get; set; }



        public string? StationNumber { get; set; }
        public int DurationOfImplementation { get; set; }// مدة التنفيذ
    }
}
