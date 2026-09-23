//using ASF.Core.Dtos;
//using ASF.Core.Services;
//using ASF.Repository.AppDbContext;
//using System.Collections.Generic;
//using System.Linq;
//using System.Threading.Tasks;
//using Microsoft.EntityFrameworkCore;
//using ASF.Core.Entities;

//namespace ASF.Service
//{
//    public class OfficeService : IOfficeService
//    {
//        private readonly ApplicationDbContext _context;

//        public OfficeService(ApplicationDbContext context)
//        {
//            _context = context;
//        }

//        public async Task<List<OfficeDTO>> GetAllAsync()
//        {
//            var offices = await _context.Offices
//                .Include(o => o.Branch) // تضمين بيانات الفرع
//                .ToListAsync();

//            return offices.Select(o => new OfficeDTO
//            {
//                Id = o.Id,
//                Name = o.Name,
//                BranchId = o.BranchId,
//                BranchName = o.Branch.Name
//            }).ToList();
//        }

//        public async Task<OfficeDTO> GetByIdAsync(int id)
//        {
//            var office = await _context.Offices
//                .Include(o => o.Branch) // تضمين بيانات الفرع
//                .FirstOrDefaultAsync(o => o.Id == id);

//            if (office == null)
//                throw new KeyNotFoundException($"Office with Id {id} not found.");

//            return new OfficeDTO
//            {
//                Id = office.Id,
//                Name = office.Name,
//                BranchId = office.BranchId,
//                BranchName = office.Branch.Name
//            };
//        }

//        public async Task<CreateOfficeDTO> CreateAsync(CreateOfficeDTO officeDTO)
//        {
//            var office = new Office
//            {
//                Name = officeDTO.Name,
//                BranchId = officeDTO.BranchId
//            };

//            _context.Offices.Add(office);
//            await _context.SaveChangesAsync();

//            return officeDTO;
//        }

//        public async Task<CreateOfficeDTO> UpdateAsync(int id, CreateOfficeDTO officeDTO)
//        {
//            var office = await _context.Offices.FindAsync(id);
//            if (office == null)
//                throw new KeyNotFoundException($"Office with Id {id} not found.");

//            office.Name = officeDTO.Name;
//            office.BranchId = officeDTO.BranchId;

//            _context.Offices.Update(office);
//            await _context.SaveChangesAsync();

//            return officeDTO;
//        }

//        public async Task DeleteAsync(int id)
//        {
//            var office = await _context.Offices.FindAsync(id);
//            if (office == null)
//                throw new KeyNotFoundException($"Office with Id {id} not found.");

//            _context.Offices.Remove(office);
//            await _context.SaveChangesAsync();
//        }
//        public async Task<List<Office>> GetOfficesByBranchIdAsync(int branchId)
//        {
//            return await _context.Offices
//                .Where(o => o.BranchId == branchId)
//                .ToListAsync();
//        }
//        public async Task<List<NeighborhoodDto>> GetByOfficeIdAsync(string officeName)
//        {
//            var neighborhoods = await _context.Set<Neighborhood>()
//                .Where(n => n.Office.Name == officeName)
//                        .Include(n => n.Office)  
//                .ToListAsync();

//            return neighborhoods.Select(n => new NeighborhoodDto
//            {
//                Id = n.Id,
//                Name = n.Name,
//                OfficeId = n.OfficeId,
//                OfficeName = n.Office != null ? n.Office.Name : "No Office",
//            }).ToList();
//        }

//    }
//}
using ASF.Core.Dtos;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Entities;

namespace ASF.Service
{
    public class OfficeService : IOfficeService
    {
        private readonly ApplicationDbContext _context;

        public OfficeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<OfficeDTO>> GetAllAsync()
        {
            var offices = await _context.Offices
                .AsNoTracking()
                .Include(o => o.Branch) // تضمين بيانات الفرع
                .ToListAsync();

            return offices.Select(o => new OfficeDTO
            {
                Id = o.Id,
                Name = o.Name,
                BranchId = o.BranchId,
                BranchName = o.Branch.Name
            }).ToList();
        }

        public async Task<OfficeDTO> GetByIdAsync(int id)
        {
            var office = await _context.Offices
                .AsNoTracking()
                .Include(o => o.Branch) // تضمين بيانات الفرع
                .FirstOrDefaultAsync(o => o.Id == id);

            if (office == null)
                throw new KeyNotFoundException($"Office with Id {id} not found.");

            return new OfficeDTO
            {
                Id = office.Id,
                Name = office.Name,
                BranchId = office.BranchId,
                BranchName = office.Branch.Name
            };
        }

        public async Task<CreateOfficeDTO> CreateAsync(CreateOfficeDTO officeDTO)
        {
            var office = new Office
            {
                Name = officeDTO.Name,
                BranchId = officeDTO.BranchId
            };

            _context.Offices.Add(office);
            await _context.SaveChangesAsync();

            return officeDTO;
        }

        public async Task<CreateOfficeDTO> UpdateAsync(int id, CreateOfficeDTO officeDTO)
        {
            var office = await _context.Offices.FindAsync(id);
            if (office == null)
                throw new KeyNotFoundException($"Office with Id {id} not found.");

            office.Name = officeDTO.Name;
            office.BranchId = officeDTO.BranchId;

            _context.Offices.Update(office);
            await _context.SaveChangesAsync();

            return officeDTO;
        }

        public async Task DeleteAsync(int id)
        {
            var office = await _context.Offices.FindAsync(id);
            if (office == null)
                throw new KeyNotFoundException($"Office with Id {id} not found.");

            _context.Offices.Remove(office);
            await _context.SaveChangesAsync();
        }
        public async Task<List<Office>> GetOfficesByBranchIdAsync(int branchId)
        {
            return await _context.Offices
                .AsNoTracking()
                .Where(o => o.BranchId == branchId)
                .ToListAsync();
        }
        public async Task<List<NeighborhoodDto>> GetByOfficeIdAsync(string officeName)
        {
            var neighborhoods = await _context.Set<Neighborhood>()
                .AsNoTracking()
                .Where(n => n.Office.Name == officeName)
                        .Include(n => n.Office)
                .ToListAsync();

            return neighborhoods.Select(n => new NeighborhoodDto
            {
                Id = n.Id,
                Name = n.Name,
                OfficeId = n.OfficeId,
                OfficeName = n.Office != null ? n.Office.Name : "No Office",
            }).ToList();
        }

    }
}