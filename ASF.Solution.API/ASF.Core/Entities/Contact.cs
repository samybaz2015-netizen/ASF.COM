using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities
{
    public class Contact
    {
        public int Id { get; set; }
        [Required]
        public string? FullName { get; set; }
        [Required]
        [EmailAddress]
        public string? Email { get; set; }
        public string? Address { get; set; }
        [Required]
        [Phone]
        public int PhoneNumber { get; set; }
        [Required]
        public string? Message { get; set; }
    }
}
