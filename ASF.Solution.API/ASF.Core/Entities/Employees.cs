using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities
{
    public class Employees
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? NationalId { get; set; }
        public string? City { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Salary { get; set; }
        public string? CvImage { get; set; }
        public string? UserImage { get; set; }
        public DateTime? Created { get; set; }
        public DateTime? GraduationDate { get; set; }
        public DateTime? EmploymentDate { get; set; }
        public string? ResidencePhoto { get; set; }
        public string? LicensePhoto { get; set; }
        public string? WorkersProfession { get; set; }


    }
}
