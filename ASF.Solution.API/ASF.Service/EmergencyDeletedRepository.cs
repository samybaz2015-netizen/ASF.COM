using Microsoft.EntityFrameworkCore;
using ASF.Core.Entities.Emergency;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
    
    public class EmergencyDeletedRepository : IEmergencyDeletedRepository
    {
        private readonly ApplicationDbContext _context;

        public EmergencyDeletedRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(EmergencyDeleted project)
        {
            await _context.EmergencyDeleted.AddAsync(project);
            await _context.SaveChangesAsync();
        }
        public async Task<List<EmergencyDeleted>> GetAllAsync()
        {
            var list = await _context.EmergencyDeleted
                 .Include(c => c.ModelPhotos) // تحميل الصور المرتبطة بالنماذج
                .Include(c => c.SitePhotos)  // تحميل صور المواقع
                .Include(c => c.SafetyWastePhotos) // تحميل صور النفايات والسلامة
                .ToListAsync();
            return list;
        }
        public async Task DeleteAsync(EmergencyDeleted entity)
        {
            _context.EmergencyDeleted.Remove(entity);
            await _context.SaveChangesAsync();
        }
        public async Task<EmergencyDeleted> GetByIdAsync(int id)
        {
            return await _context.EmergencyDeleted
                .Include(c => c.ModelPhotos)
                .Include(c => c.SitePhotos)
                .Include(c => c.SafetyWastePhotos)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

    }
}
