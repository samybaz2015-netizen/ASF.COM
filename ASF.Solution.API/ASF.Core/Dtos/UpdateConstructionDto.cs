using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class UpdateConstructionDto
    {
        public string? ExtractNumber { get; set; }    // رقم المستخلص
        public string? FaultNumber { get; set; }
        public DateTime? OrderDate { get; set; }
        public string? StationNumber { get; set; }

        public string? District { get; set; }
        public string? Contractor { get; set; }
        public string? Consultant { get; set; }
        public string? ProjectOwner { get; set; }
        public string? ProjectParty { get; set; }
        public string? WorkDescription { get; set; }
        public string? OrderType { get; set; }
        public string? DescriptionViolation { get; set; }
        public string? TypeOfStomachTest { get; set; }

        public bool? SafetyViolationsExist { get; set; }
        public bool? isArchive { get; set; }

        public string? Note { get; set; }

        public List<IFormFile>? ModelPhotos { get; set; }
        public List<IFormFile>? SitePhotos { get; set; }
        public List<IFormFile>? SafetyWastePhotos { get; set; }
        public string? ImplementationPhase { get; set; }
        public List<IFormFile>? TestModels { get; set; }

        public string? ProjectPlace { get; set; }
        public string? Office { get; set; }
        public string? ContractNumber { get; set; }
        public string? ProjectValue { get; set; }
        public string? WorkOrderType { get; set; }// نوع امر العمل
        public string? DurationOfImplementation { get; set; }// مدة التنفيذ
        public string? Situation { get; set; }
        public DateTime? ReceiveDateTime { get; set; }
        public string? Coordinates { get; set; }
        public int? NumberOfEquipment { get; set; }

        public string? CompletionDate { get; set; }
        public string? NumberOfDaysDelayed { get; set; }
        public string? NumberOfDaysRemaining { get; set; }
        public int? ProjectExcavationLength { get; set; }
        public int? DailyExcavationLength { get; set; }
        public int? ExcavationLength { get; set; }



        public int? ProjectCableLength { get; set; }
        public List<ConstructionPricingItemDto>? PricingItems { get; set; }

    }

}
