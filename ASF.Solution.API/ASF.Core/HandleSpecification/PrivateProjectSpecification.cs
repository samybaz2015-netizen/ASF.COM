using ASF.Core.Entities.PrivateProject;
using ASF.Core.Specification;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.HandleSpecification
{
    public class PrivateProjectSpecification:BaseSpecification<PrivateProject>
    {
        public PrivateProjectSpecification()
        {
            AddInclude(o => o.SitePhotos);
            AddInclude(o => o.ModelPhotos);
            AddInclude(o => o.SafetyWastePhotos);
        }

        public PrivateProjectSpecification(bool? isArchive, int pageSize, int pageIndex)
        {
            AddInclude(o => o.SitePhotos);
            AddInclude(o => o.ModelPhotos);
            AddInclude(o => o.SafetyWastePhotos);
            if (isArchive.HasValue)
            {
                Critaria = (o => o.IsArchived == isArchive.Value);
            }

            AddPagination(pageSize * (pageIndex - 1), pageSize);


        }
        public PrivateProjectSpecification(string? branchName, bool? isArchive) 
        {

            if (!string.IsNullOrEmpty(branchName) && isArchive.HasValue)
            {
                Critaria = i => i.BranchName == branchName && i.IsArchived == isArchive;
            }
            else if (!string.IsNullOrEmpty(branchName))
            {
                Critaria = i => i.BranchName == branchName;
            }
            else if (isArchive.HasValue)
            {
                Critaria = i => i.IsArchived == isArchive;
            }

            AddInclude(o => o.SitePhotos!);
            AddInclude(o => o.ModelPhotos!);
            AddInclude(o => o.SafetyWastePhotos!);
        }
    }
}
