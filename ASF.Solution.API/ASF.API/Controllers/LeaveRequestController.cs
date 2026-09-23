//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using ASF.Core.Dtos;
//using ASF.Core.Entities;
//using ASF.Core.Services;
//using System.Security.Claims;
//using System.Threading.Tasks;

//namespace ASF.Api.Controllers
//{
//    [ApiController]
//    [Route("api/leaverequests")]
//    public class LeaveRequestController : ControllerBase
//    {
//        private readonly ILeaveRequestService _leaveRequestService;

//        public LeaveRequestController(ILeaveRequestService leaveRequestService)
//        {
//            _leaveRequestService = leaveRequestService;
//        }

//        [HttpPost("request")]
//        public async Task<IActionResult> RequestLeave([FromForm] LeaveRequestDto leaveRequestDto)
//        {
//            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//            if (string.IsNullOrEmpty(userId))
//                return Unauthorized(new { message = "User is not authenticated." });

//            var result = await _leaveRequestService.RequestLeaveAsync(userId, leaveRequestDto);
//            if (!result) return BadRequest("Failed to request leave.");

//            return Ok(new { message = "Leave request submitted successfully.", statusCode = 200, data = result });
//        }

//        [HttpGet("all")]
//        public async Task<IActionResult> GetAllRequests(
//      [FromQuery] string? employeeName = null,
//      [FromQuery] int? branchId = null)
//        {
//            var requests = await _leaveRequestService.GetAllRequestsAsync(employeeName, branchId);
//            return Ok(new { statusCode = 200, data = requests });
//        }

//        [HttpGet("get/{id}")]
//        public async Task<IActionResult> GetLeaveRequestById(int id)
//        {
//            var request = await _leaveRequestService.GetLeaveRequestByIdAsync(id);
//            if (request == null) return NotFound(new { message = "Leave request not found." });

//            return Ok(new { statusCode = 200, data = request });
//        }

//        [HttpDelete("delete/{id}")]
//        public async Task<IActionResult> DeleteLeaveRequest(int id)
//        {
//            var success = await _leaveRequestService.DeleteLeaveRequestAsync(id);
//            if (!success) return NotFound(new { message = "Leave request not found." });

//            return Ok(new { message = "Leave request deleted successfully." });
//        }

//        [HttpPut("update-status/{requestId}")]
//        [Authorize(Roles = "admin")]
//        public async Task<IActionResult> UpdateLeaveStatus(
//     int requestId,
//     [FromQuery] string status,
//     [FromBody] RejectedLeaveRequestReason reason)
//        {
//            try
//            {
//                var ok = await _leaveRequestService.UpdateLeaveStatusAsync(requestId, status, reason?.Reason);
//                if (!ok) // احتياطًا لو رجعت false بدون استثناء
//                    return BadRequest(new { message = "Could not update leave status." });

//                return Ok(new { message = $"Leave request {status} successfully." });
//            }
//            catch (KeyNotFoundException ex)
//            {
//                // طلب غير موجود أو موظف غير موجود
//                return NotFound(new { message = ex.Message });
//            }
//            catch (ArgumentException ex)
//            {
//                // ستاتس غير صحيح
//                return BadRequest(new { message = ex.Message });
//            }
//            catch (InvalidOperationException ex)
//            {
//                // رصيد غير كافٍ / تحديث فشل / أيام غير صالحة
//                return BadRequest(new { message = ex.Message });
//            }
//            catch (Exception ex)
//            {
//                // أي خطأ غير متوقع
//                return StatusCode(500, new { message = "Unexpected error.", detail = ex.Message });
//            }
//        }

//        [HttpDelete("delete/all")]
//        [Authorize(Roles = "admin")]
//        public async Task<IActionResult> DeleteAllLeaveRequests()
//        {
//            var success = await _leaveRequestService.DeleteAllLeaveRequestsAsync();
//            if (!success) return BadRequest(new { message = "Failed to delete leave requests." });

//            return Ok(new { message = "All leave requests deleted successfully." });
//        }

//        // جديد: إحضار الإجازات الخاصة بالموظف مع العدّادات
//        [HttpGet("my")]
//        [Authorize] // يفضل تقييدها بمستخدم مصادق
//        public async Task<IActionResult> GetMyLeaveRequests()
//        {
//            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//            if (string.IsNullOrEmpty(userId))
//                return Unauthorized(new { message = "User is not authenticated." });

//            var data = await _leaveRequestService.GetMyLeaveRequestsWithCountersAsync(userId);
//            return Ok(new { statusCode = 200, data });
//        }

