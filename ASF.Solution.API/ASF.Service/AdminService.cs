using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Dtos.ConstructionResponse;
using ASF.Core.Dtos.EmergencyResponse;
using ASF.Core.Dtos.MaintenanceResponse;
using ASF.Core.Dtos.NewProjectResponse;
using ASF.Core.Dtos.PrivateResponse;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities.Identity;
using ASF.Core.Entities.Maintenance;
using ASF.Core.Entities.NewProject;
using ASF.Core.Entities.PrivateProject;
using ASF.Core.HandleSpecification;
using ASF.Core.Repository;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;

namespace ASF.Service
{
    public class AdminService : IAdminService
    {
        private readonly IPrivateProject privateProject;
        private readonly INewProjectService _newProjectService;
        private readonly IConstructionService _constructionService;
        private readonly IEmergencyService _emergencyService;
        private readonly IMaintenanceService _maintenanceService;

        private readonly IGenericRepository<NewProject> newRepository;
        private readonly IGenericRepository<Construction> constructionRepository;
        private readonly IGenericRepository<PrivateProject> privateRepository;
        private readonly IGenericRepository<Emergency> emergencyRepository;
        private readonly IGenericRepository<Maintenance> maintenanceRepository;
        private readonly IMapper _mapper;
        private readonly UserManager<AppUser> _userManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApplicationDbContext _context;

        public AdminService(
            IPrivateProject privateProject,
            INewProjectService newProjectService,
            IConstructionService constructionService,
            IGenericRepository<NewProject> newRepository,
            IGenericRepository<PrivateProject> privateRepository,
            IGenericRepository<Construction> constructionRepository,
            IEmergencyService emergencyService,
            IGenericRepository<Emergency> emergencyRepository,
            IMaintenanceService maintenanceService,
            IGenericRepository<Maintenance> maintenanceRepository,
            IMapper mapper,
            UserManager<AppUser> userManager,
            IHttpContextAccessor httpContextAccessor,
            ApplicationDbContext context)
        {
            this.privateProject = privateProject;
            _newProjectService = newProjectService;
            _constructionService = constructionService;
            this.newRepository = newRepository;
            this.privateRepository = privateRepository;
            this.constructionRepository = constructionRepository;
            _emergencyService = emergencyService;
            this.emergencyRepository = emergencyRepository;
            this.maintenanceRepository = maintenanceRepository;
            _maintenanceService = maintenanceService;
            _mapper = mapper;
            _userManager = userManager;
            _httpContextAccessor = httpContextAccessor;
            _context = context;
        }

        // ============================================================
        // ✅ الميثودز الجديدة - فلترة وباجينيشن على مستوى الـ DB
        // ============================================================
        // ✅ Helper مشترك يبني الـ WHERE conditions المشتركة
        private static IQueryable<T> ApplyCommonFilters<T>(
            IQueryable<T> query,
            OrderFilterDto filter,
            string? scopeBranch,
            string? scopeOffice) where T : class
        {
            var type = typeof(T);

            // Scope (صلاحيات المستخدم - أولوية قصوى)
            if (!string.IsNullOrEmpty(scopeBranch))
                query = query.Where(p => EF.Property<string>(p, "BranchName") == scopeBranch);
            if (!string.IsNullOrEmpty(scopeOffice))
                query = query.Where(p => EF.Property<string>(p, "Office") == scopeOffice);

            // فلاتر المستخدم
            if (!string.IsNullOrEmpty(filter.BranchName))
                query = query.Where(p => EF.Property<string>(p, "BranchName") == filter.BranchName);
            if (!string.IsNullOrEmpty(filter.OfficeName))
                query = query.Where(p => EF.Property<string>(p, "Office") == filter.OfficeName);
            if (!string.IsNullOrEmpty(filter.Situation))
                query = query.Where(p => EF.Property<string>(p, "Situation") == filter.Situation);
            if (!string.IsNullOrEmpty(filter.Contractor))
                query = query.Where(p => EF.Property<string>(p, "Contractor").Contains(filter.Contractor));
            if (!string.IsNullOrEmpty(filter.Consultant))
                query = query.Where(p => EF.Property<string>(p, "Consultant").Contains(filter.Consultant));
            if (!string.IsNullOrEmpty(filter.District))
                query = query.Where(p => EF.Property<string>(p, "District").Contains(filter.District));
            if (!string.IsNullOrEmpty(filter.WorkOrderType))
                query = query.Where(p => EF.Property<string>(p, "WorkOrderType").Contains(filter.WorkOrderType));
            if (!string.IsNullOrEmpty(filter.FaultNumber))
                query = query.Where(p => EF.Property<string>(p, "FaultNumber").Contains(filter.FaultNumber));
            if (filter.SafetyViolationsExist.HasValue)
                query = query.Where(p => EF.Property<bool>(p, "SafetyViolationsExist") == filter.SafetyViolationsExist.Value);
            if (filter.IsArchived.HasValue)
                query = query.Where(p => EF.Property<bool>(p, "IsArchived") == filter.IsArchived.Value);
            if (filter.OrderDateFrom.HasValue)
                query = query.Where(p => EF.Property<DateTime?>(p, "OrderDate") >= filter.OrderDateFrom.Value);
            if (filter.OrderDateTo.HasValue)
                query = query.Where(p => EF.Property<DateTime?>(p, "OrderDate") <= filter.OrderDateTo.Value);

            return query;
        }

