using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class ProjectSituationDto
    {
        public int Id { get; set; }
        public string Name { get; set; }      // اسم المشروع
        public string Type { get; set; }      // نوع المشروع (اختياري، عشان تفرق بينهم)
        public string Situation { get; set; } // الحالة
    }

    public class ProjectSituationFilterDto
    {
        public List<string> Situations { get; set; }
        public List<ProjectSituationDto> Projects { get; set; }
    }
    public class SituationCountDto
    {
        public string Situation { get; set; }
        public int Count { get; set; }
        public int TotoalActualValue { get; set; }
        public int TotalEstimatedValue { get; set; }

    }
    public class ProjectSituationStatisticsDto
    {
        public List<SituationCountDto> Overall { get; set; }
        public List<SituationCountDto> Rehabilitationworks { get; set; }
        public List<SituationCountDto> ConstructionProjects { get; set; }
        public List<SituationCountDto> EmergencyProjects { get; set; }
        public List<SituationCountDto> MaintenanceProjects { get; set; }
    }
    public class ProjectDetailsDto
    {
        public int Id { get; set; }
        public string? EstimatedValue { get; set; }  // القيمة التقديرية
        public string? ActualValue { get; set; }     // القيمة الفعلية
        public string? ExtractNumber { get; set; }    // رقم المستخلص
        public string? Type { get; set; }    // رقم المستخلص
        public string? FaultNumber { get; set; }
        public string? StationNumber { get; set; }// رقم المحطة
        public DateTime? OrderDate { get; set; }
        public string? District { get; set; }
        public string? Contractor { get; set; }
        public string? Consultant { get; set; }
        public bool? SafetyViolationsExist { get; set; }
        public bool? IsArchive { get; set; }
        public string? Note { get; set; }
        public string? ImplementationPhase { get; set; }
        public string? NotificationNumber { get; set; }
        public string? TaskNumber { get; set; }
        public string? TypeOfStomachTest { get; set; }
        public string? DescriptionViolation { get; set; }
        public int? NumberOfEquipment { get; set; }
        public List<string> ModelPhotos { get; set; } = new List<string>();
        public List<string> TestModels { get; set; } = new List<string>();
        public List<string> SitePhotos { get; set; } = new List<string>();
        public List<string> SafetyWastePhotos { get; set; } = new List<string>();
        public string? ProjectPlace { get; set; }
        public string? Office { get; set; }
        public string? ProjectValue { get; set; }
        public string? WorkOrderType { get; set; }// نوع أمر العمل
        public string? WorkDescription { get; set; }// وصف العمل
        public string? DurationOfImplementation { get; set; }// مدة التنفيذ
        public string? Situation { get; set; }
        public DateTime? ReceiveDateTime { get; set; }
        public string? Coordinates { get; set; }
    }
}
