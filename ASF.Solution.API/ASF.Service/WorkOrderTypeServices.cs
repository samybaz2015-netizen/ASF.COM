
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
    public class WorkOrderTypeServices : IWorkOrderTypeServices
    {
        private readonly ApplicationDbContext _context;

        public WorkOrderTypeServices(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GetWorkOrderTypeDTO>> GetAllWorkOrderTypes()
        {
            return await _context.WorkOrderTypes
                .AsNoTracking()
                .Select(c => new GetWorkOrderTypeDTO
                {
                    Id = c.Id,
                    Name = c.Name
                })
                .ToListAsync();
        }

        public async Task<GetWorkOrderTypeDTO> GetWorkOrderTypeById(int id)
        {
            var workOrderType = await _context.WorkOrderTypes
                .AsNoTracking()
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (workOrderType == null)
                return null;

            return new GetWorkOrderTypeDTO
            {
                Id = workOrderType.Id,
                Name = workOrderType.Name
            };
        }

        public async Task<WorkOrderTypeDTO> CreateWorkOrderType(WorkOrderTypeDTO workOrderTypeDTO)
        {
            // التحقق إذا كان هناك استشارة بنفس الاسم
            var existingGetWorkOrderType = await _context.WorkOrderTypes
                .Where(c => c.Name == workOrderTypeDTO.Name)
                .FirstOrDefaultAsync();

            if (existingGetWorkOrderType != null)
            {
                // إذا كانت الاستشارة موجودة، إرجاع رسالة خطأ
                throw new Exception("Consultant with this name already exists.");
            }

            // إضافة الاستشارة الجديدة إذا لم تكن موجودة
            var workOrderType = new WorkOrderType
            {
                Name = workOrderTypeDTO.Name
            };

            _context.WorkOrderTypes.Add(workOrderType);
            await _context.SaveChangesAsync();



            return workOrderTypeDTO;
        }


        public async Task<WorkOrderTypeDTO> UpdateWorkOrderType(int id, WorkOrderTypeDTO workOrderTypeDTO)
        {
            var workOrderType = await _context.WorkOrderTypes
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (workOrderType == null)
                return null;

            workOrderType.Name = workOrderTypeDTO.Name;

            _context.WorkOrderTypes.Update(workOrderType);
            await _context.SaveChangesAsync();

            return workOrderTypeDTO;
        }

        public async Task<bool> DeleteWorkOrderType(int id)
        {
            var workOrderType = await _context.WorkOrderTypes
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (workOrderType == null)
                return false;

            _context.WorkOrderTypes.Remove(workOrderType);
            await _context.SaveChangesAsync();

            return true;
        }


    }

}