using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASF.Api.Attributes;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProjectPartyController : ControllerBase
    {
        private readonly IProjectPartyService _projectPartyService;

        public ProjectPartyController(IProjectPartyService projectPartyService)
        {
            _projectPartyService = projectPartyService;
        }
        [HttpPut("AssignBranch")]
        [HasPermission(Permissions.ProjectParty.Update)]
        public async Task<IActionResult> AssignBranch()
        {
            await _projectPartyService.AssignBranchToAll(1);

            return Ok(new
            {
                statusCode = 200,
                message = "All Project Parties assigned to Branch 1 successfully."
            });
        }
        // GET: api/ProjectParty?type=مقاول
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GetProjectPartyDto>>> GetProjectParties(
          [FromQuery] string? type,
          [FromQuery] int? branchId)
        {
            var parties = await _projectPartyService.GetAllProjectParties(type, branchId);
            return Ok(new { statusCode = 200, message = "success", data = parties });
        }

        // GET: api/ProjectParty/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GetProjectPartyDto>> GetProjectParty(int id)
        {
            var party = await _projectPartyService.GetProjectPartyById(id);
            if (party == null)
            {
                return Ok(new { statusCode = 200, message = "not found" });
            }
            return Ok(new { statusCode = 200, message = "success", data = party });
        }

        // POST: api/ProjectParty
        [HttpPost]
        [HasPermission(Permissions.ProjectParty.Create)]
        public async Task<ActionResult> PostProjectParty([FromBody] ProjectPartyDto dto)
        {
            try
            {
                var created = await _projectPartyService.CreateProjectParty(dto);
                return Ok(new { statusCode = 200, message = "success", data = created });
            }
            catch (Exception ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
        }

        // PUT: api/ProjectParty/5
        [HttpPut("{id}")]
        [HasPermission(Permissions.ProjectParty.Update)]
        public async Task<IActionResult> PutProjectParty(int id, [FromBody] ProjectPartyDto dto)
        {
            try
            {
                var updated = await _projectPartyService.UpdateProjectParty(id, dto);
                if (updated == null)
                {
                    return NotFound(new { statusCode = 404, message = "غير موجود" });
                }
                return Ok(new { statusCode = 200, message = "success", data = updated });
            }
            catch (Exception ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
        }

        // DELETE: api/ProjectParty/5
        [HttpDelete("{id}")]
        [HasPermission(Permissions.ProjectParty.Delete)]
        public async Task<IActionResult> DeleteProjectParty(int id)
        {
            var success = await _projectPartyService.DeleteProjectParty(id);
            if (!success)
            {
                return NotFound(new { statusCode = 404, message = "غير موجود" });
            }
            return Ok(new { statusCode = 200, message = "تم الحذف بنجاح" });
        }
    }
}
