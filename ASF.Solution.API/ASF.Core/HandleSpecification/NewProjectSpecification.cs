using ASF.Core.Entities.NewProject;
using ASF.Core.Specification;


namespace ASF.Core.HandleSpecification
{
    public class NewProjectSpecification:BaseSpecification<NewProject>
    {
        public NewProjectSpecification() {
            AddInclude(o => o.SitePhotos);
            AddInclude(o => o.ModelPhotos);
            AddInclude(o => o.SafetyWastePhotos);
        }
        public NewProjectSpecification(bool? isArchive, int? sort, int pageSize, int pageIndex)
        {
            AddInclude(o => o.SitePhotos);
            AddInclude(o => o.ModelPhotos);
            AddInclude(o => o.SafetyWastePhotos);
            if ( isArchive.HasValue )
            {
                Critaria=(o => o.IsArchived==isArchive.Value);
            }

            if ( sort.HasValue&&sort.Value>0 )
            {
                AddOrderBy(o => o.FaultNumber);
            }
            else
            {
                OrderByDescening=(o => o.FaultNumber);
            }
            AddPagination(pageSize*(pageIndex-1), pageSize);


        }
        public NewProjectSpecification(string? branchName, bool? isArchive) //: base(i => i.BranchName==branchName && i.isArchive==isArchive)
        {

            if ( !string.IsNullOrEmpty(branchName)&&isArchive.HasValue )
            {
                Critaria=i => i.BranchName==branchName&&i.IsArchived==isArchive;
            }
            else if ( !string.IsNullOrEmpty(branchName) )
            {
                Critaria=i => i.BranchName==branchName;
            }
            else if ( isArchive.HasValue )
            {
                Critaria=i => i.IsArchived==isArchive;
            }

            AddInclude(o => o.SitePhotos!);
            AddInclude(o => o.ModelPhotos!);
            AddInclude(o => o.SafetyWastePhotos!);
        }
        public NewProjectSpecification(int id) : base(o => o.Id.Equals(id))
        {

        }



        public NewProjectSpecification(string? userId, string? branchName)
         : base(u => u.AppUserId.Equals(userId)&&(string.IsNullOrEmpty(branchName)||u.BranchName.Equals(branchName)))
        {
            AddInclude(o => o.SitePhotos);
            AddInclude(o => o.ModelPhotos);
            AddInclude(o => o.SafetyWastePhotos);
        }
    }
}
