using Microsoft.AspNetCore.Http;
using System;

namespace ASF.Core.Dtos.Identity
{
    public class UpdateAccountDto
    {
        public string? Email { get; set; }
        public string? UserName { get; set; }
        public string? PhoneNumber { get; set; }
        public int? BranchId { get; set; }
        public string? UserType { get; set; }
        public string? Password { get; set; }

        // ── الحقول اللي كانت في EngineerProfile وبقت في AppUser ──
        public string? DisplayName { get; set; }
        public string? Specialization { get; set; }
        public string? ExperienceYears { get; set; }
        public string? Bio { get; set; }
        public string? JobTitle { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? HireDate { get; set; }
        public DateTime? ResidenceExpiryDate { get; set; }
        public bool? CanCreateOutsideCity { get; set; }

        // ملفات ترفع على Google Drive بدل التخزين المحلي
        public IFormFile? Certifications { get; set; }
        public IFormFile? Files1 { get; set; }
        public IFormFile? UserImage { get; set; }
    }
}
