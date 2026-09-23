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
    public class ProjectOwnerController : ControllerBase
    {
        private readonly IProjectOwnerService _projectOwnerService;

        public ProjectOwnerController(IProjectOwnerService projectOwnerService)
        {
            _projectOwnerService = projectOwnerService;
        }

        // GET: api/ProjectOwner
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GetProjectOwnerDto>>> GetProjectOwners()
        {
            var owners = await _projectOwnerService.GetAllProjectOwners();
            return Ok(new { statusCode = 200, message = "success", data = owners });
        }

        // GET: api/ProjectOwner/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GetProjectOwnerDto>> GetProjectOwner(int id)
        {
            var owner = await _projectOwnerService.GetProjectOwnerById(id);
            if (owner == null)
            {
                return Ok(new { statusCode = 200, message = "not found" });
            }
            return Ok(new { statusCode = 200, message = "success", data = owner });
        }

        // POST: api/ProjectOwner
        [HttpPost]
        [HasPermission(Permissions.ProjectOwner.Create)]
        public async Task<ActionResult> PostProjectOwner(ProjectOwnerDto dto)
        {
            try
            {
                var created = await _projectOwnerService.CreateProjectOwner(dto);
                return Ok(new { statusCode = 200, message = "success", data = created });
            }
            catch (Exception ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
        }

        // PUT: api/ProjectOwner/5
        [HttpPut("{id}")]
        [HasPermission(Permissions.ProjectOwner.Update)]
        public async Task<IActionResult> PutProjectOwner(int id, ProjectOwnerDto dto)
        {
            var updated = await _projectOwnerService.UpdateProjectOwner(id, dto);
            if (updated == null)
            {
                return NotFound(new { statusCode = 404, message = "غير موجود" });
            }
            return Ok(new { statusCode = 200, message = "success", data = updated });
        }

        // DELETE: api/ProjectOwner/5
        [HttpDelete("{id}")]
        [HasPermission(Permissions.ProjectOwner.Delete)]
        public async Task<IActionResult> DeleteProjectOwner(int id)
        {
            var success = await _projectOwnerService.DeleteProjectOwner(id);
            if (!success)
            {
                return NotFound(new { statusCode = 404, message = "غير موجود" });
            }
            return Ok(new { statusCode = 200, message = "تم الحذف بنجاح" });
        }
    }
}
