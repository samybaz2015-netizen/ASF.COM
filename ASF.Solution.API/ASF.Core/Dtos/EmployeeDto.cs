using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Dtos
{
    public class EmployeeDto
    {
        public string? Name { get; set; }
        public string? NationalId { get; set; }
        public string? City { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Salary { get; set; }
        public string? WorkersProfession { get; set; }

        public IFormFile? CvImage { get; set; }
        public IFormFile? ResidencePhoto { get; set; }
        public IFormFile? LicensePhoto { get; set; }
        public IFormFile? UserImage { get; set; }
        public DateTime? GraduationDate { get; set; }
        public DateTime? EmploymentDate { get; set; }
    }

}
