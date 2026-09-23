using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class MaintenanceDto
    {
        [RegularExpression("^[0-9]+$", ErrorMessage = "رقم المستخلص يجب أن يحتوي على أرقام فقط.")]
        public string? ExtractNumber { get; set; }
        [RegularExpression("^[0-9]+$", ErrorMessage = "رقم امر العمل يجب أن يحتوي على أرقام فقط.")]
        public string? FaultNumber { get; set; }
        public string? StationNumber { get; set; }
        public DateTime? OrderDate { get; set; }
        public string? District { get; set; }
        public string? Contractor { get; set; }
        public string? Consultant { get; set; }
        public string? ProjectOwner { get; set; }
        public string? ProjectParty { get; set; }
        public string? ImplementationPhase { get; set; }
        public string? NotificationNumber { get; set; }
        public string? TaskNumber { get; set; }
        public string? TypeOfStomachTest { get; set; }
        public bool? SafetyViolationsExist { get; set; }
        public bool? isArchive { get; set; }
        public string? OrderType { get; set; }
        public string? Note { get; set; }
        public List<IFormFile>? ModelPhotos { get; set; }
        public List<IFormFile>? SitePhotos { get; set; }
        public List<IFormFile>? SafetyWastePhotos { get; set; }
        public List<IFormFile>? TestModels { get; set; }
        public string? ProjectPlace { get; set; }
        public string? Office { get; set; }
        public string? ContractNumber { get; set; }
        [RegularExpression("^[0-9]+$", ErrorMessage = "قيمة المشروع يجب أن يحتوي على أرقام فقط.")]
        public string? ProjectValue { get; set; }
        public string? WorkOrderType { get; set; }
        public string? WorkDescription { get; set; }
        [RegularExpression("^[0-9]+$", ErrorMessage = "مدة التنفيذ يجب أن يحتوي على أرقام فقط.")]
        public string? DurationOfImplementation { get; set; }
        public string? Situation { get; set; }
        public DateTime? ReceiveDateTime { get; set; }
        public string? Coordinates { get; set; }
        public string? DescriptionViolation { get; set; }
        public int? NumberOfEquipment { get; set; }
        public int? BranchId { get; set; }
        public string? BranchName { get; set; }

        // البنود التسعيرية
        public List<ConstructionPricingItemDto>? PricingItems { get; set; }
    }
}