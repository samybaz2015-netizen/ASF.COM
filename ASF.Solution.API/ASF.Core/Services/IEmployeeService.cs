using ASF.Core.Dtos;
using ASF.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IEmployeeService
    {
        Task<IEnumerable<Employees>> GetAllEmployeesAsync();
        Task<Employees?> GetEmployeeByIdAsync(int id);
        Task<Employees> CreateEmployeeAsync(EmployeeDto employeeDto, string baseUrl);
        Task<bool> UpdateEmployeeAsync(int id, EmployeeDto employeeDto, string baseUrl);
        Task<bool> DeleteEmployeeAsync(int id);
    }

}
