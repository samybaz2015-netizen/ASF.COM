//using Microsoft.AspNetCore.Mvc;
//using ASF.Core.Entities.NewProject;
//using ASF.Core.Repository;
//using ASF.Core.HandleSpecification;
//using AutoMapper;
//using ASF.Core.Dtos.NewProjectResponse;
//using ASF.Core.Entities.PrivateProject;
//using ASF.Core.Dtos.PrivateResponse;
//using ASF.Core.Entities;
//using ASF.Service;
//using ASF.Core.Services;
//using ASF.Core.Dtos;
//using ASF.Core.Entities.Construction;
//using ASF.Core.Entities.Emergency;
//using ASF.Core.Dtos.EmergencyResponse;
//using ASF.Core.Entities.Maintenance;
//using System.Security.Claims;
//using ASF.Repository.AppDbContext;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.AspNetCore.Identity;
//using ASF.Core.Entities.Identity;


//namespace ASF.Api.Controllers
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class SearchController : ControllerBase
//    {
//        private readonly IGenericRepository<NewProject> newRepository;
//        private readonly IGenericRepository<Construction> constructionRepository;
//        private readonly IGenericRepository<PrivateProject> _privateRepository;
//        private readonly IGenericRepository<Emergency> _emergencyRepository;
//        private readonly IGenericRepository<Maintenance> _maintenanceRepository;
//        private readonly UserManager<AppUser> _userManager;
//        private readonly INotificationRepository _notificationRepository;

//        private readonly IMapper _mapper;

//        private readonly INewProjectDeletedRepository _newProjectDeletedRepository;
//        private readonly IPrivateProjectDeletedRepository _privateProjectDeletedRepository;
//        private readonly IConstructionDeletedRepository _constructionDeletedRepository;
//        private readonly IEmergencyDeletedRepository _emergencyDeletedRepository;
//        private readonly IMaintenanceDeletedRepository _maintenanceDeletedRepository;



//        private readonly INewProjectService _newProjectService;
//        private readonly IPrivateProject _privateProject;
//        private readonly IConstructionService _constructionService;
//        private readonly IEmergencyService _emergencyService;
//        private readonly IMaintenanceService _maintenanceService;

//        private readonly ApplicationDbContext _context;




//        public SearchController(
//            IGenericRepository<NewProject> newRepository,
//            IGenericRepository<PrivateProject> privateRepository,
//            IGenericRepository<Construction> constructionRepository,
//            IGenericRepository<Emergency> emergencyRepository,
//            IGenericRepository<Maintenance> maintenanceRepository,
//            IMapper mapper,
//            INewProjectDeletedRepository newProjectDeletedRepository,
//            IPrivateProjectDeletedRepository privateProjectDeletedRepository,
//            IConstructionDeletedRepository constructionDeletedRepository,
//            IEmergencyDeletedRepository emergencyDeletedRepository,
//            IMaintenanceDeletedRepository maintenanceDeletedRepository,
//            INewProjectService newProjectService,
//            IPrivateProject privateProject,
//            IConstructionService constructionService,
//            IEmergencyService emergencyService,
//            IMaintenanceService maintenanceService,
//            ApplicationDbContext context,
//            UserManager<AppUser> userManager,
//            INotificationRepository notificationRepository




//            )
//        {
//            this.newRepository = newRepository;
//            this.constructionRepository = constructionRepository;
//            _privateRepository = privateRepository;
//            _emergencyRepository = emergencyRepository;
//            _maintenanceRepository = maintenanceRepository;
//            _mapper = mapper;
//            _newProjectDeletedRepository = newProjectDeletedRepository;
//            _privateProjectDeletedRepository = privateProjectDeletedRepository;
//            _constructionDeletedRepository = constructionDeletedRepository;
//            _emergencyDeletedRepository = emergencyDeletedRepository;
//            _maintenanceDeletedRepository = maintenanceDeletedRepository;
//            _newProjectService = newProjectService;
//            _privateProject = privateProject;
//            _constructionService = constructionService;
//            _emergencyService = emergencyService;
//            _maintenanceService = maintenanceService;
//            _context = context;
//            _userManager = userManager;
//            _notificationRepository = notificationRepository;
//        }
//        [HttpGet("bot")]
//        public async Task<IActionResult> Bot([FromQuery] string orderId, [FromQuery] string type)
//        {
//            object? result = null;

//            switch (type)
//            {

//                case "rehabilitationWorks":
//                    #region NewProject
//                    var specNew = new NewProjectSpecification();
//                    var newProject = _context.NewProjects.Include(d=>d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos).FirstOrDefault(p => p.FaultNumber == orderId);
//                    result = newProject;
//                    #endregion
//                    break;

//                case "construction":
//                    #region Construction
//                    var specConstruction = new ConstructionSpecification();
//                    var constructionProject = _context.Constructions.Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos).Include(d=>d.TestModels).FirstOrDefault(p => p.FaultNumber == orderId);
//                    result = constructionProject;
//                    #endregion
//                    break;

//                case "emergency":
//                    #region Construction
//                    var specEmergency = new EmergencySpecification();
//                    var emergencyProject = _context.Emergencys.Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).FirstOrDefault(p => p.FaultNumber == orderId);
//                    result = emergencyProject;
//                    #endregion
//                    break;

//                case "maintenance":
//                    #region Construction
//                    var specMaintenance = new MaintenanceSpecification();
//                    var maintenanceProject = _context.Maintenances.Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).FirstOrDefault(p => p.FaultNumber == orderId);
//                    result = maintenanceProject;
//                    #endregion
//                    break;

//                case "privateproject":
//                    #region PrivateProject
//                    var specPrivate = new PrivateProjectSpecification();
//                    var privateProject = _context.PrivateProjects.Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos).FirstOrDefault(p => p.OrderCode == orderId);
//                    result = privateProject;
//                    #endregion
//                    break;

//                default:
//                    return BadRequest(new { message = "Invalid type provided. Use 'order', 'newproject', or 'operation'." });
//            }

//            if (result == null)
//            {
//                return NotFound(new { message = "No matching record found for the provided orderId and type." });
//            }

//            return Ok(new {massege = "data" , statusCode = 200,data = result });
//        }

//        [HttpGet("search-by-orderidWithType")]
//        public async Task<IActionResult> SearchByOrderIdWithType([FromQuery] int orderId, [FromQuery] string type)
//        {
//            object? result = null;

//            switch ( type )
//            {

//                case "rehabilitationWorks":
//                    #region NewProject
//                    var specNew = new NewProjectSpecification();
//                    var newProjects = await newRepository.GetAllWithSpecAsync(specNew);
//                    var newProject = newProjects.FirstOrDefault(p => p.Id==orderId);
//                    result=newProject!=null ? _mapper.Map<NewProjectResponse>(newProject) : null; // Map only if not null
//                    #endregion
//                    break; 

//                case "construction":
//                    #region Construction
//                    var specConstruction = new ConstructionSpecification();
//                    var construction = await constructionRepository.GetAllWithSpecAsync(specConstruction);
//                    var constructionProject = construction.FirstOrDefault(p => p.Id==orderId);
//                    result= constructionProject != null ? _mapper.Map<NewProjectResponse>(constructionProject) : null; // Map only if not null
//                    #endregion
//                    break; 

//                case "emergency":
//                    #region Construction
//                    var specEmergency = new EmergencySpecification();
//                    var emergency = await _emergencyRepository.GetAllWithSpecAsync(specEmergency);
//                    var emergencyProject = emergency.FirstOrDefault(p => p.Id==orderId);
//                    result= emergencyProject != null ? _mapper.Map<EmergencyResponse>(emergencyProject) : null; // Map only if not null
//                    #endregion
//                    break;   

//                case "maintenance":
//                    #region Construction
//                    var specMaintenance = new MaintenanceSpecification();
//                    var maintenance = await _maintenanceRepository.GetAllWithSpecAsync(specMaintenance);
//                    var maintenanceProject = maintenance.FirstOrDefault(p => p.Id==orderId);
//                    result= maintenanceProject != null ? _mapper.Map<EmergencyResponse>(maintenanceProject) : null; // Map only if not null
//                    #endregion
//                    break;

//                case "privateproject":
//                    #region PrivateProject
//                    var specPrivate = new PrivateProjectSpecification();
//                    var privateProjects = await _privateRepository.GetAllWithSpecAsync(specPrivate);
//                    var privateProject = privateProjects.FirstOrDefault(p => p.Id == orderId); 
//                    result = privateProject != null ? _mapper.Map<PrivateResponse>(privateProject) : null; 
//                    #endregion
//                    break;

//                default:
//                    return BadRequest(new { message = "Invalid type provided. Use 'order', 'newproject', or 'operation'." });
//            }

//            if ( result==null )
//            {
//                return NotFound(new { message = "No matching record found for the provided orderId and type." });
//            }

//            return Ok(result);
//        }

//        [HttpDelete("delete-by-orderidWithType")]
//        public async Task<IActionResult> DeleteByOrderIdWithType([FromQuery] int orderId, [FromQuery] string type)
//        {
//            if (User == null)
//            {
//                return Unauthorized(new { message = "المستخدم غير مسجل الدخول." });
//            }

//            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//            var user = _userManager.Users.FirstOrDefault(d => d.Id == userId);
//            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

//            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userRole))
//            {
//                return Unauthorized(new { message = "فشل استرداد معلومات المستخدم." });
//            }
//            var existingDeleteRequest = await _context.DeleteRequests
//            .FirstOrDefaultAsync(dr => dr.OrderId == orderId && dr.Type.ToLower() == type.ToLower() && dr.RequestedBy == userId);
//            if (existingDeleteRequest != null)
//            {
//                return BadRequest(new { message = "لقد قمت بطلب حذف هذا المشروع مسبقًا." });
//            }
//            if (userRole == "eng")
//            {
//                var deleteRequest = new DeleteRequest
//                {
//                    OrderId = orderId,
//                    Type = type,
//                    RequestedBy = userId,
//                    IsApproved = false // الأدمن سيوافق عليه لاحقًا
//                };
//                var admins = await _userManager.Users
//                 .Where(u => u.UserType == "admin")
//                 .ToListAsync();

//                foreach (var admin in admins)
//                {
//                    var notification = new Notification
//                    {
//                        Message = $"تم 'طلب حذف' مشروع : {orderId}",
//                        UserName = user.UserName,
//                        UserImage = user.UserImage!,
//                        CreatedAt = DateTime.Now,
//                        NotificationType = "إنشاء مشروع جديد",
//                        Target = admin.Id
//                    };

//                    await _notificationRepository.AddAsync(notification);
//                }
//                await _context.DeleteRequests.AddAsync(deleteRequest);
//                await _context.SaveChangesAsync();
//                return Ok(new { message = "تم إرسال طلب الحذف إلى الأدمن للموافقة." });
//            }

//            switch ( type.ToLower() )
//            {


//                case "rehabilitationworks":
//                    #region NewProject
//                    var specNew = new NewProjectSpecification();
//                    var newProjects = await newRepository.GetAllWithSpecAsync(specNew);
//                    var newProject = newProjects.FirstOrDefault(p => p.Id == orderId);
//                    if (newProject != null)
//                    {
//                        // إضافة المشروع إلى جدول NewProjectDeleted
//                        var newProjectDeleted = new NewProjectDeleted
//                        {
//                            WorkOrderType = newProject.WorkOrderType,
//                            //StationNumber = newProject.StationNumber ?? null,
//                            DurationOfImplementation = newProject.DurationOfImplementation,
//                            FaultNumber = newProject.FaultNumber,
//                            District = newProject.District,
//                            Contractor = newProject.Contractor,
//                            Consultant = newProject.Consultant,
//                            StationNumber = newProject.StationNumber,
//                            Type = type,
//                            WorkDescription = newProject.WorkDescription,
//                            AppUserId = newProject.AppUserId,
//                            UserName = newProject.UserName,
//                            UserImage = newProject.UserImage,
//                            BranchName = newProject.BranchName,
//                            OrderDate = newProject.OrderDate ?? null,
//                            SafetyViolationsExist = newProject.SafetyViolationsExist,
//                            Note = newProject.Note,
//                            IsArchived = newProject.IsArchived,
//                            CreateAt = newProject.CreateAt,
//                            EstimatedValue = newProject.EstimatedValue,
//                            ActualValue = newProject.ActualValue ?? null,
//                            ExtractNumber = newProject.ExtractNumber ?? null,
//                            ProjectPlace = newProject.ProjectPlace,
//                            Office = newProject.Office,
//                            ProjectValue = newProject.ProjectValue,
//                            Situation = newProject.Situation,
//                            ReceiveDateTime = newProject.ReceiveDateTime,
//                            QualificationClassification = newProject.QualificationClassification,
//                            Coordinates = newProject.Coordinates,
//                            UserApproveId = newProject.UserApproveId,
//                            IsApprove = newProject.IsApprove,
//                            // نسخ الصور المرتبطة بالمشروع
//                            ModelPhotos = newProject.ModelPhotos.Select(mp => new ModelPhotoForDeletedNew
//                            {
//                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
//                                NewProjectId = newProject.Id
//                            }).ToList(),

