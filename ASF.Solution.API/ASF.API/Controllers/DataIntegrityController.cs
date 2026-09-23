using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos;
using ASF.Core.Services;
using ASF.Service;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASF.Controllers
{
    [ApiController]
    [Route("api/data-integrity")]
    [Authorize]
    public class DataIntegrityController : ControllerBase
    {
        private readonly IDataIntegrityService _service;

        public DataIntegrityController(IDataIntegrityService service)
        {
            _service = service;
        }

        // الخطوة 1: مراجعة السجلات المشبوهة قبل أي حذف
        // GET /api/data-integrity/suspicious-values?threshold=1000000
        [HttpGet("suspicious-values")]
        public async Task<IActionResult> GetSuspiciousValues([FromQuery] decimal threshold = 1_000_000m)
        {
            var results = await _service.GetSuspiciousValuesAsync(threshold);
            return Ok(results);
        }

        // الخطوة 2: بعد ما تتأكد من القائمة، ابعت بس الـ SourceTable + Id بتوع اللي عايز تمسحهم
        // POST /api/data-integrity/suspicious-values/delete
        // Body: [{ "sourceTable": "Constructions", "id": 123 }, ...]
        [HttpPost("suspicious-values/delete")]
        public async Task<IActionResult> DeleteConfirmed([FromBody] List<SuspiciousValueRefDto> items)
        {
            if (items == null || items.Count == 0)
                return BadRequest("لازم تبعت قائمة السجلات المطلوب حذفها");

            var result = await _service.DeleteConfirmedAsync(items);
            return Ok(result);
        }
    }
}