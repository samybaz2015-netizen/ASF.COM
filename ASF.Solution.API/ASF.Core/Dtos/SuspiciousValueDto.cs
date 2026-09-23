using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class SuspiciousValueDto
    {
        // اسم الجدول المصدر: Constructions / Maintenances / Emergencys / NewProjects / PrivateProjects
        public string SourceTable { get; set; } = string.Empty;
        public int Id { get; set; }
        public string? ContractNumber { get; set; }   // FaultNumber أو StationNumber حسب الجدول
        public string? BranchName { get; set; }
        public string? Office { get; set; }
        public string? Situation { get; set; }
        public string? OrderType { get; set; }
        public decimal EstimatedValue { get; set; }
        public decimal ActualValue { get; set; }

        // القيمة اللي اتقارنت بالـ threshold عشان تفهم ليه السجل ده ظهر
        public decimal FlaggedValue { get; set; }
    }

    public class SuspiciousValueRefDto
    {
        public string SourceTable { get; set; } = string.Empty;
        public int Id { get; set; }
    }

    public class DeleteSuspiciousResultDto
    {
        public List<SuspiciousValueRefDto> Deleted { get; set; } = new();
        public List<string> Errors { get; set; } = new();
    }

}
