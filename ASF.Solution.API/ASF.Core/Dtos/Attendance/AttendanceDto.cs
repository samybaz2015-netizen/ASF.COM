using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos.Attendance
{
    public class AttendanceCreateDto
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Notes { get; set; }
        public DateTime ClientTime { get; set; } // ✅ الوقت من الموبايل/متصفح

    }

    public class AttendanceCheckOutDto
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Notes { get; set; }
        public DateTime ClientTime { get; set; } // ✅ الوقت من الموبايل/متصفح

    }
     public class AddAdminNoteAttendanceDto
    {
        public string? AdminNotes { get; set; }


    }

    public class AttendanceDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string CheckInTime { get; set; }       // 🔹 string عشان ترجع للـ API
        public string? CheckOutTime { get; set; }

        public double? CheckInLatitude { get; set; }
        public double? CheckInLongitude { get; set; }
        public double? CheckOutLatitude { get; set; }
        public double? CheckOutLongitude { get; set; }

        public string? Notes { get; set; }
        public string? AdminNotes { get; set; } // ✅

        public bool IsActive { get; set; }
        public EmployeeDto2 User { get; set; }

    }
    public class EmployeeDto2
    {
        public string Id { get; set; }
        public string UserName { get; set; }
        public string? DisplayName { get; set; }
        public string? UserImage { get; set; }
        public string UserType { get; set; }
        public int BranchId { get; set; }
        public string BranchName { get; set; }
        public int? OfficeId { get; set; }
    }
}
