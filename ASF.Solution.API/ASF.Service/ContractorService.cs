using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class ContractorService : IContractorService
    {
        private readonly ApplicationDbContext _context;

        public ContractorService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GetContractorsDTO>> GetAllContractors()
        {
            return await _context.Contractors
                .Select(c => new GetContractorsDTO
                {
                    Id = c.Id,
                    Name = c.Name
                })
                .ToListAsync();
        }

        public async Task<GetContractorsDTO> GetContractorById(int id)
        {
            var contractor = await _context.Contractors
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (contractor == null)
                return null;

            return new GetContractorsDTO
            {
                Id = contractor.Id,
                Name = contractor.Name
            };
        }

        public async Task<ContractorDTO> CreateContractor(ContractorDTO contractorDTO)
        {
            // التحقق إذا كان هناك استشارة بنفس الاسم
            var existingContractort = await _context.Contractors
                .Where(c => c.Name == contractorDTO.Name)
                .FirstOrDefaultAsync();

            if (existingContractort != null)
            {
                // إذا كانت الاستشارة موجودة، إرجاع رسالة خطأ
                throw new Exception("Consultant with this name already exists.");
            }

            // إضافة الاستشارة الجديدة إذا لم تكن موجودة
            var contractor = new Contractor
            {
                Name = contractorDTO.Name
            };

            _context.Contractors.Add(contractor);
            await _context.SaveChangesAsync();



            return contractorDTO;
        }


        public async Task<ContractorDTO> UpdateContractor(int id, ContractorDTO contractorDTO)
        {
            var contractor = await _context.Contractors
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (contractor == null)
                return null;

            contractor.Name = contractorDTO.Name;

            _context.Contractors.Update(contractor);
            await _context.SaveChangesAsync();

            return contractorDTO;
        }

        public async Task<bool> DeleteContractor(int id)
        {
            var contractor = await _context.Contractors
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (contractor == null)
                return false;

            _context.Contractors.Remove(contractor);
            await _context.SaveChangesAsync();

            return true;
        }

        
    }

}
