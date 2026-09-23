using ASF.Core.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace ASF.Core.Entities
{
    public class LeaveRequest
    {
        public int Id { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public int NumberOfDays { get; set; }
        public string Reason { get; set; } = string.Empty;

        // بقت nullable
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }

        // خليه nullable برضه (لو NRT مفعّل)
        public string? File { get; set; }

        public string Status { get; set; } = "Pending";
        public DateTime RequestDate { get; set; }

        public bool EndReminderSent { get; set; } = false;


        [JsonIgnore]
        public AppUser Employee { get; set; } // ربط بالإيمبلوي


    }

}
