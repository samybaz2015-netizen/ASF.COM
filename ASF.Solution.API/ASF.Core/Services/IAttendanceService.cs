using ASF.Core.Dtos.Attendance;
using ASF.Core.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IAttendanceService
    {
        Task<ApiResponse<AttendanceDto>> CheckInAsync(string userId, AttendanceCreateDto dto);
        Task<ApiResponse<AttendanceDto>> CheckOutAsync(string userId, AttendanceCheckOutDto dto);
        Task<ApiResponse<List<AttendanceDto>>> GetAllAsync(
              int page = 1,
              int pageSize = 10,
              string? search = null,
              DateTime? fromDate = null,
              DateTime? toDate = null,
              int? month = null
          );
        Task<ApiResponse<List<AttendanceDto>>> GetUserAttendanceAsync(string userId);
        Task<ApiResponse<AttendanceDto>> AddAdminNoteAsync(
    int attendanceId,
    AddAdminNoteAttendanceDto dto);
    }
}
