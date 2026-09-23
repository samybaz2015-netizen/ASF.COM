using ASF.Core.Entities.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities
{
    public class Attendance
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        public AppUser User { get; set; }

        [Required]
        public DateTime CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }

        // ✅ إحداثيات الدخول
        public double? CheckInLatitude { get; set; }
        public double? CheckInLongitude { get; set; }

        // ✅ إحداثيات الانصراف
        public double? CheckOutLatitude { get; set; }
        public double? CheckOutLongitude { get; set; }

        [MaxLength(250)]
        public string? Notes { get; set; }
        public string? AdminNotes { get; set; }

        public bool IsActive => CheckOutTime == null;
    }

}
