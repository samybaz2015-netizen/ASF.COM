//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using ASF.Core.Dtos.Attendance;
//using ASF.Core.Services;
//using System.Security.Claims;

//namespace ASF.Api.Controllers
//{
//    [ApiController]
//    [Route("api/[controller]")]
//    public class AttendanceController : ControllerBase
//    {
//        private readonly IAttendanceService _attendanceService;

//        public AttendanceController(IAttendanceService attendanceService)
//        {
//            _attendanceService = attendanceService;
//        }

//        // ✅ تسجيل حضور
//        [HttpPost("check-in")]
//        public async Task<IActionResult> CheckIn([FromBody] AttendanceCreateDto dto)
//        {
//            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
//            if (userId == null)
//                return Unauthorized(new { message = "المستخدم غير مصرح له" });

//            var result = await _attendanceService.CheckInAsync(userId, dto);
//            return StatusCode(result.StatusCode, result);
//        }

//        // ✅ تسجيل انصراف
//        [HttpPost("check-out")]
//        public async Task<IActionResult> CheckOut([FromBody] AttendanceCheckOutDto dto)
//        {
//            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
//            if (userId == null)
//                return Unauthorized(new { message = "المستخدم غير مصرح له" });

//            var result = await _attendanceService.CheckOutAsync(userId, dto);
//            return StatusCode(result.StatusCode, result);
//        }

//        // ✅ عرض كل السجلات (للأدمن فقط)
//        [HttpGet("all")]
//        public async Task<IActionResult> GetAll(
//      [FromQuery] int page = 1,
//      [FromQuery] int pageSize = 10,
//      [FromQuery] string? search = null,
//      [FromQuery] DateTime? fromDate = null,
//      [FromQuery] DateTime? toDate = null,
//      [FromQuery] int? month = null
//  )
//        {
//            var result = await _attendanceService.GetAllAsync(
//                page, pageSize, search, fromDate, toDate, month
//            );

//            return StatusCode(result.StatusCode, result);
//        }


//        // ✅ سجل المستخدم الحالي
//        [HttpGet("my")]
//        public async Task<IActionResult> GetMyAttendance()
//        {
//            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
//            if (userId == null)
//                return Unauthorized(new { message = "المستخدم غير مصرح له" });

//            var result = await _attendanceService.GetUserAttendanceAsync(userId);
//            return StatusCode(result.StatusCode, result);
//        }

//        [HttpPut("admin/add-note/{attendanceId}")]
//        public async Task<IActionResult> AddAdminNote(
//    int attendanceId,
//    [FromBody] AddAdminNoteAttendanceDto dto)
//        {
//            var result = await _attendanceService.AddAdminNoteAsync(attendanceId, dto);
//            return StatusCode(result.StatusCode, result);
//        }

//    }
//}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos.Attendance;
using ASF.Core.Services;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public AttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }

        // ✅ تسجيل حضور
        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] AttendanceCreateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(new { message = "المستخدم غير مصرح له" });

            var result = await _attendanceService.CheckInAsync(userId, dto);
            return StatusCode(result.StatusCode, result);
        }

        // ✅ تسجيل انصراف
        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut([FromBody] AttendanceCheckOutDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(new { message = "المستخدم غير مصرح له" });

            var result = await _attendanceService.CheckOutAsync(userId, dto);
            return StatusCode(result.StatusCode, result);
        }

        // ✅ عرض كل السجلات (للأدمن فقط)
        [HttpGet("all")]
        public async Task<IActionResult> GetAll(
      [FromQuery] int page = 1,
      [FromQuery] int pageSize = 10,
      [FromQuery] string? search = null,
      [FromQuery] DateTime? fromDate = null,
      [FromQuery] DateTime? toDate = null,
      [FromQuery] int? month = null
  )
        {
            var result = await _attendanceService.GetAllAsync(
                page, pageSize, search, fromDate, toDate, month
            );

            return StatusCode(result.StatusCode, result);
        }


        // ✅ سجل المستخدم الحالي
        [HttpGet("my")]
        public async Task<IActionResult> GetMyAttendance()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(new { message = "المستخدم غير مصرح له" });

            var result = await _attendanceService.GetUserAttendanceAsync(userId);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPut("admin/add-note/{attendanceId}")]
        public async Task<IActionResult> AddAdminNote(
    int attendanceId,
    [FromBody] AddAdminNoteAttendanceDto dto)
        {
            var result = await _attendanceService.AddAdminNoteAsync(attendanceId, dto);
            return StatusCode(result.StatusCode, result);
        }

    }
}