using Microsoft.EntityFrameworkCore;
using ASF.Core.Entities.NewProject;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class NewProjectDeletedRepository : INewProjectDeletedRepository
    {
        private readonly ApplicationDbContext _context;

        public NewProjectDeletedRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(NewProjectDeleted project)
        {
            await _context.NewProjectDeleted.AddAsync(project);
            await _context.SaveChangesAsync();
        }
        public async Task<List<NewProjectDeleted>> GetAllAsync()
        {
            var list = await _context.NewProjectDeleted.ToListAsync();
            return list;
        }
        public async Task DeleteAsync(NewProjectDeleted entity)
        {
            _context.NewProjectDeleted.Remove(entity);
            await _context.SaveChangesAsync();
        }
        public async Task<NewProjectDeleted> GetByIdAsync(int id)
        {
            return await _context.NewProjectDeleted
                .Include(c => c.ModelPhotos)
                .Include(c => c.SitePhotos)
                .Include(c => c.SafetyWastePhotos)
                .FirstOrDefaultAsync(c => c.Id == id);
        }


    }



}
