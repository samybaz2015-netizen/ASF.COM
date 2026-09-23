using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;

namespace ASF.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NeighborhoodController : ControllerBase
    {
        private readonly INeighborhoodService _neighborhoodService;

        public NeighborhoodController(INeighborhoodService neighborhoodService)
        {
            _neighborhoodService = neighborhoodService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var neighborhoods = await _neighborhoodService.GetAllAsync();
            return Ok(new { statusCode = 200, message = "نجح", data = neighborhoods });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var neighborhood = await _neighborhoodService.GetByIdAsync(id);
                return Ok(new { statusCode = 200, message = "نجح", data = neighborhood });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateNeighborhoodDto neighborhoodDto)
        {
            if (string.IsNullOrWhiteSpace(neighborhoodDto.Name))
            {
                return BadRequest("Name is required.");
            }

            var createdNeighborhood = await _neighborhoodService.CreateAsync(neighborhoodDto);

            return Ok(new {statusCode = 200,message = "نجح", data = createdNeighborhood});
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateNeighborhoodDto neighborhoodDto)
        {
            try
            {
                var updatedNeighborhood = await _neighborhoodService.UpdateAsync(id, neighborhoodDto);
                return Ok(updatedNeighborhood);
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
                await _neighborhoodService.DeleteAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }

}