//                            SitePhotos = newProject.SitePhotos?.Select(sp => new SitePhotoForDeletedNew
//                            {
//                                Url = sp.Url,  // استخدم الاسم الصحيح للخاصية
//                                NewProjectId = newProject.Id
//                            }).ToList(),

//                            SafetyWastePhotos = newProject.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForDeletedNew
//                            {
//                                Url = swp.Url,  // استخدم الاسم الصحيح للخاصية
//                                NewProjectId = newProject.Id
//                            }).ToList()
//                        };

//                        // إضافة البيانات المحذوفة
//                        await _newProjectDeletedRepository.AddAsync(newProjectDeleted);

//                        // حذف المشروع من جدول NewProject
//                        await newRepository.DeleteAsync(newProject);
//                    }
//                    #endregion
//                    break;   
//                case "construction":
//                    #region Construction
//                    var specConstruction = new ConstructionSpecification();
//                    var constructions = await constructionRepository.GetAllWithSpecAsync(specConstruction);
//                    var construction = constructions.FirstOrDefault(p => p.Id == orderId);
//                    if (construction != null)
//                    {
//                        // إضافة المشروع إلى جدول NewProjectDeleted
//                        var constructionDeleted = new ConstructionDeleted
//                        {
//                            WorkOrderType = construction.WorkOrderType,
//                            DurationOfImplementation = construction.DurationOfImplementation,
//                            FaultNumber = construction.FaultNumber,
//                            District = construction.District,
//                            Contractor = construction.Contractor,
//                            Consultant = construction.Consultant,
//                            AppUserId = construction.AppUserId,
//                            UserName = construction.UserName,
//                            UserImage = construction.UserImage,
//                            StationNumber = construction.StationNumber,
//                            BranchName = construction.BranchName,
//                            OrderDate = construction.OrderDate ?? null,
//                            SafetyViolationsExist = construction.SafetyViolationsExist,
//                            Note = construction.Note,
//                            IsArchived = construction.IsArchived,
//                            CreateAt = construction.CreateAt,
//                            EstimatedValue = construction.EstimatedValue,
//                            ActualValue = construction.ActualValue ?? null,
//                            ExtractNumber = construction.ExtractNumber ?? null,
//                            ProjectPlace = construction.ProjectPlace,
//                            Office = construction.Office,
//                            ProjectValue = construction.ProjectValue,
//                            Situation = construction.Situation,
//                            ReceiveDateTime = construction.ReceiveDateTime,
//                            DailyExcavationLength = construction.DailyExcavationLength,
//                            NumberOfDaysDelayed = construction.NumberOfDaysDelayed,
//                            NumberOfDaysRemaining = construction.NumberOfDaysRemaining,
//                            ExcavationLength = construction.ExcavationLength,
//                            CompletionDate = construction.CompletionDate,
//                            Coordinates = construction.Coordinates,
//                            ProjectExcavationLength = construction.ProjectExcavationLength,
//                            ImplementationPhase = construction.ImplementationPhase,

//                            Type = construction.Type,
//                            WorkDescription = construction.WorkDescription,
//                            DescriptionViolation = construction.DescriptionViolation,
//                            CompletionStatusReport = construction.CompletionStatusReport ?? "Not Specified",
//                            TypeOfStomachTest = construction.TypeOfStomachTest,
//                            NumberOfEquipment = construction.NumberOfEquipment,
//                            CableLength = construction.CableLength,
//                            DailyCableLength = construction.DailyCableLength,   
//                            CableCompletion = construction.CableCompletion,
//                            ProjectCableLength = construction.ProjectCableLength,
//                            OrderType = construction.OrderType,
//                            IsApprove = construction.IsApprove,
//                            UserApproveId = construction.UserApproveId,


//                            // نسخ الصور المرتبطة بالمشروع
//                            ModelPhotos = construction.ModelPhotos.Select(mp => new ModelPhotoForDeletedConstruction
//                            {
//                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
//                                ConstructionId = construction.Id
//                            }).ToList(),
//                            TestModels = construction.TestModels.Select(mp => new ModelTestForDeletedConstruction
//                            {
//                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
//                                ConstructionId = construction.Id
//                            }).ToList(),

//                            SitePhotos = construction.SitePhotos?.Select(sp => new SitePhotoForDeletedConstruction
//                            {
//                                Url = sp.Url,  // استخدم الاسم الصحيح للخاصية
//                                ConstructionId = construction.Id
//                            }).ToList(),

//                            SafetyWastePhotos = construction.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForDeletedConstruction
//                            {
//                                Url = swp.Url,  // استخدم الاسم الصحيح للخاصية
//                                ConstructionId = construction.Id
//                            }).ToList()


//                        };

//                        // إضافة البيانات المحذوفة
//                        await _constructionDeletedRepository.AddAsync(constructionDeleted);

//                        // حذف المشروع من جدول NewProject
//                        await constructionRepository.DeleteAsync(construction);
//                    }
//                    #endregion
//                    break; 
//                case "emergency":
//                    #region Emergency
//                    var specEmergency = new EmergencySpecification();
//                    var emergencys = await _emergencyRepository.GetAllWithSpecAsync(specEmergency);
//                    var emergency = emergencys.FirstOrDefault(p => p.Id == orderId);
//                    if (emergency != null)
//                    {
//                        // إضافة المشروع إلى جدول NewProjectDeleted
//                        var emergencyDeleted = new EmergencyDeleted
//                        {
//                            WorkOrderType = emergency.WorkOrderType,
//                            WorkDescription = emergency.WorkDescription,
//                            StationNumber = emergency.StationNumber ?? null,
//                            DurationOfImplementation = emergency.DurationOfImplementation,
//                            FaultNumber = emergency.FaultNumber,
//                            District = emergency.District,
//                            Contractor = emergency.Contractor,
//                            Consultant = emergency.Consultant,
//                            AppUserId = emergency.AppUserId,
//                            UserName = emergency.UserName,
//                            UserImage = emergency.UserImage,
//                            BranchName = emergency.BranchName,
//                            OrderDate = emergency.OrderDate ?? null,
//                            SafetyViolationsExist = emergency.SafetyViolationsExist,
//                            Note = emergency.Note,
//                            IsArchived = emergency.IsArchived,
//                            CreateAt = emergency.CreateAt,
//                            EstimatedValue = emergency.EstimatedValue,
//                            ActualValue = emergency.ActualValue ?? null,
//                            ExtractNumber = emergency.ExtractNumber ?? null,
//                            ProjectPlace = emergency.ProjectPlace,
//                            Office = emergency.Office,
//                            ProjectValue = emergency.ProjectValue,
//                            Situation = emergency.Situation,
//                            ReceiveDateTime = emergency.ReceiveDateTime,
//                            ImplementationPhase = emergency.ImplementationPhase,
//                            Coordinates = emergency.Coordinates,
//                            NotificationNumber = emergency.NotificationNumber,
//                            TaskNumber  = emergency.TaskNumber,
//                            TypeOfStomachTest = emergency.TypeOfStomachTest,
//                            Type = emergency.Type,
//                            IsApprove = emergency.IsApprove,
//                            UserApproveId = emergency.UserApproveId,
//                            DescriptionViolation = emergency.DescriptionViolation, 
//                            NumberOfEquipment = emergency.NumberOfEquipment,

//                            // نسخ الصور المرتبطة بالمشروع
//                            ModelPhotos = emergency.ModelPhotos.Select(mp => new ModelPhotoForDeletedEmergency
//                            {
//                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
//                                EmergencyId = emergency.Id
//                            }).ToList(),
//                            TestModels = emergency.TestModels.Select(mp => new ModelTestForDeletedEmergency
//                            {
//                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
//                                EmergencyId = emergency.Id
//                            }).ToList(),

//                            SitePhotos = emergency.SitePhotos?.Select(sp => new SitePhotoForDeletedEmergency
//                            {
//                                Url = sp.Url,  // استخدم الاسم الصحيح للخاصية
//                                EmergencyId = emergency.Id
//                            }).ToList(),

//                            SafetyWastePhotos = emergency.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForDeletedEmergency
//                            {
//                                Url = swp.Url,  // استخدم الاسم الصحيح للخاصية
//                                EmergencyId = emergency.Id
//                            }).ToList()


//                        };

//                        // إضافة البيانات المحذوفة
//                        await _emergencyDeletedRepository.AddAsync(emergencyDeleted);

//                        // حذف المشروع من جدول NewProject
//                        await _emergencyRepository.DeleteAsync(emergency);
//                    }
//                    #endregion
//                    break;
//                case "maintenance":
//                    #region Emergency
//                    var specMaintenance = new MaintenanceSpecification();
//                    var maintenances = await _maintenanceRepository.GetAllWithSpecAsync(specMaintenance);
//                    var maintenance = maintenances.FirstOrDefault(p => p.Id == orderId);
//                    if (maintenance != null)
//                    {
//                        // إضافة المشروع إلى جدول NewProjectDeleted
//                        var maintenanceDeleted = new MaintenanceDeleted
//                        {
//                            WorkOrderType = maintenance.WorkOrderType,
//                            WorkDescription = maintenance.WorkDescription,
//                            DurationOfImplementation = maintenance.DurationOfImplementation,
//                            FaultNumber = maintenance.FaultNumber,
//                            District = maintenance.District,
//                            Contractor = maintenance.Contractor,
//                            Consultant = maintenance.Consultant,
//                            AppUserId = maintenance.AppUserId,
//                            UserName = maintenance.UserName,
//                            UserImage = maintenance.UserImage,
//                            BranchName = maintenance.BranchName,
//                            StationNumber = maintenance.StationNumber,
//                            OrderDate = maintenance.OrderDate ?? null,
//                            SafetyViolationsExist = maintenance.SafetyViolationsExist,
//                            Note = maintenance.Note,
//                            IsArchived = maintenance.IsArchived,
//                            CreateAt = maintenance.CreateAt,
//                            EstimatedValue = maintenance.EstimatedValue,
//                            ActualValue = maintenance.ActualValue ?? null,
//                            ExtractNumber = maintenance.ExtractNumber ?? null,
//                            ProjectPlace = maintenance.ProjectPlace,
//                            Office = maintenance.Office,
//                            ProjectValue = maintenance.ProjectValue,
//                            Situation = maintenance.Situation,
//                            ReceiveDateTime = maintenance.ReceiveDateTime,
//                            TypeOfStomachTest = maintenance.TypeOfStomachTest,
//                            TaskNumber = maintenance.TaskNumber,
//                            NotificationNumber = maintenance.NotificationNumber,
//                            ImplementationPhase = maintenance.ImplementationPhase,
//                            Coordinates = maintenance.Coordinates,
//                           IsApprove = maintenance.IsApprove,
//                           UserApproveId = maintenance.UserApproveId,
//                            DescriptionViolation = maintenance.DescriptionViolation,
//                            NumberOfEquipment = maintenance.NumberOfEquipment,

//                            // نسخ الصور المرتبطة بالمشروع
//                            ModelPhotos = maintenance.ModelPhotos.Select(mp => new ModelPhotoForMaintenanceDeleted
//                            {
//                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
//                                MaintenanceId = maintenance.Id
//                            }).ToList(), 
//                            TestModels = maintenance.TestModels.Select(mp => new ModelTestForMaintenanceDeleted
//                            {
//                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
//                                MaintenanceId = maintenance.Id
//                            }).ToList(),

//                            SitePhotos = maintenance.SitePhotos?.Select(sp => new SitePhotoForMaintenanceDeleted
//                            {
//                                Url = sp.Url,  // استخدم الاسم الصحيح للخاصية
//                                MaintenanceId = maintenance.Id
//                            }).ToList(),

//                            SafetyWastePhotos = maintenance.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForMaintenanceDeleted
//                            {
//                                Url = swp.Url,  // استخدم الاسم الصحيح للخاصية
//                                MaintenanceId = maintenance.Id
//                            }).ToList()

//                        };

//                        // إضافة البيانات المحذوفة
//                        await _maintenanceDeletedRepository.AddAsync(maintenanceDeleted);

//                        // حذف المشروع من جدول NewProject
//                        await _maintenanceRepository.DeleteAsync(maintenance);
//                    }
//                    #endregion
//                    break;
//                case "privateproject":
//                    #region privateProject
//                    var specPrivate = new PrivateProjectSpecification();
//                    var priProjects = await _privateRepository.GetAllWithSpecAsync(specPrivate);
//                    var priProject = priProjects.FirstOrDefault(p => p.Id == orderId);

//                    if (priProject != null)
//                    {
//                        // حفظ الصور في متغيرات قبل حذف المشروع
//                        var modelPhotos = priProject.ModelPhotos?.ToList() ?? new List<ModelPhotoForPrivate>();
//                        var sitePhotos = priProject.SitePhotos?.ToList() ?? new List<SitePhotoForPrivate>();
//                        var safetyWastePhotos = priProject.SafetyWastePhotos?.ToList() ?? new List<SafetyWastePhotoForPrivate>();

