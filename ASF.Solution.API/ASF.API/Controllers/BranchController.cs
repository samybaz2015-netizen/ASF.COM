//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using ASF.Core.Dtos;
//using ASF.Core.Entities;
//using ASF.Core.Services;

//namespace ASF.Api.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class BranchController : ControllerBase
//    {
//        private readonly IBranchService _branchService;

//        public BranchController(IBranchService branchService)
//        {
//            _branchService = branchService;
//        }

//        [HttpGet]
//        public async Task<IActionResult> GetAll()
//        {
//            var branchs = await _branchService.GetAllAsync();
//            return Ok(new { statusCode = 200, message = "نجح", data = branchs });
//        }

//        [HttpGet("{id}")]
//        public async Task<IActionResult> GetById(int id)
//        {
//            try
//            {
//                var branch = await _branchService.GetByIdAsync(id);
//                return Ok(new { statusCode = 200, message = "نجح", data = branch });
//            }
//            catch (KeyNotFoundException ex)
//            {
//                return NotFound(ex.Message);
//            }
//        }

//        [HttpPost]
//        public async Task<IActionResult> Create([FromBody] AddBranchsDTO branchDTO)
//        {
//            if (string.IsNullOrWhiteSpace(branchDTO.Name))
//            {
//                return BadRequest("Name is required.");
//            }

//            var createdBranch= await _branchService.CreateAsync(branchDTO);

//            return Ok(new { statusCode = 200, message = "نجح", data = createdBranch });
//        }

//        [HttpPut("{id}")]
//        public async Task<IActionResult> Update(int id, [FromBody] AddBranchsDTO branchDTO)
//        {
//            try
//            {
//                var updatedBranch = await _branchService.UpdateAsync(id, branchDTO);
//                return Ok(updatedBranch);
//            }
//            catch (KeyNotFoundException ex)
//            {
//                return NotFound(ex.Message);
//            }
//        }

//        [HttpDelete("{id}")]
//        public async Task<IActionResult> Delete(int id)
//        {
//            try
//            {
//                await _branchService.DeleteAsync(id);
//                return NoContent();
//            }
//            catch (KeyNotFoundException ex)
//            {
//                return NotFound(ex.Message);
//            }
//        }

//    }
//}
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
    public class BranchController : ControllerBase
    {
        private readonly IBranchService _branchService;

        public BranchController(IBranchService branchService)
        {
            _branchService = branchService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var branchs = await _branchService.GetAllAsync();
            return Ok(new { statusCode = 200, message = "نجح", data = branchs });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var branch = await _branchService.GetByIdAsync(id);
                return Ok(new { statusCode = 200, message = "نجح", data = branch });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AddBranchsDTO branchDTO)
        {
            if (string.IsNullOrWhiteSpace(branchDTO.Name))
            {
                return BadRequest("Name is required.");
            }

            var createdBranch = await _branchService.CreateAsync(branchDTO);

            return Ok(new { statusCode = 200, message = "نجح", data = createdBranch });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AddBranchsDTO branchDTO)
        {
            try
            {
                var updatedBranch = await _branchService.UpdateAsync(id, branchDTO);
                return Ok(updatedBranch);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _branchService.DeleteAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

    }
}