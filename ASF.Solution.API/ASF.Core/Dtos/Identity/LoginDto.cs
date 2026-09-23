using System.ComponentModel.DataAnnotations;

namespace ASF.Core.Dtos.Identity
{
    public class LoginDto
    {
        [Required]

        public string UserName { get; set; }
        [Required]
        public string Password { get; set; }    
    }
}