//                        // إنشاء كائن من PrivateProjectDeleted
//                        var privateProjectDeleted = new PrivateProjectDeleted
//                        {
//                            ProjectName = priProject.ProjectName,
//                            ProjectPlace = priProject.ProjectPlace,
//                            ProjectValue = priProject.ProjectValue,
//                            TimeOfProject = priProject.TimeOfProject,
//                            Customer = priProject.Customer,
//                            Consultant = priProject.Consultant,
//                            Contractor = priProject.Contractor,
//                            AppUserId = priProject.AppUserId,
//                            UserName = priProject.UserName,
//                            UserImage = priProject.UserImage,
//                            BranchName = priProject.BranchName,
//                            OrderDate = priProject.OrderDate ??null,
//                            SafetyViolationsExist = priProject.SafetyViolationsExist,
//                            Note = priProject.Note,
//                            IsArchived = priProject.IsArchived,
//                            CreateAt = priProject.CreateAt,
//                            StationNumber = priProject.StationNumber??null,
//                            WorkDescription = priProject.WorkDescription,
//                            DeletedAt = DateTime.Now, // وقت الحذف
//                            IsApprove = priProject.IsApprove,
//                            UserApproveId = priProject.UserApproveId,
//                            Coordinates = priProject.Coordinates,
//                            // نقل الصور
//                            // نسخ الصور المرتبطة بالمشروع
//                            ModelPhotos = priProject.ModelPhotos.Select(mp => new ModelPhotoForPrivateDeleted
//                            {
//                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
//                                PrivateProjectId = priProject.Id
//                            }).ToList(),

//                            SitePhotos = priProject.SitePhotos?.Select(sp => new SitePhotoForPrivateDeleted
//                            {
//                                Url = sp.Url,  // استخدم الاسم الصحيح للخاصية
//                                PrivateProjectId = priProject.Id
//                            }).ToList(),

//                            SafetyWastePhotos = priProject.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForPrivateDeleted
//                            {
//                                Url = swp.Url,  // استخدم الاسم الصحيح للخاصية
//                                PrivateProjectId = priProject.Id
//                            }).ToList()
//                        };

//                        // إضافة المشروع المحذوف إلى الجدول الخاص بالـ PrivateProjectDeleted
//                        await _privateProjectDeletedRepository.AddAsync(privateProjectDeleted);

//                        // حذف المشروع من جدول PrivateProject بعد نقل الصور
//                        await _privateRepository.DeleteAsync(priProject);

//                        // إرسال الرد مع بيانات المشروع المحذوف
//                        return Ok(new
//                        {
//                            statusCode = 200,
//                            message = "تم حذف المشروع بنجاح",
//                            data = privateProjectDeleted
//                        });
//                    }
//                    #endregion
//                    break;



//                default:
//                    return BadRequest(new { message = "Invalid type provided. Use 'order', 'rehabilitationWorks','maintenance', or 'construction'. or 'emergency" });
//            }

//            return Ok(new { message = "تم حذف الطلب بنجاح", orderId });
//        }
//        [HttpGet("get-deleted-projects")]
//        public async Task<IActionResult> GetDeletedProjects()
//        {
//            try
//            {
//                // جلب البيانات من جميع الـ repositories
//                var newProjects = await _newProjectDeletedRepository.GetAllAsync() ?? new List<NewProjectDeleted>();
//                var constructions = await _constructionDeletedRepository.GetAllAsync() ?? new List<ConstructionDeleted>();
//                var emergencys = await _emergencyDeletedRepository.GetAllAsync() ?? new List<EmergencyDeleted>();
//                var maintenances = await _maintenanceDeletedRepository.GetAllAsync() ?? new List<MaintenanceDeleted>();
//               var privateProjects = await _privateProjectDeletedRepository.GetAllAsync() ?? new List<PrivateProjectDeleted>();

//                // دمج البيانات في كائن واحد
//                var response = new DeletedProjectsResponse
//                {
//                    RehabilitationWorks = newProjects,
//                    Constructions = constructions,
//                    Emergencies = emergencys,
//                    Maintenances = maintenances,
//                    PrivateProjects = privateProjects,
//                };

//                // إرجاع الرد
//                return Ok(response);
//            }
//            catch (Exception ex)
//            {
//                // تسجيل الخطأ
//                return BadRequest(new { message = "حدث خطأ غير متوقع", error = ex.Message });
//            }
//        }
//        [HttpDelete("delete-project-from-trash/{id}")]
//        public async Task<IActionResult> DeleteProjectFromTrash(int id, string type)
//        {
//            try
//            {
//                bool isDeleted = false;

//                switch (type.ToLower())
//                {
//                    case "rehabilitationworks":
//                        var newProject = await _newProjectDeletedRepository.GetByIdAsync(id);
//                        if (newProject != null)
//                        {
//                            await _newProjectDeletedRepository.DeleteAsync(newProject);
//                            isDeleted = true;
//                        }
//                        break;

//                    case "privateproject":
//                        var privateProject = await _privateProjectDeletedRepository.GetByIdAsync(id);
//                        if (privateProject != null)
//                        {
//                            await _privateProjectDeletedRepository.DeleteAsync(privateProject);
//                            isDeleted = true;
//                        }
//                        break;

//                    case "construction":
//                        var construction = await _constructionDeletedRepository.GetByIdAsync(id);
//                        if (construction != null)
//                        {
//                            await _constructionDeletedRepository.DeleteAsync(construction);
//                            isDeleted = true;
//                        }
//                        break;

//                    case "emergency":
//                        var emergency = await _emergencyDeletedRepository.GetByIdAsync(id);
//                        if (emergency != null)
//                        {
//                            await _emergencyDeletedRepository.DeleteAsync(emergency);
//                            isDeleted = true;
//                        }
//                        break;

//                    case "maintenance":
//                        var maintenance = await _maintenanceDeletedRepository.GetByIdAsync(id);
//                        if (maintenance != null)
//                        {
//                            await _maintenanceDeletedRepository.DeleteAsync(maintenance);
//                            isDeleted = true;
//                        }
//                        break;

//                    default:
//                        return BadRequest(new { message = "نوع المشروع غير صالح" });
//                }

//                if (isDeleted)
//                {
//                    return Ok(new { message = "تم حذف المشروع بنجاح من سلة المهملات" });
//                }

//                return NotFound(new { message = "المشروع غير موجود" });
//            }
//            catch (Exception ex)
//            {
//                return BadRequest(new { message = "حدث خطأ أثناء حذف المشروع", error = ex.Message });
//            }
//        }

//        [HttpPost("restore-project-from-trash/{id}")]
//        public async Task<IActionResult> RestoreProjectFromTrash(int id, string type)
//        {
//            try
//            {
//                bool isRestored = false;

//                switch (type.ToLower())
//                {
//                    case "rehabilitationworks":
//                        var deletedNewProject = await _newProjectDeletedRepository.GetByIdAsync(id);
//                        if (deletedNewProject != null)
//                        {
//                            var restoredNewProject = new NewProject
//                            {
//                                WorkOrderType = deletedNewProject.WorkOrderType,
//                                //StationNumber = deletedNewProject.StationNumber,
//                                DurationOfImplementation = deletedNewProject.DurationOfImplementation,
//                                FaultNumber = deletedNewProject.FaultNumber,
//                                District = deletedNewProject.District,
//                                Contractor = deletedNewProject.Contractor,
//                                Consultant = deletedNewProject.Consultant,
//                                AppUserId = deletedNewProject.AppUserId,
//                                UserName = deletedNewProject.UserName,
//                                UserImage = deletedNewProject.UserImage,
//                                BranchName = deletedNewProject.BranchName,
//                                OrderDate = deletedNewProject.OrderDate,
//                                SafetyViolationsExist = deletedNewProject.SafetyViolationsExist,
//                                WorkDescription = deletedNewProject.WorkDescription,
//                                Note = deletedNewProject.Note,
//                                IsArchived = deletedNewProject.IsArchived,
//                                CreateAt = deletedNewProject.CreateAt,
//                                EstimatedValue = deletedNewProject.EstimatedValue,
//                                ActualValue = deletedNewProject.ActualValue,
//                                ExtractNumber = deletedNewProject.ExtractNumber,
//                                ProjectPlace = deletedNewProject.ProjectPlace,
//                                Office = deletedNewProject.Office,
//                                ProjectValue = deletedNewProject.ProjectValue,
//                                Situation = deletedNewProject.Situation,
//                                ReceiveDateTime = deletedNewProject.ReceiveDateTime,
//                                QualificationClassification = deletedNewProject.QualificationClassification,
//                                Coordinates = deletedNewProject.Coordinates,
//                                StationNumber = deletedNewProject.StationNumber,
//                                IsApprove = deletedNewProject.IsApprove,
//                                UserApproveId = deletedNewProject.UserApproveId,

//                                // ✅ استعادة الصور مع تحديد NewProjectId
//                                ModelPhotos = deletedNewProject.ModelPhotos?.Select(mp => new ModelPhotoForNew
//                                {
//                                    Url = mp.Url,
//                                    NewProjectId = deletedNewProject.Id
//                                }).ToList() ?? new List<ModelPhotoForNew>(),

//                                SitePhotos = deletedNewProject.SitePhotos?.Select(sp => new SitePhotoForNew
//                                {
//                                    Url = sp.Url,
//                                    NewProjectId = deletedNewProject.Id
//                                }).ToList() ?? new List<SitePhotoForNew>(),

//                                SafetyWastePhotos = deletedNewProject.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForNew
//                                {
//                                    Url = swp.Url,
//                                    NewProjectId = deletedNewProject.Id
//                                }).ToList() ?? new List<SafetyWastePhotoForNew>()
//                            };

//                            await newRepository.AddAsync(restoredNewProject);
//                            await _newProjectDeletedRepository.DeleteAsync(deletedNewProject);
//                            isRestored = true;
//                        }
//                        break;
//                    case "privateproject":
//                        var deletedPrivateProject = await _privateProjectDeletedRepository.GetByIdAsync(id);
//                        if (deletedPrivateProject != null)
//                        {
//                            var restoredPrivateProject = new PrivateProject
//                            {
//                                ProjectName = deletedPrivateProject.ProjectName,
//                                ProjectPlace = deletedPrivateProject.ProjectPlace,
//                                ProjectValue = deletedPrivateProject.ProjectValue,
//                                TimeOfProject = deletedPrivateProject.TimeOfProject,
//                                Customer = deletedPrivateProject.Customer,
//                                Consultant = deletedPrivateProject.Consultant,
//                                Contractor = deletedPrivateProject.Contractor,
//                                AppUserId = deletedPrivateProject.AppUserId,
//                                UserName = deletedPrivateProject.UserName,
//                                UserImage = deletedPrivateProject.UserImage,
//                                BranchName = deletedPrivateProject.BranchName,
//                                OrderDate = deletedPrivateProject.OrderDate,
//                                SafetyViolationsExist = deletedPrivateProject.SafetyViolationsExist,
//                                Note = deletedPrivateProject.Note,
//                                IsArchived = deletedPrivateProject.IsArchived,
//                                CreateAt = deletedPrivateProject.CreateAt,
//                                StationNumber = deletedPrivateProject.StationNumber,
//                                UserApproveId = deletedPrivateProject.UserApproveId,
//                                Coordinates = deletedPrivateProject.Coordinates,
//                                IsApprove = deletedPrivateProject.IsApprove,
//                                WorkDescription = deletedPrivateProject.WorkDescription,

//                                // ✅ استعادة الصور مع تحديد PrivateProjectId
//                                ModelPhotos = deletedPrivateProject.ModelPhotos?.Select(mp => new ModelPhotoForPrivate
//                                {
//                                    Url = mp.Url,
//                                    PrivateProjectId = deletedPrivateProject.Id
//                                }).ToList() ?? new List<ModelPhotoForPrivate>(),

//                                SitePhotos = deletedPrivateProject.SitePhotos?.Select(sp => new SitePhotoForPrivate
//                                {
//                                    Url = sp.Url,
//                                    PrivateProjectId = deletedPrivateProject.Id
//                                }).ToList() ?? new List<SitePhotoForPrivate>(),

//                                SafetyWastePhotos = deletedPrivateProject.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForPrivate
//                                {
//                                    Url = swp.Url,
//                                    PrivateProjectId = deletedPrivateProject.Id
//                                }).ToList() ?? new List<SafetyWastePhotoForPrivate>()
//                            };

//                            await _privateRepository.AddAsync(restoredPrivateProject);
//                            await _privateProjectDeletedRepository.DeleteAsync(deletedPrivateProject);
//                            isRestored = true;
//                        }
//                        break;

