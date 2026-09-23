//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.VisualBasic;
//using ASF.Core.Dtos;
//using ASF.Core.Entities;
//using ASF.Core.Services;

//namespace ASF.Api.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class ConsultantsController : ControllerBase
//    {
//        private readonly IConsultantService _consultantService;

//        public ConsultantsController(IConsultantService consultantService)
//        {
//            _consultantService = consultantService;
//        }

//        // GET: api/Consultants
//        [HttpGet]
//        public async Task<ActionResult<IEnumerable<ConsultantDto>>> GetConsultants()
//        {
//            var consultants = await _consultantService.GetAllConsultants();
//            return Ok(new { statusCode = 200, message = "success", data = consultants });
//        }

//        // GET: api/Consultants/5
//        [HttpGet("{id}")]
//        public async Task<ActionResult<ConsultantDto>> GetConsultant(int id)
//        {
//            var consultant = await _consultantService.GetConsultantById(id);

//            if (consultant == null)
//            {
//                return Ok(new { statusCode = 200, message = "not found" });
//            }

//            return Ok(new { statusCode = 200, message = "success", data = consultant });
//        }

//        // POST: api/Consultants
//        [HttpPost]
//        public async Task<ActionResult> PostConsultant(ConsultantDto consultantDto)
//        {
//            try
//            {
//                // محاولة إنشاء الاستشارة
//                var createdConsultant = await _consultantService.CreateConsultant(consultantDto);
//                return Ok(new { statusCode = 200, message = "success" });
//            }
//            catch (Exception ex)
//            {
//                // إذا تم العثور على استشارة بنفس الاسم، إرجاع رسالة خطأ
//                return BadRequest(new { statusCode = 400, message = ex.Message });
//            }
//        }

//        // PUT: api/Consultants/5
//        [HttpPut("{id}")]
//        public async Task<IActionResult> PutConsultant(int id, ConsultantDto consultantDto)
//        {
//            var updatedConsultant = await _consultantService.UpdateConsultant(id, consultantDto);

//            if (updatedConsultant == null)
//            {
//                return NotFound();
//            }

//            return Ok(new { statusCode = 200, message = "success" });
//        }

//        // DELETE: api/Consultants/5
//        [HttpDelete("{id}")]
//        public async Task<IActionResult> DeleteConsultant(int id)
//        {
//            var success = await _consultantService.DeleteConsultant(id);

//            if (!success)
//            {
//                return NotFound();
//            }

//            return NoContent();
//        }
//    }


//}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ConsultantsController : ControllerBase
    {
        private readonly IConsultantService _consultantService;

        public ConsultantsController(IConsultantService consultantService)
        {
            _consultantService = consultantService;
        }

        // GET: api/Consultants
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ConsultantDto>>> GetConsultants()
        {
            var consultants = await _consultantService.GetAllConsultants();
            return Ok(new { statusCode = 200, message = "success", data = consultants });
        }

        // GET: api/Consultants/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ConsultantDto>> GetConsultant(int id)
        {
            var consultant = await _consultantService.GetConsultantById(id);

            if (consultant == null)
            {
                return Ok(new { statusCode = 200, message = "not found" });
            }

            return Ok(new { statusCode = 200, message = "success", data = consultant });
        }

        // POST: api/Consultants
        [HttpPost]
        public async Task<ActionResult> PostConsultant(ConsultantDto consultantDto)
        {
            try
            {
                // محاولة إنشاء الاستشارة
                var createdConsultant = await _consultantService.CreateConsultant(consultantDto);
                return Ok(new { statusCode = 200, message = "success" });
            }
            catch (Exception ex)
            {
                // إذا تم العثور على استشارة بنفس الاسم، إرجاع رسالة خطأ
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
        }

        // PUT: api/Consultants/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutConsultant(int id, ConsultantDto consultantDto)
        {
            var updatedConsultant = await _consultantService.UpdateConsultant(id, consultantDto);

            if (updatedConsultant == null)
            {
                return NotFound();
            }

            return Ok(new { statusCode = 200, message = "success" });
        }

        // DELETE: api/Consultants/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConsultant(int id)
        {
            var success = await _consultantService.DeleteConsultant(id);

            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
    }


}