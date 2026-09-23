using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class EngineerProfileDto
    {
        public string? FullName { get; set; }
        public DateTime? HireDate { get; set; }
        public string? JobTitle { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Specialization { get; set; }
        public string? ExperienceYears { get; set; }
        public IFormFile? Certifications { get; set; }
        public int? AnnualLeaveDays { get; set; }
        public string? Bio { get; set; }
        public IFormFile? Files1 { get; set; }
        public DateTime? ResidenceExpiryDate { get; set; } // 🔹 استقبال تاريخ الإقامة

    }
    public class GetEngineerProfileDto
    {
        public string? FullName { get; set; }
        public DateTime? HireDate { get; set; }
        public string? JobTitle { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Specialization { get; set; }
        public string? ExperienceYears { get; set; }
        public string? Certifications { get; set; }
        public int? AnnualLeaveDays { get; set; }
        public string? Bio { get; set; }
        public string? Files1 { get; set; }
        public DateTime? ResidenceExpiryDate { get; set; } // 🔹 استقبال تاريخ الإقامة

    }

}
