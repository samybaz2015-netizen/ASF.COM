using ASF.Core.Dtos;
using ASF.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IOfficeService
    {
        Task<List<OfficeDTO>> GetAllAsync();  // للحصول على كل المكاتب
        Task<OfficeDTO> GetByIdAsync(int id);  // للحصول على مكتب بواسطة id
        Task<CreateOfficeDTO> CreateAsync(CreateOfficeDTO officeDTO);  // لإنشاء مكتب جديد
        Task<CreateOfficeDTO> UpdateAsync(int id, CreateOfficeDTO officeDTO);  // لتحديث مكتب
        Task DeleteAsync(int id);  // لحذف مكتب
        Task<List<Office>> GetOfficesByBranchIdAsync(int branchId);
        Task<List<NeighborhoodDto>> GetByOfficeIdAsync(string officeName);
    }
}
