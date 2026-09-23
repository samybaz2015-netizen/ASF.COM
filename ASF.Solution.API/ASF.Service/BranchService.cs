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
  
    public class BranchService : IBranchService
    {
        private readonly ApplicationDbContext _context;

        public BranchService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<BranchsDTO>> GetAllAsync()
        {
            var branches = await _context.Set<Branchs>()
                .Include(b => b.Offices)
                .ToListAsync();

            var count = branches.Count();

            return branches.Select(branch => new BranchsDTO
            {
                Id = branch.Id,
                Name = branch.Name,
                Offices = branch.Offices.Select(o => new OfficeDTO2
                {
                    Id = o.Id,
                    Name = o.Name
                }).ToList()
            }).ToList();
        }


        public async Task<BranchsDTO> GetByIdAsync(int? id)
        {
            var branch = await _context.Set<Branchs>()
                .Include(b => b.Offices)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (branch == null)
                throw new KeyNotFoundException($"Branch with Id {id} not found.");

            return new BranchsDTO
            {
                Id = branch.Id,
                Name = branch.Name,
                Offices = branch.Offices.Select(o => new OfficeDTO2
                {
                    Id = o.Id,
                    Name = o.Name
                }).ToList()
            };
        }

        public async Task<AddBranchsDTO> CreateAsync(AddBranchsDTO branchsDTO)
        {
            var branchs = new Branchs
            {
                Name = branchsDTO.Name
            };

            _context.Set<Branchs>().Add(branchs);
            await _context.SaveChangesAsync();

            return branchsDTO;
        }

        public async Task<AddBranchsDTO> UpdateAsync(int id, AddBranchsDTO branchsDTO)
        {
            var branch = await _context.Set<Branchs>().FindAsync(id);
            if (branch == null)
                throw new KeyNotFoundException($"branch with Id {id} not found.");

            branch.Name = branchsDTO.Name;

            _context.Set<Branchs>().Update(branch);
            await _context.SaveChangesAsync();

            return new AddBranchsDTO
            {
                Name = branch.Name
            };
        }

        public async Task DeleteAsync(int id)
        {
            var branch = await _context.Set<Branchs>().FindAsync(id);
            if (branch == null)
                throw new KeyNotFoundException($"Branch with Id {id} not found.");

            _context.Set<Branchs>().Remove(branch);
            await _context.SaveChangesAsync();
        }

       
    }
}
