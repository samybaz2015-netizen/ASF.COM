//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using ASF.Core.Dtos;
//using ASF.Core.Services;
//using ASF.Service;

//namespace ASF.Api.Controllers
//{
//    [ApiController]
//    [Route("api/[controller]")]
//    public class OfficeController : ControllerBase
//    {
//        private readonly IOfficeService _officeService;

//        public OfficeController(IOfficeService officeService)
//        {
//            _officeService = officeService;
//        }

//        [HttpGet]
//        public async Task<ActionResult<List<OfficeDTO>>> GetAll()
//        {
//            var result = await _officeService.GetAllAsync();
//            return Ok(new {statusCode = 200,message = "نجح",data = result});
//        }

//        [HttpGet("{id}")]
//        public async Task<ActionResult<OfficeDTO>> GetById(int id)
//        {
//            var result = await _officeService.GetByIdAsync(id);

//            return Ok(new { statusCode = 200, message = "نجح", data = result });
//        }

//        [HttpPost]
//        public async Task<ActionResult<CreateOfficeDTO>> Create([FromBody] CreateOfficeDTO officeDTO)
//        {
//            var result = await _officeService.CreateAsync(officeDTO);
//            return Ok(new { statusCode = 200, message = "نجح", data = result });
//        }

//        [HttpPut("{id}")]
//        public async Task<ActionResult<CreateOfficeDTO>> Update(int id, [FromBody] CreateOfficeDTO officeDTO)
//        {
//            var result = await _officeService.UpdateAsync(id, officeDTO);

//            return Ok(new { statusCode = 200, message = "نجح", data = result });
//        }
//        [HttpGet("offices/{branchId}")]
//        public async Task<IActionResult> GetOfficesByBranchId(int branchId)
//        {
//            try
//            {
//                var offices = await _officeService.GetOfficesByBranchIdAsync(branchId);

//                if (!offices.Any())
//                {
//                    return Ok(new { statusCode = 200, message = "لا توجد مكاتب في هذا الفرع.",data = offices });
//                }

//                return Ok(new { statusCode = 200, message = "نجح", data = offices });
//            }
//            catch (Exception ex)
//            {
//                return StatusCode(500, new { statusCode = 500, message = "حدث خطأ أثناء معالجة الطلب.", error = ex.Message });
//            }
//        }

//        [HttpDelete("{id}")]
//        public async Task<IActionResult> Delete(int id)
//        {
//            await _officeService.DeleteAsync(id);
//            return NoContent();
//        }
//        [HttpGet("GetByOffice")]
//        public async Task<IActionResult> GetByOffice(string officeName)
//        {
//            if (officeName ==null)
//            {
//                return BadRequest(new { statusCode = 400, message = "معرف المكتب غير صالح" });
//            }

//            var neighborhoods = await _officeService.GetByOfficeIdAsync(officeName);

//            if (!neighborhoods.Any())
//            {
//                return Ok(new { statusCode = 200, message = "لم يتم العثور على أحياء لهذا المكتب",data = neighborhoods });
//            }

//            return Ok(new { statusCode = 200, message = "نجح", data = neighborhoods });
//        }

//    }

//}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos;
using ASF.Core.Services;
using ASF.Service;

namespace ASF.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OfficeController : ControllerBase
    {
        private readonly IOfficeService _officeService;

        public OfficeController(IOfficeService officeService)
        {
            _officeService = officeService;
        }

        [HttpGet]
        public async Task<ActionResult<List<OfficeDTO>>> GetAll()
        {
            var result = await _officeService.GetAllAsync();
            return Ok(new { statusCode = 200, message = "نجح", data = result });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OfficeDTO>> GetById(int id)
        {
            var result = await _officeService.GetByIdAsync(id);

            return Ok(new { statusCode = 200, message = "نجح", data = result });
        }

        [HttpPost]
        public async Task<ActionResult<CreateOfficeDTO>> Create([FromBody] CreateOfficeDTO officeDTO)
        {
            var result = await _officeService.CreateAsync(officeDTO);
            return Ok(new { statusCode = 200, message = "نجح", data = result });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CreateOfficeDTO>> Update(int id, [FromBody] CreateOfficeDTO officeDTO)
        {
            var result = await _officeService.UpdateAsync(id, officeDTO);

            return Ok(new { statusCode = 200, message = "نجح", data = result });
        }
        [HttpGet("offices/{branchId}")]
        public async Task<IActionResult> GetOfficesByBranchId(int branchId)
        {
            try
            {
                var offices = await _officeService.GetOfficesByBranchIdAsync(branchId);

                if (!offices.Any())
                {
                    return Ok(new { statusCode = 200, message = "لا توجد مكاتب في هذا الفرع.", data = offices });
                }

                return Ok(new { statusCode = 200, message = "نجح", data = offices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { statusCode = 500, message = "حدث خطأ أثناء معالجة الطلب.", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _officeService.DeleteAsync(id);
            return NoContent();
        }
        [HttpGet("GetByOffice")]
        public async Task<IActionResult> GetByOffice(string officeName)
        {
            if (officeName == null)
            {
                return BadRequest(new { statusCode = 400, message = "معرف المكتب غير صالح" });
            }

            var neighborhoods = await _officeService.GetByOfficeIdAsync(officeName);

            if (!neighborhoods.Any())
            {
                return Ok(new { statusCode = 200, message = "لم يتم العثور على أحياء لهذا المكتب", data = neighborhoods });
            }

            return Ok(new { statusCode = 200, message = "نجح", data = neighborhoods });
        }

    }

}