//        [HttpPut("{requestId}")]
//        public async Task<IActionResult> UpdateLeaveRequest(
//       int requestId,
//       [FromForm] UpdateLeaveRequestDto dto) // FromForm لو فيه ملف
//        {
//            try
//            {
//                var result = await _leaveRequestService.UpdateLeaveRequestAsync(requestId, dto);
//                if (!result)
//                    return NotFound(new { message = "طلب الإجازة غير موجود." });

//                return Ok(new { message = "تم تحديث طلب الإجازة بنجاح." });
//            }
//            catch (Exception ex)
//            {
//                return StatusCode(500, new { message = "حدث خطأ أثناء تحديث طلب الإجازة.", detail = ex.Message });
//            }
//        }
//    }
//}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ASF.Api.Controllers
{
    [ApiController]
    [Route("api/leaverequests")]
    [Authorize]
    public class LeaveRequestController : ControllerBase
    {
        private readonly ILeaveRequestService _leaveRequestService;

        public LeaveRequestController(ILeaveRequestService leaveRequestService)
        {
            _leaveRequestService = leaveRequestService;
        }

        [HttpPost("request")]
        public async Task<IActionResult> RequestLeave([FromForm] LeaveRequestDto leaveRequestDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User is not authenticated." });

            var result = await _leaveRequestService.RequestLeaveAsync(userId, leaveRequestDto);
            if (!result) return BadRequest("Failed to request leave.");

            return Ok(new { message = "Leave request submitted successfully.", statusCode = 200, data = result });
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllRequests(
      [FromQuery] string? employeeName = null,
      [FromQuery] int? branchId = null)
        {
            var requests = await _leaveRequestService.GetAllRequestsAsync(employeeName, branchId);
            return Ok(new { statusCode = 200, data = requests });
        }

        [HttpGet("get/{id}")]
        public async Task<IActionResult> GetLeaveRequestById(int id)
        {
            var request = await _leaveRequestService.GetLeaveRequestByIdAsync(id);
            if (request == null) return NotFound(new { message = "Leave request not found." });

            return Ok(new { statusCode = 200, data = request });
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteLeaveRequest(int id)
        {
            var success = await _leaveRequestService.DeleteLeaveRequestAsync(id);
            if (!success) return NotFound(new { message = "Leave request not found." });

            return Ok(new { message = "Leave request deleted successfully." });
        }

        [HttpPut("update-status/{requestId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateLeaveStatus(
     int requestId,
     [FromQuery] string status,
     [FromBody] RejectedLeaveRequestReason reason)
        {
            try
            {
                var ok = await _leaveRequestService.UpdateLeaveStatusAsync(requestId, status, reason?.Reason);
                if (!ok) // احتياطًا لو رجعت false بدون استثناء
                    return BadRequest(new { message = "Could not update leave status." });

                return Ok(new { message = $"Leave request {status} successfully." });
            }
            catch (KeyNotFoundException ex)
            {
                // طلب غير موجود أو موظف غير موجود
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                // ستاتس غير صحيح
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                // رصيد غير كافٍ / تحديث فشل / أيام غير صالحة
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // أي خطأ غير متوقع
                return StatusCode(500, new { message = "Unexpected error.", detail = ex.Message });
            }
        }

        [HttpDelete("delete/all")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteAllLeaveRequests()
        {
            var success = await _leaveRequestService.DeleteAllLeaveRequestsAsync();
            if (!success) return BadRequest(new { message = "Failed to delete leave requests." });

            return Ok(new { message = "All leave requests deleted successfully." });
        }

        // جديد: إحضار الإجازات الخاصة بالموظف مع العدّادات
        [HttpGet("my")]
        public async Task<IActionResult> GetMyLeaveRequests()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User is not authenticated." });

            var data = await _leaveRequestService.GetMyLeaveRequestsWithCountersAsync(userId);
            return Ok(new { statusCode = 200, data });
        }

        [HttpPut("{requestId}")]
        public async Task<IActionResult> UpdateLeaveRequest(
       int requestId,
       [FromForm] UpdateLeaveRequestDto dto) // FromForm لو فيه ملف
        {
            try
            {
                var result = await _leaveRequestService.UpdateLeaveRequestAsync(requestId, dto);
                if (!result)
                    return NotFound(new { message = "طلب الإجازة غير موجود." });

                return Ok(new { message = "تم تحديث طلب الإجازة بنجاح." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء تحديث طلب الإجازة.", detail = ex.Message });
            }
        }
    }
}