//using Microsoft.AspNetCore.Mvc;
//using System.Collections.Generic;
//using System.Threading.Tasks;
//using ASF.Core.Entities.NewProject;
//using ASF.Core.Repository;
//using ASF.Core.HandleSpecification;
//using Microsoft.EntityFrameworkCore;
//using ASF.Core.Entities.PrivateProject;
//using Microsoft.AspNetCore.Identity;
//using ASF.Core.Entities.Identity;
//using ASF.Api.Helpers;
//using ASF.Core.Entities.Construction;
//using ASF.Core.Entities.Emergency;
//using ASF.Core.Entities.Maintenance;
//using ASF.Core.Services;
//using ASF.Core.Helpers;
//using ASF.Core.Dtos;

//namespace ASF.Api.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class OrdersinHomeController : ControllerBase
//    {
//        private readonly UserManager<AppUser> userManager;
//        private readonly IGenericRepository<PrivateProject> privateRepository;
//        private readonly IGenericRepository<NewProject> newRepository;
//        private readonly IGenericRepository<Construction> constructionRepository;
//        private readonly IGenericRepository<Emergency> emergencyRepository;
//        private readonly IGenericRepository<Maintenance> maintenanceRepository;
//        private readonly IPrivateProject _privateRepository;
//        private readonly INewProjectService _newRepository;
//        private readonly IConstructionService _constructionRepository;
//        private readonly IEmergencyService _emergencyRepository;
//        private readonly IMaintenanceService _maintenanceRepository;

//        public OrdersinHomeController(
//            UserManager<AppUser> userManager,
//            IGenericRepository<PrivateProject> privateRepository,
//            IGenericRepository<NewProject> newRepository, 
//            IGenericRepository<Construction> constructionRepository,
//             IGenericRepository<Emergency> emergencyRepository,
//             IGenericRepository<Maintenance> maintenanceRepository,
//             IPrivateProject _privateRepository,
//             INewProjectService _newRepository,
//             IConstructionService _constructionRepository,
//             IEmergencyService _emergencyRepository,
//             IMaintenanceService _maintenanceRepository

//            )
//        { 
//            this.userManager = userManager;

//            this.privateRepository = privateRepository;
//            this.newRepository=newRepository;
//            this.constructionRepository = constructionRepository;
//            this.emergencyRepository = emergencyRepository;
//            this.maintenanceRepository = maintenanceRepository;

//            this._privateRepository = _privateRepository;
//            this._newRepository = _newRepository;
//            this._maintenanceRepository = _maintenanceRepository;
//            this._constructionRepository = _constructionRepository;
//            this._emergencyRepository = _emergencyRepository;
//        }

//        [HttpGet("GetNumberOfEng-complete-nonComplete")]
//         public IActionResult GetNumbersOfEngAndCompleteAndNonCompleteProjects()
//        {

//            #region CompleteProjects
//           var CompleteProjectInNewProject = newRepository.GetTableNoTracking().Where(f => f.IsArchived == false).ToList().Count();
//            var CompleteProjectInPrivate = privateRepository.GetTableNoTracking().Where(f => f.IsArchived == false).ToList().Count();

//            var TotalCompleteProjects =CompleteProjectInNewProject+ CompleteProjectInPrivate;
//            #endregion

//            #region Non-CompleteProjectsvar NonCompleteProjectInNewProject = newRepository.GetTableNoTracking().Where(f => f.IsArchived == true).ToList().Count();
//            var NonCompleteProjectInPrivate = privateRepository.GetTableNoTracking().Where(f => f.IsArchived == true).ToList().Count();

//            var TotalNonCompleteProjects = NonCompleteProjectInPrivate;
//            #endregion


//            #region NumberOFeng
//            var TotalNumberOFeng = userManager.Users
//                .Where(u => u.UserType == "eng")
//                .Count();
//            #endregion

//            var Total = new
//            {
//                CompleteProject = TotalCompleteProjects,
//                NonCompleteProject = TotalNonCompleteProjects,
//                NumberOfEngineers = TotalNumberOFeng
//            };
//            var response = new ApiResponse<object>(200, "تم حصول علي اعداد بروجكتات المكتملة و تحت تنفيذ بنجاح", Total);
//            return Ok(response);

