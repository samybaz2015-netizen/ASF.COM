using Microsoft.AspNetCore.Http;


namespace ASF.Core.Dtos
{

    public class OrderDto
    {

        public string? OrderNumber { get; set; }
        public string? Contractor { get; set; }
        public string ?District { get; set; }
        public string? Station { get; set; }
        public string? Consultant { get; set; }
        public string? EstimatedValue { get; set; }  // القيمة التقديرية
        public string? ActualValue { get; set; }     // القيمة الفعلية
        public string? ExtractNumber { get; set; }    // رقم المستخلص
        public List<IFormFile>? ModelPhotos { get; set; }
        public List<IFormFile>? SitePhotos { get; set; }
        public List<IFormFile>? SafetyWastePhotos { get; set; }
        public bool? isExist { get; set; }
        public bool? notExist { get; set; }

        public string? Note { get; set; }

        public bool isArchive { get; set; }

    }

}
