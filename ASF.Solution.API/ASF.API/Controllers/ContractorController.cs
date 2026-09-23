using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos;
using ASF.Core.Services;
using ASF.Service;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ContractorController : ControllerBase
    {
        private readonly IContractorService _contractorService;

        public ContractorController(IContractorService contractorService)
        {
            _contractorService = contractorService;
        }

        // GET: api/Consultants
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ContractorDTO>>> GetContractors()
        {
            var contractors = await _contractorService.GetAllContractors();
            return Ok(new { statusCode = 200, message = "success", data = contractors });
        }

        // GET: api/Consultants/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ContractorDTO>> GetContractor(int id)
        {
            var contractor = await _contractorService.GetContractorById(id);

            if (contractor == null)
            {
                return Ok(new { statusCode = 200, message = "not found" });
            }

            return Ok(new { statusCode = 200, message = "success", data = contractor });
        }

        // POST: api/Consultants
        [HttpPost]
        public async Task<ActionResult> PostContractor(ContractorDTO contractorDto)
        {
            try
            {
                // محاولة إنشاء الاستشارة
                var createdcontractor = await _contractorService.CreateContractor(contractorDto);
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
        public async Task<IActionResult> PutContractor(int id, ContractorDTO contractorDTO)
        {
            var updatedcontractor = await _contractorService.UpdateContractor(id, contractorDTO);

            if (updatedcontractor == null)
            {
                return NotFound();
            }

            return Ok(new { statusCode = 200, message = "success" });
        }

        // DELETE: api/Consultants/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContractor(int id)
        {
            var success = await _contractorService.DeleteContractor(id);

            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}

