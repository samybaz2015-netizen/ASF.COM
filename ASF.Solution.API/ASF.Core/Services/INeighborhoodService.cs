using ASF.Core.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface INeighborhoodService
    {
        Task<List<NeighborhoodDto>> GetAllAsync();
        Task<NeighborhoodDto> GetByIdAsync(int id);
        Task<CreateNeighborhoodDto> CreateAsync(CreateNeighborhoodDto neighborhoodDto);
        Task<CreateNeighborhoodDto> UpdateAsync(int id, CreateNeighborhoodDto neighborhoodDto);
        Task DeleteAsync(int id);
    }

}
