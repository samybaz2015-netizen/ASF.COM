

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Dtos.ConstructionResponse;
using ASF.Core.Dtos.EmergencyResponse;
using ASF.Core.Dtos.MaintenanceResponse;
using ASF.Core.Dtos.NewProjectResponse;
using ASF.Core.Dtos.PrivateResponse;
using ASF.Core.Entities.Identity;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;

namespace ASF.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly UserManager<AppUser> _userManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApplicationDbContext _context;

        public AdminController(
            IAdminService adminService,
            UserManager<AppUser> userManager,
            IHttpContextAccessor httpContextAccessor,
            ApplicationDbContext context)
        {
            _adminService = adminService;
            _userManager = userManager;
            _httpContextAccessor = httpContextAccessor;
            _context = context;
        }

        [HttpGet("AllOrders")]
        public async Task<ActionResult<AllOrdersPaginatedDto>> GetAllOrders([FromQuery] OrderFilterDto filter)
        {
            var user = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
            if (user == null) return Unauthorized();

            var userRoles = await _userManager.GetRolesAsync(user);
            string? scopeBranch = null;
            string? scopeOffice = null;

            var role = userRoles.FirstOrDefault();

            if (role == "admin")
            {
                // شايف كل حاجة
            }
            else if (role == "officeManager")
            {
                if (!user.OfficeId.HasValue)
                    return BadRequest(new { message = "OfficeId غير محدد للمستخدم." });

                scopeOffice = await _context.Offices
                    .Where(d => d.Id == user.OfficeId.Value)
                    .Select(d => d.Name)
                    .FirstOrDefaultAsync();  // ✅ async

                if (string.IsNullOrEmpty(scopeOffice))
                    return BadRequest(new { message = "اسم المكتب غير موجود." });
            }
            else if (role == "supervisor")
            {
                if (user.BranchId == 0)
                    return BadRequest(new { message = "BranchId غير محدد للمستخدم." });

                scopeBranch = await _context.Branchs
                    .Where(d => d.Id == user.BranchId)
                    .Select(d => d.Name)
                    .FirstOrDefaultAsync();  // ✅ async

                if (string.IsNullOrEmpty(scopeBranch))
                    return BadRequest(new { message = "اسم الفرع غير موجود." });
            }
            else
            {
                return Forbid();
            }

            var (newProjects, newTotal) = await _adminService.GetAllNewProjectsAsync(filter, scopeBranch, scopeOffice);
            var (constructions, conTotal) = await _adminService.GetAllConstructionAsync(filter, scopeBranch, scopeOffice);
            var (emergencies, emgTotal) = await _adminService.GetAllEmergencyAsync(filter, scopeBranch, scopeOffice);
            var (maintenances, mntTotal) = await _adminService.GetAllMaintenanceAsync(filter, scopeBranch, scopeOffice);

            return Ok(new AllOrdersPaginatedDto
            {
                RehabilitationWorks = new PaginatedResult<NewProjectResponse>
                {
                    PageIndex = filter.PageIndex,
                    PageSize = filter.PageSize,
                    TotalCount = newTotal,
                    Data = newProjects.ToList()
                },
                Constructions = new PaginatedResult<ConstructionResponse>
                {
                    PageIndex = filter.PageIndex,
                    PageSize = filter.PageSize,
                    TotalCount = conTotal,
                    Data = constructions.ToList()
                },
                Emergencies = new PaginatedResult<EmergencyResponse>
                {
                    PageIndex = filter.PageIndex,
                    PageSize = filter.PageSize,
                    TotalCount = emgTotal,
                    Data = emergencies.ToList()
                },
                Maintenances = new PaginatedResult<MaintenanceResponse>
                {
                    PageIndex = filter.PageIndex,
                    PageSize = filter.PageSize,
                    TotalCount = mntTotal,
                    Data = maintenances.ToList()
                }
            });
        }
        [HttpGet("AllPrivateOrders")]
        public async Task<ActionResult> AllPrivateOrders([FromQuery] PrivateOrderFilterDto filter)
        {
            var user = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
            if (user == null)
                return Ok(new { statusCode = 200, message = "user not found" });

            var userRoles = await _userManager.GetRolesAsync(user);

            // ✅ تحسين أداء: بدل ما نجيب كل المشاريع الخاصة (أو حتى المفلترة بس بـ filter.BranchName)
            // ثم نفلتر على نطاق صلاحية المستخدم (Office/Branch) في الميموري، بنحدد نطاق الصلاحية
            // الأول وبنبعته كـ branchName لل service، عشان الفلترة بالـ Office/Branch تتم في الـ DB
            // مباشرة (زي ما بيحصل بالفعل جوه GetAllPrivateProjectsWithBranchNameAsync) بدل تحميل
            // الجدول كامل ثم رمي أغلبه في الميموري. الـ Response شكله وقيمته زي ما هو بالظبط.
            string? scopeBranchName = filter.BranchName;

            if (userRoles.FirstOrDefault() == "officeManager")
            {
                var officeId = (int)user.OfficeId;
                var officeName = (await _context.Offices.FirstOrDefaultAsync(d => d.Id == officeId))?.Name;
                if (string.IsNullOrEmpty(officeName))
                    return BadRequest("Office name is missing.");
                scopeBranchName = officeName; // نطاق الصلاحية بيغلب أي فلتر عام
            }
            else if (userRoles.FirstOrDefault() == "supervisor")
            {
                var branchId = (int)user.BranchId;
                var branchName2 = (await _context.Branchs.FirstOrDefaultAsync(d => d.Id == branchId))?.Name;
                if (string.IsNullOrEmpty(branchName2))
                    return BadRequest("Branch name is missing.");
                scopeBranchName = branchName2;
            }
            else if (userRoles.FirstOrDefault() != "admin")
            {
                return Forbid();
            }

            var allPrivateOrders = await _adminService.GetAllPrivateProjectsAsync(scopeBranchName);

            var filteredOrders = allPrivateOrders.AsQueryable();

            if (!string.IsNullOrEmpty(filter.ProjectName))
                filteredOrders = filteredOrders.Where(p => p.ProjectName.Contains(filter.ProjectName));
            if (!string.IsNullOrEmpty(filter.ProjectPlace))
                filteredOrders = filteredOrders.Where(p => p.ProjectPlace.Contains(filter.ProjectPlace));
            if (!string.IsNullOrEmpty(filter.Customer))
                filteredOrders = filteredOrders.Where(p => p.Customer.Contains(filter.Customer));
            if (!string.IsNullOrEmpty(filter.Consultant))
                filteredOrders = filteredOrders.Where(p => p.Consultant.Contains(filter.Consultant));
            if (!string.IsNullOrEmpty(filter.District))
                filteredOrders = filteredOrders.Where(p => p.District.Contains(filter.District));
            if (!string.IsNullOrEmpty(filter.Contractor))
                filteredOrders = filteredOrders.Where(p => p.UserName.Contains(filter.Contractor));
            if (!string.IsNullOrEmpty(filter.ProjectValue))
                filteredOrders = filteredOrders.Where(p => p.ProjectValue.Contains(filter.ProjectValue));
            if (!string.IsNullOrEmpty(filter.StationNumber))
                filteredOrders = filteredOrders.Where(p => p.StationNumber == filter.StationNumber); // ✅
            if (!string.IsNullOrEmpty(filter.TimeOfProject))
                filteredOrders = filteredOrders.Where(p => p.TimeOfProject == filter.TimeOfProject); // ✅
            if (!string.IsNullOrEmpty(filter.WorkDescription))
                filteredOrders = filteredOrders.Where(p => p.Note != null && p.Note.Contains(filter.WorkDescription));
            if (!string.IsNullOrEmpty(filter.Coordinates))
                filteredOrders = filteredOrders.Where(p => p.ProjectPlace != null && p.ProjectPlace.Contains(filter.Coordinates));
            if (filter.SafetyViolationsExist.HasValue)
                filteredOrders = filteredOrders.Where(p => p.SafetyViolationsExist == filter.SafetyViolationsExist.Value);
            if (filter.IsArchived.HasValue)
                filteredOrders = filteredOrders.Where(p => p.IsArchived == filter.IsArchived.Value);
            if (filter.OrderDate.HasValue)
            {
                var targetDate = filter.OrderDate.Value.Date;
                filteredOrders = filteredOrders.Where(p => p.OrderDate.HasValue && p.OrderDate.Value.Date == targetDate);
            }

            return Ok(new { statusCode = 200, message = "المشاريع الخاصة", data = filteredOrders.ToList() });
        }

        [HttpGet("OrdersByBranch")]
        public async Task<ActionResult<AllOrdersDto>> GetOrdersByBranch([FromQuery] string? branchName)
        {
            var privateOrder = await _adminService.GetPrivateProjectsByCurrentDateAndBranchAsync(branchName);
            var newProjects = await _adminService.GetNewProjectsByCurrentDateAndBranchAsync(branchName);
            var constructions = await _adminService.GetConstructionByCurrentDateAndBranchAsync(branchName);
            var emergencies = await _adminService.GetEmergencyByCurrentDateAndBranchAsync(branchName);
            var maintenances = await _adminService.GetMaintenanceByCurrentDateAndBranchAsync(branchName);

            return Ok(new AllOrdersDto
            {
                PrivateProjects = privateOrder,
                RehabilitationWorks = newProjects,
                Constructions = constructions,
                Emergencies = emergencies,
                Maintenances = maintenances
            });
        }

        [HttpGet("PrivateOrdersByBranch")]
        public async Task<ActionResult<AllOrdersDto>> GetPrivateOrdersByBranch([FromQuery] string? branchName)
        {
            var privateOrder = await _adminService.GetPrivateProjectsByCurrentDateAndBranchAsync(branchName);
            return Ok(new { statusCode = 200, message = "المشاريع الخاصة", data = privateOrder });
        }

        [HttpGet("statistics-orders")]
        public async Task<IActionResult> GetOrderStatistics()
        {
            var statistics = await _adminService.GetOrderStatisticsAsync();
            return Ok(statistics);
        }

        [HttpGet("projects-with-situations")]
        public async Task<IActionResult> GetProjectsWithSituations()
        {
            var result = await _adminService.GetProjectsWithSituationsAsync();
            return Ok(result);
        }

        [HttpGet("situation-counts")]
        public async Task<IActionResult> GetSituationCounts()
        {
            var result = await _adminService.GetSituationCountsAsync();
            return Ok(new { message = "data", statusCode = 200, data = result });
        }

        [HttpPut("projects/update-situations")]
        public async Task<IActionResult> UpdateProjectSituations()
        {
            await _adminService.UpdateProjectSituationsAsync();
            return Ok(new { message = "تم تحديث الحالات بنجاح" });
        }

        [HttpGet("projects-by-situation")]
        public async Task<IActionResult> GetProjectsBySituation([FromQuery] string situation, [FromQuery] string? projectType)
        {
            var user = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
            var userRoles = await _userManager.GetRolesAsync(user);

            IReadOnlyCollection<ProjectDetailsDto> projects;

            if (userRoles.FirstOrDefault() == "admin")
            {
                projects = await _adminService.GetProjectsBySituationAsync(situation, projectType);
            }
            else if (userRoles.FirstOrDefault() == "officeManager")
            {
                var officeId = user.OfficeId ?? 0;
                var officeName = (await _context.Offices.FirstOrDefaultAsync(d => d.Id == officeId))?.Name;
                if (string.IsNullOrEmpty(officeName))
                    return BadRequest("Office name is missing.");
                var allProjects = await _adminService.GetProjectsBySituationAsync(situation, projectType);
                projects = allProjects.Where(p => p.Office == officeName).ToList();
            }
            else
            {
                return Forbid();
            }

            return Ok(new { message = "data", statusCode = 200, data = projects });
        }

        // ========================
        // Nested DTOs
        // ========================

        public class AllOrdersDto
        {
            public IReadOnlyCollection<PrivateResponse> PrivateProjects { get; set; }
            public IReadOnlyCollection<NewProjectResponse> RehabilitationWorks { get; set; }
            public IReadOnlyCollection<ConstructionResponse> Constructions { get; set; }
            public IReadOnlyCollection<MaintenanceResponse> Maintenances { get; set; }
            public IReadOnlyCollection<EmergencyResponse> Emergencies { get; set; }
        }

        public class PrivateOrderFilterDto
        {
            public string? BranchName { get; set; }
            public string? ProjectName { get; set; }
            public string? ProjectPlace { get; set; }
            public string? Customer { get; set; }
            public string? Consultant { get; set; }
            public string? District { get; set; }
            public string? Contractor { get; set; }
            public string? ProjectValue { get; set; }
            public string? StationNumber { get; set; }
            public string? TimeOfProject { get; set; }
            public bool? SafetyViolationsExist { get; set; }
            public string? WorkDescription { get; set; }
            public bool? IsArchived { get; set; }
            public DateTime? OrderDate { get; set; }
            public string? Coordinates { get; set; }
        }

        [HttpPut("projects/mark-paid-as-disbursed")]
        public async Task<IActionResult> MarkPaidProjectsAsDisbursed()
        {
            var updatedCount = await _adminService.MarkPaidProjectsAsDisbursedAsync();
            return Ok(new
            {
                statusCode = 200,
                message = $"تم تحديث {updatedCount} مشروع من (paid) إلى (تم الصرف)"
            });
        }
    }
}