//                    case "construction":
//                        #region Restore Construction
//                        var deletedConstruction = await _constructionDeletedRepository.GetByIdAsync(id);
//                        if (deletedConstruction != null)
//                        {
//                            var restoredConstruction = new Construction
//                            {
//                                WorkOrderType = deletedConstruction.WorkOrderType,
//                                DurationOfImplementation = deletedConstruction.DurationOfImplementation,
//                                FaultNumber = deletedConstruction.FaultNumber,
//                                District = deletedConstruction.District,
//                                Contractor = deletedConstruction.Contractor,
//                                Consultant = deletedConstruction.Consultant,
//                                AppUserId = deletedConstruction.AppUserId,
//                                UserName = deletedConstruction.UserName,
//                                UserImage = deletedConstruction.UserImage,
//                                BranchName = deletedConstruction.BranchName,
//                                OrderDate = deletedConstruction.OrderDate,
//                                SafetyViolationsExist = deletedConstruction.SafetyViolationsExist,
//                                Note = deletedConstruction.Note,
//                                IsArchived = deletedConstruction.IsArchived,
//                                CreateAt = deletedConstruction.CreateAt,
//                                EstimatedValue = deletedConstruction.EstimatedValue,
//                                ActualValue = deletedConstruction.ActualValue,
//                                ExtractNumber = deletedConstruction.ExtractNumber,
//                                ProjectPlace = deletedConstruction.ProjectPlace,
//                                Office = deletedConstruction.Office,
//                                ProjectValue = deletedConstruction.ProjectValue,
//                                Situation = deletedConstruction.Situation,
//                                ReceiveDateTime = deletedConstruction.ReceiveDateTime,
//                                DailyExcavationLength = deletedConstruction.DailyExcavationLength,
//                                Coordinates = deletedConstruction.Coordinates,
//                                CompletionStatusReport = deletedConstruction.CompletionStatusReport,
//                                ProjectExcavationLength = deletedConstruction.ProjectExcavationLength,
//                                NumberOfDaysDelayed = deletedConstruction.NumberOfDaysDelayed,
//                                NumberOfDaysRemaining = deletedConstruction.NumberOfDaysRemaining,
//                                ExcavationLength = deletedConstruction.ExcavationLength,
//                                CompletionDate = deletedConstruction.CompletionDate,
//                                ImplementationPhase = deletedConstruction.ImplementationPhase,

//                                Type = deletedConstruction.Type,
//                                IsApprove = deletedConstruction.IsApprove,
//                                NumberOfEquipment = deletedConstruction.NumberOfEquipment,
//                                 DailyCableLength = deletedConstruction.DailyCableLength,
//                                 CableLength = deletedConstruction.CableLength,
//                                 CableCompletion = deletedConstruction.CableCompletion,
//                                 DescriptionViolation = deletedConstruction.DescriptionViolation,
//                                 OrderType = deletedConstruction.OrderType,
//                                 ProjectCableLength = deletedConstruction.ProjectCableLength,
//                                 StationNumber = deletedConstruction.StationNumber,
//                                 TypeOfStomachTest = deletedConstruction.TypeOfStomachTest,
//                                 UserApproveId = deletedConstruction.UserApproveId,
//                                 WorkDescription = deletedConstruction.WorkDescription,

//                                // ✅ استعادة الصور مع تحديد ConstructionId
//                                ModelPhotos = deletedConstruction.ModelPhotos?.Select(mp => new ModelPhotoForConstruction
//                                {
//                                    Url = mp.Url,
//                                    ConstructionId = deletedConstruction.Id
//                                }).ToList() ?? new List<ModelPhotoForConstruction>(),
//                                TestModels = deletedConstruction.TestModels?.Select(mp => new ModelTestForConstruction
//                                {
//                                    Url = mp.Url,
//                                    ConstructionId = deletedConstruction.Id
//                                }).ToList() ?? new List<ModelTestForConstruction>(),

//                                SitePhotos = deletedConstruction.SitePhotos?.Select(sp => new SitePhotoForConstruction
//                                {
//                                    Url = sp.Url,
//                                    ConstructionId = deletedConstruction.Id
//                                }).ToList() ?? new List<SitePhotoForConstruction>(),

//                                SafetyWastePhotos = deletedConstruction.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForConstruction
//                                {
//                                    Url = swp.Url,
//                                    ConstructionId = deletedConstruction.Id
//                                }).ToList() ?? new List<SafetyWastePhotoForConstruction>()
//                            };

//                            await constructionRepository.AddAsync(restoredConstruction);
//                            await _constructionDeletedRepository.DeleteAsync(deletedConstruction);
//                            isRestored = true;
//                        }
//                        #endregion
//                        break;


//                    case "emergency":
//                        #region Restore Emergency
//                        var deletedEmergency = await _emergencyDeletedRepository.GetByIdAsync(id);
//                        if (deletedEmergency != null)
//                        {
//                            var restoredEmergency = new Emergency
//                            {
//                                WorkOrderType = deletedEmergency.WorkOrderType,
//                                WorkDescription = deletedEmergency.WorkDescription,
//                                StationNumber = deletedEmergency.StationNumber,
//                                DurationOfImplementation = deletedEmergency.DurationOfImplementation,
//                                FaultNumber = deletedEmergency.FaultNumber,
//                                District = deletedEmergency.District,
//                                Contractor = deletedEmergency.Contractor,
//                                Consultant = deletedEmergency.Consultant,
//                                AppUserId = deletedEmergency.AppUserId,
//                                UserName = deletedEmergency.UserName,
//                                UserImage = deletedEmergency.UserImage,
//                                BranchName = deletedEmergency.BranchName,
//                                OrderDate = deletedEmergency.OrderDate,
//                                SafetyViolationsExist = deletedEmergency.SafetyViolationsExist,
//                                Note = deletedEmergency.Note,
//                                IsArchived = deletedEmergency.IsArchived,
//                                CreateAt = deletedEmergency.CreateAt,
//                                EstimatedValue = deletedEmergency.EstimatedValue,
//                                ActualValue = deletedEmergency.ActualValue,
//                                ExtractNumber = deletedEmergency.ExtractNumber,
//                                ProjectPlace = deletedEmergency.ProjectPlace,
//                                Office = deletedEmergency.Office,
//                                ProjectValue = deletedEmergency.ProjectValue,
//                                Situation = deletedEmergency.Situation,
//                                ReceiveDateTime = deletedEmergency.ReceiveDateTime,
//                                ImplementationPhase = deletedEmergency.ImplementationPhase,
//                                Coordinates = deletedEmergency.Coordinates,
//                                NotificationNumber = deletedEmergency.NotificationNumber,
//                                TaskNumber = deletedEmergency.TaskNumber,
//                                Type = deletedEmergency.Type,
//                                UserApproveId = deletedEmergency.UserApproveId,
//                                DescriptionViolation = deletedEmergency.DescriptionViolation,
//                                IsApprove = deletedEmergency.IsApprove,
//                                NumberOfEquipment = deletedEmergency.NumberOfEquipment,
//                                TypeOfStomachTest = deletedEmergency.TypeOfStomachTest,


//                                // ✅ استعادة الصور مع تحديد EmergencyId
//                                ModelPhotos = deletedEmergency.ModelPhotos?.Select(mp => new ModelPhotoForEmergency
//                                {
//                                    Url = mp.Url,
//                                    EmergencyId = deletedEmergency.Id
//                                }).ToList() ?? new List<ModelPhotoForEmergency>(),

//                                SitePhotos = deletedEmergency.SitePhotos?.Select(sp => new SitePhotoForEmergency
//                                {
//                                    Url = sp.Url,
//                                    EmergencyId = deletedEmergency.Id
//                                }).ToList() ?? new List<SitePhotoForEmergency>(),

//                                SafetyWastePhotos = deletedEmergency.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForEmergency
//                                {
//                                    Url = swp.Url,
//                                    EmergencyId = deletedEmergency.Id
//                                }).ToList() ?? new List<SafetyWastePhotoForEmergency>()
//                            };

//                            await _emergencyRepository.AddAsync(restoredEmergency);
//                            await _emergencyDeletedRepository.DeleteAsync(deletedEmergency);
//                            isRestored = true;
//                        }
//                        #endregion
//                        break;
//                    case "maintenance":
//                        #region Restore Maintenance
//                        var deletedMaintenance = await _maintenanceDeletedRepository.GetByIdAsync(id);
//                        if (deletedMaintenance != null)
//                        {
//                            var restoredMaintenance = new Maintenance
//                            {
//                                WorkOrderType = deletedMaintenance.WorkOrderType,
//                                WorkDescription = deletedMaintenance.WorkDescription,
//                                DurationOfImplementation = deletedMaintenance.DurationOfImplementation,
//                                FaultNumber = deletedMaintenance.FaultNumber,
//                                District = deletedMaintenance.District,
//                                Contractor = deletedMaintenance.Contractor,
//                                Consultant = deletedMaintenance.Consultant,
//                                AppUserId = deletedMaintenance.AppUserId,
//                                UserName = deletedMaintenance.UserName,
//                                UserImage = deletedMaintenance.UserImage,
//                                BranchName = deletedMaintenance.BranchName,
//                                OrderDate = deletedMaintenance.OrderDate,
//                                SafetyViolationsExist = deletedMaintenance.SafetyViolationsExist,
//                                Note = deletedMaintenance.Note,
//                                IsArchived = deletedMaintenance.IsArchived,
//                                CreateAt = deletedMaintenance.CreateAt,
//                                EstimatedValue = deletedMaintenance.EstimatedValue,
//                                ActualValue = deletedMaintenance.ActualValue,
//                                ExtractNumber = deletedMaintenance.ExtractNumber,
//                                ProjectPlace = deletedMaintenance.ProjectPlace,
//                                Office = deletedMaintenance.Office,
//                                ProjectValue = deletedMaintenance.ProjectValue,
//                                Situation = deletedMaintenance.Situation,
//                                ReceiveDateTime = deletedMaintenance.ReceiveDateTime,
//                               UserApproveId = deletedMaintenance.UserApproveId,
//                               DescriptionViolation = deletedMaintenance.DescriptionViolation,
//                               IsApprove = deletedMaintenance.IsApprove,
//                               NumberOfEquipment = deletedMaintenance.NumberOfEquipment,
//                               StationNumber = deletedMaintenance.StationNumber,
//                                Coordinates = deletedMaintenance.Coordinates,
//                                ImplementationPhase = deletedMaintenance.ImplementationPhase,
//                                NotificationNumber = deletedMaintenance.NotificationNumber,
//                                TaskNumber = deletedMaintenance.TaskNumber,
//                                TypeOfStomachTest = deletedMaintenance.TypeOfStomachTest,
//                                Type = deletedMaintenance.Type,

//                                // ✅ استعادة الصور مع تحديد MaintenanceId
//                                ModelPhotos = deletedMaintenance.ModelPhotos?.Select(mp => new ModelPhotoForMaintenance
//                                {
//                                    Url = mp.Url,
//                                    MaintenanceId = deletedMaintenance.Id
//                                }).ToList() ?? new List<ModelPhotoForMaintenance>(),
//                                TestModels = deletedMaintenance.TestModels?.Select(mp => new ModelTestForMaintenance
//                                {
//                                    Url = mp.Url,
//                                    MaintenanceId = deletedMaintenance.Id
//                                }).ToList() ?? new List<ModelTestForMaintenance>(),

//                                SitePhotos = deletedMaintenance.SitePhotos?.Select(sp => new SitePhotoForMaintenance
//                                {
//                                    Url = sp.Url,
//                                    MaintenanceId = deletedMaintenance.Id
//                                }).ToList() ?? new List<SitePhotoForMaintenance>(),

//                                SafetyWastePhotos = deletedMaintenance.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForMaintenance
//                                {
//                                    Url = swp.Url,
//                                    MaintenanceId = deletedMaintenance.Id
//                                }).ToList() ?? new List<SafetyWastePhotoForMaintenance>()
//                            };

//                            await _maintenanceRepository.AddAsync(restoredMaintenance);
//                            await _maintenanceDeletedRepository.DeleteAsync(deletedMaintenance);
//                            isRestored = true;
//                        }
//                        #endregion
//                        break;



//                    default:
//                        return BadRequest(new { message = "نوع المشروع غير صالح" });
//                }

//                if (isRestored)
//                {
//                    return Ok(new { message = "تم استعادة المشروع بنجاح" });
//                }

//                return NotFound(new { message = "المشروع غير موجود في سلة المهملات" });
//            }
//            catch (Exception ex)
//            {
//                return BadRequest(new { message = "حدث خطأ أثناء استعادة المشروع", error = ex.Message });
//            }
//        }

//        [HttpGet("{projectId}/changes")]
//        public async Task<IActionResult> GetProjectChangesAsync(int projectId, [FromQuery] string projectType)
//        {
//            try
//            {
//                // قم بتحديد المتغيرات بناءً على نوع المشروع
//                object changes = null;

//                switch (projectType.ToLower())
//                {
//                    case "new":
//                        // جلب التغييرات الخاصة بالمشاريع الجديدة
//                        changes = await _newProjectService.GetProjectChangesAsync(projectId);
//                        break;
//                    case "private":
//                        // جلب التغييرات الخاصة بالمشاريع الخاصة
//                        changes = await _privateProject.GetProjectChangesAsync(projectId);
//                        break;

//                    default:
//                        return BadRequest("Invalid project type.");
//                }

//                return Ok(changes);
//            }
//            catch (KeyNotFoundException ex)
//            {
//                return NotFound(ex.Message);
//            }
//            catch (Exception ex)
//            {
//                return BadRequest(ex.Message);
//            }
//        }


//        [HttpPost("approve-delete")]
//        public async Task<IActionResult> ApproveOrRejectDeleteRequest([FromBody] DeleteRequestDTO dto)
//        {
//            var request = await _context.DeleteRequests.FirstOrDefaultAsync(d => d.Id == dto.RequestId);
//            if (request == null)
//            {
//                return NotFound(new { message = "لم يتم العثور على طلب الحذف." });
//            }

//            if (dto.IsApproved)
//            {
//                request.IsApproved = true;
//                _context.DeleteRequests.Remove(request);

