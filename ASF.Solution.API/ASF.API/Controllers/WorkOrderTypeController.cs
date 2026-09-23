//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using ASF.Core.Dtos;
//using ASF.Core.Services;

//namespace ASF.Api.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class WorkOrderTypeController : ControllerBase
//    {
//        private readonly IWorkOrderTypeServices _workOrderTypeServices;

//        public WorkOrderTypeController(IWorkOrderTypeServices workOrderTypeServices)
//        {
//            _workOrderTypeServices = workOrderTypeServices;
//        }

//        // GET: api/Consultants
//        [HttpGet]
//        public async Task<ActionResult<IEnumerable<GetWorkOrderTypeDTO>>> GetWorkOrderTypes()
//        {
//            var WorkOrderTypes = await _workOrderTypeServices.GetAllWorkOrderTypes();
//            return Ok(new { statusCode = 200, message = "success", data = WorkOrderTypes });
//        }

//        // GET: api/Consultants/5
//        [HttpGet("{id}")]
//        public async Task<ActionResult<GetWorkOrderTypeDTO>> GetWorkOrderType(int id)
//        {
//            var workOrderType = await _workOrderTypeServices.GetWorkOrderTypeById(id);

//            if (workOrderType == null)
//            {
//                return Ok(new { statusCode = 200, message = "not found" });
//            }

//            return Ok(new { statusCode = 200, message = "success", data = workOrderType });
//        }

//        // POST: api/Consultants
//        [HttpPost]
//        public async Task<ActionResult> PostWorkOrderType(WorkOrderTypeDTO workOrderTypeDTO)
//        {
//            try
//            {
//                // محاولة إنشاء الاستشارة
//                var createdworkOrderType = await _workOrderTypeServices.CreateWorkOrderType(workOrderTypeDTO);
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
//        public async Task<IActionResult> PutWorkOrderType(int id, WorkOrderTypeDTO workOrderTypeDTO)
//        {
//            var updatedworkOrderType = await _workOrderTypeServices.UpdateWorkOrderType(id, workOrderTypeDTO);

//            if (updatedworkOrderType == null)
//            {
//                return NotFound();
//            }

//            return Ok(new { statusCode = 200, message = "success" });
//        }

//        // DELETE: api/Consultants/5
//        [HttpDelete("{id}")]
//        public async Task<IActionResult> DeleteWorkOrderType(int id)
//        {
//            var success = await _workOrderTypeServices.DeleteWorkOrderType(id);

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
using ASF.Core.Dtos;
using ASF.Core.Services;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WorkOrderTypeController : ControllerBase
    {
        private readonly IWorkOrderTypeServices _workOrderTypeServices;

        public WorkOrderTypeController(IWorkOrderTypeServices workOrderTypeServices)
        {
            _workOrderTypeServices = workOrderTypeServices;
        }

        // GET: api/Consultants
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GetWorkOrderTypeDTO>>> GetWorkOrderTypes()
        {
            var WorkOrderTypes = await _workOrderTypeServices.GetAllWorkOrderTypes();
            return Ok(new { statusCode = 200, message = "success", data = WorkOrderTypes });
        }

        // GET: api/Consultants/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GetWorkOrderTypeDTO>> GetWorkOrderType(int id)
        {
            var workOrderType = await _workOrderTypeServices.GetWorkOrderTypeById(id);

            if (workOrderType == null)
            {
                return Ok(new { statusCode = 200, message = "not found" });
            }

            return Ok(new { statusCode = 200, message = "success", data = workOrderType });
        }

        // POST: api/Consultants
        [HttpPost]
        public async Task<ActionResult> PostWorkOrderType(WorkOrderTypeDTO workOrderTypeDTO)
        {
            try
            {
                // محاولة إنشاء الاستشارة
                var createdworkOrderType = await _workOrderTypeServices.CreateWorkOrderType(workOrderTypeDTO);
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
        public async Task<IActionResult> PutWorkOrderType(int id, WorkOrderTypeDTO workOrderTypeDTO)
        {
            var updatedworkOrderType = await _workOrderTypeServices.UpdateWorkOrderType(id, workOrderTypeDTO);

            if (updatedworkOrderType == null)
            {
                return NotFound();
            }

            return Ok(new { statusCode = 200, message = "success" });
        }

        // DELETE: api/Consultants/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkOrderType(int id)
        {
            var success = await _workOrderTypeServices.DeleteWorkOrderType(id);

            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }

        // GET: api/WorkOrderType/get-contract-number
        [HttpGet("get-contract-number")]
        public IActionResult GetContractNumber(
            [FromQuery] string? branchName,
            [FromQuery] string? office,
            [FromQuery] string? projectPlace,
            [FromQuery] DateTime? assignmentDate)
        {
            var contractNumber = ASF.Core.ContractHelper.GetContractNumber(branchName, office, projectPlace, assignmentDate);
            return Ok(new { statusCode = 200, message = "success", data = contractNumber });
        }
    }
}