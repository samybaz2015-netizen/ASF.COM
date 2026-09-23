//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using ASF.Core.Dtos;
//using ASF.Core.Services;
//using System;
//using System.Security.Claims;
//using System.Threading.Tasks;

//namespace ASF.Api.Controllers
//{
//    [ApiController]
//    [Route("api/custodies")]
//    [Authorize] // اسمح للمصادقين فقط
//    public class CustodiesController : ControllerBase
//    {
//        private readonly ICustodyService _service;

//        public CustodiesController(ICustodyService service)
//        {
//            _service = service;
//        }

//        // فتح عهدة جديدة
//        [HttpPost]
//        public async Task<IActionResult> Open([FromBody] CreateCustodyDto dto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(new { statusCode = 400, message = "Invalid payload.", errors = ModelState });

//            try
//            {
//                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
//                if (string.IsNullOrWhiteSpace(currentUserId))
//                    return StatusCode(401, new { statusCode = 401, message = "Unauthorized." });

//                var data = await _service.OpenCustodyAsync(currentUserId, dto);
//                return Ok(new { statusCode = 200, message = "Custody opened.", data });
//            }
//            catch (Exception ex)
//            {
//                return ToErrorResult(ex);
//            }
//        }

//        // إضافة فاتورة داخل عهدة
//        [HttpPost("{custodyId:int}/invoices")]
//        public async Task<IActionResult> AddInvoice(int custodyId, [FromBody] AddInvoiceDto dto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(new { statusCode = 400, message = "Invalid payload.", errors = ModelState });

//            try
//            {
//                var data = await _service.AddInvoiceAsync(custodyId, dto);
//                return Ok(new { statusCode = 200, message = "Invoice added.", data });
//            }
//            catch (Exception ex)
//            {
//                return ToErrorResult(ex);
//            }
//        }

//        // إغلاق/تصفية العهدة
//        [HttpPut("{custodyId:int}/close")]
//        public async Task<IActionResult> Close(int custodyId, [FromBody] CloseCustodyDto dto)
//        {
//            if (!ModelState.IsValid)
//                return BadRequest(new { statusCode = 400, message = "Invalid payload.", errors = ModelState });

//            try
//            {
//                var ok = await _service.CloseCustodyAsync(custodyId, dto);
//                if (!ok) return BadRequest(new { statusCode = 400, message = "Could not close custody." });
//                return Ok(new { statusCode = 200, message = "Custody closed." });
//            }
//            catch (Exception ex)
//            {
//                return ToErrorResult(ex);
//            }
//        }

//        // جلب عهدة معيّنة
//        [HttpGet("{custodyId:int}")]
//        public async Task<IActionResult> GetById(int custodyId)
//        {
//            try
//            {
//                var data = await _service.GetCustodyAsync(custodyId);
//                if (data == null) return NotFound(new { statusCode = 404, message = "Custody not found." });
//                return Ok(new { statusCode = 200, data });
//            }
//            catch (Exception ex)
//            {
//                return ToErrorResult(ex);
//            }
//        }

//        // قائمة العهد
//        [HttpGet]
//        public async Task<IActionResult> List([FromQuery] string? userId = null, [FromQuery] bool includeClosed = true)
//        {
//            try
//            {
//                var data = await _service.GetCustodiesAsync(userId, includeClosed);
//                return Ok(new { statusCode = 200, data });
//            }
//            catch (Exception ex)
//            {
//                return ToErrorResult(ex);
//            }
//        }

//        // تجميع إجمالي
//        [HttpGet("aggregate")]
//        public async Task<IActionResult> Aggregate([FromQuery] string? userId = null)
//        {
//            try
//            {
//                var data = await _service.GetAggregateAsync(userId);
//                return Ok(new { statusCode = 200, data });
//            }
//            catch (Exception ex)
//            {
//                return ToErrorResult(ex);
//            }
//        }

//        // جلب العهد الخاصة باليوزر الحالي (المسجّل)
//        [HttpGet("my")]
//        public async Task<IActionResult> MyCustodies([FromQuery] bool includeClosed = true)
//        {
//            try
//            {
//                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
//                if (string.IsNullOrWhiteSpace(currentUserId))
//                    return StatusCode(401, new { statusCode = 401, message = "Unauthorized." });

//                var data = await _service.GetCustodiesAsync(currentUserId, includeClosed);

//                return Ok(new
//                {
//                    statusCode = 200,
//                    data
//                });
//            }
//            catch (Exception ex)
//            {
//                return ToErrorResult(ex);
//            }
//        }


//        // ================= Helpers =================

//        private IActionResult ToErrorResult(Exception ex)
//        {
//            return ex switch
//            {
//                KeyNotFoundException k =>
//                    NotFound(new { statusCode = 404, message = k.Message }),

//                ArgumentException a =>
//                    BadRequest(new { statusCode = 400, message = a.Message }),

//                FormatException f =>
//                    BadRequest(new { statusCode = 400, message = f.Message }),

//                InvalidOperationException inv =>
//                    StatusCode(409, new { statusCode = 404, message = inv.Message }),

//                UnauthorizedAccessException u =>
//                    StatusCode(403, new { statusCode = 403, message = u.Message }),

