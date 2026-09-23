using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Dtos.ConstructionResponse;
using ASF.Core.Dtos.EmergencyResponse;
using ASF.Core.Dtos.MaintenanceResponse;
using ASF.Core.Dtos.NewProjectResponse;
using ASF.Core.Entities.Identity;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    /// <summary>
    /// إحصائيات الحسابات والمشاريع: لوحة القيادة، أعداد المهندسين والمشاريع لكل فرع.
    /// يستخدم نفس الـ Route القديم (api/Account) للتوافق مع الفرونت إند.
    /// </summary>
    [Route("api/Account")]
    [ApiController]
    [Authorize]
    public class AccountStatisticsController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IBranchService _branchService;
        private readonly ApplicationDbContext _context;
        private readonly AppIdentityDbContext _appContext;
        private readonly IAdminService _adminService;

        public AccountStatisticsController(
            UserManager<AppUser> userManager,
            IBranchService branchService,
            ApplicationDbContext context,
            AppIdentityDbContext appContext,
            IAdminService adminService)
        {
            _userManager = userManager;
            _branchService = branchService;
            _context = context;
            _appContext = appContext;
            _adminService = adminService;
        }

        [HttpGet("get-count-engineers-per-branch")]
        public async Task<ActionResult<object>> GetCountEngineersPerBranch()
        {
            var branches = await _branchService.GetAllAsync();

            var branchEngineersCounts = new List<object>();

            foreach (var branch in branches)
            {
                var usersInBranch = await _userManager.Users
                    .Where(u => u.BranchId == branch.Id)
                    .ToListAsync();

                int engineersCount = 0;

                foreach (var user in usersInBranch)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    if (roles.Contains("eng"))
                    {
                        engineersCount++;
                    }
                }

                branchEngineersCounts.Add(new
                {
                    BranchName = branch.Name,
                    EngineersCount = engineersCount
                });
            }

            return Ok(branchEngineersCounts);
        }

        [HttpGet("get-count-projects-per-branch")]
        public async Task<ActionResult<object>> GetCountProjectsPerBranch()
        {
            var newProjectsList = await _context.NewProjects.ToListAsync();
            var constructionsList = await _context.Constructions.ToListAsync();
            var emergenciesList = await _context.Emergencys.ToListAsync();
            var maintenancesList = await _context.Maintenances.ToListAsync();
            var privateProjectsList = await _context.PrivateProjects.ToListAsync();

            var countNewProjects = newProjectsList
                .GroupBy(p => new { BranchName = p.BranchName?.Trim().ToLower(), Office = p.Office?.Trim().ToLower() })
                .Select(g => new
                {
                    g.Key.BranchName,
                    g.Key.Office,
                    Count = g.Count(),
                    ActualValue = g.Sum(x => decimal.TryParse(x.ActualValue, out var av) ? av : 0),
                    EstimatedValue = g.Sum(x => decimal.TryParse(x.EstimatedValue, out var en) ? en : 0)
                }).ToList();

            var countConstructions = constructionsList
                .GroupBy(p => new { BranchName = p.BranchName?.Trim().ToLower(), Office = p.Office?.Trim().ToLower() })
                .Select(g => new
                {
                    g.Key.BranchName,
                    g.Key.Office,
                    Count = g.Count(),
                    ActualValue = g.Sum(x => decimal.TryParse(x.ActualValue, out var av) ? av : 0),
                    EstimatedValue = g.Sum(x => decimal.TryParse(x.EstimatedValue, out var en) ? en : 0)
                }).ToList();

            var countEmergencies = emergenciesList
                .GroupBy(p => new { BranchName = p.BranchName?.Trim().ToLower(), Office = p.Office?.Trim().ToLower() })
                .Select(g => new
                {
                    g.Key.BranchName,
                    g.Key.Office,
                    Count = g.Count(),
                    ActualValue = g.Sum(x => decimal.TryParse(x.ActualValue, out var av) ? av : 0),
                    EstimatedValue = g.Sum(x => decimal.TryParse(x.EstimatedValue, out var en) ? en : 0)
                }).ToList();

            var countMaintenances = maintenancesList
                .GroupBy(p => new { BranchName = p.BranchName?.Trim().ToLower(), Office = p.Office?.Trim().ToLower() })
                .Select(g => new
                {
                    g.Key.BranchName,
                    g.Key.Office,
                    Count = g.Count(),
                    ActualValue = g.Sum(x => decimal.TryParse(x.ActualValue, out var av) ? av : 0),
                    EstimatedValue = g.Sum(x => decimal.TryParse(x.EstimatedValue, out var en) ? en : 0)
                }).ToList();

            var countPrivateProjects = privateProjectsList
                .GroupBy(p => new { BranchName = p.BranchName?.Trim().ToLower() })
                .Select(g => new
                {
                    BranchName = g.Key.BranchName,
                    Office = "غير محدد", // لأن PrivateProject مفيهوش Office
                    Count = g.Count(),
                    ActualValue = 0m,
                    EstimatedValue = 0m
                }).ToList();

            var allBranchCounts = countNewProjects
                .Concat(countConstructions)
                .Concat(countEmergencies)
                .Concat(countMaintenances)
                .Concat(countPrivateProjects)
                .GroupBy(p => p.BranchName)
                .Select(g => new
                {
                    BranchName = g.Key,
                    Offices = g.GroupBy(x => x.Office)
                        .Select(officeGroup => new
                        {
                            OfficeName = officeGroup.Key,
                            ProjectCount = officeGroup.Sum(x => x.Count),
                            TotalActualValue = officeGroup.Sum(x => x.ActualValue),
                            TotalEstimatedValue = officeGroup.Sum(x => x.EstimatedValue)
                        }).ToList(),
                    TotalProjectCount = g.Sum(x => x.Count),
                    TotalActualValue = g.Sum(x => x.ActualValue),
                    TotalEstimatedValue = g.Sum(x => x.EstimatedValue)
                }).ToList();

            return Ok(new { statusCode = 200, message = "done", data = allBranchCounts });
        }

        [HttpGet("get-projects-count-and-weekly")]
        public async Task<ActionResult<object>> GetProjectsCountAndWeekly()
        {
            // 🟢 استخراج الـ ID من التوكن
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { statusCode = 401, message = "المستخدم غير مصرح له أو التوكن غير صحيح" });
            }

            // 🟢 الحصول على الفرع الذي ينتمي إليه المستخدم
            var user = await _appContext.Users.Where(u => u.Id == userId).FirstOrDefaultAsync();
            if (user == null || user.BranchId == null)
            {
                return BadRequest(new { statusCode = 400, message = "لم يتم العثور على المستخدم أو الفرع غير محدد" });
            }

            var branch = await _context.Branchs.FirstOrDefaultAsync(d => d.Id == user.BranchId);
            if (branch == null)
                return BadRequest(new { statusCode = 400, message = "الفرع غير موجود في قاعدة البيانات" });
            string branchId = branch.Name;

            // 🔹 حساب الأسبوع الحالي في الشهر
            static int GetWeekOfMonth(DateTime date)
            {
                var firstDayOfMonth = new DateTime(date.Year, date.Month, 1);
                int daysDifference = (date - firstDayOfMonth).Days;
                return (daysDifference / 7) + 1;
            }

            static List<int> GetWeeksInMonth(int year, int month)
            {
                var weeks = new List<int>();
                var daysInMonth = DateTime.DaysInMonth(year, month);
                for (int day = 1; day <= daysInMonth; day++)
                {
                    var date = new DateTime(year, month, day);
                    var week = GetWeekOfMonth(date);
                    if (!weeks.Contains(week))
                    {
                        weeks.Add(week);
                    }
                }
                return weeks;
            }

            // 🟢 تصفية المشاريع بناءً على فرع المستخدم
            var countRehabilitationworks = await _context.NewProjects.CountAsync(p => p.BranchName == branchId);
            var countPrivate = await _context.PrivateProjects.CountAsync(p => p.BranchName == branchId);
            var countConstruction = await _context.Constructions.CountAsync(p => p.BranchName == branchId);
            var countEmergency = await _context.Emergencys.CountAsync(p => p.BranchName == branchId);
            var countMaintenance = await _context.Maintenances.CountAsync(p => p.BranchName == branchId);

            var newProjects = await _context.NewProjects.Where(p => p.BranchName == branchId).ToListAsync();
            var countNewProjects = newProjects
                .GroupBy(p => new { p.CreateAt.Year, p.CreateAt.Month, Week = GetWeekOfMonth(p.CreateAt) })
                .Select(g => new { Year = g.Key.Year, Month = g.Key.Month, Week = g.Key.Week, Count = g.Count() })
                .ToList();

            var constructions = await _context.Constructions.Where(p => p.BranchName == branchId).ToListAsync();
            var countConstructions = constructions
                .GroupBy(p => new { p.CreateAt.Year, p.CreateAt.Month, Week = GetWeekOfMonth(p.CreateAt) })
                .Select(g => new { Year = g.Key.Year, Month = g.Key.Month, Week = g.Key.Week, Count = g.Count() })
                .ToList();

            var emergencys = await _context.Emergencys.Where(p => p.BranchName == branchId).ToListAsync();
            var countEmergencys = emergencys
                .GroupBy(p => new { p.CreateAt.Year, p.CreateAt.Month, Week = GetWeekOfMonth(p.CreateAt) })
                .Select(g => new { Year = g.Key.Year, Month = g.Key.Month, Week = g.Key.Week, Count = g.Count() })
                .ToList();

            var maintenances = await _context.Maintenances.Where(p => p.BranchName == branchId).ToListAsync();
            var countMaintenances = maintenances
                .GroupBy(p => new { p.CreateAt.Year, p.CreateAt.Month, Week = GetWeekOfMonth(p.CreateAt) })
                .Select(g => new { Year = g.Key.Year, Month = g.Key.Month, Week = g.Key.Week, Count = g.Count() })
                .ToList();

            var privateProjects = await _context.PrivateProjects.Where(p => p.BranchName == branchId).ToListAsync();
            var countPrivateProjects = privateProjects
                .GroupBy(p => new { p.CreateAt.Year, p.CreateAt.Month, Week = GetWeekOfMonth(p.CreateAt) })
                .Select(g => new { Year = g.Key.Year, Month = g.Key.Month, Week = g.Key.Week, Count = g.Count() })
                .ToList();

            var allWeeksInMonth = GetWeeksInMonth(DateTime.Now.Year, DateTime.Now.Month);

            var allWeekCounts = allWeeksInMonth.Select(week =>
            {
                // دمج كل المشاريع حسب الأسبوع
                var weekData = countNewProjects.Concat(countPrivateProjects)
                                               .Concat(countConstructions)
                                               .Concat(countEmergencys)
                                               .Concat(countMaintenances)
                                               .Where(p => p.Year == DateTime.Now.Year && p.Month == DateTime.Now.Month && p.Week == week)
                                               .GroupBy(p => new { p.Year, p.Month, p.Week })
                                               .Select(g => new
                                               {
                                                   Year = g.Key.Year,
                                                   Month = g.Key.Month,
                                                   Week = g.Key.Week,
                                                   ProjectCount = g.Sum(x => x.Count)
                                               })
                                               .FirstOrDefault();

                // إذا لم توجد بيانات، يتم إرجاع صفر
                if (weekData == null)
                {
                    weekData = new { Year = DateTime.Now.Year, Month = DateTime.Now.Month, Week = week, ProjectCount = 0 };
                }

                return weekData;
            }).ToList();

            return Ok(new
            {
                statusCode = 200,
                message = "تم جلب البيانات بنجاح",
                data = new
                {
                    branchId,
                    countRehabilitationworks,
                    countPrivate,
                    countConstruction,
                    countEmergency,
                    countMaintenance,
                    weeklyData = allWeekCounts
                }
            });
        }

        [HttpGet("dashboard-office")]
        public async Task<IActionResult> GetDashboardData()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var roles = await _userManager.GetRolesAsync(user);
            string role = roles.FirstOrDefault();

            IReadOnlyCollection<NewProjectResponse> newProjects;
            IReadOnlyCollection<ConstructionResponse> constructions;
            IReadOnlyCollection<EmergencyResponse> emergencies;
            IReadOnlyCollection<MaintenanceResponse> maintenances;

            if (role == "admin")
            {
                var filter = new OrderFilterDto { PageIndex = 1, PageSize = int.MaxValue };

                newProjects = (await _adminService.GetAllNewProjectsAsync(filter, null, null)).Data;
                constructions = (await _adminService.GetAllConstructionAsync(filter, null, null)).Data;
                emergencies = (await _adminService.GetAllEmergencyAsync(filter, null, null)).Data;
                maintenances = (await _adminService.GetAllMaintenanceAsync(filter, null, null)).Data;
            }
            else if (role == "officeManager")
            {
                var filter = new OrderFilterDto { PageIndex = 1, PageSize = int.MaxValue };
                var officeId = user.OfficeId;
                var officeName = (await _context.Offices.FirstOrDefaultAsync(d => d.Id == officeId))?.Name;
                if (string.IsNullOrEmpty(officeName)) return BadRequest("Office name is missing.");

                newProjects = (await _adminService.GetAllNewProjectsAsync(filter, null, officeName)).Data;
                constructions = (await _adminService.GetAllConstructionAsync(filter, null, officeName)).Data;
                emergencies = (await _adminService.GetAllEmergencyAsync(filter, null, officeName)).Data;
                maintenances = (await _adminService.GetAllMaintenanceAsync(filter, null, officeName)).Data;
            }
            else if (role == "supervisor")
            {
                var filter = new OrderFilterDto { PageIndex = 1, PageSize = int.MaxValue };
                var branchId = user.BranchId;
                var branchName = (await _context.Branchs.FirstOrDefaultAsync(d => d.Id == branchId))?.Name;
                if (string.IsNullOrEmpty(branchName)) return BadRequest("Branch name is missing.");

                newProjects = (await _adminService.GetAllNewProjectsAsync(filter, branchName, null)).Data;
                constructions = (await _adminService.GetAllConstructionAsync(filter, branchName, null)).Data;
                emergencies = (await _adminService.GetAllEmergencyAsync(filter, branchName, null)).Data;
                maintenances = (await _adminService.GetAllMaintenanceAsync(filter, branchName, null)).Data;
            }
            else
            {
                return Forbid();
            }

            decimal totalEstimatedValue = newProjects.Sum(p => decimal.TryParse(p.EstimatedValue, out var v1) ? v1 : 0)
                                        + constructions.Sum(p => decimal.TryParse(p.EstimatedValue, out var v2) ? v2 : 0)
                                        + emergencies.Sum(p => decimal.TryParse(p.EstimatedValue, out var v3) ? v3 : 0)
                                        + maintenances.Sum(p => decimal.TryParse(p.EstimatedValue, out var v4) ? v4 : 0);

            decimal totalActualValue = newProjects.Sum(p => decimal.TryParse(p.ActualValue, out var v1) ? v1 : 0)
                                      + constructions.Sum(p => decimal.TryParse(p.ActualValue, out var v2) ? v2 : 0)
                                      + emergencies.Sum(p => decimal.TryParse(p.ActualValue, out var v3) ? v3 : 0)
                                      + maintenances.Sum(p => decimal.TryParse(p.ActualValue, out var v4) ? v4 : 0);

            int totalProjects = newProjects.Count + constructions.Count + emergencies.Count + maintenances.Count;
            int employeesCount = 0;

            if (role == "admin")
            {
                employeesCount = await _userManager.Users
                    .Where(u => u.UserType == "eng")
                    .CountAsync();
            }
            else if (role == "officeManager")
            {
                employeesCount = await _userManager.Users
                    .Where(u => u.OfficeId == user.OfficeId && u.UserType == "eng")
                    .CountAsync();
            }
            else if (role == "supervisor")
            {
                employeesCount = await _userManager.Users
                    .Where(u => u.BranchId == user.BranchId && u.UserType == "eng")
                    .CountAsync();
            }


            return Ok(new
            {
                statusCode = 200,
                message = "تم جلب البيانات بنجاح",
                data = new
                {
                    EmployeesCount = employeesCount,
                    TotalProjects = totalProjects,
                    TotalEstimatedValue = totalEstimatedValue,
                    TotalActualValue = totalActualValue
                }
            });
        }
    }
}
