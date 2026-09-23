using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class EmployeeService : IEmployeeService
    {
        private readonly ApplicationDbContext _context;

        public EmployeeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Employees>> GetAllEmployeesAsync()
        {
            return await _context.Employees.ToListAsync();
        }

        public async Task<Employees?> GetEmployeeByIdAsync(int id)
        {
            return await _context.Employees.FindAsync(id);
        }

        public async Task<Employees> CreateEmployeeAsync(EmployeeDto employeeDto, string baseUrl)
        {
            string? cvImagePath = null;
            string? userImagePath = null;
            string? licenseImagePath = null;
            string? residenceImagePath = null;

            if (employeeDto.ResidencePhoto != null)
            {
                var residenceFileName = $"{Guid.NewGuid()}_{employeeDto.ResidencePhoto.FileName}";
                var relativePath = $"/uploads/cvs/{residenceFileName}";
                var residenceFilePath = Path.Combine("wwwroot", "uploads", "cvs", residenceFileName);
                Directory.CreateDirectory(Path.GetDirectoryName(residenceFilePath)!);

                using (var stream = new FileStream(residenceFilePath, FileMode.Create))
                {
                    await employeeDto.ResidencePhoto.CopyToAsync(stream);
                }


                residenceImagePath = $"{baseUrl}{relativePath}";
            }
            if (employeeDto.LicensePhoto != null)
            {
                var licenseFileName = $"{Guid.NewGuid()}_{employeeDto.LicensePhoto.FileName}";
                var relativePath = $"/uploads/cvs/{licenseFileName}";
                var licenseFilePath = Path.Combine("wwwroot", "uploads", "cvs", licenseFileName);
                Directory.CreateDirectory(Path.GetDirectoryName(licenseFilePath)!);

                using (var stream = new FileStream(licenseFilePath, FileMode.Create))
                {
                    await employeeDto.LicensePhoto.CopyToAsync(stream);
                }

                licenseImagePath = $"{baseUrl}{relativePath}";
            }
            if (employeeDto.CvImage != null)
            {
                var cvFileName = $"{Guid.NewGuid()}_{employeeDto.CvImage.FileName}";
                var relativePath = $"/uploads/cvs/{cvFileName}";
                var cvFilePath = Path.Combine("wwwroot", "uploads", "cvs", cvFileName);
                Directory.CreateDirectory(Path.GetDirectoryName(cvFilePath)!);

                using (var stream = new FileStream(cvFilePath, FileMode.Create))
                {
                    await employeeDto.CvImage.CopyToAsync(stream);
                }

                cvImagePath = $"{baseUrl}{relativePath}";
            }

            if (employeeDto.UserImage != null)
            {
                var userFileName = $"{Guid.NewGuid()}_{employeeDto.UserImage.FileName}";
                var relativePath = $"/uploads/users/{userFileName}";
                var userFilePath = Path.Combine("wwwroot", "uploads", "users", userFileName);
                Directory.CreateDirectory(Path.GetDirectoryName(userFilePath)!);

                using (var stream = new FileStream(userFilePath, FileMode.Create))
                {
                    await employeeDto.UserImage.CopyToAsync(stream);
                }

                userImagePath = $"{baseUrl}{relativePath}";
            }
            

            var employee = new Employees
            {
                Name = employeeDto.Name,
                Phone = employeeDto.Phone,
                Email = employeeDto.Email,
                Salary = employeeDto.Salary,
                City = employeeDto.City,
                NationalId = employeeDto.NationalId,
                GraduationDate = employeeDto.GraduationDate,
                Created = DateTime.Now,
                CvImage = cvImagePath,
                UserImage = userImagePath,
                ResidencePhoto = residenceImagePath,
                LicensePhoto = licenseImagePath,
                EmploymentDate = employeeDto.EmploymentDate,
                WorkersProfession = employeeDto.WorkersProfession,
            };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();
            return employee;
        }


        public async Task<bool> UpdateEmployeeAsync(int id, EmployeeDto employeeDto, string baseUrl)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null) return false;

            // تحديث القيم النصية
            employee.Name = string.IsNullOrWhiteSpace(employeeDto.Name) ? employee.Name : employeeDto.Name;
            employee.Name = string.IsNullOrWhiteSpace(employeeDto.WorkersProfession) ? employee.WorkersProfession : employeeDto.WorkersProfession;
            employee.Phone = string.IsNullOrWhiteSpace(employeeDto.Phone) ? employee.Phone : employeeDto.Phone;
            employee.Email = string.IsNullOrWhiteSpace(employeeDto.Email) ? employee.Email : employeeDto.Email;
            employee.Salary = string.IsNullOrWhiteSpace(employeeDto.Salary) ? employee.Salary : employeeDto.Salary;
            employee.City = string.IsNullOrWhiteSpace(employeeDto.City) ? employee.City : employeeDto.City;
            employee.NationalId = string.IsNullOrWhiteSpace(employeeDto.NationalId) ? employee.NationalId : employeeDto.NationalId;
            employee.GraduationDate = employeeDto.GraduationDate ?? employee.GraduationDate;
            employee.EmploymentDate = employeeDto.EmploymentDate ?? employee.EmploymentDate;

            // رفع صورة السيرة الذاتية CV
            if (employeeDto.ResidencePhoto != null)
            {
                var cvFileName = $"{Guid.NewGuid()}_{employeeDto.ResidencePhoto.FileName}";
                var relativePath = $"/uploads/cvs/{cvFileName}";
                var filePath = Path.Combine("wwwroot", "uploads", "cvs", cvFileName);
                Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await employeeDto.ResidencePhoto.CopyToAsync(stream);
                }

                employee.ResidencePhoto = $"{baseUrl}{relativePath}";
            }
            if (employeeDto.LicensePhoto != null)
            {
                var cvFileName = $"{Guid.NewGuid()}_{employeeDto.LicensePhoto.FileName}";
                var relativePath = $"/uploads/cvs/{cvFileName}";
                var filePath = Path.Combine("wwwroot", "uploads", "cvs", cvFileName);
                Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await employeeDto.LicensePhoto.CopyToAsync(stream);
                }

                employee.LicensePhoto = $"{baseUrl}{relativePath}";
            }
            if (employeeDto.CvImage != null)
            {
                var cvFileName = $"{Guid.NewGuid()}_{employeeDto.CvImage.FileName}";
                var relativePath = $"/uploads/cvs/{cvFileName}";
                var filePath = Path.Combine("wwwroot", "uploads", "cvs", cvFileName);
                Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await employeeDto.CvImage.CopyToAsync(stream);
                }

                employee.CvImage = $"{baseUrl}{relativePath}";
            }

            // رفع صورة المستخدم
            if (employeeDto.UserImage != null)
            {
                var userFileName = $"{Guid.NewGuid()}_{employeeDto.UserImage.FileName}";
                var relativePath = $"/uploads/users/{userFileName}";
                var filePath = Path.Combine("wwwroot", "uploads", "users", userFileName);
                Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await employeeDto.UserImage.CopyToAsync(stream);
                }

                employee.UserImage = $"{baseUrl}{relativePath}";
            }

            _context.Employees.Update(employee);
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<bool> DeleteEmployeeAsync(int id)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null) return false;

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
            return true;
        }
    }

}
