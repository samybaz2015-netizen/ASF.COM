using Microsoft.EntityFrameworkCore;
using ASF.Core.Entities.Construction;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
  
    public class ConstructionDeletedRepository : IConstructionDeletedRepository
    {
        private readonly ApplicationDbContext _context;

        public ConstructionDeletedRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ConstructionDeleted project)
        {
            await _context.ConstructionDeleted.AddAsync(project);
            await _context.SaveChangesAsync();
        }
        public async Task<List<ConstructionDeleted>> GetAllAsync()
        {
            var list = await _context.ConstructionDeleted
                .Include(c => c.ModelPhotos) // تحميل الصور المرتبطة بالنماذج
                .Include(c => c.SitePhotos)  // تحميل صور المواقع
                .Include(c => c.SafetyWastePhotos) // تحميل صور النفايات والسلامة
                .ToListAsync();

            return list;
        }

        public async Task DeleteAsync(ConstructionDeleted entity)
        {
            _context.ConstructionDeleted.Remove(entity);
            await _context.SaveChangesAsync();
        }
        public async Task<ConstructionDeleted> GetByIdAsync(int id)
        {
            return await _context.ConstructionDeleted
                .Include(c => c.ModelPhotos)
                .Include(c => c.SitePhotos)
                .Include(c => c.SafetyWastePhotos)
                .FirstOrDefaultAsync(c => c.Id == id);
        }


    }


}