//        }

//        [HttpGet("all-projects-inHome")]
//        public async Task<IActionResult> GetAllProjects([FromQuery] HomeFilterParams filter)
//        {
//            // جلب البيانات من كل service مع الـ branch فقط
//            var privateProjects = await _privateRepository.GetAllPrivateProjectsWithBranchNameAsync(filter.BranchName);
//            var newProjects = await _newRepository.GetNewProjectWithBranchNameAsync(filter.BranchName);
//            var constructions = await _constructionRepository.GetConstructionWithBranchNameAsync(filter.BranchName);
//            var emergencies = await _emergencyRepository.GetEmergencyWithBranchNameAsync(filter.BranchName);
//            var maintenances = await _maintenanceRepository.GetMaintenanceWithBranchNameAsync(filter.BranchName);

//            // دالة مساعدة للفلترة الموحدة
//            static IQueryable<T> ApplyFilter<T>(
//     IEnumerable<T> source,
//     HomeFilterParams f,
//     Func<T, string?> getBranch,
//     Func<T, string?> getOffice,
//     Func<T, string?> getFault,
//     Func<T, string?> getWorkOrder,
//     Func<T, bool> getApprove,
//     Func<T, string?>? getSituation = null)   // ✅ اضافة
//     => source.AsQueryable()
//         .Where(p => getApprove(p))
//         .Where(p => string.IsNullOrEmpty(f.BranchName) || getBranch(p) == f.BranchName)
//         .Where(p => string.IsNullOrEmpty(f.Office) || getOffice(p) == f.Office)
//         .Where(p => string.IsNullOrEmpty(f.FaultNumber) || getFault(p)!.Contains(f.FaultNumber))
//         .Where(p => string.IsNullOrEmpty(f.WorkOrderType) || getWorkOrder(p)!.Contains(f.WorkOrderType))
//         .Where(p => string.IsNullOrEmpty(f.Situation) || getSituation == null || getSituation(p) == f.Situation); // ✅ اضافة


//            var filteredNew = ApplyFilter(newProjects, filter,
//      p => p.BranchName, p => p.Office, p => p.FaultNumber, p => p.WorkOrderType, p => p.IsApprove == true, p => p.Situation);

//            var filteredCons = ApplyFilter(constructions, filter,
//                p => p.BranchName, p => p.Office, p => p.FaultNumber, p => p.WorkOrderType, p => p.IsApprove == true, p => p.Situation);

//            var filteredEmerg = ApplyFilter(emergencies, filter,
//                p => p.BranchName, p => p.Office, p => p.FaultNumber, p => p.WorkOrderType, p => p.IsApprove == true, p => p.Situation);

//            var filteredMaint = ApplyFilter(maintenances, filter,
//                p => p.BranchName, p => p.Office, p => p.FaultNumber, p => p.WorkOrderType, p => p.IsApprove == true, p => p.Situation);

//            // دالة Pagination
//            static PaginatedResult<T> Paginate<T>(IQueryable<T> query, HomeFilterParams f)
//            {
//                var total = query.Count();
//                var data = query.Skip((f.PageIndex - 1) * f.PageSize).Take(f.PageSize).ToList();
//                return new PaginatedResult<T>
//                {
//                    TotalCount = total,
//                    PageIndex = f.PageIndex,
//                    PageSize = f.PageSize,
//                    Data = data
//                };
//            }

//            var result = new
//            {
//                RehabilitationWorks = Paginate(filteredNew, filter),
//                Constructions = Paginate(filteredCons, filter),
//                Emergencies = Paginate(filteredEmerg, filter),
//                Maintenances = Paginate(filteredMaint, filter),
//            };

//            return Ok(new { data = result });
//        }

//        [HttpGet("all-private-projects-inHome")]
//        public async Task<IActionResult> GetAllPrivateProjects([FromQuery] string branchName)
//        {
//            var privateProjects = await _privateRepository.GetAllPrivateProjectsWithBranchNameAsync(branchName);

//            if (!string.IsNullOrEmpty(branchName))
//            {
//                privateProjects = privateProjects.Where(p => p.BranchName == branchName && p.IsApprove == true).ToList();
//            }

//            var result = privateProjects;

//            return Ok(new { data = result });
//        }