        public async Task<(IReadOnlyCollection<NewProjectResponse> Data, int TotalCount)>GetAllNewProjectsAsync(OrderFilterDto filter, string? scopeBranch, string? scopeOffice)
        {
            // لو ProjectType محدد ومش rehabilitationworks ارجع فاضي
            if (!string.IsNullOrEmpty(filter.ProjectType) &&
                !filter.ProjectType.Equals("أعمال التاهيل", StringComparison.OrdinalIgnoreCase))
                return (new List<NewProjectResponse>(), 0);

            var query = newRepository.GetTableNoTracking()
                .Include(o => o.SitePhotos)
                .Include(o => o.SafetyWastePhotos)
                .Include(o => o.ModelPhotos)
                .Include(o => o.NewProjectPricingItems)
                    .ThenInclude(p => p.PricingItem)
                .AsQueryable();

            query = ApplyCommonFilters(query, filter, scopeBranch, scopeOffice);

            // ✅ StationNumber - int مباشرة
            if (!string.IsNullOrEmpty(filter.StationNumber))
                query = query.Where(p => p.StationNumber == filter.StationNumber);
            var totalCount = await query.CountAsync();
            var data = await query
                .OrderByDescending(p => p.OrderDate)
                .Skip((filter.PageIndex - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            var dtos = _mapper.Map<List<NewProjectResponse>>(data);

            var projectIds = dtos.Select(p => p.Id).ToList();
            if (projectIds.Any())
            {
                var logsMap = await _context.OperationChangeForNewProjects
                    .Where(l => projectIds.Contains(l.OperationId))
                    .OrderByDescending(l => l.ChangeDate)
                    .ToListAsync();

                var groupedLogs = logsMap
                    .GroupBy(l => l.OperationId)
                    .ToDictionary(g => g.Key, g => g.Select(l => new OperationChangeDto
                    {
                        Id = l.Id,
                        OperationId = l.OperationId,
                        UserName = l.UserName,
                        ChangeDate = l.ChangeDate,
                        UserProfileImage = l.UserProfileImage,
                        ChangeDescription = l.ChangeDescription,
                        ItemNumber = l.ItemNumber,
                        ItemDescription = l.ItemDescription
                    }).ToList());

                foreach (var dto in dtos)
                {
                    if (groupedLogs.TryGetValue(dto.Id, out var projectLogs))
                    {
                        dto.Logs = projectLogs;
                    }
                }
            }

            return (dtos, totalCount);
        }

        public async Task<(IReadOnlyCollection<ConstructionResponse> Data, int TotalCount)>
            GetAllConstructionAsync(OrderFilterDto filter, string? scopeBranch, string? scopeOffice)
        {
            if (!string.IsNullOrEmpty(filter.ProjectType) &&
                !filter.ProjectType.Equals("الإنشاءات", StringComparison.OrdinalIgnoreCase))
                return (new List<ConstructionResponse>(), 0);

            var query = constructionRepository.GetTableNoTracking()
                .Include(o => o.SitePhotos)
                .Include(o => o.SafetyWastePhotos)
                .Include(o => o.ModelPhotos)
                .Include(o => o.TestModels)
                .Include(o => o.ConstructionPricingItems)
                    .ThenInclude(p => p.PricingItem)
                .AsQueryable();

            query = ApplyCommonFilters(query, filter, scopeBranch, scopeOffice);

            // ✅ فلاتر خاصة بـ Construction
            if (filter.CableLength.HasValue)
                query = query.Where(p => p.CableLength == filter.CableLength.Value);
          
            var totalCount = await query.CountAsync();
            var data = await query
                .OrderByDescending(p => p.OrderDate)
                .Skip((filter.PageIndex - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            var dtos = _mapper.Map<List<ConstructionResponse>>(data);

            var projectIds = dtos.Select(p => p.Id).ToList();
            if (projectIds.Any())
            {
                var logsMap = await _context.OperationChangeForConstructions
                    .Where(l => projectIds.Contains(l.OperationId))
                    .OrderByDescending(l => l.ChangeDate)
                    .ToListAsync();

                var groupedLogs = logsMap
                    .GroupBy(l => l.OperationId)
                    .ToDictionary(g => g.Key, g => g.Select(l => new OperationChangeDto
                    {
                        Id = l.Id,
                        OperationId = l.OperationId,
                        UserName = l.UserName,
                        ChangeDate = l.ChangeDate,
                        UserProfileImage = l.UserProfileImage,
                        ChangeDescription = l.ChangeDescription,
                        ItemNumber = l.ItemNumber,
                        ItemDescription = l.ItemDescription
                    }).ToList());

                foreach (var dto in dtos)
                {
                    if (groupedLogs.TryGetValue(dto.Id, out var projectLogs))
                    {
                        dto.Logs = projectLogs;
                    }
                }
            }

            return (dtos, totalCount);
        }

        public async Task<(IReadOnlyCollection<EmergencyResponse> Data, int TotalCount)>
            GetAllEmergencyAsync(OrderFilterDto filter, string? scopeBranch, string? scopeOffice)
        {
            if (!string.IsNullOrEmpty(filter.ProjectType) &&
                !filter.ProjectType.Equals("الطوارئ", StringComparison.OrdinalIgnoreCase))
                return (new List<EmergencyResponse>(), 0);

            var query = emergencyRepository.GetTableNoTracking()
                .Include(o => o.SitePhotos)
                .Include(o => o.SafetyWastePhotos)
                .Include(o => o.ModelPhotos)
                .Include(o => o.TestModels)
                .Include(o => o.EmergencyPricingItems)
                    .ThenInclude(p => p.PricingItem)
                .AsQueryable();

            query = ApplyCommonFilters(query, filter, scopeBranch, scopeOffice);

            // ✅ StationNumber
            if (!string.IsNullOrEmpty(filter.StationNumber))
                query = query.Where(p => p.StationNumber == filter.StationNumber);

            var totalCount = await query.CountAsync();
            var data = await query
                .OrderByDescending(p => p.OrderDate)
                .Skip((filter.PageIndex - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            var dtos = _mapper.Map<List<EmergencyResponse>>(data);

            var projectIds = dtos.Select(p => p.Id).ToList();
            if (projectIds.Any())
            {
                var logsMap = await _context.OperationChangeForEmergencies
                    .Where(l => projectIds.Contains(l.OperationId))
                    .OrderByDescending(l => l.ChangeDate)
                    .ToListAsync();

                var groupedLogs = logsMap
                    .GroupBy(l => l.OperationId)
                    .ToDictionary(g => g.Key, g => g.Select(l => new OperationChangeDto
                    {
                        Id = l.Id,
                        OperationId = l.OperationId,
                        UserName = l.UserName,
                        ChangeDate = l.ChangeDate,
                        UserProfileImage = l.UserProfileImage,
                        ChangeDescription = l.ChangeDescription,
                        ItemNumber = l.ItemNumber,
                        ItemDescription = l.ItemDescription
                    }).ToList());

                foreach (var dto in dtos)
                {
                    if (groupedLogs.TryGetValue(dto.Id, out var projectLogs))
                    {
                        dto.Logs = projectLogs;
                    }
                }
            }

            return (dtos, totalCount);
        }

        public async Task<(IReadOnlyCollection<MaintenanceResponse> Data, int TotalCount)>
            GetAllMaintenanceAsync(OrderFilterDto filter, string? scopeBranch, string? scopeOffice)
        {
            if (!string.IsNullOrEmpty(filter.ProjectType) &&
                !filter.ProjectType.Equals("الصيانة", StringComparison.OrdinalIgnoreCase))
                return (new List<MaintenanceResponse>(), 0);

            var query = maintenanceRepository.GetTableNoTracking()
                .Include(o => o.SitePhotos)
                .Include(o => o.SafetyWastePhotos)
                .Include(o => o.ModelPhotos)
                .Include(o => o.TestModels)
                .Include(o => o.MaintenancePricingItems)
                    .ThenInclude(p => p.PricingItem)
                .AsQueryable();

            query = ApplyCommonFilters(query, filter, scopeBranch, scopeOffice);

            var totalCount = await query.CountAsync();
            var data = await query
                .OrderByDescending(p => p.OrderDate)
                .Skip((filter.PageIndex - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            var dtos = _mapper.Map<List<MaintenanceResponse>>(data);

            var projectIds = dtos.Select(p => p.Id).ToList();
            if (projectIds.Any())
            {
                var logsMap = await _context.OperationChangeForMaintenances
                    .Where(l => projectIds.Contains(l.OperationId))
                    .OrderByDescending(l => l.ChangeDate)
                    .ToListAsync();

                var groupedLogs = logsMap
                    .GroupBy(l => l.OperationId)
                    .ToDictionary(g => g.Key, g => g.Select(l => new OperationChangeDto
                    {
                        Id = l.Id,
                        OperationId = l.OperationId,
                        UserName = l.UserName,
                        ChangeDate = l.ChangeDate,
                        UserProfileImage = l.UserProfileImage,
                        ChangeDescription = l.ChangeDescription,
                        ItemNumber = l.ItemNumber,
                        ItemDescription = l.ItemDescription
                    }).ToList());

                foreach (var dto in dtos)
                {
                    if (groupedLogs.TryGetValue(dto.Id, out var projectLogs))
                    {
                        dto.Logs = projectLogs;
                    }
                }
            }

            return (dtos, totalCount);
        }
        // ============================================================
        // ✅ باقي الميثودز زي ما هي
        // ============================================================

        public async Task<IReadOnlyCollection<NewProjectResponse>> GetNewProjectsByCurrentDateAndBranchAsync(string? branchName)
        {
            var today = DateTime.Today;
            var order = await newRepository.GetTableNoTracking()
                .Where(p => p.BranchName == branchName && p.OrderDate.HasValue && p.OrderDate.Value.Date == today)
                .Include(o => o.SitePhotos).Include(o => o.SafetyWastePhotos).Include(o => o.ModelPhotos)
                .ToListAsync();
            return _mapper.Map<IReadOnlyCollection<NewProjectResponse>>(order);
        }

        public async Task<IReadOnlyCollection<PrivateResponse>> GetAllPrivateProjectsAsync(string? branchName)
        {
            var orders = await privateProject.GetAllPrivateProjectsWithBranchNameAsync(branchName);
            return _mapper.Map<IReadOnlyCollection<PrivateResponse>>(orders);
        }

        public async Task<IReadOnlyCollection<PrivateResponse>> GetPrivateProjectsByCurrentDateAndBranchAsync(string? branchName)
        {
            var today = DateTime.Today;
            var orders = await privateRepository.GetTableNoTracking()
                .Where(r => r.BranchName == branchName && r.OrderDate.HasValue && r.OrderDate.Value.Date == today)
                .Include(o => o.SitePhotos).Include(o => o.SafetyWastePhotos).Include(o => o.ModelPhotos)
                .ToListAsync();
            return _mapper.Map<IReadOnlyCollection<PrivateResponse>>(orders);
        }

        public async Task<IReadOnlyCollection<ConstructionResponse>> GetConstructionByCurrentDateAndBranchAsync(string? branchName)
        {
            var today = DateTime.Today;
            var order = await constructionRepository.GetTableNoTracking()
                .Where(p => p.BranchName == branchName && p.OrderDate.HasValue && p.OrderDate.Value.Date == today)
                .Include(o => o.SitePhotos).Include(o => o.SafetyWastePhotos).Include(o => o.ModelPhotos)
                .ToListAsync();
            return _mapper.Map<IReadOnlyCollection<ConstructionResponse>>(order);
        }

        public async Task<IReadOnlyCollection<EmergencyResponse>> GetEmergencyByCurrentDateAndBranchAsync(string? branchName)
        {
            var today = DateTime.Today;
            var order = await emergencyRepository.GetTableNoTracking()
                .Where(p => p.BranchName == branchName && p.OrderDate.HasValue && p.OrderDate.Value.Date == today)
                .Include(o => o.SitePhotos).Include(o => o.SafetyWastePhotos).Include(o => o.ModelPhotos)
                .ToListAsync();
            return _mapper.Map<IReadOnlyCollection<EmergencyResponse>>(order);
        }

        public async Task<IReadOnlyCollection<MaintenanceResponse>> GetMaintenanceByCurrentDateAndBranchAsync(string? branchName)
        {
            var today = DateTime.Today;
            var order = await maintenanceRepository.GetTableNoTracking()
                .Where(p => p.BranchName == branchName && p.OrderDate.HasValue && p.OrderDate.Value.Date == today)
                .Include(o => o.SitePhotos).Include(o => o.SafetyWastePhotos).Include(o => o.ModelPhotos)
                .ToListAsync();
            return _mapper.Map<IReadOnlyCollection<MaintenanceResponse>>(order);
        }

        public static class ProjectSituations
        {
            public static List<string> All => new List<string>
            {
                "تحت التنفيذ",
                "تم التنفيذ",
                "صدور شهادة الإنجاز",
                "دخلت مستخلص",
                "تم الصرف",
                "لا يحتاج تصريح"
            };
        }

        public async Task<ProjectSituationFilterDto> GetProjectsWithSituationsAsync()
        {
            var newProjects = await newRepository.GetTableNoTracking()
                .Select(p => new ProjectSituationDto { Id = p.Id, Name = p.FaultNumber + p.WorkOrderType, Type = "NewProject", Situation = p.Situation }).ToListAsync();
            var constructionProjects = await constructionRepository.GetTableNoTracking()
                .Select(p => new ProjectSituationDto { Id = p.Id, Name = p.FaultNumber + p.WorkOrderType, Type = "Construction", Situation = p.Situation }).ToListAsync();
            var emergencyProjects = await emergencyRepository.GetTableNoTracking()
                .Select(p => new ProjectSituationDto { Id = p.Id, Name = p.FaultNumber + p.WorkOrderType, Type = "Emergency", Situation = p.Situation }).ToListAsync();
            var maintenanceProjects = await maintenanceRepository.GetTableNoTracking()
                .Select(p => new ProjectSituationDto { Id = p.Id, Name = p.FaultNumber + p.WorkOrderType, Type = "Maintenance", Situation = p.Situation }).ToListAsync();

            return new ProjectSituationFilterDto
            {
                Situations = ProjectSituations.All,
                Projects = newProjects.Concat(constructionProjects).Concat(emergencyProjects).Concat(maintenanceProjects).ToList()
            };
        }

        public async Task<List<ProjectDetailsDto>> GetProjectsBySituationAsync(string situation, string projectType = null)
        {
            IQueryable<NewProject> newProjectsQuery = null;
            IQueryable<Construction> constructionProjectsQuery = null;
            IQueryable<Emergency> emergencyProjectsQuery = null;
            IQueryable<Maintenance> maintenanceProjectsQuery = null;

            switch (projectType)
            {
                case "rehabilitationworks":
                    newProjectsQuery = newRepository.GetTableNoTracking().Include(d => d.SafetyWastePhotos).Include(d => d.ModelPhotos).Include(d => d.SitePhotos).Where(p => p.Situation == situation);
                    break;
                case "constructionProjects":
                    constructionProjectsQuery = constructionRepository.GetTableNoTracking().Include(d => d.SafetyWastePhotos).Include(d => d.ModelPhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).Where(p => p.Situation == situation);
                    break;
                case "emergencyProjects":
                    emergencyProjectsQuery = emergencyRepository.GetTableNoTracking().Include(d => d.SafetyWastePhotos).Include(d => d.ModelPhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).Where(p => p.Situation == situation);
                    break;
                case "maintenanceProjects":
                    maintenanceProjectsQuery = maintenanceRepository.GetTableNoTracking().Include(d => d.SafetyWastePhotos).Include(d => d.ModelPhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).Where(p => p.Situation == situation);
                    break;
                default:
                    newProjectsQuery = newRepository.GetTableNoTracking().Include(d => d.SafetyWastePhotos).Include(d => d.ModelPhotos).Include(d => d.SitePhotos).Where(p => p.Situation == situation);
                    constructionProjectsQuery = constructionRepository.GetTableNoTracking().Include(d => d.SafetyWastePhotos).Include(d => d.ModelPhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).Where(p => p.Situation == situation);
                    emergencyProjectsQuery = emergencyRepository.GetTableNoTracking().Include(d => d.SafetyWastePhotos).Include(d => d.ModelPhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).Where(p => p.Situation == situation);
                    maintenanceProjectsQuery = maintenanceRepository.GetTableNoTracking().Include(d => d.SafetyWastePhotos).Include(d => d.ModelPhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).Where(p => p.Situation == situation);
                    break;
            }

            var allProjects = new List<object>();
            if (newProjectsQuery != null) allProjects.AddRange(await newProjectsQuery.ToListAsync());
            if (constructionProjectsQuery != null) allProjects.AddRange(await constructionProjectsQuery.ToListAsync());
            if (emergencyProjectsQuery != null) allProjects.AddRange(await emergencyProjectsQuery.ToListAsync());
            if (maintenanceProjectsQuery != null) allProjects.AddRange(await maintenanceProjectsQuery.ToListAsync());

            return allProjects.Select(p =>
            {
                if (p is NewProject np) return new ProjectDetailsDto { Id = np.Id, Type = "NewProject", Situation = np.Situation, EstimatedValue = np.EstimatedValue, ActualValue = np.ActualValue, ExtractNumber = np.ExtractNumber, FaultNumber = np.FaultNumber, StationNumber = np.StationNumber, OrderDate = np.OrderDate, District = np.District, Contractor = np.Contractor, Consultant = np.Consultant, SafetyViolationsExist = np.SafetyViolationsExist, IsArchive = np.IsArchived, Note = np.Note, ModelPhotos = np.ModelPhotos.Select(m => m.Url).ToList(), SitePhotos = np.SitePhotos.Select(s => s.Url).ToList(), SafetyWastePhotos = np.SafetyWastePhotos.Select(s => s.Url).ToList(), ProjectPlace = np.ProjectPlace, Office = np.Office, ProjectValue = np.ProjectValue, WorkOrderType = np.WorkOrderType, WorkDescription = np.WorkDescription, DurationOfImplementation = np.DurationOfImplementation, ReceiveDateTime = np.ReceiveDateTime, Coordinates = np.Coordinates };
                if (p is Construction c) return new ProjectDetailsDto { Id = c.Id, Type = "Construction", Situation = c.Situation, EstimatedValue = c.EstimatedValue, ActualValue = c.ActualValue, ExtractNumber = c.ExtractNumber, FaultNumber = c.FaultNumber, StationNumber = c.StationNumber, OrderDate = c.OrderDate, District = c.District, Contractor = c.Contractor, Consultant = c.Consultant, SafetyViolationsExist = c.SafetyViolationsExist, IsArchive = c.IsArchived, Note = c.Note, ImplementationPhase = c.ImplementationPhase, TypeOfStomachTest = c.TypeOfStomachTest, DescriptionViolation = c.DescriptionViolation, NumberOfEquipment = c.NumberOfEquipment, ModelPhotos = c.ModelPhotos.Select(m => m.Url).ToList(), SitePhotos = c.SitePhotos.Select(s => s.Url).ToList(), SafetyWastePhotos = c.SafetyWastePhotos.Select(s => s.Url).ToList(), TestModels = c.TestModels.Select(t => t.Url).ToList(), ProjectPlace = c.ProjectPlace, Office = c.Office, ProjectValue = c.ProjectValue, WorkOrderType = c.WorkOrderType, WorkDescription = c.WorkDescription, DurationOfImplementation = c.DurationOfImplementation, ReceiveDateTime = c.ReceiveDateTime, Coordinates = c.Coordinates };
                if (p is Emergency e) return new ProjectDetailsDto { Id = e.Id, Type = "Emergency", Situation = e.Situation, EstimatedValue = e.EstimatedValue, ActualValue = e.ActualValue, ExtractNumber = e.ExtractNumber, FaultNumber = e.FaultNumber, StationNumber = e.StationNumber, OrderDate = e.OrderDate, District = e.District, Contractor = e.Contractor, Consultant = e.Consultant, SafetyViolationsExist = e.SafetyViolationsExist, IsArchive = e.IsArchived, Note = e.Note, ImplementationPhase = e.ImplementationPhase, NotificationNumber = e.NotificationNumber, TaskNumber = e.TaskNumber, TypeOfStomachTest = e.TypeOfStomachTest, DescriptionViolation = e.DescriptionViolation, NumberOfEquipment = e.NumberOfEquipment, ModelPhotos = e.ModelPhotos.Select(m => m.Url).ToList(), SitePhotos = e.SitePhotos.Select(s => s.Url).ToList(), SafetyWastePhotos = e.SafetyWastePhotos.Select(s => s.Url).ToList(), TestModels = e.TestModels.Select(t => t.Url).ToList(), ProjectPlace = e.ProjectPlace, Office = e.Office, ProjectValue = e.ProjectValue, WorkOrderType = e.WorkOrderType, WorkDescription = e.WorkDescription, DurationOfImplementation = e.DurationOfImplementation, ReceiveDateTime = e.ReceiveDateTime, Coordinates = e.Coordinates };
                if (p is Maintenance m) return new ProjectDetailsDto { Id = m.Id, Type = "Maintenance", Situation = m.Situation, EstimatedValue = m.EstimatedValue, ActualValue = m.ActualValue, ExtractNumber = m.ExtractNumber, FaultNumber = m.FaultNumber, StationNumber = m.StationNumber, OrderDate = m.OrderDate, District = m.District, Contractor = m.Contractor, Consultant = m.Consultant, SafetyViolationsExist = m.SafetyViolationsExist, IsArchive = m.IsArchived, Note = m.Note, ImplementationPhase = m.ImplementationPhase, NotificationNumber = m.NotificationNumber, TaskNumber = m.TaskNumber, TypeOfStomachTest = m.TypeOfStomachTest, DescriptionViolation = m.DescriptionViolation, NumberOfEquipment = m.NumberOfEquipment, ModelPhotos = m.ModelPhotos.Select(x => x.Url).ToList(), SitePhotos = m.SitePhotos.Select(s => s.Url).ToList(), SafetyWastePhotos = m.SafetyWastePhotos.Select(s => s.Url).ToList(), TestModels = m.TestModels.Select(t => t.Url).ToList(), ProjectPlace = m.ProjectPlace, Office = m.Office, ProjectValue = m.ProjectValue, WorkOrderType = m.WorkOrderType, WorkDescription = m.WorkDescription, DurationOfImplementation = m.DurationOfImplementation, ReceiveDateTime = m.ReceiveDateTime, Coordinates = m.Coordinates };
                return null;
            }).Where(p => p != null).ToList();
        }

        public async Task<ProjectSituationStatisticsDto> GetSituationCountsAsync()
        {
            var user = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
            var userRoles = await _userManager.GetRolesAsync(user);

            List<object> newProjects, constructionProjects, emergencyProjects, maintenanceProjects;

            if (userRoles.FirstOrDefault() == "admin")
            {
                newProjects = (await newRepository.GetTableNoTracking().ToListAsync()).Cast<object>().ToList();
                constructionProjects = (await constructionRepository.GetTableNoTracking().ToListAsync()).Cast<object>().ToList();
                emergencyProjects = (await emergencyRepository.GetTableNoTracking().ToListAsync()).Cast<object>().ToList();
                maintenanceProjects = (await maintenanceRepository.GetTableNoTracking().ToListAsync()).Cast<object>().ToList();
            }
            else if (userRoles.FirstOrDefault() == "officeManager")
            {
                int officeId = (int)user.OfficeId;
                var officeName = _context.Offices.FirstOrDefault(d => d.Id == officeId)?.Name;
                newProjects = (await newRepository.GetTableNoTracking().Where(p => p.Office == officeName).ToListAsync()).Cast<object>().ToList();
                constructionProjects = (await constructionRepository.GetTableNoTracking().Where(p => p.Office == officeName).ToListAsync()).Cast<object>().ToList();
                emergencyProjects = (await emergencyRepository.GetTableNoTracking().Where(p => p.Office == officeName).ToListAsync()).Cast<object>().ToList();
                maintenanceProjects = (await maintenanceRepository.GetTableNoTracking().Where(p => p.Office == officeName).ToListAsync()).Cast<object>().ToList();
            }
            else
            {
                return new ProjectSituationStatisticsDto();
            }

            List<SituationCountDto> GetCounts(List<object> items)
            {
                var grouped = items
                    .GroupBy(item => (string)item.GetType().GetProperty("Situation")?.GetValue(item))
                    .Select(g => new SituationCountDto
                    {
                        Situation = g.Key,
                        Count = g.Count(),
                        TotoalActualValue = g.Sum(x => { var val = x.GetType().GetProperty("ActualValue")?.GetValue(x)?.ToString(); return int.TryParse(val, out var parsed) ? parsed : 0; }),
                        TotalEstimatedValue = g.Sum(x => { var val = x.GetType().GetProperty("EstimatedValue")?.GetValue(x)?.ToString(); return int.TryParse(val, out var parsed) ? parsed : 0; })
                    }).ToList();

                return ProjectSituations.All.Select(s => new SituationCountDto
                {
                    Situation = s,
                    Count = grouped.FirstOrDefault(g => g.Situation == s)?.Count ?? 0,
                    TotoalActualValue = grouped.FirstOrDefault(g => g.Situation == s)?.TotoalActualValue ?? 0,
                    TotalEstimatedValue = grouped.FirstOrDefault(g => g.Situation == s)?.TotalEstimatedValue ?? 0
                }).ToList();
            }

            return new ProjectSituationStatisticsDto
            {
                Overall = GetCounts(newProjects.Concat(constructionProjects).Concat(emergencyProjects).Concat(maintenanceProjects).ToList()),
                Rehabilitationworks = GetCounts(newProjects),
                ConstructionProjects = GetCounts(constructionProjects),
                EmergencyProjects = GetCounts(emergencyProjects),
                MaintenanceProjects = GetCounts(maintenanceProjects)
            };
        }

        public async Task UpdateProjectSituationsAsync()
        {
            var emergency = await emergencyRepository.GetTableNoTracking().ToListAsync();
            foreach (var project in emergency)
            {
                if (project.BranchName == "منطقة الرياض") project.BranchName = "منطقه الرياض";
                await emergencyRepository.UpdateAsync(project);
            }
            var maintenance = await maintenanceRepository.GetTableNoTracking().ToListAsync();
            foreach (var project in maintenance)
            {
                if (project.BranchName == "منطقة الرياض") project.BranchName = "منطقه الرياض";
                await maintenanceRepository.UpdateAsync(project);
            }
            var construction = await constructionRepository.GetTableNoTracking().ToListAsync();
            foreach (var project in construction)
            {
                if (project.BranchName == "منطقة الرياض") project.BranchName = "منطقه الرياض";
                await constructionRepository.UpdateAsync(project);
            }
            var newProjects = await newRepository.GetTableNoTracking().ToListAsync();
            foreach (var project in newProjects)
            {
                if (project.BranchName == "منطقة الرياض") project.BranchName = "منطقه الرياض";
                await newRepository.UpdateAsync(project);
            }
        }

        public async Task<OrderCompleteOrNoDto> GetOrderStatisticsAsync()
        {
            var completedOrderForNew = await newRepository.GetTableNoTracking().CountAsync(o => !o.IsArchived);
            var completedOrderForConstruction = await constructionRepository.GetTableNoTracking().CountAsync(o => !o.IsArchived);
            var completedOrderForMaintenance = await maintenanceRepository.GetTableNoTracking().CountAsync(o => !o.IsArchived);
            var completedOrderForEmergency = await emergencyRepository.GetTableNoTracking().CountAsync(o => !o.IsArchived);
            var completedOrderForPrivate = await privateRepository.GetTableNoTracking().CountAsync(o => !o.IsArchived);

            var nonCompletedOrderForNew = await newRepository.GetTableNoTracking().CountAsync(o => o.IsArchived);
            var nonCompletedOrderForConstruction = await constructionRepository.GetTableNoTracking().CountAsync(o => o.IsArchived);
            var nonCompletedOrderForMaintenance = await maintenanceRepository.GetTableNoTracking().CountAsync(o => o.IsArchived);
            var nonCompletedOrderForEmergency = await emergencyRepository.GetTableNoTracking().CountAsync(o => o.IsArchived);
            var nonCompletedOrderForPrivate = await privateRepository.GetTableNoTracking().CountAsync(o => o.IsArchived);

            var supervisors = await _userManager.GetUsersInRoleAsync("supervisor");

            return new OrderCompleteOrNoDto
            {
                CompletedOrdersCount = completedOrderForNew + completedOrderForConstruction + completedOrderForMaintenance + completedOrderForEmergency + completedOrderForPrivate,
                CompletedOrderForRehabilitationWorks = completedOrderForNew,
                CompletedOrderForConstruction = completedOrderForConstruction,
                CompletedOrderForMaintenance = completedOrderForMaintenance,
                CompletedOrderForEmergency = completedOrderForEmergency,
                CompletedOrderForPrivate = completedOrderForPrivate,
                NonCompletedOrdersCount = nonCompletedOrderForNew + nonCompletedOrderForConstruction + nonCompletedOrderForMaintenance + nonCompletedOrderForEmergency + nonCompletedOrderForPrivate,
                NonCompletedOrderForRehabilitationWorks = nonCompletedOrderForNew,
                NonCompletedOrderForConstruction = nonCompletedOrderForConstruction,
                NonCompletedOrderForMaintance = nonCompletedOrderForMaintenance,
                NonCompletedOrderForEmergency = nonCompletedOrderForEmergency,
                NonCompletedOrderForPrivate = nonCompletedOrderForPrivate,
                SupervisorCount = supervisors.Count()
            };
        }
        public async Task<int> MarkPaidProjectsAsDisbursedAsync()
        {
            const string oldStatus = "paid";
            const string newStatus = "تم الصرف";

            int updatedCount = 0;

            var newProjects = await newRepository.GetTableNoTracking()
                .Where(p => p.Situation == oldStatus)
                .ToListAsync();
            foreach (var project in newProjects)
            {
                project.Situation = newStatus;
                await newRepository.UpdateAsync(project);
                updatedCount++;
            }

            var constructions = await constructionRepository.GetTableNoTracking()
                .Where(p => p.Situation == oldStatus)
                .ToListAsync();
            foreach (var project in constructions)
            {
                project.Situation = newStatus;
                await constructionRepository.UpdateAsync(project);
                updatedCount++;
            }

            var emergencies = await emergencyRepository.GetTableNoTracking()
                .Where(p => p.Situation == oldStatus)
                .ToListAsync();
            foreach (var project in emergencies)
            {
                project.Situation = newStatus;
                await emergencyRepository.UpdateAsync(project);
                updatedCount++;
            }

            var maintenances = await maintenanceRepository.GetTableNoTracking()
                .Where(p => p.Situation == oldStatus)
                .ToListAsync();
            foreach (var project in maintenances)
            {
                project.Situation = newStatus;
                await maintenanceRepository.UpdateAsync(project);
                updatedCount++;
            }

           
            return updatedCount;
        }
    }
}