//                // EFCore/DB مشاكل
//                Microsoft.EntityFrameworkCore.DbUpdateException dbu =>
//                    StatusCode(500, new { statusCode = 500, message = "Database error.", details = dbu.Message }),

//                _ =>
//                    StatusCode(500, new { statusCode = 500, message = "An unexpected error occurred.", details = ex.Message })
//            };
//        }
//    }
//}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos;
using ASF.Core.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ASF.Api.Controllers
{
    [ApiController]
    [Route("api/custodies")]
    [Authorize] // اسمح للمصادقين فقط
    public class CustodiesController : ControllerBase
    {
        private readonly ICustodyService _service;

        public CustodiesController(ICustodyService service)
        {
            _service = service;
        }

        // فتح عهدة جديدة
        [HttpPost]
        public async Task<IActionResult> Open([FromBody] CreateCustodyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { statusCode = 400, message = "Invalid payload.", errors = ModelState });

            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(currentUserId))
                    return StatusCode(401, new { statusCode = 401, message = "Unauthorized." });

                var data = await _service.OpenCustodyAsync(currentUserId, dto);
                return Ok(new { statusCode = 200, message = "Custody opened.", data });
            }
            catch (Exception ex)
            {
                return ToErrorResult(ex);
            }
        }

        // إضافة فاتورة داخل عهدة
        [HttpPost("{custodyId:int}/invoices")]
        public async Task<IActionResult> AddInvoice(int custodyId, [FromBody] AddInvoiceDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { statusCode = 400, message = "Invalid payload.", errors = ModelState });

            try
            {
                var data = await _service.AddInvoiceAsync(custodyId, dto);
                return Ok(new { statusCode = 200, message = "Invoice added.", data });
            }
            catch (Exception ex)
            {
                return ToErrorResult(ex);
            }
        }

        // إغلاق/تصفية العهدة
        [HttpPut("{custodyId:int}/close")]
        public async Task<IActionResult> Close(int custodyId, [FromBody] CloseCustodyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { statusCode = 400, message = "Invalid payload.", errors = ModelState });

            try
            {
                var ok = await _service.CloseCustodyAsync(custodyId, dto);
                if (!ok) return BadRequest(new { statusCode = 400, message = "Could not close custody." });
                return Ok(new { statusCode = 200, message = "Custody closed." });
            }
            catch (Exception ex)
            {
                return ToErrorResult(ex);
            }
        }

        // جلب عهدة معيّنة
        [HttpGet("{custodyId:int}")]
        public async Task<IActionResult> GetById(int custodyId)
        {
            try
            {
                var data = await _service.GetCustodyAsync(custodyId);
                if (data == null) return NotFound(new { statusCode = 404, message = "Custody not found." });
                return Ok(new { statusCode = 200, data });
            }
            catch (Exception ex)
            {
                return ToErrorResult(ex);
            }
        }

        // قائمة العهد
        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? userId = null, [FromQuery] bool includeClosed = true)
        {
            try
            {
                var data = await _service.GetCustodiesAsync(userId, includeClosed);
                return Ok(new { statusCode = 200, data });
            }
            catch (Exception ex)
            {
                return ToErrorResult(ex);
            }
        }

        // تجميع إجمالي
        [HttpGet("aggregate")]
        public async Task<IActionResult> Aggregate([FromQuery] string? userId = null)
        {
            try
            {
                var data = await _service.GetAggregateAsync(userId);
                return Ok(new { statusCode = 200, data });
            }
            catch (Exception ex)
            {
                return ToErrorResult(ex);
            }
        }

        // جلب العهد الخاصة باليوزر الحالي (المسجّل)
        [HttpGet("my")]
        public async Task<IActionResult> MyCustodies([FromQuery] bool includeClosed = true)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(currentUserId))
                    return StatusCode(401, new { statusCode = 401, message = "Unauthorized." });

                var data = await _service.GetCustodiesAsync(currentUserId, includeClosed);

                return Ok(new
                {
                    statusCode = 200,
                    data
                });
            }
            catch (Exception ex)
            {
                return ToErrorResult(ex);
            }
        }


        // ================= Helpers =================

        private IActionResult ToErrorResult(Exception ex)
        {
            return ex switch
            {
                KeyNotFoundException k =>
                    NotFound(new { statusCode = 404, message = k.Message }),

                ArgumentException a =>
                    BadRequest(new { statusCode = 400, message = a.Message }),

                FormatException f =>
                    BadRequest(new { statusCode = 400, message = f.Message }),

                InvalidOperationException inv =>
                    StatusCode(409, new { statusCode = 404, message = inv.Message }),

                UnauthorizedAccessException u =>
                    StatusCode(403, new { statusCode = 403, message = u.Message }),

                // EFCore/DB مشاكل
                Microsoft.EntityFrameworkCore.DbUpdateException dbu =>
                    StatusCode(500, new { statusCode = 500, message = "Database error.", details = dbu.Message }),

                _ =>
                    StatusCode(500, new { statusCode = 500, message = "An unexpected error occurred.", details = ex.Message })
            };
        }
    }
}