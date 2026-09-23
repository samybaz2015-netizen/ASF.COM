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
    public class JobDescriptionServices : IJobDescriptionService
    {
        private readonly ApplicationDbContext _context;

        public JobDescriptionServices(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GetJobDescriptionDTO>> GetAllJobDescriptions()
        {
            return await _context.JobDescriptions
                .Select(c => new GetJobDescriptionDTO
                {
                    Id = c.Id,
                    Name = c.Name
                })
                .ToListAsync();
        }
      
        public async Task<GetJobDescriptionDTO> GetJobDescriptionById(int id)
        {
            var jobDescriptions = await _context.JobDescriptions
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (jobDescriptions == null)
                return null;

            return new GetJobDescriptionDTO
            {
                Id = jobDescriptions.Id,
                Name = jobDescriptions.Name
            };
        }

        public async Task<JobDescriptionDTO> CreateJobDescription(JobDescriptionDTO jobDescriptionDTO)
        {
            // التحقق إذا كان هناك استشارة بنفس الاسم
            var existingJobDescription = await _context.JobDescriptions
                .Where(c => c.Name == jobDescriptionDTO.Name)
                .FirstOrDefaultAsync();

            if (existingJobDescription != null)
            {
                // إذا كانت الاستشارة موجودة، إرجاع رسالة خطأ
                throw new Exception("Consultant with this name already exists.");
            }

            // إضافة الاستشارة الجديدة إذا لم تكن موجودة
            var jobDescription = new JobDescription
            {
                Name = jobDescriptionDTO.Name
            };

            _context.JobDescriptions.Add(jobDescription);
            await _context.SaveChangesAsync();



            return jobDescriptionDTO;
        }


        public async Task<JobDescriptionDTO> UpdateJobDescription(int id, JobDescriptionDTO jobDescriptionDTO)
        {
            var jobDescription = await _context.JobDescriptions
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (jobDescription == null)
                return null;

            jobDescription.Name = jobDescriptionDTO.Name;

            _context.JobDescriptions.Update(jobDescription);
            await _context.SaveChangesAsync();

            return jobDescriptionDTO;
        }

        public async Task<bool> DeleteJobDescription(int id)
        {
            var jobDescription = await _context.JobDescriptions
                .Where(c => c.Id == id)
                .FirstOrDefaultAsync();

            if (jobDescription == null)
                return false;

            _context.JobDescriptions.Remove(jobDescription);
            await _context.SaveChangesAsync();

            return true;
        }

       
    }
}
