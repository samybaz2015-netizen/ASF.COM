using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace ASF.Core.Dtos.Identity
{
    public class RegisterDto
    {
        public string? UserName { get; set; }
        public string? DisplayName { get; set; }

        [EmailAddress]
        public string ?Email { get; set; }
        public int? BranchId { get; set; }
        [Required]

        public string? UserType { get; set; }

        [Phone]
        public string?PhoneNumber { get; set; }

        public string? Password { get; set; }

        public IFormFile ?UserImage { get; set; }
        public int? OfficeId { get; set; }

    }
}
