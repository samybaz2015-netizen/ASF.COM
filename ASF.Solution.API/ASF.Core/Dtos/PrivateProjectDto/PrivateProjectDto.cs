using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos.PrivateProjectDto
{
    public class PrivateProjectDto
    {

        public string? ProjectName { get; set; }
        public string? ProjectPlace { get; set; }
        public string? ContractNumber { get; set; }
        public string? Customer { get; set; }
        public string? Consultant { get; set; }
        public string? Contractor { get; set; }
        public string? ProjectOwner { get; set; }
        public string? ProjectParty { get; set; }
        public string? ProjectValue { get; set; }
        public string? StationNumber { get; set; }// رقم المحطة
      //  public string? DurationOfImplementation { get; set; }// مدة التنفيذ
        public string? TimeOfProject { get; set; }
         public bool? SafetyViolationsExist { get; set; }
        public string? WorkDescription { get; set; }// وصف العمل

        public string? Note { get; set; }
        public bool IsArchived { get; set; }
        public List<IFormFile>? ModelPhotos { get; set; }
        public List<IFormFile>? SitePhotos { get; set; }
        public DateTime? OrderDate { get; set; }
        public List<IFormFile>? SafetyWastePhotos { get; set; }
        public string? Coordinates { get; set; }
        public int? BranchId { get; set; }
        public string? BranchName { get; set; }
    }
}
