using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class ContactDto
    {
        [Required]
        public string? FullName { get; set; }
        [Required]

        public string? Email { get; set; }
        [Required]

        public string? Address { get; set; }
        [Required]

        public int PhoneNumber { get; set; }
        [Required]

        public string? Message { get; set; }
    }
}
