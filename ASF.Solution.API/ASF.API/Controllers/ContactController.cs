using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;
using System.Threading.Tasks;

namespace ASF.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContactController : ControllerBase
    {
        private readonly IContactService _contactService;

        public ContactController(IContactService contactService)
        {
            _contactService=contactService;
        }

        [HttpPost("send-message")]
        public async Task<IActionResult> CreateContact([FromQuery] ContactDto contactDto)
        {
            if ( !ModelState.IsValid )
            {
                return BadRequest(ModelState);
            }

            var createdContact = await _contactService.CreateContactAsync(contactDto);

            return Ok(createdContact);      
        }

        [HttpGet("get-messages")]
        public async Task<IActionResult> GetContacts()
        {
            var contacts = await _contactService.GetContactsAsync();

            if ( contacts==null )
            {
                return NotFound();
            }

            return Ok(contacts);
        }

        [HttpDelete("id")]
        public async Task<IActionResult> DeleteContact(int id)
        {
            var result = await _contactService.DeleteContactAsync(id);

            if ( !result )
            {
                return NotFound(new { Message = $"Contact with ID {id} not found" });
            }

            return NoContent(); 
        }

    
    }
}