//                // تنفيذ الحذف عند الموافقة
//                await DeleteByOrderIdWithType(request.OrderId, request.Type);
//                await _context.SaveChangesAsync();



//                return Ok(new { message = "تمت الموافقة على الحذف وتنفيذه بنجاح." });
//            }
//            else
//            {
//                // رفض الطلب
//                _context.DeleteRequests.Remove(request);
//                await _context.SaveChangesAsync();

//                return Ok(new { message = "تم رفض طلب الحذف وحذفه من القائمة." });
//            }
//        }

//        // تعريف الـ DTO
//        public class DeleteRequestDTO
//        {
//            public int RequestId { get; set; }
//            public bool IsApproved { get; set; }
//        }


//        [HttpGet("delete-requests")]
//        public async Task<IActionResult> GetDeleteRequests()
//        {
//            var requests = await _context.DeleteRequests.ToListAsync();
//            return Ok(new{message = "data" , statusCode = 200, data = requests});
//        }


//    }
//}
using Microsoft.AspNetCore.Mvc;
using ASF.Core.Entities.NewProject;
using ASF.Core.Repository;
using ASF.Core.HandleSpecification;
using AutoMapper;
using ASF.Core.Dtos.NewProjectResponse;
using ASF.Core.Entities.PrivateProject;
using ASF.Core.Dtos.PrivateResponse;
using ASF.Core.Entities;
using ASF.Service;
using ASF.Core.Services;
using ASF.Core.Dtos;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Emergency;
using ASF.Core.Dtos.EmergencyResponse;
using ASF.Core.Entities.Maintenance;
using System.Security.Claims;
using ASF.Repository.AppDbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using ASF.Core.Entities.Identity;


namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly IGenericRepository<NewProject> newRepository;
        private readonly IGenericRepository<Construction> constructionRepository;
        private readonly IGenericRepository<PrivateProject> _privateRepository;
        private readonly IGenericRepository<Emergency> _emergencyRepository;
        private readonly IGenericRepository<Maintenance> _maintenanceRepository;
        private readonly UserManager<AppUser> _userManager;
        private readonly INotificationRepository _notificationRepository;

        private readonly IMapper _mapper;

        private readonly INewProjectDeletedRepository _newProjectDeletedRepository;
        private readonly IPrivateProjectDeletedRepository _privateProjectDeletedRepository;
        private readonly IConstructionDeletedRepository _constructionDeletedRepository;
        private readonly IEmergencyDeletedRepository _emergencyDeletedRepository;
        private readonly IMaintenanceDeletedRepository _maintenanceDeletedRepository;



        private readonly INewProjectService _newProjectService;
        private readonly IPrivateProject _privateProject;
        private readonly IConstructionService _constructionService;
        private readonly IEmergencyService _emergencyService;
        private readonly IMaintenanceService _maintenanceService;

        private readonly ApplicationDbContext _context;




        public SearchController(
            IGenericRepository<NewProject> newRepository,
            IGenericRepository<PrivateProject> privateRepository,
            IGenericRepository<Construction> constructionRepository,
            IGenericRepository<Emergency> emergencyRepository,
            IGenericRepository<Maintenance> maintenanceRepository,
            IMapper mapper,
            INewProjectDeletedRepository newProjectDeletedRepository,
            IPrivateProjectDeletedRepository privateProjectDeletedRepository,
            IConstructionDeletedRepository constructionDeletedRepository,
            IEmergencyDeletedRepository emergencyDeletedRepository,
            IMaintenanceDeletedRepository maintenanceDeletedRepository,
            INewProjectService newProjectService,
            IPrivateProject privateProject,
            IConstructionService constructionService,
            IEmergencyService emergencyService,
            IMaintenanceService maintenanceService,
            ApplicationDbContext context,
            UserManager<AppUser> userManager,
            INotificationRepository notificationRepository




            )
        {
            this.newRepository = newRepository;
            this.constructionRepository = constructionRepository;
            _privateRepository = privateRepository;
            _emergencyRepository = emergencyRepository;
            _maintenanceRepository = maintenanceRepository;
            _mapper = mapper;
            _newProjectDeletedRepository = newProjectDeletedRepository;
            _privateProjectDeletedRepository = privateProjectDeletedRepository;
            _constructionDeletedRepository = constructionDeletedRepository;
            _emergencyDeletedRepository = emergencyDeletedRepository;
            _maintenanceDeletedRepository = maintenanceDeletedRepository;
            _newProjectService = newProjectService;
            _privateProject = privateProject;
            _constructionService = constructionService;
            _emergencyService = emergencyService;
            _maintenanceService = maintenanceService;
            _context = context;
            _userManager = userManager;
            _notificationRepository = notificationRepository;
        }
        [HttpGet("bot")]
        public async Task<IActionResult> Bot([FromQuery] string orderId, [FromQuery] string type)
        {
            object? result = null;

            switch (type)
            {

                case "rehabilitationWorks":
                    #region NewProject
                    var specNew = new NewProjectSpecification();
                    var newProject = await _context.NewProjects.AsNoTracking().Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos).FirstOrDefaultAsync(p => p.FaultNumber == orderId);
                    result = newProject;
                    #endregion
                    break;

                case "construction":
                    #region Construction
                    var specConstruction = new ConstructionSpecification();
                    var constructionProject = await _context.Constructions.AsNoTracking().Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).FirstOrDefaultAsync(p => p.FaultNumber == orderId);
                    result = constructionProject;
                    #endregion
                    break;

                case "emergency":
                    #region Construction
                    var specEmergency = new EmergencySpecification();
                    var emergencyProject = await _context.Emergencys.AsNoTracking().Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).FirstOrDefaultAsync(p => p.FaultNumber == orderId);
                    result = emergencyProject;
                    #endregion
                    break;

                case "maintenance":
                    #region Construction
                    var specMaintenance = new MaintenanceSpecification();
                    var maintenanceProject = await _context.Maintenances.AsNoTracking().Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos).Include(d => d.TestModels).FirstOrDefaultAsync(p => p.FaultNumber == orderId);
                    result = maintenanceProject;
                    #endregion
                    break;

                case "privateproject":
                    #region PrivateProject
                    var specPrivate = new PrivateProjectSpecification();
                    var privateProject = await _context.PrivateProjects.AsNoTracking().Include(d => d.ModelPhotos).Include(d => d.SafetyWastePhotos).Include(d => d.SitePhotos).FirstOrDefaultAsync(p => p.OrderCode == orderId);
                    result = privateProject;
                    #endregion
                    break;

                default:
                    return BadRequest(new { message = "Invalid type provided. Use 'order', 'newproject', or 'operation'." });
            }

            if (result == null)
            {
                return NotFound(new { message = "No matching record found for the provided orderId and type." });
            }

            return Ok(new { massege = "data", statusCode = 200, data = result });
        }

        [HttpGet("search-by-orderidWithType")]
        public async Task<IActionResult> SearchByOrderIdWithType([FromQuery] int orderId, [FromQuery] string type)
        {
            object? result = null;

            switch (type)
            {

                case "rehabilitationWorks":
                    #region NewProject
                    var newProject = await _context.NewProjects
                        .AsNoTracking()
                        .Include(p => p.ModelPhotos)
                        .Include(p => p.SafetyWastePhotos)
                        .Include(p => p.SitePhotos)
                        .FirstOrDefaultAsync(p => p.Id == orderId);
                    result = newProject != null ? _mapper.Map<NewProjectResponse>(newProject) : null; // Map only if not null
                    #endregion
                    break;

                case "construction":
                    #region Construction
                    var constructionProject = await _context.Constructions
                        .AsNoTracking()
                        .Include(p => p.ModelPhotos)
                        .Include(p => p.SafetyWastePhotos)
                        .Include(p => p.SitePhotos)
                        .Include(p => p.TestModels)
                        .FirstOrDefaultAsync(p => p.Id == orderId);
                    // كان يُسند إلى NewProjectResponse ولا وجود لتحويل Construction إليه،
                    // فكانت صفحة أمر عمل الإنشاءات تسقط بـ AutoMapperMappingException.
                    result = constructionProject != null ? _mapper.Map<ASF.Core.Dtos.ConstructionResponse.ConstructionResponse>(constructionProject) : null;
                    #endregion
                    break;

                case "emergency":
                    #region Construction
                    var emergencyProject = await _context.Emergencys
                        .AsNoTracking()
                        .Include(p => p.ModelPhotos)
                        .Include(p => p.SafetyWastePhotos)
                        .Include(p => p.SitePhotos)
                        .Include(p => p.TestModels)
                        .FirstOrDefaultAsync(p => p.Id == orderId);
                    result = emergencyProject != null ? _mapper.Map<EmergencyResponse>(emergencyProject) : null; // Map only if not null
                    #endregion
                    break;

                case "maintenance":
                    #region Construction
                    var maintenanceProject = await _context.Maintenances
                        .AsNoTracking()
                        .Include(p => p.ModelPhotos)
                        .Include(p => p.SafetyWastePhotos)
                        .Include(p => p.SitePhotos)
                        .Include(p => p.TestModels)
                        .FirstOrDefaultAsync(p => p.Id == orderId);
                    result = maintenanceProject != null ? _mapper.Map<EmergencyResponse>(maintenanceProject) : null; // Map only if not null
                    #endregion
                    break;

                case "privateproject":
                    #region PrivateProject
                    var privateProject = await _context.PrivateProjects
                        .AsNoTracking()
                        .Include(p => p.ModelPhotos)
                        .Include(p => p.SafetyWastePhotos)
                        .Include(p => p.SitePhotos)
                        .FirstOrDefaultAsync(p => p.Id == orderId);
                    result = privateProject != null ? _mapper.Map<PrivateResponse>(privateProject) : null;
                    #endregion
                    break;

                default:
                    return BadRequest(new { message = "Invalid type provided. Use 'order', 'newproject', or 'operation'." });
            }

            if (result == null)
            {
                return NotFound(new { message = "No matching record found for the provided orderId and type." });
            }

            return Ok(result);
        }

        [HttpDelete("delete-by-orderidWithType")]
        public async Task<IActionResult> DeleteByOrderIdWithType([FromQuery] int orderId, [FromQuery] string type)
        {
            if (User == null)
            {
                return Unauthorized(new { message = "المستخدم غير مسجل الدخول." });
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.Users.FirstOrDefaultAsync(d => d.Id == userId);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userRole))
            {
                return Unauthorized(new { message = "فشل استرداد معلومات المستخدم." });
            }
            var existingDeleteRequest = await _context.DeleteRequests
            .FirstOrDefaultAsync(dr => dr.OrderId == orderId && dr.Type.ToLower() == type.ToLower() && dr.RequestedBy == userId);
            if (existingDeleteRequest != null)
            {
                return BadRequest(new { message = "لقد قمت بطلب حذف هذا المشروع مسبقًا." });
            }
            if (userRole == "eng")
            {
                var deleteRequest = new DeleteRequest
                {
                    OrderId = orderId,
                    Type = type,
                    RequestedBy = userId,
                    IsApproved = false // الأدمن سيوافق عليه لاحقًا
                };
                var admins = await _userManager.Users
                 .Where(u => u.UserType == "admin")
                 .ToListAsync();

                foreach (var admin in admins)
                {
                    var notification = new Notification
                    {
                        Message = $"تم 'طلب حذف' مشروع : {orderId}",
                        UserName = user.UserName,
                        UserImage = user.UserImage!,
                        CreatedAt = DateTime.Now,
                        NotificationType = "إنشاء مشروع جديد",
                        Target = admin.Id
                    };

                    await _notificationRepository.AddAsync(notification);
                }
                await _context.DeleteRequests.AddAsync(deleteRequest);
                await _context.SaveChangesAsync();
                return Ok(new { message = "تم إرسال طلب الحذف إلى الأدمن للموافقة." });
            }

            switch (type.ToLower())
            {


                case "rehabilitationworks":
                    #region NewProject
                    var newProject = await _context.NewProjects
                        .Include(p => p.ModelPhotos)
                        .Include(p => p.SafetyWastePhotos)
                        .Include(p => p.SitePhotos)
                        .FirstOrDefaultAsync(p => p.Id == orderId);
                    if (newProject != null)
                    {
                        // إضافة المشروع إلى جدول NewProjectDeleted
                        var newProjectDeleted = new NewProjectDeleted
                        {
                            WorkOrderType = newProject.WorkOrderType,
                            //StationNumber = newProject.StationNumber ?? null,
                            DurationOfImplementation = newProject.DurationOfImplementation,
                            FaultNumber = newProject.FaultNumber,
                            District = newProject.District,
                            Contractor = newProject.Contractor,
                            Consultant = newProject.Consultant,
                            StationNumber = newProject.StationNumber,
                            Type = type,
                            WorkDescription = newProject.WorkDescription,
                            AppUserId = newProject.AppUserId,
                            UserName = newProject.UserName,
                            UserImage = newProject.UserImage,
                            BranchName = newProject.BranchName,
                            OrderDate = newProject.OrderDate ?? null,
                            SafetyViolationsExist = newProject.SafetyViolationsExist,
                            Note = newProject.Note,
                            IsArchived = newProject.IsArchived,
                            CreateAt = newProject.CreateAt,
                            EstimatedValue = newProject.EstimatedValue,
                            ActualValue = newProject.ActualValue ?? null,
                            ExtractNumber = newProject.ExtractNumber ?? null,
                            ProjectPlace = newProject.ProjectPlace,
                            Office = newProject.Office,
                            ProjectValue = newProject.ProjectValue,
                            Situation = newProject.Situation,
                            ReceiveDateTime = newProject.ReceiveDateTime,
                            QualificationClassification = newProject.QualificationClassification,
                            Coordinates = newProject.Coordinates,
                            UserApproveId = newProject.UserApproveId,
                            IsApprove = newProject.IsApprove,
                            // نسخ الصور المرتبطة بالمشروع
                            ModelPhotos = newProject.ModelPhotos.Select(mp => new ModelPhotoForDeletedNew
                            {
                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
                                NewProjectId = newProject.Id
                            }).ToList(),

                            SitePhotos = newProject.SitePhotos?.Select(sp => new SitePhotoForDeletedNew
                            {
                                Url = sp.Url,  // استخدم الاسم الصحيح للخاصية
                                NewProjectId = newProject.Id
                            }).ToList(),

                            SafetyWastePhotos = newProject.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForDeletedNew
                            {
                                Url = swp.Url,  // استخدم الاسم الصحيح للخاصية
                                NewProjectId = newProject.Id
                            }).ToList()
                        };

                        // إضافة البيانات المحذوفة
                        await _newProjectDeletedRepository.AddAsync(newProjectDeleted);

                        // حذف المشروع من جدول NewProject
                        await newRepository.DeleteAsync(newProject);
                    }
                    #endregion
                    break;
                case "construction":
                    #region Construction
                    var construction = await _context.Constructions
                        .Include(p => p.ModelPhotos)
                        .Include(p => p.SafetyWastePhotos)
                        .Include(p => p.SitePhotos)
                        .Include(p => p.TestModels)
                        .FirstOrDefaultAsync(p => p.Id == orderId);
                    if (construction != null)
                    {
                        // إضافة المشروع إلى جدول NewProjectDeleted
                        var constructionDeleted = new ConstructionDeleted
                        {
                            WorkOrderType = construction.WorkOrderType,
                            DurationOfImplementation = construction.DurationOfImplementation,
                            FaultNumber = construction.FaultNumber,
                            District = construction.District,
                            Contractor = construction.Contractor,
                            Consultant = construction.Consultant,
                            AppUserId = construction.AppUserId,
                            UserName = construction.UserName,
                            UserImage = construction.UserImage,
                            StationNumber = construction.StationNumber,
                            BranchName = construction.BranchName,
                            OrderDate = construction.OrderDate ?? null,
                            SafetyViolationsExist = construction.SafetyViolationsExist,
                            Note = construction.Note,
                            IsArchived = construction.IsArchived,
                            CreateAt = construction.CreateAt,
                            EstimatedValue = construction.EstimatedValue,
                            ActualValue = construction.ActualValue ?? null,
                            ExtractNumber = construction.ExtractNumber ?? null,
                            ProjectPlace = construction.ProjectPlace,
                            Office = construction.Office,
                            ProjectValue = construction.ProjectValue,
                            Situation = construction.Situation,
                            ReceiveDateTime = construction.ReceiveDateTime,
                            DailyExcavationLength = construction.DailyExcavationLength,
                            NumberOfDaysDelayed = construction.NumberOfDaysDelayed,
                            NumberOfDaysRemaining = construction.NumberOfDaysRemaining,
                            ExcavationLength = construction.ExcavationLength,
                            CompletionDate = construction.CompletionDate,
                            Coordinates = construction.Coordinates,
                            ProjectExcavationLength = construction.ProjectExcavationLength,
                            ImplementationPhase = construction.ImplementationPhase,

                            Type = construction.Type,
                            WorkDescription = construction.WorkDescription,
                            DescriptionViolation = construction.DescriptionViolation,
                            CompletionStatusReport = construction.CompletionStatusReport ?? "Not Specified",
                            TypeOfStomachTest = construction.TypeOfStomachTest,
                            NumberOfEquipment = construction.NumberOfEquipment,
                            CableLength = construction.CableLength,
                            DailyCableLength = construction.DailyCableLength,
                            CableCompletion = construction.CableCompletion,
                            ProjectCableLength = construction.ProjectCableLength,
                            OrderType = construction.OrderType,
                            IsApprove = construction.IsApprove,
                            UserApproveId = construction.UserApproveId,


                            // نسخ الصور المرتبطة بالمشروع
                            ModelPhotos = construction.ModelPhotos.Select(mp => new ModelPhotoForDeletedConstruction
                            {
                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
                                ConstructionId = construction.Id
                            }).ToList(),
                            TestModels = construction.TestModels.Select(mp => new ModelTestForDeletedConstruction
                            {
                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
                                ConstructionId = construction.Id
                            }).ToList(),

                            SitePhotos = construction.SitePhotos?.Select(sp => new SitePhotoForDeletedConstruction
                            {
                                Url = sp.Url,  // استخدم الاسم الصحيح للخاصية
                                ConstructionId = construction.Id
                            }).ToList(),

                            SafetyWastePhotos = construction.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForDeletedConstruction
                            {
                                Url = swp.Url,  // استخدم الاسم الصحيح للخاصية
                                ConstructionId = construction.Id
                            }).ToList()


                        };

                        // إضافة البيانات المحذوفة
                        await _constructionDeletedRepository.AddAsync(constructionDeleted);

                        // حذف المشروع من جدول NewProject
                        await constructionRepository.DeleteAsync(construction);
                    }
                    #endregion
                    break;
                case "emergency":
                    #region Emergency
                    var emergency = await _context.Emergencys
                        .Include(p => p.ModelPhotos)
                        .Include(p => p.SafetyWastePhotos)
                        .Include(p => p.SitePhotos)
                        .Include(p => p.TestModels)
                        .FirstOrDefaultAsync(p => p.Id == orderId);
                    if (emergency != null)
                    {
                        // إضافة المشروع إلى جدول NewProjectDeleted
                        var emergencyDeleted = new EmergencyDeleted
                        {
                            WorkOrderType = emergency.WorkOrderType,
                            WorkDescription = emergency.WorkDescription,
                            StationNumber = emergency.StationNumber ?? null,
                            DurationOfImplementation = emergency.DurationOfImplementation,
                            FaultNumber = emergency.FaultNumber,
                            District = emergency.District,
                            Contractor = emergency.Contractor,
                            Consultant = emergency.Consultant,
                            AppUserId = emergency.AppUserId,
                            UserName = emergency.UserName,
                            UserImage = emergency.UserImage,
                            BranchName = emergency.BranchName,
                            OrderDate = emergency.OrderDate ?? null,
                            SafetyViolationsExist = emergency.SafetyViolationsExist,
                            Note = emergency.Note,
                            IsArchived = emergency.IsArchived,
                            CreateAt = emergency.CreateAt,
                            EstimatedValue = emergency.EstimatedValue,
                            ActualValue = emergency.ActualValue ?? null,
                            ExtractNumber = emergency.ExtractNumber ?? null,
                            ProjectPlace = emergency.ProjectPlace,
                            Office = emergency.Office,
                            ProjectValue = emergency.ProjectValue,
                            Situation = emergency.Situation,
                            ReceiveDateTime = emergency.ReceiveDateTime,
                            ImplementationPhase = emergency.ImplementationPhase,
                            Coordinates = emergency.Coordinates,
                            NotificationNumber = emergency.NotificationNumber,
                            TaskNumber = emergency.TaskNumber,
                            TypeOfStomachTest = emergency.TypeOfStomachTest,
                            Type = emergency.Type,
                            IsApprove = emergency.IsApprove,
                            UserApproveId = emergency.UserApproveId,
                            DescriptionViolation = emergency.DescriptionViolation,
                            NumberOfEquipment = emergency.NumberOfEquipment,

                            // نسخ الصور المرتبطة بالمشروع
                            ModelPhotos = emergency.ModelPhotos.Select(mp => new ModelPhotoForDeletedEmergency
                            {
                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
                                EmergencyId = emergency.Id
                            }).ToList(),
                            TestModels = emergency.TestModels.Select(mp => new ModelTestForDeletedEmergency
                            {
                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
                                EmergencyId = emergency.Id
                            }).ToList(),

                            SitePhotos = emergency.SitePhotos?.Select(sp => new SitePhotoForDeletedEmergency
                            {
                                Url = sp.Url,  // استخدم الاسم الصحيح للخاصية
                                EmergencyId = emergency.Id
                            }).ToList(),

                            SafetyWastePhotos = emergency.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForDeletedEmergency
                            {
                                Url = swp.Url,  // استخدم الاسم الصحيح للخاصية
                                EmergencyId = emergency.Id
                            }).ToList()


                        };

                        // إضافة البيانات المحذوفة
                        await _emergencyDeletedRepository.AddAsync(emergencyDeleted);

                        // حذف المشروع من جدول NewProject
                        await _emergencyRepository.DeleteAsync(emergency);
                    }
                    #endregion
                    break;
                case "maintenance":
                    #region Emergency
                    var maintenance = await _context.Maintenances
                        .Include(p => p.ModelPhotos)
                        .Include(p => p.SafetyWastePhotos)
                        .Include(p => p.SitePhotos)
                        .Include(p => p.TestModels)
                        .FirstOrDefaultAsync(p => p.Id == orderId);
                    if (maintenance != null)
                    {
                        // إضافة المشروع إلى جدول NewProjectDeleted
                        var maintenanceDeleted = new MaintenanceDeleted
                        {
                            WorkOrderType = maintenance.WorkOrderType,
                            WorkDescription = maintenance.WorkDescription,
                            DurationOfImplementation = maintenance.DurationOfImplementation,
                            FaultNumber = maintenance.FaultNumber,
                            District = maintenance.District,
                            Contractor = maintenance.Contractor,
                            Consultant = maintenance.Consultant,
                            AppUserId = maintenance.AppUserId,
                            UserName = maintenance.UserName,
                            UserImage = maintenance.UserImage,
                            BranchName = maintenance.BranchName,
                            StationNumber = maintenance.StationNumber,
                            OrderDate = maintenance.OrderDate ?? null,
                            SafetyViolationsExist = maintenance.SafetyViolationsExist,
                            Note = maintenance.Note,
                            IsArchived = maintenance.IsArchived,
                            CreateAt = maintenance.CreateAt,
                            EstimatedValue = maintenance.EstimatedValue,
                            ActualValue = maintenance.ActualValue ?? null,
                            ExtractNumber = maintenance.ExtractNumber ?? null,
                            ProjectPlace = maintenance.ProjectPlace,
                            Office = maintenance.Office,
                            ProjectValue = maintenance.ProjectValue,
                            Situation = maintenance.Situation,
                            ReceiveDateTime = maintenance.ReceiveDateTime,
                            TypeOfStomachTest = maintenance.TypeOfStomachTest,
                            TaskNumber = maintenance.TaskNumber,
                            NotificationNumber = maintenance.NotificationNumber,
                            ImplementationPhase = maintenance.ImplementationPhase,
                            Coordinates = maintenance.Coordinates,
                            IsApprove = maintenance.IsApprove,
                            UserApproveId = maintenance.UserApproveId,
                            DescriptionViolation = maintenance.DescriptionViolation,
                            NumberOfEquipment = maintenance.NumberOfEquipment,

                            // نسخ الصور المرتبطة بالمشروع
                            ModelPhotos = maintenance.ModelPhotos.Select(mp => new ModelPhotoForMaintenanceDeleted
                            {
                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
                                MaintenanceId = maintenance.Id
                            }).ToList(),
                            TestModels = maintenance.TestModels.Select(mp => new ModelTestForMaintenanceDeleted
                            {
                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
                                MaintenanceId = maintenance.Id
                            }).ToList(),

                            SitePhotos = maintenance.SitePhotos?.Select(sp => new SitePhotoForMaintenanceDeleted
                            {
                                Url = sp.Url,  // استخدم الاسم الصحيح للخاصية
                                MaintenanceId = maintenance.Id
                            }).ToList(),

                            SafetyWastePhotos = maintenance.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForMaintenanceDeleted
                            {
                                Url = swp.Url,  // استخدم الاسم الصحيح للخاصية
                                MaintenanceId = maintenance.Id
                            }).ToList()

                        };

                        // إضافة البيانات المحذوفة
                        await _maintenanceDeletedRepository.AddAsync(maintenanceDeleted);

                        // حذف المشروع من جدول NewProject
                        await _maintenanceRepository.DeleteAsync(maintenance);
                    }
                    #endregion
                    break;
                case "privateproject":
                    #region privateProject
                    var priProject = await _context.PrivateProjects
                        .Include(p => p.ModelPhotos)
                        .Include(p => p.SafetyWastePhotos)
                        .Include(p => p.SitePhotos)
                        .FirstOrDefaultAsync(p => p.Id == orderId);

                    if (priProject != null)
                    {
                        // حفظ الصور في متغيرات قبل حذف المشروع
                        var modelPhotos = priProject.ModelPhotos?.ToList() ?? new List<ModelPhotoForPrivate>();
                        var sitePhotos = priProject.SitePhotos?.ToList() ?? new List<SitePhotoForPrivate>();
                        var safetyWastePhotos = priProject.SafetyWastePhotos?.ToList() ?? new List<SafetyWastePhotoForPrivate>();

                        // إنشاء كائن من PrivateProjectDeleted
                        var privateProjectDeleted = new PrivateProjectDeleted
                        {
                            ProjectName = priProject.ProjectName,
                            ProjectPlace = priProject.ProjectPlace,
                            ProjectValue = priProject.ProjectValue,
                            TimeOfProject = priProject.TimeOfProject,
                            Customer = priProject.Customer,
                            Consultant = priProject.Consultant,
                            Contractor = priProject.Contractor,
                            AppUserId = priProject.AppUserId,
                            UserName = priProject.UserName,
                            UserImage = priProject.UserImage,
                            BranchName = priProject.BranchName,
                            OrderDate = priProject.OrderDate ?? null,
                            SafetyViolationsExist = priProject.SafetyViolationsExist,
                            Note = priProject.Note,
                            IsArchived = priProject.IsArchived,
                            CreateAt = priProject.CreateAt,
                            StationNumber = priProject.StationNumber ?? null,
                            WorkDescription = priProject.WorkDescription,
                            DeletedAt = DateTime.Now, // وقت الحذف
                            IsApprove = priProject.IsApprove,
                            UserApproveId = priProject.UserApproveId,
                            Coordinates = priProject.Coordinates,
                            // نقل الصور
                            // نسخ الصور المرتبطة بالمشروع
                            ModelPhotos = priProject.ModelPhotos.Select(mp => new ModelPhotoForPrivateDeleted
                            {
                                Url = mp.Url,  // تأكد من أن `PhotoUrl` هو الاسم الصحيح في `ModelPhotoForConstruction`
                                PrivateProjectId = priProject.Id
                            }).ToList(),

                            SitePhotos = priProject.SitePhotos?.Select(sp => new SitePhotoForPrivateDeleted
                            {
                                Url = sp.Url,  // استخدم الاسم الصحيح للخاصية
                                PrivateProjectId = priProject.Id
                            }).ToList(),

                            SafetyWastePhotos = priProject.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForPrivateDeleted
                            {
                                Url = swp.Url,  // استخدم الاسم الصحيح للخاصية
                                PrivateProjectId = priProject.Id
                            }).ToList()
                        };

                        // إضافة المشروع المحذوف إلى الجدول الخاص بالـ PrivateProjectDeleted
                        await _privateProjectDeletedRepository.AddAsync(privateProjectDeleted);

                        // حذف المشروع من جدول PrivateProject بعد نقل الصور
                        await _privateRepository.DeleteAsync(priProject);

                        // إرسال الرد مع بيانات المشروع المحذوف
                        return Ok(new
                        {
                            statusCode = 200,
                            message = "تم حذف المشروع بنجاح",
                            data = privateProjectDeleted
                        });
                    }
                    #endregion
                    break;



                default:
                    return BadRequest(new { message = "Invalid type provided. Use 'order', 'rehabilitationWorks','maintenance', or 'construction'. or 'emergency" });
            }

            return Ok(new { message = "تم حذف الطلب بنجاح", orderId });
        }
        [HttpGet("get-deleted-projects")]
        public async Task<IActionResult> GetDeletedProjects()
        {
            try
            {
                // جلب البيانات من جميع الـ repositories
                var newProjects = await _newProjectDeletedRepository.GetAllAsync() ?? new List<NewProjectDeleted>();
                var constructions = await _constructionDeletedRepository.GetAllAsync() ?? new List<ConstructionDeleted>();
                var emergencys = await _emergencyDeletedRepository.GetAllAsync() ?? new List<EmergencyDeleted>();
                var maintenances = await _maintenanceDeletedRepository.GetAllAsync() ?? new List<MaintenanceDeleted>();
                var privateProjects = await _privateProjectDeletedRepository.GetAllAsync() ?? new List<PrivateProjectDeleted>();

                // دمج البيانات في كائن واحد
                var response = new DeletedProjectsResponse
                {
                    RehabilitationWorks = newProjects,
                    Constructions = constructions,
                    Emergencies = emergencys,
                    Maintenances = maintenances,
                    PrivateProjects = privateProjects,
                };

                // إرجاع الرد
                return Ok(response);
            }
            catch (Exception ex)
            {
                // تسجيل الخطأ
                return BadRequest(new { message = "حدث خطأ غير متوقع", error = ex.Message });
            }
        }
        [HttpDelete("delete-project-from-trash/{id}")]
        public async Task<IActionResult> DeleteProjectFromTrash(int id, string type)
        {
            try
            {
                bool isDeleted = false;

                switch (type.ToLower())
                {
                    case "rehabilitationworks":
                        var newProject = await _newProjectDeletedRepository.GetByIdAsync(id);
                        if (newProject != null)
                        {
                            await _newProjectDeletedRepository.DeleteAsync(newProject);
                            isDeleted = true;
                        }
                        break;

                    case "privateproject":
                        var privateProject = await _privateProjectDeletedRepository.GetByIdAsync(id);
                        if (privateProject != null)
                        {
                            await _privateProjectDeletedRepository.DeleteAsync(privateProject);
                            isDeleted = true;
                        }
                        break;

                    case "construction":
                        var construction = await _constructionDeletedRepository.GetByIdAsync(id);
                        if (construction != null)
                        {
                            await _constructionDeletedRepository.DeleteAsync(construction);
                            isDeleted = true;
                        }
                        break;

                    case "emergency":
                        var emergency = await _emergencyDeletedRepository.GetByIdAsync(id);
                        if (emergency != null)
                        {
                            await _emergencyDeletedRepository.DeleteAsync(emergency);
                            isDeleted = true;
                        }
                        break;

                    case "maintenance":
                        var maintenance = await _maintenanceDeletedRepository.GetByIdAsync(id);
                        if (maintenance != null)
                        {
                            await _maintenanceDeletedRepository.DeleteAsync(maintenance);
                            isDeleted = true;
                        }
                        break;

                    default:
                        return BadRequest(new { message = "نوع المشروع غير صالح" });
                }

                if (isDeleted)
                {
                    return Ok(new { message = "تم حذف المشروع بنجاح من سلة المهملات" });
                }

                return NotFound(new { message = "المشروع غير موجود" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "حدث خطأ أثناء حذف المشروع", error = ex.Message });
            }
        }

        [HttpPost("restore-project-from-trash/{id}")]
        public async Task<IActionResult> RestoreProjectFromTrash(int id, string type)
        {
            try
            {
                bool isRestored = false;

                switch (type.ToLower())
                {
                    case "rehabilitationworks":
                        var deletedNewProject = await _newProjectDeletedRepository.GetByIdAsync(id);
                        if (deletedNewProject != null)
                        {
                            var restoredNewProject = new NewProject
                            {
                                WorkOrderType = deletedNewProject.WorkOrderType,
                                //StationNumber = deletedNewProject.StationNumber,
                                DurationOfImplementation = deletedNewProject.DurationOfImplementation,
                                FaultNumber = deletedNewProject.FaultNumber,
                                District = deletedNewProject.District,
                                Contractor = deletedNewProject.Contractor,
                                Consultant = deletedNewProject.Consultant,
                                AppUserId = deletedNewProject.AppUserId,
                                UserName = deletedNewProject.UserName,
                                UserImage = deletedNewProject.UserImage,
                                BranchName = deletedNewProject.BranchName,
                                OrderDate = deletedNewProject.OrderDate,
                                SafetyViolationsExist = deletedNewProject.SafetyViolationsExist,
                                WorkDescription = deletedNewProject.WorkDescription,
                                Note = deletedNewProject.Note,
                                IsArchived = deletedNewProject.IsArchived,
                                CreateAt = deletedNewProject.CreateAt,
                                EstimatedValue = deletedNewProject.EstimatedValue,
                                ActualValue = deletedNewProject.ActualValue,
                                ExtractNumber = deletedNewProject.ExtractNumber,
                                ProjectPlace = deletedNewProject.ProjectPlace,
                                Office = deletedNewProject.Office,
                                ProjectValue = deletedNewProject.ProjectValue,
                                Situation = deletedNewProject.Situation,
                                ReceiveDateTime = deletedNewProject.ReceiveDateTime,
                                QualificationClassification = deletedNewProject.QualificationClassification,
                                Coordinates = deletedNewProject.Coordinates,
                                StationNumber = deletedNewProject.StationNumber,
                                IsApprove = deletedNewProject.IsApprove,
                                UserApproveId = deletedNewProject.UserApproveId,

                                // ✅ استعادة الصور مع تحديد NewProjectId
                                ModelPhotos = deletedNewProject.ModelPhotos?.Select(mp => new ModelPhotoForNew
                                {
                                    Url = mp.Url,
                                    NewProjectId = deletedNewProject.Id
                                }).ToList() ?? new List<ModelPhotoForNew>(),

                                SitePhotos = deletedNewProject.SitePhotos?.Select(sp => new SitePhotoForNew
                                {
                                    Url = sp.Url,
                                    NewProjectId = deletedNewProject.Id
                                }).ToList() ?? new List<SitePhotoForNew>(),

                                SafetyWastePhotos = deletedNewProject.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForNew
                                {
                                    Url = swp.Url,
                                    NewProjectId = deletedNewProject.Id
                                }).ToList() ?? new List<SafetyWastePhotoForNew>()
                            };

                            await newRepository.AddAsync(restoredNewProject);
                            await _newProjectDeletedRepository.DeleteAsync(deletedNewProject);
                            isRestored = true;
                        }
                        break;
                    case "privateproject":
                        var deletedPrivateProject = await _privateProjectDeletedRepository.GetByIdAsync(id);
                        if (deletedPrivateProject != null)
                        {
                            var restoredPrivateProject = new PrivateProject
                            {
                                ProjectName = deletedPrivateProject.ProjectName,
                                ProjectPlace = deletedPrivateProject.ProjectPlace,
                                ProjectValue = deletedPrivateProject.ProjectValue,
                                TimeOfProject = deletedPrivateProject.TimeOfProject,
                                Customer = deletedPrivateProject.Customer,
                                Consultant = deletedPrivateProject.Consultant,
                                Contractor = deletedPrivateProject.Contractor,
                                AppUserId = deletedPrivateProject.AppUserId,
                                UserName = deletedPrivateProject.UserName,
                                UserImage = deletedPrivateProject.UserImage,
                                BranchName = deletedPrivateProject.BranchName,
                                OrderDate = deletedPrivateProject.OrderDate,
                                SafetyViolationsExist = deletedPrivateProject.SafetyViolationsExist,
                                Note = deletedPrivateProject.Note,
                                IsArchived = deletedPrivateProject.IsArchived,
                                CreateAt = deletedPrivateProject.CreateAt,
                                StationNumber = deletedPrivateProject.StationNumber,
                                UserApproveId = deletedPrivateProject.UserApproveId,
                                Coordinates = deletedPrivateProject.Coordinates,
                                IsApprove = deletedPrivateProject.IsApprove,
                                WorkDescription = deletedPrivateProject.WorkDescription,

                                // ✅ استعادة الصور مع تحديد PrivateProjectId
                                ModelPhotos = deletedPrivateProject.ModelPhotos?.Select(mp => new ModelPhotoForPrivate
                                {
                                    Url = mp.Url,
                                    PrivateProjectId = deletedPrivateProject.Id
                                }).ToList() ?? new List<ModelPhotoForPrivate>(),

                                SitePhotos = deletedPrivateProject.SitePhotos?.Select(sp => new SitePhotoForPrivate
                                {
                                    Url = sp.Url,
                                    PrivateProjectId = deletedPrivateProject.Id
                                }).ToList() ?? new List<SitePhotoForPrivate>(),

                                SafetyWastePhotos = deletedPrivateProject.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForPrivate
                                {
                                    Url = swp.Url,
                                    PrivateProjectId = deletedPrivateProject.Id
                                }).ToList() ?? new List<SafetyWastePhotoForPrivate>()
                            };

                            await _privateRepository.AddAsync(restoredPrivateProject);
                            await _privateProjectDeletedRepository.DeleteAsync(deletedPrivateProject);
                            isRestored = true;
                        }
                        break;

                    case "construction":
                        #region Restore Construction
                        var deletedConstruction = await _constructionDeletedRepository.GetByIdAsync(id);
                        if (deletedConstruction != null)
                        {
                            var restoredConstruction = new Construction
                            {
                                WorkOrderType = deletedConstruction.WorkOrderType,
                                DurationOfImplementation = deletedConstruction.DurationOfImplementation,
                                FaultNumber = deletedConstruction.FaultNumber,
                                District = deletedConstruction.District,
                                Contractor = deletedConstruction.Contractor,
                                Consultant = deletedConstruction.Consultant,
                                AppUserId = deletedConstruction.AppUserId,
                                UserName = deletedConstruction.UserName,
                                UserImage = deletedConstruction.UserImage,
                                BranchName = deletedConstruction.BranchName,
                                OrderDate = deletedConstruction.OrderDate,
                                SafetyViolationsExist = deletedConstruction.SafetyViolationsExist,
                                Note = deletedConstruction.Note,
                                IsArchived = deletedConstruction.IsArchived,
                                CreateAt = deletedConstruction.CreateAt,
                                EstimatedValue = deletedConstruction.EstimatedValue,
                                ActualValue = deletedConstruction.ActualValue,
                                ExtractNumber = deletedConstruction.ExtractNumber,
                                ProjectPlace = deletedConstruction.ProjectPlace,
                                Office = deletedConstruction.Office,
                                ProjectValue = deletedConstruction.ProjectValue,
                                Situation = deletedConstruction.Situation,
                                ReceiveDateTime = deletedConstruction.ReceiveDateTime,
                                DailyExcavationLength = deletedConstruction.DailyExcavationLength,
                                Coordinates = deletedConstruction.Coordinates,
                                CompletionStatusReport = deletedConstruction.CompletionStatusReport,
                                ProjectExcavationLength = deletedConstruction.ProjectExcavationLength,
                                NumberOfDaysDelayed = deletedConstruction.NumberOfDaysDelayed,
                                NumberOfDaysRemaining = deletedConstruction.NumberOfDaysRemaining,
                                ExcavationLength = deletedConstruction.ExcavationLength,
                                CompletionDate = deletedConstruction.CompletionDate,
                                ImplementationPhase = deletedConstruction.ImplementationPhase,

                                Type = deletedConstruction.Type,
                                IsApprove = deletedConstruction.IsApprove,
                                NumberOfEquipment = deletedConstruction.NumberOfEquipment,
                                DailyCableLength = deletedConstruction.DailyCableLength,
                                CableLength = deletedConstruction.CableLength,
                                CableCompletion = deletedConstruction.CableCompletion,
                                DescriptionViolation = deletedConstruction.DescriptionViolation,
                                OrderType = deletedConstruction.OrderType,
                                ProjectCableLength = deletedConstruction.ProjectCableLength,
                                StationNumber = deletedConstruction.StationNumber,
                                TypeOfStomachTest = deletedConstruction.TypeOfStomachTest,
                                UserApproveId = deletedConstruction.UserApproveId,
                                WorkDescription = deletedConstruction.WorkDescription,

                                // ✅ استعادة الصور مع تحديد ConstructionId
                                ModelPhotos = deletedConstruction.ModelPhotos?.Select(mp => new ModelPhotoForConstruction
                                {
                                    Url = mp.Url,
                                    ConstructionId = deletedConstruction.Id
                                }).ToList() ?? new List<ModelPhotoForConstruction>(),
                                TestModels = deletedConstruction.TestModels?.Select(mp => new ModelTestForConstruction
                                {
                                    Url = mp.Url,
                                    ConstructionId = deletedConstruction.Id
                                }).ToList() ?? new List<ModelTestForConstruction>(),

                                SitePhotos = deletedConstruction.SitePhotos?.Select(sp => new SitePhotoForConstruction
                                {
                                    Url = sp.Url,
                                    ConstructionId = deletedConstruction.Id
                                }).ToList() ?? new List<SitePhotoForConstruction>(),

                                SafetyWastePhotos = deletedConstruction.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForConstruction
                                {
                                    Url = swp.Url,
                                    ConstructionId = deletedConstruction.Id
                                }).ToList() ?? new List<SafetyWastePhotoForConstruction>()
                            };

                            await constructionRepository.AddAsync(restoredConstruction);
                            await _constructionDeletedRepository.DeleteAsync(deletedConstruction);
                            isRestored = true;
                        }
                        #endregion
                        break;


                    case "emergency":
                        #region Restore Emergency
                        var deletedEmergency = await _emergencyDeletedRepository.GetByIdAsync(id);
                        if (deletedEmergency != null)
                        {
                            var restoredEmergency = new Emergency
                            {
                                WorkOrderType = deletedEmergency.WorkOrderType,
                                WorkDescription = deletedEmergency.WorkDescription,
                                StationNumber = deletedEmergency.StationNumber,
                                DurationOfImplementation = deletedEmergency.DurationOfImplementation,
                                FaultNumber = deletedEmergency.FaultNumber,
                                District = deletedEmergency.District,
                                Contractor = deletedEmergency.Contractor,
                                Consultant = deletedEmergency.Consultant,
                                AppUserId = deletedEmergency.AppUserId,
                                UserName = deletedEmergency.UserName,
                                UserImage = deletedEmergency.UserImage,
                                BranchName = deletedEmergency.BranchName,
                                OrderDate = deletedEmergency.OrderDate,
                                SafetyViolationsExist = deletedEmergency.SafetyViolationsExist,
                                Note = deletedEmergency.Note,
                                IsArchived = deletedEmergency.IsArchived,
                                CreateAt = deletedEmergency.CreateAt,
                                EstimatedValue = deletedEmergency.EstimatedValue,
                                ActualValue = deletedEmergency.ActualValue,
                                ExtractNumber = deletedEmergency.ExtractNumber,
                                ProjectPlace = deletedEmergency.ProjectPlace,
                                Office = deletedEmergency.Office,
                                ProjectValue = deletedEmergency.ProjectValue,
                                Situation = deletedEmergency.Situation,
                                ReceiveDateTime = deletedEmergency.ReceiveDateTime,
                                ImplementationPhase = deletedEmergency.ImplementationPhase,
                                Coordinates = deletedEmergency.Coordinates,
                                NotificationNumber = deletedEmergency.NotificationNumber,
                                TaskNumber = deletedEmergency.TaskNumber,
                                Type = deletedEmergency.Type,
                                UserApproveId = deletedEmergency.UserApproveId,
                                DescriptionViolation = deletedEmergency.DescriptionViolation,
                                IsApprove = deletedEmergency.IsApprove,
                                NumberOfEquipment = deletedEmergency.NumberOfEquipment,
                                TypeOfStomachTest = deletedEmergency.TypeOfStomachTest,


                                // ✅ استعادة الصور مع تحديد EmergencyId
                                ModelPhotos = deletedEmergency.ModelPhotos?.Select(mp => new ModelPhotoForEmergency
                                {
                                    Url = mp.Url,
                                    EmergencyId = deletedEmergency.Id
                                }).ToList() ?? new List<ModelPhotoForEmergency>(),

                                SitePhotos = deletedEmergency.SitePhotos?.Select(sp => new SitePhotoForEmergency
                                {
                                    Url = sp.Url,
                                    EmergencyId = deletedEmergency.Id
                                }).ToList() ?? new List<SitePhotoForEmergency>(),

                                SafetyWastePhotos = deletedEmergency.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForEmergency
                                {
                                    Url = swp.Url,
                                    EmergencyId = deletedEmergency.Id
                                }).ToList() ?? new List<SafetyWastePhotoForEmergency>()
                            };

                            await _emergencyRepository.AddAsync(restoredEmergency);
                            await _emergencyDeletedRepository.DeleteAsync(deletedEmergency);
                            isRestored = true;
                        }
                        #endregion
                        break;
                    case "maintenance":
                        #region Restore Maintenance
                        var deletedMaintenance = await _maintenanceDeletedRepository.GetByIdAsync(id);
                        if (deletedMaintenance != null)
                        {
                            var restoredMaintenance = new Maintenance
                            {
                                WorkOrderType = deletedMaintenance.WorkOrderType,
                                WorkDescription = deletedMaintenance.WorkDescription,
                                DurationOfImplementation = deletedMaintenance.DurationOfImplementation,
                                FaultNumber = deletedMaintenance.FaultNumber,
                                District = deletedMaintenance.District,
                                Contractor = deletedMaintenance.Contractor,
                                Consultant = deletedMaintenance.Consultant,
                                AppUserId = deletedMaintenance.AppUserId,
                                UserName = deletedMaintenance.UserName,
                                UserImage = deletedMaintenance.UserImage,
                                BranchName = deletedMaintenance.BranchName,
                                OrderDate = deletedMaintenance.OrderDate,
                                SafetyViolationsExist = deletedMaintenance.SafetyViolationsExist,
                                Note = deletedMaintenance.Note,
                                IsArchived = deletedMaintenance.IsArchived,
                                CreateAt = deletedMaintenance.CreateAt,
                                EstimatedValue = deletedMaintenance.EstimatedValue,
                                ActualValue = deletedMaintenance.ActualValue,
                                ExtractNumber = deletedMaintenance.ExtractNumber,
                                ProjectPlace = deletedMaintenance.ProjectPlace,
                                Office = deletedMaintenance.Office,
                                ProjectValue = deletedMaintenance.ProjectValue,
                                Situation = deletedMaintenance.Situation,
                                ReceiveDateTime = deletedMaintenance.ReceiveDateTime,
                                UserApproveId = deletedMaintenance.UserApproveId,
                                DescriptionViolation = deletedMaintenance.DescriptionViolation,
                                IsApprove = deletedMaintenance.IsApprove,
                                NumberOfEquipment = deletedMaintenance.NumberOfEquipment,
                                StationNumber = deletedMaintenance.StationNumber,
                                Coordinates = deletedMaintenance.Coordinates,
                                ImplementationPhase = deletedMaintenance.ImplementationPhase,
                                NotificationNumber = deletedMaintenance.NotificationNumber,
                                TaskNumber = deletedMaintenance.TaskNumber,
                                TypeOfStomachTest = deletedMaintenance.TypeOfStomachTest,
                                Type = deletedMaintenance.Type,

                                // ✅ استعادة الصور مع تحديد MaintenanceId
                                ModelPhotos = deletedMaintenance.ModelPhotos?.Select(mp => new ModelPhotoForMaintenance
                                {
                                    Url = mp.Url,
                                    MaintenanceId = deletedMaintenance.Id
                                }).ToList() ?? new List<ModelPhotoForMaintenance>(),
                                TestModels = deletedMaintenance.TestModels?.Select(mp => new ModelTestForMaintenance
                                {
                                    Url = mp.Url,
                                    MaintenanceId = deletedMaintenance.Id
                                }).ToList() ?? new List<ModelTestForMaintenance>(),

                                SitePhotos = deletedMaintenance.SitePhotos?.Select(sp => new SitePhotoForMaintenance
                                {
                                    Url = sp.Url,
                                    MaintenanceId = deletedMaintenance.Id
                                }).ToList() ?? new List<SitePhotoForMaintenance>(),

                                SafetyWastePhotos = deletedMaintenance.SafetyWastePhotos?.Select(swp => new SafetyWastePhotoForMaintenance
                                {
                                    Url = swp.Url,
                                    MaintenanceId = deletedMaintenance.Id
                                }).ToList() ?? new List<SafetyWastePhotoForMaintenance>()
                            };

                            await _maintenanceRepository.AddAsync(restoredMaintenance);
                            await _maintenanceDeletedRepository.DeleteAsync(deletedMaintenance);
                            isRestored = true;
                        }
                        #endregion
                        break;



                    default:
                        return BadRequest(new { message = "نوع المشروع غير صالح" });
                }

                if (isRestored)
                {
                    return Ok(new { message = "تم استعادة المشروع بنجاح" });
                }

                return NotFound(new { message = "المشروع غير موجود في سلة المهملات" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "حدث خطأ أثناء استعادة المشروع", error = ex.Message });
            }
        }

        [HttpGet("{projectId}/changes")]
        public async Task<IActionResult> GetProjectChangesAsync(int projectId, [FromQuery] string projectType)
        {
            try
            {
                // قم بتحديد المتغيرات بناءً على نوع المشروع
                object changes = null;

                switch (projectType.ToLower())
                {
                    case "new":
                        // جلب التغييرات الخاصة بالمشاريع الجديدة
                        changes = await _newProjectService.GetProjectChangesAsync(projectId);
                        break;
                    case "private":
                        // جلب التغييرات الخاصة بالمشاريع الخاصة
                        changes = await _privateProject.GetProjectChangesAsync(projectId);
                        break;

                    default:
                        return BadRequest("Invalid project type.");
                }

                return Ok(changes);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpPost("approve-delete")]
        public async Task<IActionResult> ApproveOrRejectDeleteRequest([FromBody] DeleteRequestDTO dto)
        {
            var request = await _context.DeleteRequests.FirstOrDefaultAsync(d => d.Id == dto.RequestId);
            if (request == null)
            {
                return NotFound(new { message = "لم يتم العثور على طلب الحذف." });
            }

            if (dto.IsApproved)
            {
                request.IsApproved = true;
                _context.DeleteRequests.Remove(request);

                // تنفيذ الحذف عند الموافقة
                await DeleteByOrderIdWithType(request.OrderId, request.Type);
                await _context.SaveChangesAsync();



                return Ok(new { message = "تمت الموافقة على الحذف وتنفيذه بنجاح." });
            }
            else
            {
                // رفض الطلب
                _context.DeleteRequests.Remove(request);
                await _context.SaveChangesAsync();

                return Ok(new { message = "تم رفض طلب الحذف وحذفه من القائمة." });
            }
        }

        // تعريف الـ DTO
        public class DeleteRequestDTO
        {
            public int RequestId { get; set; }
            public bool IsApproved { get; set; }
        }


        [HttpGet("delete-requests")]
        public async Task<IActionResult> GetDeleteRequests()
        {
            var requests = await _context.DeleteRequests.ToListAsync();
            return Ok(new { message = "data", statusCode = 200, data = requests });
        }


    }
}