using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class ProjectOwnerService : IProjectOwnerService
    {
        private readonly ApplicationDbContext _context;

        public ProjectOwnerService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GetProjectOwnerDto>> GetAllProjectOwners()
        {
            return await _context.ProjectOwners
                .AsNoTracking()
                .Select(c => new GetProjectOwnerDto
                {
                    Id = c.Id,
                    Name = c.Name
                })
                .ToListAsync();
        }

        public async Task<GetProjectOwnerDto?> GetProjectOwnerById(int id)
        {
            var owner = await _context.ProjectOwners
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (owner == null)
                return null;

            return new GetProjectOwnerDto
            {
                Id = owner.Id,
                Name = owner.Name
            };
        }

        public async Task<ProjectOwnerDto> CreateProjectOwner(ProjectOwnerDto dto)
        {
            var existingOwner = await _context.ProjectOwners
                .FirstOrDefaultAsync(c => c.Name == dto.Name);

            if (existingOwner != null)
            {
                throw new Exception("مالك المشروع بهذا الاسم موجود بالفعل.");
            }

            var owner = new ProjectOwner
            {
                Name = dto.Name
            };

            _context.ProjectOwners.Add(owner);
            await _context.SaveChangesAsync();

            return dto;
        }

        public async Task<ProjectOwnerDto?> UpdateProjectOwner(int id, ProjectOwnerDto dto)
        {
            var owner = await _context.ProjectOwners
                .FirstOrDefaultAsync(c => c.Id == id);

            if (owner == null)
                return null;

            owner.Name = dto.Name;

            _context.ProjectOwners.Update(owner);
            await _context.SaveChangesAsync();

            return dto;
        }

        public async Task<bool> DeleteProjectOwner(int id)
        {
            var owner = await _context.ProjectOwners
                .FirstOrDefaultAsync(c => c.Id == id);

            if (owner == null)
                return false;

            _context.ProjectOwners.Remove(owner);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
