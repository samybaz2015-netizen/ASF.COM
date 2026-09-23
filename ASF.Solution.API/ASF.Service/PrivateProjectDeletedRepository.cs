using Microsoft.EntityFrameworkCore;
using ASF.Core.Entities.PrivateProject;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class PrivateProjectDeletedRepository : IPrivateProjectDeletedRepository
    {
        private readonly ApplicationDbContext _context;

        public PrivateProjectDeletedRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(PrivateProjectDeleted deletedProject)
        {
            await _context.PrivateProjectDeleted.AddAsync(deletedProject);
            await _context.SaveChangesAsync();
        }

        public async Task<List<PrivateProjectDeleted>> GetAllAsync()
        {
            return await _context.PrivateProjectDeleted
                .Include(p => p.ModelPhotos)
                .Include(p => p.SitePhotos)
                .Include(p => p.SafetyWastePhotos)
                .ToListAsync();
        }

        public async Task DeleteAsync(PrivateProjectDeleted entity)
        {
            _context.PrivateProjectDeleted.Remove(entity);
            await _context.SaveChangesAsync();
        }
        public async Task<PrivateProjectDeleted> GetByIdAsync(int id)
        {
            return await _context.PrivateProjectDeleted
                .Include(c => c.ModelPhotos)
                .Include(c => c.SitePhotos)
                .Include(c => c.SafetyWastePhotos)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

    }
}
