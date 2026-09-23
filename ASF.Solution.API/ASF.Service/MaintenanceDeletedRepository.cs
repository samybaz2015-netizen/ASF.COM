using Microsoft.EntityFrameworkCore;
using ASF.Core.Entities.Maintenance;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
   
    public class MaintenanceDeletedRepository : IMaintenanceDeletedRepository
    {
        private readonly ApplicationDbContext _context;

        public MaintenanceDeletedRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(MaintenanceDeleted project)
        {
            await _context.MaintenanceDeleted.AddAsync(project);
            await _context.SaveChangesAsync();
        }
        public async Task<List<MaintenanceDeleted>> GetAllAsync()
        {
            var list = await _context.MaintenanceDeleted
                 .Include(c => c.ModelPhotos) // تحميل الصور المرتبطة بالنماذج
                .Include(c => c.SitePhotos)  // تحميل صور المواقع
                .Include(c => c.SafetyWastePhotos) // تحميل صور النفايات والسلامة
                .ToListAsync();
            return list;
        }
        public async Task DeleteAsync(MaintenanceDeleted entity)
        {
            _context.MaintenanceDeleted.Remove(entity);
            await _context.SaveChangesAsync();
        }
        public async Task<MaintenanceDeleted> GetByIdAsync(int id)
        {
            return await _context.MaintenanceDeleted
                .Include(c => c.ModelPhotos)
                .Include(c => c.SitePhotos)
                .Include(c => c.SafetyWastePhotos)
                .FirstOrDefaultAsync(c => c.Id == id);
        }


    }
}