//    }
//}
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASF.Core.Entities.NewProject;
using Microsoft.AspNetCore.Authorization;
using ASF.Core.Repository;
using ASF.Core.HandleSpecification;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Entities.PrivateProject;
using Microsoft.AspNetCore.Identity;
using ASF.Core.Entities.Identity;
using ASF.Api.Helpers;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities.Maintenance;
using ASF.Core.Services;
using ASF.Core.Helpers;
using ASF.Core.Dtos;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersinHomeController : ControllerBase
    {
        private readonly UserManager<AppUser> userManager;
        private readonly IGenericRepository<PrivateProject> privateRepository;
        private readonly IGenericRepository<NewProject> newRepository;
        private readonly IGenericRepository<Construction> constructionRepository;
        private readonly IGenericRepository<Emergency> emergencyRepository;
        private readonly IGenericRepository<Maintenance> maintenanceRepository;
        private readonly IPrivateProject _privateRepository;
        private readonly INewProjectService _newRepository;
        private readonly IConstructionService _constructionRepository;
        private readonly IEmergencyService _emergencyRepository;
        private readonly IMaintenanceService _maintenanceRepository;

        public OrdersinHomeController(
            UserManager<AppUser> userManager,
            IGenericRepository<PrivateProject> privateRepository,
            IGenericRepository<NewProject> newRepository,
            IGenericRepository<Construction> constructionRepository,
             IGenericRepository<Emergency> emergencyRepository,
             IGenericRepository<Maintenance> maintenanceRepository,
             IPrivateProject _privateRepository,
             INewProjectService _newRepository,
             IConstructionService _constructionRepository,
             IEmergencyService _emergencyRepository,
             IMaintenanceService _maintenanceRepository

            )
        {
            this.userManager = userManager;

            this.privateRepository = privateRepository;
            this.newRepository = newRepository;
            this.constructionRepository = constructionRepository;
            this.emergencyRepository = emergencyRepository;
            this.maintenanceRepository = maintenanceRepository;

            this._privateRepository = _privateRepository;
            this._newRepository = _newRepository;
            this._maintenanceRepository = _maintenanceRepository;
            this._constructionRepository = _constructionRepository;
            this._emergencyRepository = _emergencyRepository;
        }

        [HttpGet("GetNumberOfEng-complete-nonComplete")]
        // ✅ تحسين أداء: بدل ما نحمّل كل الصفوف في الميموري (ToList()) عشان نعدّهم بس،
        // بنخلي الـ DB نفسه يعمل COUNT (أسرع بكتير ومفيش نقل بيانات زيادة على الشبكة).
        // القيم الناتجة والـ Response نفسه 100% زي الأول (حافظنا حتى على نفس الحسبة
        // بتاعة TotalNonCompleteProjects اللي مكونة من PrivateProject بس زي الكود الأصلي).
        public async Task<IActionResult> GetNumbersOfEngAndCompleteAndNonCompleteProjects()
        {
            #region CompleteProjects
            var CompleteProjectInNewProject = await newRepository.GetTableNoTracking().CountAsync(f => f.IsArchived == false);
            var CompleteProjectInPrivate = await privateRepository.GetTableNoTracking().CountAsync(f => f.IsArchived == false);

            var TotalCompleteProjects = CompleteProjectInNewProject + CompleteProjectInPrivate;
            #endregion

            #region Non-CompleteProjects
            var NonCompleteProjectInPrivate = await privateRepository.GetTableNoTracking().CountAsync(f => f.IsArchived == true);

            var TotalNonCompleteProjects = NonCompleteProjectInPrivate;
            #endregion


            #region NumberOFeng
            var TotalNumberOFeng = await userManager.Users
                .Where(u => u.UserType == "eng")
                .CountAsync();
            #endregion

            var Total = new
            {
                CompleteProject = TotalCompleteProjects,
                NonCompleteProject = TotalNonCompleteProjects,
                NumberOfEngineers = TotalNumberOFeng
            };
            var response = new ApiResponse<object>(200, "تم حصول علي اعداد بروجكتات المكتملة و تحت تنفيذ بنجاح", Total);
            return Ok(response);

        }

        [HttpGet("all-projects-inHome")]
        // ✅ تحسين أداء جوهري: الكود القديم كان بيجيب *كل* صفوف الأربع جداول (مع Include لكل
        // الصور/المرفقات) من الـ DB بالكامل (أو بالفرع بس)، ثم يعمل الفلترة الإضافية
        // (Office/FaultNumber/WorkOrderType/Situation) والـ Pagination (Skip/Take) على البيانات
        // بعد ما هي خلاص اتحملت في ذاكرة السيرفر. مع 3000+ مشروع ده معناه تحميل آلاف الصفوف
        // (مضروبة في عدد الصور المرتبطة بكل صف بسبب الـ Include) عشان في الآخر يترجعلك 10-20 بس.
        //
        // التعديل: كل الفلاتر + الـ Skip/Take بقت جوه IQueryable وبتتنفذ كـ WHERE/OFFSET/FETCH
        // في الـ DB نفسه، والـ Include (تحميل الصور) بيحصل بس على الصفحة النهائية المطلوبة.
        // شكل ومحتوى الـ Response (PaginatedResult لكل نوع، بنفس الحقول) لم يتغير إطلاقًا.
        public async Task<IActionResult> GetAllProjects([FromQuery] HomeFilterParams filter)
        {
            async Task<PaginatedResult<T>> BuildPaginatedAsync<T>(
                IQueryable<T> baseQuery,
                Func<IQueryable<T>, IQueryable<T>> includePhotos,
                Func<IQueryable<T>, HomeFilterParams, IQueryable<T>> applyTypeSpecificFilters) where T : class
            {
                var query = applyTypeSpecificFilters(baseQuery, filter);

                var total = await query.CountAsync();

                var data = await includePhotos(query)
                    .Skip((filter.PageIndex - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToListAsync();

                return new PaginatedResult<T>
                {
                    TotalCount = total,
                    PageIndex = filter.PageIndex,
                    PageSize = filter.PageSize,
                    Data = data
                };
            }

            // نفس شروط الفلترة بالظبط زي الكود الأصلي، بس بقت IQueryable بدل Func على كائنات محمّلة بالفعل
            IQueryable<NewProject> newQuery = newRepository.GetTableNoTracking().Where(p => p.IsApprove == true);
            if (!string.IsNullOrEmpty(filter.BranchName)) newQuery = newQuery.Where(p => p.BranchName == filter.BranchName);
            if (!string.IsNullOrEmpty(filter.Office)) newQuery = newQuery.Where(p => p.Office == filter.Office);
            if (!string.IsNullOrEmpty(filter.FaultNumber)) newQuery = newQuery.Where(p => p.FaultNumber.Contains(filter.FaultNumber));
            if (!string.IsNullOrEmpty(filter.WorkOrderType)) newQuery = newQuery.Where(p => p.WorkOrderType.Contains(filter.WorkOrderType));
            if (!string.IsNullOrEmpty(filter.Situation)) newQuery = newQuery.Where(p => p.Situation == filter.Situation);

            IQueryable<Construction> consQuery = constructionRepository.GetTableNoTracking().Where(p => p.IsApprove == true);
            if (!string.IsNullOrEmpty(filter.BranchName)) consQuery = consQuery.Where(p => p.BranchName == filter.BranchName);
            if (!string.IsNullOrEmpty(filter.Office)) consQuery = consQuery.Where(p => p.Office == filter.Office);
            if (!string.IsNullOrEmpty(filter.FaultNumber)) consQuery = consQuery.Where(p => p.FaultNumber.Contains(filter.FaultNumber));
            if (!string.IsNullOrEmpty(filter.WorkOrderType)) consQuery = consQuery.Where(p => p.WorkOrderType.Contains(filter.WorkOrderType));
            if (!string.IsNullOrEmpty(filter.Situation)) consQuery = consQuery.Where(p => p.Situation == filter.Situation);

            IQueryable<Emergency> emergQuery = emergencyRepository.GetTableNoTracking().Where(p => p.IsApprove == true);
            if (!string.IsNullOrEmpty(filter.BranchName)) emergQuery = emergQuery.Where(p => p.BranchName == filter.BranchName);
            if (!string.IsNullOrEmpty(filter.Office)) emergQuery = emergQuery.Where(p => p.Office == filter.Office);
            if (!string.IsNullOrEmpty(filter.FaultNumber)) emergQuery = emergQuery.Where(p => p.FaultNumber.Contains(filter.FaultNumber));
            if (!string.IsNullOrEmpty(filter.WorkOrderType)) emergQuery = emergQuery.Where(p => p.WorkOrderType.Contains(filter.WorkOrderType));
            if (!string.IsNullOrEmpty(filter.Situation)) emergQuery = emergQuery.Where(p => p.Situation == filter.Situation);

            IQueryable<Maintenance> maintQuery = maintenanceRepository.GetTableNoTracking().Where(p => p.IsApprove == true);
            if (!string.IsNullOrEmpty(filter.BranchName)) maintQuery = maintQuery.Where(p => p.BranchName == filter.BranchName);
            if (!string.IsNullOrEmpty(filter.Office)) maintQuery = maintQuery.Where(p => p.Office == filter.Office);
            if (!string.IsNullOrEmpty(filter.FaultNumber)) maintQuery = maintQuery.Where(p => p.FaultNumber.Contains(filter.FaultNumber));
            if (!string.IsNullOrEmpty(filter.WorkOrderType)) maintQuery = maintQuery.Where(p => p.WorkOrderType.Contains(filter.WorkOrderType));
            if (!string.IsNullOrEmpty(filter.Situation)) maintQuery = maintQuery.Where(p => p.Situation == filter.Situation);

            if (filter.ContractNumbers != null && filter.ContractNumbers.Any())
            {
                var contracts = filter.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                if (contracts.Any())
                {
                    newQuery = newQuery.Where(p => p.ContractNumber != null && contracts.Contains(p.ContractNumber));
                    consQuery = consQuery.Where(p => p.ContractNumber != null && contracts.Contains(p.ContractNumber));
                    emergQuery = emergQuery.Where(p => p.ContractNumber != null && contracts.Contains(p.ContractNumber));
                    maintQuery = maintQuery.Where(p => p.ContractNumber != null && contracts.Contains(p.ContractNumber));
                }
            }
            else if (!string.IsNullOrWhiteSpace(filter.ContractNumber))
            {
                var cn = filter.ContractNumber.Trim();
                newQuery = newQuery.Where(p => p.ContractNumber == cn);
                consQuery = consQuery.Where(p => p.ContractNumber == cn);
                emergQuery = emergQuery.Where(p => p.ContractNumber == cn);
                maintQuery = maintQuery.Where(p => p.ContractNumber == cn);
            }

            var rehabilitationWorks = await BuildPaginatedAsync(newQuery,
                q => q.Include(p => p.SafetyWastePhotos).Include(p => p.ModelPhotos).Include(p => p.SitePhotos),
                (q, f) => q);

            var constructions = await BuildPaginatedAsync(consQuery,
                q => q.Include(p => p.TestModels).Include(p => p.SafetyWastePhotos).Include(p => p.ModelPhotos).Include(p => p.SitePhotos),
                (q, f) => q);

            var emergencies = await BuildPaginatedAsync(emergQuery,
                q => q.Include(p => p.TestModels).Include(p => p.SafetyWastePhotos).Include(p => p.ModelPhotos).Include(p => p.SitePhotos),
                (q, f) => q);

            var maintenances = await BuildPaginatedAsync(maintQuery,
                q => q.Include(p => p.TestModels).Include(p => p.SafetyWastePhotos).Include(p => p.ModelPhotos).Include(p => p.SitePhotos),
                (q, f) => q);

            var result = new
            {
                RehabilitationWorks = rehabilitationWorks,
                Constructions = constructions,
                Emergencies = emergencies,
                Maintenances = maintenances,
            };

            return Ok(new { data = result });
        }

        [HttpGet("all-private-projects-inHome")]
        public async Task<IActionResult> GetAllPrivateProjects([FromQuery] string branchName)
        {
            var privateProjects = await _privateRepository.GetAllPrivateProjectsWithBranchNameAsync(branchName);

            if (!string.IsNullOrEmpty(branchName))
            {
                privateProjects = privateProjects.Where(p => p.BranchName == branchName && p.IsApprove == true).ToList();
            }

            var result = privateProjects;

            return Ok(new { data = result });
        }


    }
}
