using ASF.Core.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Services
{
    public interface IJobDescriptionService
    {
        Task<IEnumerable<GetJobDescriptionDTO>> GetAllJobDescriptions();
        Task<GetJobDescriptionDTO> GetJobDescriptionById(int id);
        Task<JobDescriptionDTO> CreateJobDescription(JobDescriptionDTO jobDescriptionDTO);
        Task<JobDescriptionDTO> UpdateJobDescription(int id, JobDescriptionDTO jobDescriptionDTO);
        Task<bool> DeleteJobDescription(int id);
    }
}
