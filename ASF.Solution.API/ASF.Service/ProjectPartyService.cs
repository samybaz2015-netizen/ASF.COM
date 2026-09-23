using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using static ASF.Core.Entities.Permissions;

namespace ASF.Service
{
    public class ProjectPartyService : IProjectPartyService
    {
        private readonly ApplicationDbContext _context;

        public ProjectPartyService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GetProjectPartyDto>> GetAllProjectParties(string? type = null, int? branchId = null)
        {
            var query = _context.ProjectParties
    .Include(x => x.Branch)
    .AsQueryable();

            if (!string.IsNullOrWhiteSpace(type))
            {
                query = query.Where(p =>
                    p.Type.Trim().ToLower() == type.Trim().ToLower());
            }

            if (branchId.HasValue)
            {
                query = query.Where(p => p.BranchId == branchId);
            }
            if (!string.IsNullOrWhiteSpace(type))
            {
                query = query.Where(p => p.Type.Trim().ToLower() == type.Trim().ToLower());
            }

            return await query
                .OrderByDescending(p => p.CreatedAt)
               .Select(p => new GetProjectPartyDto
               {
                   Id = p.Id,
                   Name = p.Name,
                   Type = p.Type,
                   BranchId = p.BranchId,
                   BranchName = p.Branch != null ? p.Branch.Name : null,
                   CreatedAt = p.CreatedAt
               })
                .ToListAsync();
        }

        public async Task<GetProjectPartyDto?> GetProjectPartyById(int id)
        {
            var party = await _context.ProjectParties.Include(x => x.Branch).AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
            if (party == null) return null;

            return new GetProjectPartyDto
            {
                Id = party.Id,
                Name = party.Name,
                Type = party.Type,
                BranchId = party.BranchId,
                BranchName = party.Branch != null ? party.Branch.Name : null,
                CreatedAt = party.CreatedAt
            };
        }

        public async Task<GetProjectPartyDto> CreateProjectParty(ProjectPartyDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("اسم الطرف مطلوب");
            if (string.IsNullOrWhiteSpace(dto.Type))
                throw new ArgumentException("نوع الطرف مطلوب (مقاول، مهندس، مشرف)");

            var exists = await _context.ProjectParties.AnyAsync(p => p.Name.Trim() == dto.Name.Trim() && p.Type.Trim() == dto.Type.Trim());
            if (exists)
                throw new InvalidOperationException($"الطرف '{dto.Name}' من نوع '{dto.Type}' موجود بالفعل");

            var party = new ProjectParty
            {
                Name = dto.Name.Trim(),
                Type = dto.Type.Trim(),
                BranchId = dto.BranchId,
                CreatedAt = DateTime.Now
            };

            await _context.ProjectParties.AddAsync(party);
            await _context.SaveChangesAsync();

            return new GetProjectPartyDto
            {
                Id = party.Id,
                Name = party.Name,
                Type = party.Type,
                CreatedAt = party.CreatedAt
            };
        }

        public async Task<GetProjectPartyDto?> UpdateProjectParty(int id, ProjectPartyDto dto)
        {
            var party = await _context.ProjectParties.FirstOrDefaultAsync(p => p.Id == id);
            if (party == null) return null;

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("اسم الطرف مطلوب");
            if (string.IsNullOrWhiteSpace(dto.Type))
                throw new ArgumentException("نوع الطرف مطلوب (مقاول، مهندس، مشرف)");

            var exists = await _context.ProjectParties.AnyAsync(p => p.Id != id && p.Name.Trim() == dto.Name.Trim() && p.Type.Trim() == dto.Type.Trim());
            if (exists)
                throw new InvalidOperationException($"الطرف '{dto.Name}' من نوع '{dto.Type}' موجود بالفعل");

            party.Name = dto.Name.Trim();
            party.Type = dto.Type.Trim();
            party.BranchId = dto.BranchId;
            _context.ProjectParties.Update(party);
            await _context.SaveChangesAsync();

            return new GetProjectPartyDto
            {
                Id = party.Id,
                Name = party.Name,
                Type = party.Type,
                CreatedAt = party.CreatedAt
            };
        }

        public async Task<bool> DeleteProjectParty(int id)
        {
            var party = await _context.ProjectParties.FirstOrDefaultAsync(p => p.Id == id);
            if (party == null) return false;

            _context.ProjectParties.Remove(party);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task AssignBranchToAll(int branchId)
        {
            var parties = await _context.ProjectParties.ToListAsync();

            foreach (var party in parties)
            {
                party.BranchId = branchId;
            }

            await _context.SaveChangesAsync();
        }
    }
}
