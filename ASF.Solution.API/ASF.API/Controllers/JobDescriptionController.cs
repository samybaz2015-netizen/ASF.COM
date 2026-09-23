using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class JobDescriptionController : ControllerBase
    {
        private readonly IJobDescriptionService _jobDescriptionService;

        public JobDescriptionController(IJobDescriptionService jobDescriptionService)
        {
            _jobDescriptionService = jobDescriptionService;
        }

        // GET: api/Consultants
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GetJobDescriptionDTO>>> GetJobDescription()
        {
            var jobDescriptions = await _jobDescriptionService.GetAllJobDescriptions();
            return Ok(new { statusCode = 200, message = "success", data = jobDescriptions });
        }

        // GET: api/Consultants/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GetJobDescriptionDTO>> GetjobDescriptions(int id)
        {
            var jobDescription = await _jobDescriptionService.GetJobDescriptionById(id);

            if (jobDescription == null)
            {
                return Ok(new { statusCode = 200, message = "not found" });
            }

            return Ok(new { statusCode = 200, message = "success", data = jobDescription });
        }

        // POST: api/Consultants
        [HttpPost]
        public async Task<ActionResult> PostJobDescription(JobDescriptionDTO jobDescriptionDTO)
        {
            try
            {
                // محاولة إنشاء الاستشارة
                var createdConsultant = await _jobDescriptionService.CreateJobDescription(jobDescriptionDTO);
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
        public async Task<IActionResult> PutJobDescription(int id, JobDescriptionDTO JobDescriptionDTO)
        {
            var updatedJobDescription = await _jobDescriptionService.UpdateJobDescription(id, JobDescriptionDTO);

            if (updatedJobDescription == null)
            {
                return NotFound();
            }

            return Ok(new { statusCode = 200, message = "success" });
        }

        // DELETE: api/Consultants/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobDescription(int id)
        {
            var success = await _jobDescriptionService.DeleteJobDescription(id);

            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
    }



}
