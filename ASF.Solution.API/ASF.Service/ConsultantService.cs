//using AutoMapper;
//using Microsoft.EntityFrameworkCore;
//using ASF.Core.Dtos;
//using ASF.Core.Entities;
//using ASF.Core.Services;
//using ASF.Repository.AppDbContext;
//using ASF.Repository.Identity;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace ASF.Service
//{
//    public class ConsultantService : IConsultantService
//    {
//        private readonly ApplicationDbContext _context;

//        public ConsultantService(ApplicationDbContext context)
//        {
//            _context = context;
//        }

//        public async Task<IEnumerable<GetConsultantDto>> GetAllConsultants()
//        {
//            return await _context.Consultants
//                .Select(c => new GetConsultantDto
//                {
//                    Id = c.Id,
//                    Name = c.Name
//                })
//                .ToListAsync();
//        }

//        public async Task<GetConsultantDto> GetConsultantById(int id)
//        {
//            var consultant = await _context.Consultants
//                .Where(c => c.Id == id)
//                .FirstOrDefaultAsync();

//            if (consultant == null)
//                return null;

//            return new GetConsultantDto
//            {
//                Id = consultant.Id,
//                Name = consultant.Name
//            };
//        }

//        public async Task<ConsultantDto> CreateConsultant(ConsultantDto consultantDto)
//        {
//            // التحقق إذا كان هناك استشارة بنفس الاسم
//            var existingConsultant = await _context.Consultants
//                .Where(c => c.Name == consultantDto.Name)
//                .FirstOrDefaultAsync();

//            if (existingConsultant != null)
//            {
//                // إذا كانت الاستشارة موجودة، إرجاع رسالة خطأ
//                throw new Exception("Consultant with this name already exists.");
//            }

//            // إضافة الاستشارة الجديدة إذا لم تكن موجودة
//            var consultant = new Consultant
//            {
//                Name = consultantDto.Name
//            };

//            _context.Consultants.Add(consultant);
//            await _context.SaveChangesAsync();



//            return consultantDto;
//        }


//        public async Task<ConsultantDto> UpdateConsultant(int id, ConsultantDto consultantDto)
//        {
//            var consultant = await _context.Consultants
//                .Where(c => c.Id == id)
//                .FirstOrDefaultAsync();

//            if (consultant == null)
//                return null;

//            consultant.Name = consultantDto.Name;

//            _context.Consultants.Update(consultant);
//            await _context.SaveChangesAsync();

//            return consultantDto;
//        }

//        public async Task<bool> DeleteConsultant(int id)
//        {
//            var consultant = await _context.Consultants
//                .Where(c => c.Id == id)
//                .FirstOrDefaultAsync();

//            if (consultant == null)
//                return false;

//            _context.Consultants.Remove(consultant);
//            await _context.SaveChangesAsync();

//            return true;
//        }
//    }

//}
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
    public class ConsultantService : IConsultantService
    {
        private readonly ApplicationDbContext _context;

        public ConsultantService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GetConsultantDto>> GetAllConsultants()
        {
            return await _context.Consultants
                .AsNoTracking()
                .Select(c => new GetConsultantDto
                {
                    Id = c.Id,
                    Name = c.Name
                })
                .ToListAsync();
        }

        public async Task<GetConsultantDto> GetConsultantById(int id)
        {
            var consultant = await _context.Consultants
                .AsNoTracking()
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (consultant == null)
                return null;

            return new GetConsultantDto
            {
                Id = consultant.Id,
                Name = consultant.Name
            };
        }

        public async Task<ConsultantDto> CreateConsultant(ConsultantDto consultantDto)
        {
            // التحقق إذا كان هناك استشارة بنفس الاسم
            var existingConsultant = await _context.Consultants
                .Where(c => c.Name == consultantDto.Name)
                .FirstOrDefaultAsync();

            if (existingConsultant != null)
            {
                // إذا كانت الاستشارة موجودة، إرجاع رسالة خطأ
                throw new Exception("Consultant with this name already exists.");
            }

            // إضافة الاستشارة الجديدة إذا لم تكن موجودة
            var consultant = new Consultant
            {
                Name = consultantDto.Name
            };

            _context.Consultants.Add(consultant);
            await _context.SaveChangesAsync();



            return consultantDto;
        }


        public async Task<ConsultantDto> UpdateConsultant(int id, ConsultantDto consultantDto)
        {
            var consultant = await _context.Consultants
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (consultant == null)
                return null;

            consultant.Name = consultantDto.Name;

            _context.Consultants.Update(consultant);
            await _context.SaveChangesAsync();

            return consultantDto;
        }

        public async Task<bool> DeleteConsultant(int id)
        {
            var consultant = await _context.Consultants
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (consultant == null)
                return false;

            _context.Consultants.Remove(consultant);
            await _context.SaveChangesAsync();

            return true;
        }
    }

}