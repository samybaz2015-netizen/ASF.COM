using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class LeaveRequestDto
    {
        public int NumberOfDays { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public IFormFile? File { get; set; }

    }
    public class RejectedLeaveRequestReason
    {
        public string? Reason { get; set; }
      
    }
    public class UpdateLeaveRequestDto
    {
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public int? NumberOfDays { get; set; }
        public string? Reason { get; set; }
        public IFormFile? File { get; set; } // لو حابب تغير الملف
    }

    public class MyLeaveRequestDto
    {
        public int Id { get; set; }
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public string Status { get; set; }
        public int TotalDays { get; set; }


        public int? DaysUntilStart { get; set; } // قبل ما تبدأ
        public int? DaysUntilEnd { get; set; }   // وهي شغالة
        public bool IsUpcoming { get; set; }
        public bool IsActive { get; set; }
        public bool IsFinished { get; set; }


        public string Reason { get; set; } 


        // خليه nullable برضه (لو NRT مفعّل)
        public string? File { get; set; }

    }
}
