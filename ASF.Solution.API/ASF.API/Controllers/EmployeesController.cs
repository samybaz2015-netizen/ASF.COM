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
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeesController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEmployees()
        {
            var employees = await _employeeService.GetAllEmployeesAsync();
            if (employees == null)
            {
                return Ok(new {message = "not found",statusCode = 200, data = employees });

            }

            return Ok(new { message = "found", statusCode = 200, data = employees });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployeeById(int id)
        {
            var employee = await _employeeService.GetEmployeeByIdAsync(id);
            if (employee == null)
                return NotFound(new { message = "Employee not found" });

            return Ok(new { message = "found", statusCode = 200, data = employee });
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromForm] EmployeeDto dto)
        {
            var request = HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}";

            var employee = await _employeeService.CreateEmployeeAsync(dto, baseUrl);

            return Ok(new { statusCode = 200, message = "Employee created successfully", data = employee });
        }


    

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromForm] EmployeeDto dto)
        {
            var request = HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}";

            var result = await _employeeService.UpdateEmployeeAsync(id, dto, baseUrl);
            if (!result) return NotFound(new { statusCode = 404, message = "Employee not found" });

            return Ok(new { statusCode = 200, message = "Employee updated successfully" });
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var deleted = await _employeeService.DeleteEmployeeAsync(id);
            if (!deleted)
                return NotFound(new { message = "Employee not found" });

            return NoContent();
        }
    }

}
