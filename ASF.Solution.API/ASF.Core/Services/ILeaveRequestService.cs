using ASF.Core.Dtos;
using ASF.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface ILeaveRequestService
    {
        Task<bool> RequestLeaveAsync(string employeeId, LeaveRequestDto leaveRequestDto);
        Task<IEnumerable<LeaveRequest>> GetAllRequestsAsync(string? employeeName = null, int? branchId = null);
        Task<bool> DeleteLeaveRequestAsync(int requestId);
        Task<LeaveRequest> GetLeaveRequestByIdAsync(int requestId);
        Task<bool> UpdateLeaveStatusAsync(int requestId, string status, string reason);
        Task<bool> DeleteAllLeaveRequestsAsync();

        // جديد: عدّادات الموظف
        Task<IEnumerable<MyLeaveRequestDto>> GetMyLeaveRequestsWithCountersAsync(string employeeId);
        Task<bool> UpdateLeaveRequestAsync(int requestId, UpdateLeaveRequestDto dto);
        Task<bool> CarryOverLeaveBalancesAsync();
    }
}
