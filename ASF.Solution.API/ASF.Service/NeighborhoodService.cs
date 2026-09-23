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
    public class NeighborhoodService : INeighborhoodService
    {
        private readonly ApplicationDbContext _context;

        public NeighborhoodService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<NeighborhoodDto>> GetAllAsync()
        {
            var neighborhoods = await _context.Set<Neighborhood>().ToListAsync();

            return neighborhoods.Select(n => new NeighborhoodDto
            {
                Id = n.Id,
                Name = n.Name,
                OfficeId = n.OfficeId,
                OfficeName = n.Office != null ? n.Office.Name : "No Office",  // تحقق من null هنا
            }).ToList();
        }


        public async Task<NeighborhoodDto> GetByIdAsync(int id)
        {
            var neighborhood = await _context.Set<Neighborhood>().FindAsync(id);
            if (neighborhood == null)
                throw new KeyNotFoundException($"Neighborhood with Id {id} not found.");

            return new NeighborhoodDto
            {
                Id = neighborhood.Id,
                Name = neighborhood.Name,
                OfficeId = neighborhood.OfficeId,
                OfficeName = neighborhood.Office.Name
            };
        }

        public async Task<CreateNeighborhoodDto> CreateAsync(CreateNeighborhoodDto neighborhoodDto)
        {
            var neighborhood = new Neighborhood
            {
                Name = neighborhoodDto.Name,
                OfficeId = neighborhoodDto.OfficeId,
            };

            _context.Set<Neighborhood>().Add(neighborhood);
            await _context.SaveChangesAsync();

            return neighborhoodDto;
        }

        public async Task<CreateNeighborhoodDto> UpdateAsync(int id, CreateNeighborhoodDto neighborhoodDto)
        {
            var neighborhood = await _context.Set<Neighborhood>().FindAsync(id);
            if (neighborhood == null)
                throw new KeyNotFoundException($"Neighborhood with Id {id} not found.");

            neighborhood.Name = neighborhoodDto.Name;
            neighborhood.OfficeId = neighborhoodDto.OfficeId;



            _context.Set<Neighborhood>().Update(neighborhood);
            await _context.SaveChangesAsync();

            return new CreateNeighborhoodDto
            {
                Name = neighborhood.Name,
                OfficeId = neighborhood.OfficeId,
            };
        }

        public async Task DeleteAsync(int id)
        {
            var neighborhood = await _context.Set<Neighborhood>().FindAsync(id);
            if (neighborhood == null)
                throw new KeyNotFoundException($"Neighborhood with Id {id} not found.");

            _context.Set<Neighborhood>().Remove(neighborhood);
            await _context.SaveChangesAsync();
        }
    }

}
