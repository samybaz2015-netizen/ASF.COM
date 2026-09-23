using ASF.Core.Entities.Construction;
using ASF.Core.Entities.NewProject;
using ASF.Core.Specification;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.HandleSpecification
{
   
    public class ConstructionSpecification : BaseSpecification<Construction>
    {
        public ConstructionSpecification()
        {
            AddInclude(o => o.SitePhotos);
            AddInclude(o => o.ModelPhotos);
            AddInclude(o => o.SafetyWastePhotos);
        }
        public ConstructionSpecification(bool? isArchive, int? sort, int pageSize, int pageIndex)
        {
            AddInclude(o => o.SitePhotos);
            AddInclude(o => o.ModelPhotos);
            AddInclude(o => o.SafetyWastePhotos);
            if (isArchive.HasValue)
            {
                Critaria = (o => o.IsArchived == isArchive.Value);
            }

            if (sort.HasValue && sort.Value > 0)
            {
                AddOrderBy(o => o.FaultNumber);
            }
            else
            {
                OrderByDescening = (o => o.FaultNumber);
            }
            AddPagination(pageSize * (pageIndex - 1), pageSize);


        }
        public ConstructionSpecification(string? branchName, bool? isArchive) //: base(i => i.BranchName==branchName && i.isArchive==isArchive)
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
            AddInclude(o => o.TestModels!);
        }
        public ConstructionSpecification(int id) : base(o => o.Id.Equals(id))
        {

        }



        public ConstructionSpecification(string? userId, string? branchName)
         : base(u => u.AppUserId.Equals(userId) && (string.IsNullOrEmpty(branchName) || u.BranchName.Equals(branchName)))
        {
            AddInclude(o => o.SitePhotos);
            AddInclude(o => o.ModelPhotos);
            AddInclude(o => o.SafetyWastePhotos);
        }
    }
}
