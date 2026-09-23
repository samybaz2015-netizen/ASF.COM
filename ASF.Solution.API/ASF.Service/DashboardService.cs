using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;
using System.Globalization;

namespace ASF.Service
{
    public class DashboardService : IDashboardService
    {
        private readonly ApplicationDbContext _db;
        private readonly AppIdentityDbContext _identityDb;

        public DashboardService(ApplicationDbContext db, AppIdentityDbContext identityDb)
        {
            _db = db;
            _identityDb = identityDb;
        }

        public async Task<DashboardStatsDto> GetFullStatsAsync()
        {
            var stats = new DashboardStatsDto
            {
                GeneratedAt = DateTime.UtcNow,
                Construction = await GetConstructionStatsAsync(),
                Maintenance = await GetMaintenanceStatsAsync(),
                Emergency = await GetEmergencyStatsAsync(),
                NewProject = await GetNewProjectStatsAsync(),
                PrivateProject = await GetPrivateProjectStatsAsync(),
                LeaveRequests = await GetLeaveRequestStatsAsync(),
                Attendance = await GetAttendanceStatsAsync(),
                Custody = await GetCustodyStatsAsync(),
                Users = await GetUsersStatsAsync(),
                Employees = await GetEmployeesStatsAsync(),
                BranchBreakdown = await GetBranchBreakdownAsync(),
                ContractorBreakdown = await GetContractorBreakdownAsync(),
                ConsultantBreakdown = await GetConsultantBreakdownAsync(),
                MonthlyOrdersTrend = await GetMonthlyTrendAsync(),
                SituationBreakdown = await GetSituationBreakdownAsync(),
                Safety = await GetSafetyStatsAsync(),
            };

            // الملخص العام يعتمد على البيانات المجمّعة
            stats.OverallSummary = new OverallSummaryDto
            {
                TotalWorkOrders = stats.Construction.Total
                                + stats.Maintenance.Total
                                + stats.Emergency.Total
                                + stats.NewProject.Total
                                + stats.PrivateProject.Total,

                TotalActiveOrders = stats.Construction.Active
                                  + stats.Maintenance.Active
                                  + stats.Emergency.Active
                                  + stats.NewProject.Active
                                  + stats.PrivateProject.Active,

                TotalArchivedOrders = stats.Construction.Archived
                                    + stats.Maintenance.Archived
                                    + stats.Emergency.Archived
                                    + stats.NewProject.Archived
                                    + stats.PrivateProject.Archived,

                TotalApproved = stats.Construction.Approved
                              + stats.Maintenance.Approved
                              + stats.Emergency.Approved
                              + stats.NewProject.Approved
                              + stats.PrivateProject.Approved,

                TotalRejected = stats.Construction.Rejected
                              + stats.Maintenance.Rejected
                              + stats.Emergency.Rejected
                              + stats.NewProject.Rejected
                              + stats.PrivateProject.Rejected,

                TotalPendingApproval = stats.Construction.PendingApproval
                                     + stats.Maintenance.PendingApproval
                                     + stats.Emergency.PendingApproval
                                     + stats.NewProject.PendingApproval
                                     + stats.PrivateProject.PendingApproval,

                TotalWithSafetyViolation = stats.Safety.TotalViolations,

                TotalDeleteRequests = await _db.DeleteRequests.AsNoTracking().CountAsync(),

                TotalEstimatedValue = stats.Construction.EstimatedValue
                                    + stats.Maintenance.EstimatedValue
                                    + stats.Emergency.EstimatedValue
                                    + stats.NewProject.EstimatedValue
                                    + stats.PrivateProject.EstimatedValue,

                TotalActualValue = stats.Construction.ActualValue
                                    + stats.Maintenance.ActualValue
                                    + stats.Emergency.ActualValue
                                    + stats.NewProject.ActualValue
                                    + stats.PrivateProject.ActualValue,
            };

            return stats;
        }

        // ======================================================
        //  الإنشاءات
        // ======================================================
        private async Task<ConstructionStatsDto> GetConstructionStatsAsync()
        {
            var q = _db.Constructions.AsNoTracking();

            var pricing = await _db.ConstructionPricingItems.AsNoTracking()
                .GroupBy(x => 1)
                .Select(g => new
                {
                    EstVal = g.Sum(p => (double?)(p.TotalPrice ?? 0)) ?? 0,
                    ActVal = g.Sum(p => (double?)(p.ExecutedWorksValue ?? 0)) ?? 0
                }).FirstOrDefaultAsync();

            var agg = await q.GroupBy(x => 1).Select(g => new
            {
                Total = g.Count(),
                Active = g.Count(x => !x.IsArchived),
                Archived = g.Count(x => x.IsArchived),
                Approved = g.Count(x => x.IsApprove == true),
                Rejected = g.Count(x => x.IsApprove == false),
                PendingApproval = g.Count(x => x.IsApprove == null),
                WithSafetyViolations = g.Count(x => x.SafetyViolationsExist),
                TotalProjectCableLength = g.Sum(x => (double?)(x.ProjectCableLength ?? 0)),
                TotalDailyCableLength = g.Sum(x => (double?)(x.DailyCableLength ?? 0)),
                TotalCableLength = g.Sum(x => (double?)(x.CableLength ?? 0)),
                TotalProjectExcavationLength = g.Sum(x => (double?)(x.ProjectExcavationLength ?? 0)),
                TotalDailyExcavationLength = g.Sum(x => (double?)(x.DailyExcavationLength ?? 0)),
                TotalExcavationLength = g.Sum(x => (double?)(x.ExcavationLength ?? 0)),
                TotalNumberOfEquipment = g.Sum(x => (int?)x.NumberOfEquipment)
            }).FirstOrDefaultAsync();

            var deletedCount = await _db.ConstructionDeleted.AsNoTracking().CountAsync();

            var distinctDistricts = await q.Where(x => x.District != null)
                .Select(x => x.District!).Distinct().ToListAsync();

            var distinctBranches = await q.Where(x => x.BranchName != null)
                .Select(x => x.BranchName!).Distinct().ToListAsync();

            var distinctOffices = await q.Where(x => x.Office != null)
                .Select(x => x.Office!).Distinct().ToListAsync();

            var situationCounts = await q.GroupBy(x => x.Situation)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var orderTypeCounts = await q.Where(x => x.OrderType != null)
                .GroupBy(x => x.OrderType)
                .Select(g => new StatusCountDto { Label = g.Key!, Count = g.Count() })
                .ToListAsync();

            var implementationPhaseCounts = await q.Where(x => x.ImplementationPhase != null)
                .GroupBy(x => x.ImplementationPhase)
                .Select(g => new StatusCountDto { Label = g.Key!, Count = g.Count() })
                .ToListAsync();

            return new ConstructionStatsDto
            {
                Total = agg?.Total ?? 0,
                Active = agg?.Active ?? 0,
                Archived = agg?.Archived ?? 0,
                Approved = agg?.Approved ?? 0,
                Rejected = agg?.Rejected ?? 0,
                PendingApproval = agg?.PendingApproval ?? 0,
                WithSafetyViolations = agg?.WithSafetyViolations ?? 0,
                DeletedCount = deletedCount,
                EstimatedValue = pricing?.EstVal ?? 0,
                ActualValue = pricing?.ActVal ?? 0,
                TotalProjectCableLength = agg?.TotalProjectCableLength,
                TotalDailyCableLength = agg?.TotalDailyCableLength,
                TotalCableLength = agg?.TotalCableLength,
                TotalProjectExcavationLength = agg?.TotalProjectExcavationLength,
                TotalDailyExcavationLength = agg?.TotalDailyExcavationLength,
                TotalExcavationLength = agg?.TotalExcavationLength,
                TotalNumberOfEquipment = agg?.TotalNumberOfEquipment,
                DistinctDistricts = distinctDistricts,
                DistinctBranches = distinctBranches,
                DistinctOffices = distinctOffices,
                SituationCounts = situationCounts,
                OrderTypeCounts = orderTypeCounts,
                ImplementationPhaseCounts = implementationPhaseCounts
            };
        }

        // ======================================================
        //  الصيانة
        // ======================================================
        private async Task<MaintenanceStatsDto> GetMaintenanceStatsAsync()
        {
            var q = _db.Maintenances.AsNoTracking();

            var pricing = await _db.MaintenancePricingItems.AsNoTracking()
                .GroupBy(x => 1)
                .Select(g => new
                {
                    EstVal = g.Sum(p => (double?)(p.TotalPrice ?? 0)) ?? 0,
                    ActVal = g.Sum(p => (double?)(p.ExecutedWorksValue ?? 0)) ?? 0
                }).FirstOrDefaultAsync();

            var agg = await q.GroupBy(x => 1).Select(g => new
            {
                Total = g.Count(),
                Active = g.Count(x => !x.IsArchived),
                Archived = g.Count(x => x.IsArchived),
                Approved = g.Count(x => x.IsApprove == true),
                Rejected = g.Count(x => x.IsApprove == false),
                PendingApproval = g.Count(x => x.IsApprove == null),
                WithSafetyViolations = g.Count(x => x.SafetyViolationsExist),
                TotalNumberOfEquipment = g.Sum(x => (int?)x.NumberOfEquipment)
            }).FirstOrDefaultAsync();

            var deletedCount = await _db.MaintenanceDeleted.AsNoTracking().CountAsync();

            var distinctDistricts = await q.Where(x => x.District != null)
                .Select(x => x.District!).Distinct().ToListAsync();

            var distinctBranches = await q.Where(x => x.BranchName != null)
                .Select(x => x.BranchName!).Distinct().ToListAsync();

            var situationCounts = await q.GroupBy(x => x.Situation)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var orderTypeCounts = await q.Where(x => x.OrderType != null)
                .GroupBy(x => x.OrderType)
                .Select(g => new StatusCountDto { Label = g.Key!, Count = g.Count() })
                .ToListAsync();

            return new MaintenanceStatsDto
            {
                Total = agg?.Total ?? 0,
                Active = agg?.Active ?? 0,
                Archived = agg?.Archived ?? 0,
                Approved = agg?.Approved ?? 0,
                Rejected = agg?.Rejected ?? 0,
                PendingApproval = agg?.PendingApproval ?? 0,
                WithSafetyViolations = agg?.WithSafetyViolations ?? 0,
                DeletedCount = deletedCount,
                TotalNumberOfEquipment = agg?.TotalNumberOfEquipment,
                EstimatedValue = pricing?.EstVal ?? 0,
                ActualValue = pricing?.ActVal ?? 0,
                DistinctDistricts = distinctDistricts,
                DistinctBranches = distinctBranches,
                SituationCounts = situationCounts,
                OrderTypeCounts = orderTypeCounts
            };
        }

        // ======================================================
        //  الطوارئ
        // ======================================================
        private async Task<EmergencyStatsDto> GetEmergencyStatsAsync()
        {
            var q = _db.Emergencys.AsNoTracking();

            var pricing = await _db.EmergencyPricingItems.AsNoTracking()
                .GroupBy(x => 1)
                .Select(g => new
                {
                    EstVal = g.Sum(p => (double?)(p.TotalPrice ?? 0)) ?? 0,
                    ActVal = g.Sum(p => (double?)(p.ExecutedWorksValue ?? 0)) ?? 0
                }).FirstOrDefaultAsync();

            var agg = await q.GroupBy(x => 1).Select(g => new
            {
                Total = g.Count(),
                Active = g.Count(x => !x.IsArchived),
                Archived = g.Count(x => x.IsArchived),
                Approved = g.Count(x => x.IsApprove == true),
                Rejected = g.Count(x => x.IsApprove == false),
                PendingApproval = g.Count(x => x.IsApprove == null),
                WithSafetyViolations = g.Count(x => x.SafetyViolationsExist),
                TotalNumberOfEquipment = g.Sum(x => (int?)x.NumberOfEquipment)
            }).FirstOrDefaultAsync();

            var deletedCount = await _db.EmergencyDeleted.AsNoTracking().CountAsync();

            var distinctDistricts = await q.Where(x => x.District != null)
                .Select(x => x.District!).Distinct().ToListAsync();

            var distinctBranches = await q.Where(x => x.BranchName != null)
                .Select(x => x.BranchName!).Distinct().ToListAsync();

            var situationCounts = await q.GroupBy(x => x.Situation)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var orderTypeCounts = await q.Where(x => x.OrderType != null)
                .GroupBy(x => x.OrderType)
                .Select(g => new StatusCountDto { Label = g.Key!, Count = g.Count() })
                .ToListAsync();

            return new EmergencyStatsDto
            {
                Total = agg?.Total ?? 0,
                Active = agg?.Active ?? 0,
                Archived = agg?.Archived ?? 0,
                Approved = agg?.Approved ?? 0,
                Rejected = agg?.Rejected ?? 0,
                PendingApproval = agg?.PendingApproval ?? 0,
                WithSafetyViolations = agg?.WithSafetyViolations ?? 0,
                DeletedCount = deletedCount,
                TotalNumberOfEquipment = agg?.TotalNumberOfEquipment,
                EstimatedValue = pricing?.EstVal ?? 0,
                ActualValue = pricing?.ActVal ?? 0,
                DistinctDistricts = distinctDistricts,
                DistinctBranches = distinctBranches,
                SituationCounts = situationCounts,
                OrderTypeCounts = orderTypeCounts
            };
        }

        // ======================================================
        //  أعمال التأهيل
        // ======================================================
        private async Task<NewProjectStatsDto> GetNewProjectStatsAsync()
        {
            var q = _db.NewProjects.AsNoTracking();

            var pricing = await _db.NewProjectPricingItems.AsNoTracking()
                .GroupBy(x => 1)
                .Select(g => new
                {
                    EstVal = g.Sum(p => (double?)(p.TotalPrice ?? 0)) ?? 0,
                    ActVal = g.Sum(p => (double?)(p.ExecutedWorksValue ?? 0)) ?? 0
                }).FirstOrDefaultAsync();

            var agg = await q.GroupBy(x => 1).Select(g => new
            {
                Total = g.Count(),
                Active = g.Count(x => !x.IsArchived),
                Archived = g.Count(x => x.IsArchived),
                Approved = g.Count(x => x.IsApprove == true),
                Rejected = g.Count(x => x.IsApprove == false),
                PendingApproval = g.Count(x => x.IsApprove == null),
                WithSafetyViolations = g.Count(x => x.SafetyViolationsExist)
            }).FirstOrDefaultAsync();

            var deletedCount = await _db.NewProjectDeleted.AsNoTracking().CountAsync();

            var distinctDistricts = await q.Where(x => x.District != null)
                .Select(x => x.District!).Distinct().ToListAsync();

            var distinctBranches = await q.Where(x => x.BranchName != null)
                .Select(x => x.BranchName!).Distinct().ToListAsync();

            var situationCounts = await q.GroupBy(x => x.Situation)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var qualificationClassificationCounts = await q.Where(x => x.QualificationClassification != null)
                .GroupBy(x => x.QualificationClassification)
                .Select(g => new StatusCountDto { Label = g.Key!, Count = g.Count() })
                .ToListAsync();

            return new NewProjectStatsDto
            {
                Total = agg?.Total ?? 0,
                Active = agg?.Active ?? 0,
                Archived = agg?.Archived ?? 0,
                Approved = agg?.Approved ?? 0,
                Rejected = agg?.Rejected ?? 0,
                PendingApproval = agg?.PendingApproval ?? 0,
                WithSafetyViolations = agg?.WithSafetyViolations ?? 0,
                DeletedCount = deletedCount,
                EstimatedValue = pricing?.EstVal ?? 0,
                ActualValue = pricing?.ActVal ?? 0,
                DistinctDistricts = distinctDistricts,
                DistinctBranches = distinctBranches,
                SituationCounts = situationCounts,
                QualificationClassificationCounts = qualificationClassificationCounts
            };
        }

        // ======================================================
        //  المشاريع الخاصة
        // ======================================================
        private async Task<PrivateProjectStatsDto> GetPrivateProjectStatsAsync()
        {
            var q = _db.PrivateProjects.AsNoTracking();

            var agg = await q.GroupBy(x => 1).Select(g => new
            {
                Total = g.Count(),
                Active = g.Count(x => !x.IsArchived),
                Archived = g.Count(x => x.IsArchived),
                Approved = g.Count(x => x.IsApprove == true),
                Rejected = g.Count(x => x.IsApprove == false),
                PendingApproval = g.Count(x => x.IsApprove == null),
                WithSafetyViolations = g.Count(x => x.SafetyViolationsExist)
            }).FirstOrDefaultAsync();

            var deletedCount = await _db.PrivateProjectDeleted.AsNoTracking().CountAsync();

            var projectValues = await q.Select(x => x.ProjectValue).ToListAsync();
            var estVal = projectValues.Sum(v => TryParseDouble(v));

            var distinctProjectPlaces = await q.Where(x => x.ProjectPlace != null)
                .Select(x => x.ProjectPlace!).Distinct().ToListAsync();

            var distinctBranches = await q.Where(x => x.BranchName != null)
                .Select(x => x.BranchName!).Distinct().ToListAsync();

            var customerCounts = await q.Where(x => x.Customer != null)
                .GroupBy(x => x.Customer)
                .Select(g => new StatusCountDto { Label = g.Key!, Count = g.Count() })
                .ToListAsync();

            return new PrivateProjectStatsDto
            {
                Total = agg?.Total ?? 0,
                Active = agg?.Active ?? 0,
                Archived = agg?.Archived ?? 0,
                Approved = agg?.Approved ?? 0,
                Rejected = agg?.Rejected ?? 0,
                PendingApproval = agg?.PendingApproval ?? 0,
                WithSafetyViolations = agg?.WithSafetyViolations ?? 0,
                DeletedCount = deletedCount,
                EstimatedValue = estVal,
                ActualValue = 0,
                DistinctProjectPlaces = distinctProjectPlaces,
                DistinctBranches = distinctBranches,
                CustomerCounts = customerCounts
            };
        }

        // ======================================================
        //  طلبات الإجازة
        // ======================================================
        private async Task<LeaveRequestStatsDto> GetLeaveRequestStatsAsync()
        {
            var q = _db.LeaveRequests.AsNoTracking();

            var agg = await q.GroupBy(x => 1).Select(g => new
            {
                Total = g.Count(),
                Approved = g.Count(x => x.Status == "Approved"),
                Rejected = g.Count(x => x.Status == "Rejected"),
                Pending = g.Count(x => x.Status == "Pending"),
                TotalDaysApproved = g.Where(x => x.Status == "Approved").Sum(x => (int?)x.NumberOfDays) ?? 0,
                TotalDaysPending = g.Where(x => x.Status == "Pending").Sum(x => (int?)x.NumberOfDays) ?? 0,
            }).FirstOrDefaultAsync();

            var monthlyGrouped = await q.GroupBy(x => new { x.RequestDate.Year, x.RequestDate.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    Approved = g.Count(x => x.Status == "Approved"),
                    Rejected = g.Count(x => x.Status == "Rejected"),
                    Pending = g.Count(x => x.Status == "Pending"),
                    TotalDays = g.Sum(x => x.NumberOfDays)
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month)
                .ToListAsync();

            var arCulture = CultureInfo.GetCultureInfo("ar-SA");
            var monthlyStats = monthlyGrouped.Select(x => new MonthlyLeaveDto
            {
                Year = x.Year,
                Month = x.Month,
                MonthName = arCulture.DateTimeFormat.GetMonthName(x.Month),
                Approved = x.Approved,
                Rejected = x.Rejected,
                Pending = x.Pending,
                TotalDays = x.TotalDays
            }).ToList();

            var perEmployee = await q.Where(x => x.EmployeeName != null)
                .GroupBy(x => x.EmployeeName)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            return new LeaveRequestStatsDto
            {
                Total = agg?.Total ?? 0,
                Approved = agg?.Approved ?? 0,
                Rejected = agg?.Rejected ?? 0,
                Pending = agg?.Pending ?? 0,
                TotalDaysApproved = agg?.TotalDaysApproved ?? 0,
                TotalDaysPending = agg?.TotalDaysPending ?? 0,
                MonthlyLeaveStats = monthlyStats,
                PerEmployeeCount = perEmployee,
            };
        }

        // ======================================================
        //  الحضور والانصراف
        // ======================================================
        private async Task<AttendanceStatsDto> GetAttendanceStatsAsync()
        {
            var q = _identityDb.Attendances.AsNoTracking();

            var totalRecords = await q.CountAsync();
            var currentlyCheckedIn = await q.CountAsync(x => x.CheckOutTime == null);
            var totalDistinctUsers = await q.Select(x => x.UserId).Distinct().CountAsync();

            var monthlyGrouped = await q.GroupBy(x => new { x.CheckInTime.Year, x.CheckInTime.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    CheckIns = g.Count(),
                    CheckOuts = g.Count(x => x.CheckOutTime.HasValue)
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month)
                .ToListAsync();

            var arCulture = CultureInfo.GetCultureInfo("ar-SA");
            var monthlyAttendance = monthlyGrouped.Select(g => new MonthlyAttendanceDto
            {
                Year = g.Year,
                Month = g.Month,
                MonthName = arCulture.DateTimeFormat.GetMonthName(g.Month),
                CheckIns = g.CheckIns,
                CheckOuts = g.CheckOuts
            }).ToList();

            var perUser = await q.Where(x => x.UserId != null)
                .GroupBy(x => x.UserId)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            return new AttendanceStatsDto
            {
                TotalRecords = totalRecords,
                CurrentlyCheckedIn = currentlyCheckedIn,
                TotalDistinctUsers = totalDistinctUsers,
                MonthlyAttendance = monthlyAttendance,
                AttendancePerUser = perUser,
            };
        }

        // ======================================================
        //  العهدات
        // ======================================================
        private async Task<CustodyStatsDto> GetCustodyStatsAsync()
        {
            var custAgg = await _db.Custodies.AsNoTracking()
                .GroupBy(x => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Open = g.Count(x => x.Status == "Open"),
                    Closed = g.Count(x => x.Status == "Closed"),
                    TotalAdvanceAmount = g.Sum(x => (decimal?)x.AdvanceAmount) ?? 0m,
                    OpenAdvanceAmount = g.Where(x => x.Status == "Open").Sum(x => (decimal?)x.AdvanceAmount) ?? 0m,
                    ClosedAdvanceAmount = g.Where(x => x.Status == "Closed").Sum(x => (decimal?)x.AdvanceAmount) ?? 0m,
                }).FirstOrDefaultAsync();

            var invAgg = await _db.CustodyInvoices.AsNoTracking()
                .GroupBy(x => 1)
                .Select(g => new
                {
                    TotalInvoices = g.Count(),
                    TotalInvoicesAmount = g.Sum(x => (decimal?)x.LineTotal) ?? 0m,
                    TotalVatAmount = g.Sum(x => (decimal?)(x.LineTotal - (x.Quantity * x.UnitPrice))) ?? 0m
                }).FirstOrDefaultAsync();

            return new CustodyStatsDto
            {
                Total = custAgg?.Total ?? 0,
                Open = custAgg?.Open ?? 0,
                Closed = custAgg?.Closed ?? 0,
                TotalAdvanceAmount = custAgg?.TotalAdvanceAmount ?? 0m,
                OpenAdvanceAmount = custAgg?.OpenAdvanceAmount ?? 0m,
                ClosedAdvanceAmount = custAgg?.ClosedAdvanceAmount ?? 0m,
                TotalInvoices = invAgg?.TotalInvoices ?? 0,
                TotalInvoicesAmount = invAgg?.TotalInvoicesAmount ?? 0m,
                TotalVatAmount = invAgg?.TotalVatAmount ?? 0m,
            };
        }

        // ======================================================
        //  المستخدمون
        // ======================================================
        private async Task<UsersStatsDto> GetUsersStatsAsync()
        {
            var total = await _identityDb.AppUsers.AsNoTracking().CountAsync();
            var withCanCreate = await _identityDb.AppUsers.AsNoTracking().CountAsync(x => x.CanCreateProjectOutsideCity);

            var perUserType = await _identityDb.AppUsers.AsNoTracking()
                .GroupBy(x => x.UserType ?? "غير محدد")
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var branchedGrouped = await _identityDb.AppUsers.AsNoTracking()
                .GroupBy(x => new { x.BranchId, UserType = x.UserType ?? "غير محدد" })
                .Select(g => new { g.Key.BranchId, g.Key.UserType, Count = g.Count() })
                .ToListAsync();

            var perUserTypeBranched = branchedGrouped
                .Select(g => new BranchedStatusCountDto
                {
                    BranchName = ResolveBranchName(g.BranchId),
                    Label = g.UserType,
                    Count = g.Count
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            var perBranchGrouped = await _identityDb.AppUsers.AsNoTracking()
                .GroupBy(x => x.BranchId)
                .Select(g => new { BranchId = g.Key, Count = g.Count() })
                .ToListAsync();

            var perBranch = perBranchGrouped
                .Select(g => new StatusCountDto { Label = ResolveBranchName(g.BranchId), Count = g.Count })
                .ToList();

            var perOffice = await _identityDb.AppUsers.AsNoTracking()
                .Where(x => x.OfficeId.HasValue)
                .GroupBy(x => x.OfficeId!.Value)
                .Select(g => new StatusCountDto { Label = $"مكتب {g.Key}", Count = g.Count() })
                .ToListAsync();

            return new UsersStatsDto
            {
                Total = total,
                WithCanCreateOutsideCity = withCanCreate,
                PerUserType = perUserType,
                PerUserTypeBranched = perUserTypeBranched,
                PerBranch = perBranch,
                PerOffice = perOffice,
            };
        }

        // ======================================================
        //  الموظفون
        // ======================================================
        private async Task<EmployeesStatsDto> GetEmployeesStatsAsync()
        {
            var total = await _db.Employees.AsNoTracking().CountAsync();

            var perProfession = await _db.Employees.AsNoTracking()
                .Where(x => x.WorkersProfession != null)
                .GroupBy(x => x.WorkersProfession!)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var perCity = await _db.Employees.AsNoTracking()
                .Where(x => x.City != null)
                .GroupBy(x => x.City!)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var today = DateTime.UtcNow.Date;
            var in30Days = today.AddDays(30);

            // الموظف هو الحساب. كان يُقرأ من EngineerProfiles وهو نسخة مكرّرة من
            // الحقول نفسها، فيختلف العدّ حسب أيّهما كُتب فيه آخر مرة.
            var engAgg = await _identityDb.Users.AsNoTracking()
                .Where(u => u.IsActiveEmployee)
                .GroupBy(x => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Expired = g.Count(x => x.ResidenceExpiryDate.HasValue && x.ResidenceExpiryDate.Value.Date < today),
                    Expiring = g.Count(x => x.ResidenceExpiryDate.HasValue && x.ResidenceExpiryDate.Value.Date >= today && x.ResidenceExpiryDate.Value.Date <= in30Days)
                }).FirstOrDefaultAsync();

            var engPerSpec = await _identityDb.Users.AsNoTracking()
                .Where(x => x.IsActiveEmployee && x.Specialization != null)
                .GroupBy(x => x.Specialization!)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var engPerJob = await _identityDb.Users.AsNoTracking()
                .Where(x => x.IsActiveEmployee && x.JobTitle != null)
                .GroupBy(x => x.JobTitle!)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            return new EmployeesStatsDto
            {
                Total = total,
                PerProfession = perProfession,
                PerCity = perCity,
                EngineersTotal = engAgg?.Total ?? 0,
                EngineersWithExpiredResidence = engAgg?.Expired ?? 0,
                EngineersWithExpiringResidence = engAgg?.Expiring ?? 0,
                EngineersPerSpecialization = engPerSpec,
                EngineersPerJobTitle = engPerJob,
            };
        }

        // ======================================================
        //  توزيع الفروع
        // ======================================================
        private async Task<List<BranchBreakdownDto>> GetBranchBreakdownAsync()
        {
            const string na = "غير محدد";

            var cBranches = await _db.Constructions.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var mBranches = await _db.Maintenances.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var eBranches = await _db.Emergencys.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var nBranches = await _db.NewProjects.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var pBranches = await _db.PrivateProjects.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var cPricing = await _db.ConstructionPricingItems.AsNoTracking()
                .Join(_db.Constructions.AsNoTracking(),
                    p => p.ConstructionId, c => c.Id,
                    (p, c) => new { Branch = c.BranchName ?? na, c.CreateAt.Year, c.CreateAt.Month, c.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 })
                .ToListAsync();

            var mPricing = await _db.MaintenancePricingItems.AsNoTracking()
                .Join(_db.Maintenances.AsNoTracking(),
                    p => p.MaintenanceId, m => m.Id,
                    (p, m) => new { Branch = m.BranchName ?? na, m.CreateAt.Year, m.CreateAt.Month, m.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 })
                .ToListAsync();

            var ePricing = await _db.EmergencyPricingItems.AsNoTracking()
                .Join(_db.Emergencys.AsNoTracking(),
                    p => p.EmergencyId, e => e.Id,
                    (p, e) => new { Branch = e.BranchName ?? na, e.CreateAt.Year, e.CreateAt.Month, e.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 })
                .ToListAsync();

            var nPricing = await _db.NewProjectPricingItems.AsNoTracking()
                .Join(_db.NewProjects.AsNoTracking(),
                    p => p.NewProjectId, n => n.Id,
                    (p, n) => new { Branch = n.BranchName ?? na, n.CreateAt.Year, n.CreateAt.Month, n.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 })
                .ToListAsync();

            var cDict = cBranches.ToDictionary(x => (x.Branch, x.Year, x.Month, x.Day), x => x.Count);
            var mDict = mBranches.ToDictionary(x => (x.Branch, x.Year, x.Month, x.Day), x => x.Count);
            var eDict = eBranches.ToDictionary(x => (x.Branch, x.Year, x.Month, x.Day), x => x.Count);
            var nDict = nBranches.ToDictionary(x => (x.Branch, x.Year, x.Month, x.Day), x => x.Count);
            var pDict = pBranches.ToDictionary(x => (x.Branch, x.Year, x.Month, x.Day), x => x.Count);

            var cPDict = cPricing.ToDictionary(x => (x.Branch, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));
            var mPDict = mPricing.ToDictionary(x => (x.Branch, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));
            var ePDict = ePricing.ToDictionary(x => (x.Branch, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));
            var nPDict = nPricing.ToDictionary(x => (x.Branch, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));

            var allKeys = cDict.Keys
                .Union(mDict.Keys)
                .Union(eDict.Keys)
                .Union(nDict.Keys)
                .Union(pDict.Keys)
                .Distinct()
                .ToList();

            return allKeys.Select(k =>
            {
                cDict.TryGetValue(k, out var cCount);
                mDict.TryGetValue(k, out var mCount);
                eDict.TryGetValue(k, out var eCount);
                nDict.TryGetValue(k, out var nCount);
                pDict.TryGetValue(k, out var pCount);

                cPDict.TryGetValue(k, out var cP);
                mPDict.TryGetValue(k, out var mP);
                ePDict.TryGetValue(k, out var eP);
                nPDict.TryGetValue(k, out var nP);

                return new BranchBreakdownDto
                {
                    Year = k.Year,
                    Month = k.Month,
                    Day = k.Day,
                    BranchName = k.Branch,
                    Construction = cCount,
                    Maintenance = mCount,
                    Emergency = eCount,
                    NewProject = nCount,
                    PrivateProject = pCount,
                    Total = cCount + mCount + eCount + nCount + pCount,
                    EstimatedValue = cP.EstVal + mP.EstVal + eP.EstVal + nP.EstVal,
                    ActualValue = cP.ActVal + mP.ActVal + eP.ActVal + nP.ActVal,
                };
            }).OrderBy(x => x.Year).ThenBy(x => x.Month).ThenBy(x => x.Day).ThenByDescending(x => x.Total).ToList();
        }

        // ======================================================
        //  توزيع الاستشاريين
        // ======================================================
        private async Task<List<ConsultantBreakdownDto>> GetConsultantBreakdownAsync()
        {
            const string na = "غير محدد";

            var cQ = await _db.Constructions.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, Consultant = x.Consultant ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mQ = await _db.Maintenances.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, Consultant = x.Consultant ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eQ = await _db.Emergencys.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, Consultant = x.Consultant ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nQ = await _db.NewProjects.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, Consultant = x.Consultant ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var pQ = await _db.PrivateProjects.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, Consultant = x.Consultant ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var cP = await _db.ConstructionPricingItems.AsNoTracking()
                .Join(_db.Constructions.AsNoTracking(),
                    p => p.ConstructionId, c => c.Id,
                    (p, c) => new { Branch = c.BranchName ?? na, Consultant = c.Consultant ?? na, c.CreateAt.Year, c.CreateAt.Month, c.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Consultant, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 }).ToListAsync();

            var mP = await _db.MaintenancePricingItems.AsNoTracking()
                .Join(_db.Maintenances.AsNoTracking(),
                    p => p.MaintenanceId, m => m.Id,
                    (p, m) => new { Branch = m.BranchName ?? na, Consultant = m.Consultant ?? na, m.CreateAt.Year, m.CreateAt.Month, m.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Consultant, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 }).ToListAsync();

            var eP = await _db.EmergencyPricingItems.AsNoTracking()
                .Join(_db.Emergencys.AsNoTracking(),
                    p => p.EmergencyId, e => e.Id,
                    (p, e) => new { Branch = e.BranchName ?? na, Consultant = e.Consultant ?? na, e.CreateAt.Year, e.CreateAt.Month, e.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Consultant, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 }).ToListAsync();

            var nP = await _db.NewProjectPricingItems.AsNoTracking()
                .Join(_db.NewProjects.AsNoTracking(),
                    p => p.NewProjectId, n => n.Id,
                    (p, n) => new { Branch = n.BranchName ?? na, Consultant = n.Consultant ?? na, n.CreateAt.Year, n.CreateAt.Month, n.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Consultant, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 }).ToListAsync();

            var cDict = cQ.ToDictionary(x => (x.Branch, x.Consultant, x.Year, x.Month, x.Day), x => x.Count);
            var mDict = mQ.ToDictionary(x => (x.Branch, x.Consultant, x.Year, x.Month, x.Day), x => x.Count);
            var eDict = eQ.ToDictionary(x => (x.Branch, x.Consultant, x.Year, x.Month, x.Day), x => x.Count);
            var nDict = nQ.ToDictionary(x => (x.Branch, x.Consultant, x.Year, x.Month, x.Day), x => x.Count);
            var pDict = pQ.ToDictionary(x => (x.Branch, x.Consultant, x.Year, x.Month, x.Day), x => x.Count);

            var cPDict = cP.ToDictionary(x => (x.Branch, x.Consultant, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));
            var mPDict = mP.ToDictionary(x => (x.Branch, x.Consultant, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));
            var ePDict = eP.ToDictionary(x => (x.Branch, x.Consultant, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));
            var nPDict = nP.ToDictionary(x => (x.Branch, x.Consultant, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));

            var allKeys = cDict.Keys.Union(mDict.Keys).Union(eDict.Keys).Union(nDict.Keys).Union(pDict.Keys).Distinct().ToList();

            return allKeys.Select(k =>
            {
                cDict.TryGetValue(k, out var cCount);
                mDict.TryGetValue(k, out var mCount);
                eDict.TryGetValue(k, out var eCount);
                nDict.TryGetValue(k, out var nCount);
                pDict.TryGetValue(k, out var pCount);

                cPDict.TryGetValue(k, out var cPVal);
                mPDict.TryGetValue(k, out var mPVal);
                ePDict.TryGetValue(k, out var ePVal);
                nPDict.TryGetValue(k, out var nPVal);

                return new ConsultantBreakdownDto
                {
                    Year = k.Year,
                    Month = k.Month,
                    Day = k.Day,
                    BranchName = k.Branch,
                    ConsultantName = k.Consultant,
                    Construction = cCount,
                    Maintenance = mCount,
                    Emergency = eCount,
                    NewProject = nCount,
                    PrivateProject = pCount,
                    Total = cCount + mCount + eCount + nCount + pCount,
                    EstimatedValue = cPVal.EstVal + mPVal.EstVal + ePVal.EstVal + nPVal.EstVal,
                    ActualValue = cPVal.ActVal + mPVal.ActVal + ePVal.ActVal + nPVal.ActVal,
                };
            }).OrderBy(x => x.Year).ThenBy(x => x.Month).ThenBy(x => x.Day).ThenByDescending(x => x.Total).ToList();
        }

        // ======================================================
        //  توزيع المقاولين
        // ======================================================
        private async Task<List<ContractorBreakdownDto>> GetContractorBreakdownAsync()
        {
            const string na = "غير محدد";

            var cQ = await _db.Constructions.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, Contractor = x.Contractor ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mQ = await _db.Maintenances.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, Contractor = x.Contractor ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eQ = await _db.Emergencys.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, Contractor = x.Contractor ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nQ = await _db.NewProjects.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, Contractor = x.Contractor ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var pQ = await _db.PrivateProjects.AsNoTracking()
                .GroupBy(x => new { Branch = x.BranchName ?? na, Contractor = x.Contractor ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var cP = await _db.ConstructionPricingItems.AsNoTracking()
                .Join(_db.Constructions.AsNoTracking(),
                    p => p.ConstructionId, c => c.Id,
                    (p, c) => new { Branch = c.BranchName ?? na, Contractor = c.Contractor ?? na, c.CreateAt.Year, c.CreateAt.Month, c.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Contractor, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 }).ToListAsync();

            var mP = await _db.MaintenancePricingItems.AsNoTracking()
                .Join(_db.Maintenances.AsNoTracking(),
                    p => p.MaintenanceId, m => m.Id,
                    (p, m) => new { Branch = m.BranchName ?? na, Contractor = m.Contractor ?? na, m.CreateAt.Year, m.CreateAt.Month, m.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Contractor, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 }).ToListAsync();

            var eP = await _db.EmergencyPricingItems.AsNoTracking()
                .Join(_db.Emergencys.AsNoTracking(),
                    p => p.EmergencyId, e => e.Id,
                    (p, e) => new { Branch = e.BranchName ?? na, Contractor = e.Contractor ?? na, e.CreateAt.Year, e.CreateAt.Month, e.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Contractor, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 }).ToListAsync();

            var nP = await _db.NewProjectPricingItems.AsNoTracking()
                .Join(_db.NewProjects.AsNoTracking(),
                    p => p.NewProjectId, n => n.Id,
                    (p, n) => new { Branch = n.BranchName ?? na, Contractor = n.Contractor ?? na, n.CreateAt.Year, n.CreateAt.Month, n.CreateAt.Day, EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => new { x.Branch, x.Contractor, x.Year, x.Month, x.Day })
                .Select(g => new { g.Key.Branch, g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 }).ToListAsync();

            var cDict = cQ.ToDictionary(x => (x.Branch, x.Contractor, x.Year, x.Month, x.Day), x => x.Count);
            var mDict = mQ.ToDictionary(x => (x.Branch, x.Contractor, x.Year, x.Month, x.Day), x => x.Count);
            var eDict = eQ.ToDictionary(x => (x.Branch, x.Contractor, x.Year, x.Month, x.Day), x => x.Count);
            var nDict = nQ.ToDictionary(x => (x.Branch, x.Contractor, x.Year, x.Month, x.Day), x => x.Count);
            var pDict = pQ.ToDictionary(x => (x.Branch, x.Contractor, x.Year, x.Month, x.Day), x => x.Count);

            var cPDict = cP.ToDictionary(x => (x.Branch, x.Contractor, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));
            var mPDict = mP.ToDictionary(x => (x.Branch, x.Contractor, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));
            var ePDict = eP.ToDictionary(x => (x.Branch, x.Contractor, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));
            var nPDict = nP.ToDictionary(x => (x.Branch, x.Contractor, x.Year, x.Month, x.Day), x => (x.EstVal, x.ActVal));

            var allKeys = cDict.Keys.Union(mDict.Keys).Union(eDict.Keys).Union(nDict.Keys).Union(pDict.Keys).Distinct().ToList();

            return allKeys.Select(k =>
            {
                cDict.TryGetValue(k, out var cCount);
                mDict.TryGetValue(k, out var mCount);
                eDict.TryGetValue(k, out var eCount);
                nDict.TryGetValue(k, out var nCount);
                pDict.TryGetValue(k, out var pCount);

                cPDict.TryGetValue(k, out var cPVal);
                mPDict.TryGetValue(k, out var mPVal);
                ePDict.TryGetValue(k, out var ePVal);
                nPDict.TryGetValue(k, out var nPVal);

                return new ContractorBreakdownDto
                {
                    Year = k.Year,
                    Month = k.Month,
                    Day = k.Day,
                    BranchName = k.Branch,
                    ContractorName = k.Contractor,
                    Construction = cCount,
                    Maintenance = mCount,
                    Emergency = eCount,
                    NewProject = nCount,
                    PrivateProject = pCount,
                    Total = cCount + mCount + eCount + nCount + pCount,
                    EstimatedValue = cPVal.EstVal + mPVal.EstVal + ePVal.EstVal + nPVal.EstVal,
                    ActualValue = cPVal.ActVal + mPVal.ActVal + ePVal.ActVal + nPVal.ActVal,
                };
            }).OrderBy(x => x.Year).ThenBy(x => x.Month).ThenBy(x => x.Day).ThenByDescending(x => x.Total).ToList();
        }

        // ======================================================
        //  الاتجاه الشهري (آخر 24 شهر)
        // ======================================================
        private async Task<List<MonthlyTrendDto>> GetMonthlyTrendAsync()
        {
            const string na = "غير محدد";

            var cRaw = await _db.Constructions.AsNoTracking()
                .GroupBy(x => new {
                    x.CreateAt.Year,
                    x.CreateAt.Month,
                    x.CreateAt.Day,
                    Branch = x.BranchName ?? na,
                    Office = x.Office ?? na,
                    Contractor = x.Contractor ?? na,
                    Consultant = x.Consultant ?? na
                })
                .Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

            var mRaw = await _db.Maintenances.AsNoTracking()
                .GroupBy(x => new {
                    x.CreateAt.Year,
                    x.CreateAt.Month,
                    x.CreateAt.Day,
                    Branch = x.BranchName ?? na,
                    Office = x.Office ?? na,
                    Contractor = x.Contractor ?? na,
                    Consultant = x.Consultant ?? na
                })
                .Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

            var eRaw = await _db.Emergencys.AsNoTracking()
                .GroupBy(x => new {
                    x.CreateAt.Year,
                    x.CreateAt.Month,
                    x.CreateAt.Day,
                    Branch = x.BranchName ?? na,
                    Office = x.Office ?? na,
                    Contractor = x.Contractor ?? na,
                    Consultant = x.Consultant ?? na
                })
                .Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

            var nRaw = await _db.NewProjects.AsNoTracking()
                .GroupBy(x => new {
                    x.CreateAt.Year,
                    x.CreateAt.Month,
                    x.CreateAt.Day,
                    Branch = x.BranchName ?? na,
                    Office = x.Office ?? na,
                    Contractor = x.Contractor ?? na,
                    Consultant = x.Consultant ?? na
                })
                .Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

            var pRaw = await _db.PrivateProjects.AsNoTracking()
                .GroupBy(x => new {
                    x.CreateAt.Year,
                    x.CreateAt.Month,
                    x.CreateAt.Day,
                    Branch = x.BranchName ?? na,
                    Office = na,
                    Contractor = x.Contractor ?? na,
                    Consultant = x.Consultant ?? na
                })
                .Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

            var cCounts = cRaw.ToDictionary(g => (g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Branch, g.Key.Office, g.Key.Contractor, g.Key.Consultant), g => g.Count);
            var mCounts = mRaw.ToDictionary(g => (g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Branch, g.Key.Office, g.Key.Contractor, g.Key.Consultant), g => g.Count);
            var eCounts = eRaw.ToDictionary(g => (g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Branch, g.Key.Office, g.Key.Contractor, g.Key.Consultant), g => g.Count);
            var nCounts = nRaw.ToDictionary(g => (g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Branch, g.Key.Office, g.Key.Contractor, g.Key.Consultant), g => g.Count);
            var pCounts = pRaw.ToDictionary(g => (g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Branch, g.Key.Office, g.Key.Contractor, g.Key.Consultant), g => g.Count);

            var periods = cCounts.Keys
                .Union(mCounts.Keys).Union(eCounts.Keys)
                .Union(nCounts.Keys).Union(pCounts.Keys)
                .OrderBy(x => x.Year).ThenBy(x => x.Month).ThenBy(x => x.Day)
                .ThenBy(x => x.Branch).ThenBy(x => x.Office)
                .ThenBy(x => x.Contractor).ThenBy(x => x.Consultant)
                .ToList();

            var arCulture = CultureInfo.GetCultureInfo("ar-SA");

            return periods.Select(p =>
            {
                cCounts.TryGetValue(p, out var cCount);
                mCounts.TryGetValue(p, out var mCount);
                eCounts.TryGetValue(p, out var eCount);
                nCounts.TryGetValue(p, out var nCount);
                pCounts.TryGetValue(p, out var pCount);

                return new MonthlyTrendDto
                {
                    Year = p.Year,
                    Month = p.Month,
                    Day = p.Day,
                    MonthName = arCulture.DateTimeFormat.GetMonthName(p.Month),
                    BranchName = p.Branch,
                    Office = p.Office,
                    Contractor = p.Contractor,
                    Consultant = p.Consultant,
                    Construction = cCount,
                    Maintenance = mCount,
                    Emergency = eCount,
                    NewProject = nCount,
                    PrivateProject = pCount,
                    Total = cCount + mCount + eCount + nCount + pCount,
                };
            }).ToList();
        }

        // ======================================================
        //  توزيع الحالات (Situation) الكلي
        // ======================================================
        private async Task<List<SituationBreakdownDto>> GetSituationBreakdownAsync()
        {
            var result = new List<SituationBreakdownDto>();

            var cPricing = await _db.ConstructionPricingItems.AsNoTracking()
                .Join(_db.Constructions.AsNoTracking(), p => p.ConstructionId, c => c.Id,
                    (p, c) => new { Situation = c.Situation ?? "غير محدد", EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => x.Situation)
                .Select(g => new { Situation = g.Key, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 })
                .ToDictionaryAsync(x => x.Situation, x => (x.EstVal, x.ActVal));

            var cSit = await _db.Constructions.AsNoTracking()
                .GroupBy(x => x.Situation)
                .Select(g => new { Situation = g.Key, Count = g.Count() }).ToListAsync();
            result.AddRange(cSit.Select(x => {
                cPricing.TryGetValue(x.Situation ?? "غير محدد", out var pr);
                return new SituationBreakdownDto
                {
                    Situation = x.Situation,
                    ProjectType = "الإنشاءات",
                    Count = x.Count,
                    EstimatedValue = pr.EstVal,
                    ActualValue = pr.ActVal
                };
            }));

            var mPricing = await _db.MaintenancePricingItems.AsNoTracking()
                .Join(_db.Maintenances.AsNoTracking(), p => p.MaintenanceId, m => m.Id,
                    (p, m) => new { Situation = m.Situation ?? "غير محدد", EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => x.Situation)
                .Select(g => new { Situation = g.Key, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 })
                .ToDictionaryAsync(x => x.Situation, x => (x.EstVal, x.ActVal));

            var mSit = await _db.Maintenances.AsNoTracking()
                .GroupBy(x => x.Situation)
                .Select(g => new { Situation = g.Key, Count = g.Count() }).ToListAsync();
            result.AddRange(mSit.Select(x => {
                mPricing.TryGetValue(x.Situation ?? "غير محدد", out var pr);
                return new SituationBreakdownDto
                {
                    Situation = x.Situation,
                    ProjectType = "الصيانة",
                    Count = x.Count,
                    EstimatedValue = pr.EstVal,
                    ActualValue = pr.ActVal
                };
            }));

            var ePricing = await _db.EmergencyPricingItems.AsNoTracking()
                .Join(_db.Emergencys.AsNoTracking(), p => p.EmergencyId, e => e.Id,
                    (p, e) => new { Situation = e.Situation ?? "غير محدد", EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => x.Situation)
                .Select(g => new { Situation = g.Key, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 })
                .ToDictionaryAsync(x => x.Situation, x => (x.EstVal, x.ActVal));

            var eSit = await _db.Emergencys.AsNoTracking()
                .GroupBy(x => x.Situation)
                .Select(g => new { Situation = g.Key, Count = g.Count() }).ToListAsync();
            result.AddRange(eSit.Select(x => {
                ePricing.TryGetValue(x.Situation ?? "غير محدد", out var pr);
                return new SituationBreakdownDto
                {
                    Situation = x.Situation,
                    ProjectType = "الطوارئ",
                    Count = x.Count,
                    EstimatedValue = pr.EstVal,
                    ActualValue = pr.ActVal
                };
            }));

            var nPricing = await _db.NewProjectPricingItems.AsNoTracking()
                .Join(_db.NewProjects.AsNoTracking(), p => p.NewProjectId, n => n.Id,
                    (p, n) => new { Situation = n.Situation ?? "غير محدد", EstVal = (double?)(p.TotalPrice ?? 0), ActVal = (double?)(p.ExecutedWorksValue ?? 0) })
                .GroupBy(x => x.Situation)
                .Select(g => new { Situation = g.Key, EstVal = g.Sum(x => x.EstVal) ?? 0, ActVal = g.Sum(x => x.ActVal) ?? 0 })
                .ToDictionaryAsync(x => x.Situation, x => (x.EstVal, x.ActVal));

            var nSit = await _db.NewProjects.AsNoTracking()
                .GroupBy(x => x.Situation)
                .Select(g => new { Situation = g.Key, Count = g.Count() }).ToListAsync();
            result.AddRange(nSit.Select(x => {
                nPricing.TryGetValue(x.Situation ?? "غير محدد", out var pr);
                return new SituationBreakdownDto
                {
                    Situation = x.Situation,
                    ProjectType = "أعمال التأهيل",
                    Count = x.Count,
                    EstimatedValue = pr.EstVal,
                    ActualValue = pr.ActVal
                };
            }));

            return result.OrderByDescending(x => x.Count).ToList();
        }

        // ======================================================
        //  السلامة
        // ======================================================
        private async Task<SafetyStatsDto> GetSafetyStatsAsync()
        {
            var cV = await _db.Constructions.AsNoTracking()
                .Where(x => x.SafetyViolationsExist)
                .GroupBy(x => x.BranchName ?? "غير محدد")
                .Select(g => new { Branch = g.Key, Count = g.Count() }).ToListAsync();

            var mV = await _db.Maintenances.AsNoTracking()
                .CountAsync(x => x.SafetyViolationsExist);
            var eV = await _db.Emergencys.AsNoTracking()
                .CountAsync(x => x.SafetyViolationsExist);
            var nV = await _db.NewProjects.AsNoTracking()
                .CountAsync(x => x.SafetyViolationsExist);
            var pV = await _db.PrivateProjects.AsNoTracking()
                .CountAsync(x => x.SafetyViolationsExist);
            int cCount = cV.Sum(x => x.Count);

            return new SafetyStatsDto
            {
                ConstructionViolations = cCount,
                MaintenanceViolations = mV,
                EmergencyViolations = eV,
                NewProjectViolations = nV,
                PrivateProjectViolations = pV,
                TotalViolations = cCount + mV + eV + nV + pV,
                ViolationsPerBranch = cV.Select(x => new StatusCountDto
                { Label = x.Branch, Count = x.Count }).ToList(),
            };
        }

        // ======================================================
        //  GetFilteredStatsAsync — الفلترة الشاملة السريعة
        // ======================================================
        public async Task<FilteredDashboardStatsDto> GetFilteredStatsAsync(DashboardFilterDto f)
        {
            var arCulture = CultureInfo.GetCultureInfo("ar-SA");

            (DateTime? from, DateTime? to) BuildDateRange()
            {
                if (f.DateFrom.HasValue || f.DateTo.HasValue)
                    return (f.DateFrom, f.DateTo.HasValue ? f.DateTo.Value.Date.AddDays(1).AddTicks(-1) : (DateTime?)null);
                if (f.Year.HasValue && f.Month.HasValue)
                {
                    var start = new DateTime(f.Year.Value, f.Month.Value, 1);
                    return (start, start.AddMonths(1).AddTicks(-1));
                }
                if (f.Year.HasValue)
                {
                    var start = new DateTime(f.Year.Value, 1, 1);
                    return (start, start.AddYears(1).AddTicks(-1));
                }
                return (null, null);
            }

            var (dateFrom, dateTo) = BuildDateRange();

            bool wantConstruction = f.ProjectType == null || f.ProjectType == "Construction";
            bool wantMaintenance = f.ProjectType == null || f.ProjectType == "Maintenance";
            bool wantEmergency = f.ProjectType == null || f.ProjectType == "Emergency";
            bool wantNewProject = f.ProjectType == null || f.ProjectType == "NewProject";
            bool wantPrivateProject = f.ProjectType == null || f.ProjectType == "PrivateProject";

            // ── Constructions ─────────────────────────────────────────────
            var cq = _db.Constructions.AsNoTracking().AsQueryable();
            if (wantConstruction)
            {
                if (dateFrom.HasValue) cq = cq.Where(x => x.CreateAt >= dateFrom.Value);
                if (dateTo.HasValue) cq = cq.Where(x => x.CreateAt <= dateTo.Value);
                if (!string.IsNullOrEmpty(f.BranchName)) cq = cq.Where(x => x.BranchName == f.BranchName);
                if (!string.IsNullOrEmpty(f.Office)) cq = cq.Where(x => x.Office == f.Office);
                if (!string.IsNullOrEmpty(f.District)) cq = cq.Where(x => x.District == f.District);
                if (!string.IsNullOrEmpty(f.Contractor)) cq = cq.Where(x => x.Contractor == f.Contractor);
                if (!string.IsNullOrEmpty(f.Consultant)) cq = cq.Where(x => x.Consultant == f.Consultant);
                if (!string.IsNullOrEmpty(f.UserName)) cq = cq.Where(x => x.UserName == f.UserName);
                if (!string.IsNullOrEmpty(f.Situation)) cq = cq.Where(x => x.Situation == f.Situation);
                if (!string.IsNullOrEmpty(f.WorkOrderType)) cq = cq.Where(x => x.WorkOrderType == f.WorkOrderType);
                if (f.IsApprove.HasValue) cq = cq.Where(x => x.IsApprove == f.IsApprove.Value);
                if (f.IsArchived.HasValue) cq = cq.Where(x => x.IsArchived == f.IsArchived.Value);
                if (f.HasSafetyViolation == true) cq = cq.Where(x => x.SafetyViolationsExist);
                if (f.ContractNumbers != null && f.ContractNumbers.Any())
                {
                    var contracts = f.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                    if (contracts.Any()) cq = cq.Where(x => x.ContractNumber != null && contracts.Contains(x.ContractNumber));
                }
                else if (!string.IsNullOrWhiteSpace(f.ContractNumber))
                {
                    var cn = f.ContractNumber.Trim();
                    cq = cq.Where(x => x.ContractNumber == cn);
                }
            }
            else cq = cq.Where(x => false);

            var cResult = await BuildProjectTypeResult(cq);

            var cEstVal = await _db.ConstructionPricingItems.AsNoTracking()
                .Where(p => cq.Select(x => x.Id).Contains(p.ConstructionId))
                .SumAsync(p => (double?)(p.TotalPrice ?? 0)) ?? 0;
            var cActVal = await _db.ConstructionPricingItems.AsNoTracking()
                .Where(p => cq.Select(x => x.Id).Contains(p.ConstructionId))
                .SumAsync(p => (double?)(p.ExecutedWorksValue ?? 0)) ?? 0;
            cResult.EstimatedValue = cEstVal;
            cResult.ActualValue = cActVal;

            // ── Maintenances ──────────────────────────────────────────────
            var mq = _db.Maintenances.AsNoTracking().AsQueryable();
            if (wantMaintenance)
            {
                if (dateFrom.HasValue) mq = mq.Where(x => x.CreateAt >= dateFrom.Value);
                if (dateTo.HasValue) mq = mq.Where(x => x.CreateAt <= dateTo.Value);
                if (!string.IsNullOrEmpty(f.BranchName)) mq = mq.Where(x => x.BranchName == f.BranchName);
                if (!string.IsNullOrEmpty(f.Office)) mq = mq.Where(x => x.Office == f.Office);
                if (!string.IsNullOrEmpty(f.District)) mq = mq.Where(x => x.District == f.District);
                if (!string.IsNullOrEmpty(f.Contractor)) mq = mq.Where(x => x.Contractor == f.Contractor);
                if (!string.IsNullOrEmpty(f.Consultant)) mq = mq.Where(x => x.Consultant == f.Consultant);
                if (!string.IsNullOrEmpty(f.UserName)) mq = mq.Where(x => x.UserName == f.UserName);
                if (!string.IsNullOrEmpty(f.Situation)) mq = mq.Where(x => x.Situation == f.Situation);
                if (!string.IsNullOrEmpty(f.WorkOrderType)) mq = mq.Where(x => x.WorkOrderType == f.WorkOrderType);
                if (f.IsApprove.HasValue) mq = mq.Where(x => x.IsApprove == f.IsApprove.Value);
                if (f.IsArchived.HasValue) mq = mq.Where(x => x.IsArchived == f.IsArchived.Value);
                if (f.HasSafetyViolation == true) mq = mq.Where(x => x.SafetyViolationsExist);
                if (f.ContractNumbers != null && f.ContractNumbers.Any())
                {
                    var contracts = f.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                    if (contracts.Any()) mq = mq.Where(x => x.ContractNumber != null && contracts.Contains(x.ContractNumber));
                }
                else if (!string.IsNullOrWhiteSpace(f.ContractNumber))
                {
                    var cn = f.ContractNumber.Trim();
                    mq = mq.Where(x => x.ContractNumber == cn);
                }
            }
            else mq = mq.Where(x => false);

            var mResult = await BuildProjectTypeResult(mq);

            var mEstVal = await _db.MaintenancePricingItems.AsNoTracking()
                .Where(p => mq.Select(x => x.Id).Contains(p.MaintenanceId))
                .SumAsync(p => (double?)(p.TotalPrice ?? 0)) ?? 0;
            var mActVal = await _db.MaintenancePricingItems.AsNoTracking()
                .Where(p => mq.Select(x => x.Id).Contains(p.MaintenanceId))
                .SumAsync(p => (double?)(p.ExecutedWorksValue ?? 0)) ?? 0;
            mResult.EstimatedValue = mEstVal;
            mResult.ActualValue = mActVal;

            // ── Emergencies ───────────────────────────────────────────────
            var eq = _db.Emergencys.AsNoTracking().AsQueryable();
            if (wantEmergency)
            {
                if (dateFrom.HasValue) eq = eq.Where(x => x.CreateAt >= dateFrom.Value);
                if (dateTo.HasValue) eq = eq.Where(x => x.CreateAt <= dateTo.Value);
                if (!string.IsNullOrEmpty(f.BranchName)) eq = eq.Where(x => x.BranchName == f.BranchName);
                if (!string.IsNullOrEmpty(f.Office)) eq = eq.Where(x => x.Office == f.Office);
                if (!string.IsNullOrEmpty(f.District)) eq = eq.Where(x => x.District == f.District);
                if (!string.IsNullOrEmpty(f.Contractor)) eq = eq.Where(x => x.Contractor == f.Contractor);
                if (!string.IsNullOrEmpty(f.Consultant)) eq = eq.Where(x => x.Consultant == f.Consultant);
                if (!string.IsNullOrEmpty(f.UserName)) eq = eq.Where(x => x.UserName == f.UserName);
                if (!string.IsNullOrEmpty(f.Situation)) eq = eq.Where(x => x.Situation == f.Situation);
                if (!string.IsNullOrEmpty(f.WorkOrderType)) eq = eq.Where(x => x.WorkOrderType == f.WorkOrderType);
                if (f.IsApprove.HasValue) eq = eq.Where(x => x.IsApprove == f.IsApprove.Value);
                if (f.IsArchived.HasValue) eq = eq.Where(x => x.IsArchived == f.IsArchived.Value);
                if (f.HasSafetyViolation == true) eq = eq.Where(x => x.SafetyViolationsExist);
                if (f.ContractNumbers != null && f.ContractNumbers.Any())
                {
                    var contracts = f.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                    if (contracts.Any()) eq = eq.Where(x => x.ContractNumber != null && contracts.Contains(x.ContractNumber));
                }
                else if (!string.IsNullOrWhiteSpace(f.ContractNumber))
                {
                    var cn = f.ContractNumber.Trim();
                    eq = eq.Where(x => x.ContractNumber == cn);
                }
            }
            else eq = eq.Where(x => false);

            var eResult = await BuildProjectTypeResult(eq);

            var eEstVal = await _db.EmergencyPricingItems.AsNoTracking()
                .Where(p => eq.Select(x => x.Id).Contains(p.EmergencyId))
                .SumAsync(p => (double?)(p.TotalPrice ?? 0)) ?? 0;
            var eActVal = await _db.EmergencyPricingItems.AsNoTracking()
                .Where(p => eq.Select(x => x.Id).Contains(p.EmergencyId))
                .SumAsync(p => (double?)(p.ExecutedWorksValue ?? 0)) ?? 0;
            eResult.EstimatedValue = eEstVal;
            eResult.ActualValue = eActVal;

            // ── NewProjects ───────────────────────────────────────────────
            var nq = _db.NewProjects.AsNoTracking().AsQueryable();
            if (wantNewProject)
            {
                if (dateFrom.HasValue) nq = nq.Where(x => x.CreateAt >= dateFrom.Value);
                if (dateTo.HasValue) nq = nq.Where(x => x.CreateAt <= dateTo.Value);
                if (!string.IsNullOrEmpty(f.BranchName)) nq = nq.Where(x => x.BranchName == f.BranchName);
                if (!string.IsNullOrEmpty(f.Office)) nq = nq.Where(x => x.Office == f.Office);
                if (!string.IsNullOrEmpty(f.District)) nq = nq.Where(x => x.District == f.District);
                if (!string.IsNullOrEmpty(f.Contractor)) nq = nq.Where(x => x.Contractor == f.Contractor);
                if (!string.IsNullOrEmpty(f.Consultant)) nq = nq.Where(x => x.Consultant == f.Consultant);
                if (!string.IsNullOrEmpty(f.UserName)) nq = nq.Where(x => x.UserName == f.UserName);
                if (!string.IsNullOrEmpty(f.Situation)) nq = nq.Where(x => x.Situation == f.Situation);
                if (!string.IsNullOrEmpty(f.WorkOrderType)) nq = nq.Where(x => x.WorkOrderType == f.WorkOrderType);
                if (f.IsApprove.HasValue) nq = nq.Where(x => x.IsApprove == f.IsApprove.Value);
                if (f.IsArchived.HasValue) nq = nq.Where(x => x.IsArchived == f.IsArchived.Value);
                if (f.HasSafetyViolation == true) nq = nq.Where(x => x.SafetyViolationsExist);
                if (f.ContractNumbers != null && f.ContractNumbers.Any())
                {
                    var contracts = f.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                    if (contracts.Any()) nq = nq.Where(x => x.ContractNumber != null && contracts.Contains(x.ContractNumber));
                }
                else if (!string.IsNullOrWhiteSpace(f.ContractNumber))
                {
                    var cn = f.ContractNumber.Trim();
                    nq = nq.Where(x => x.ContractNumber == cn);
                }
            }
            else nq = nq.Where(x => false);

            var nResult = await BuildProjectTypeResult(nq);

            var nEstVal = await _db.NewProjectPricingItems.AsNoTracking()
                .Where(p => nq.Select(x => x.Id).Contains(p.NewProjectId))
                .SumAsync(p => (double?)(p.TotalPrice ?? 0)) ?? 0;
            var nActVal = await _db.NewProjectPricingItems.AsNoTracking()
                .Where(p => nq.Select(x => x.Id).Contains(p.NewProjectId))
                .SumAsync(p => (double?)(p.ExecutedWorksValue ?? 0)) ?? 0;
            nResult.EstimatedValue = nEstVal;
            nResult.ActualValue = nActVal;

            // ── PrivateProjects ───────────────────────────────────────────
            var pq = _db.PrivateProjects.AsNoTracking().AsQueryable();
            if (wantPrivateProject)
            {
                if (dateFrom.HasValue) pq = pq.Where(x => x.CreateAt >= dateFrom.Value);
                if (dateTo.HasValue) pq = pq.Where(x => x.CreateAt <= dateTo.Value);
                if (!string.IsNullOrEmpty(f.BranchName)) pq = pq.Where(x => x.BranchName == f.BranchName);
                if (!string.IsNullOrEmpty(f.Contractor)) pq = pq.Where(x => x.Contractor == f.Contractor);
                if (!string.IsNullOrEmpty(f.Consultant)) pq = pq.Where(x => x.Consultant == f.Consultant);
                if (!string.IsNullOrEmpty(f.UserName)) pq = pq.Where(x => x.UserName == f.UserName);
                if (f.IsApprove.HasValue) pq = pq.Where(x => x.IsApprove == f.IsApprove.Value);
                if (f.IsArchived.HasValue) pq = pq.Where(x => x.IsArchived == f.IsArchived.Value);
                if (f.HasSafetyViolation == true) pq = pq.Where(x => x.SafetyViolationsExist);
                if (f.ContractNumbers != null && f.ContractNumbers.Any())
                {
                    var contracts = f.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                    if (contracts.Any()) pq = pq.Where(x => x.ContractNumber != null && contracts.Contains(x.ContractNumber));
                }
                else if (!string.IsNullOrWhiteSpace(f.ContractNumber))
                {
                    var cn = f.ContractNumber.Trim();
                    pq = pq.Where(x => x.ContractNumber == cn);
                }
            }
            else pq = pq.Where(x => false);

            var pResult = await BuildProjectTypeResult(pq);

            // ── القيم الإجمالية ────────────────────────────────────────────
            double totalEst = cEstVal + mEstVal + eEstVal + nEstVal;
            double totalAct = cActVal + mActVal + eActVal + nActVal;

            // ── القيم المالية التفصيلية من PricingItems و PrivateProjects المفلترة (مع التاريخ) ────────────
            var cPricingFiltered = await _db.ConstructionPricingItems.AsNoTracking()
                .Where(p => cq.Select(x => x.Id).Contains(p.ConstructionId))
                .Join(cq, p => p.ConstructionId, c => c.Id,
                    (p, c) => new {
                        Branch = c.BranchName ?? "غير محدد",
                        Contractor = c.Contractor,
                        Consultant = c.Consultant,
                        Office = c.Office,
                        District = c.District,
                        Situation = c.Situation,
                        WorkOrderType = c.WorkOrderType,
                        c.CreateAt.Year,
                        c.CreateAt.Month,
                        c.CreateAt.Day,
                        EstVal = (double?)(p.TotalPrice ?? 0),
                        ActVal = (double?)(p.ExecutedWorksValue ?? 0)
                    })
                .GroupBy(x => new { x.Branch, x.Contractor, x.Consultant, x.Office, x.District, x.Situation, x.WorkOrderType, x.Year, x.Month, x.Day })
                .Select(g => new {
                    g.Key.Branch,
                    g.Key.Contractor,
                    g.Key.Consultant,
                    g.Key.Office,
                    g.Key.District,
                    g.Key.Situation,
                    g.Key.WorkOrderType,
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Day,
                    EstVal = g.Sum(x => x.EstVal) ?? 0,
                    ActVal = g.Sum(x => x.ActVal) ?? 0
                })
                .ToListAsync();

            var mPricingFiltered = await _db.MaintenancePricingItems.AsNoTracking()
                .Where(p => mq.Select(x => x.Id).Contains(p.MaintenanceId))
                .Join(mq, p => p.MaintenanceId, m => m.Id,
                    (p, m) => new {
                        Branch = m.BranchName ?? "غير محدد",
                        Contractor = m.Contractor,
                        Consultant = m.Consultant,
                        Office = m.Office,
                        District = m.District,
                        Situation = m.Situation,
                        WorkOrderType = m.WorkOrderType,
                        m.CreateAt.Year,
                        m.CreateAt.Month,
                        m.CreateAt.Day,
                        EstVal = (double?)(p.TotalPrice ?? 0),
                        ActVal = (double?)(p.ExecutedWorksValue ?? 0)
                    })
                .GroupBy(x => new { x.Branch, x.Contractor, x.Consultant, x.Office, x.District, x.Situation, x.WorkOrderType, x.Year, x.Month, x.Day })
                .Select(g => new {
                    g.Key.Branch,
                    g.Key.Contractor,
                    g.Key.Consultant,
                    g.Key.Office,
                    g.Key.District,
                    g.Key.Situation,
                    g.Key.WorkOrderType,
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Day,
                    EstVal = g.Sum(x => x.EstVal) ?? 0,
                    ActVal = g.Sum(x => x.ActVal) ?? 0
                })
                .ToListAsync();

            var ePricingFiltered = await _db.EmergencyPricingItems.AsNoTracking()
                .Where(p => eq.Select(x => x.Id).Contains(p.EmergencyId))
                .Join(eq, p => p.EmergencyId, e => e.Id,
                    (p, e) => new {
                        Branch = e.BranchName ?? "غير محدد",
                        Contractor = e.Contractor,
                        Consultant = e.Consultant,
                        Office = e.Office,
                        District = e.District,
                        Situation = e.Situation,
                        WorkOrderType = e.WorkOrderType,
                        e.CreateAt.Year,
                        e.CreateAt.Month,
                        e.CreateAt.Day,
                        EstVal = (double?)(p.TotalPrice ?? 0),
                        ActVal = (double?)(p.ExecutedWorksValue ?? 0)
                    })
                .GroupBy(x => new { x.Branch, x.Contractor, x.Consultant, x.Office, x.District, x.Situation, x.WorkOrderType, x.Year, x.Month, x.Day })
                .Select(g => new {
                    g.Key.Branch,
                    g.Key.Contractor,
                    g.Key.Consultant,
                    g.Key.Office,
                    g.Key.District,
                    g.Key.Situation,
                    g.Key.WorkOrderType,
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Day,
                    EstVal = g.Sum(x => x.EstVal) ?? 0,
                    ActVal = g.Sum(x => x.ActVal) ?? 0
                })
                .ToListAsync();

            var nPricingFiltered = await _db.NewProjectPricingItems.AsNoTracking()
                .Where(p => nq.Select(x => x.Id).Contains(p.NewProjectId))
                .Join(nq, p => p.NewProjectId, n => n.Id,
                    (p, n) => new {
                        Branch = n.BranchName ?? "غير محدد",
                        Contractor = n.Contractor,
                        Consultant = n.Consultant,
                        Office = n.Office,
                        District = n.District,
                        Situation = n.Situation,
                        WorkOrderType = n.WorkOrderType,
                        n.CreateAt.Year,
                        n.CreateAt.Month,
                        n.CreateAt.Day,
                        EstVal = (double?)(p.TotalPrice ?? 0),
                        ActVal = (double?)(p.ExecutedWorksValue ?? 0)
                    })
                .GroupBy(x => new { x.Branch, x.Contractor, x.Consultant, x.Office, x.District, x.Situation, x.WorkOrderType, x.Year, x.Month, x.Day })
                .Select(g => new {
                    g.Key.Branch,
                    g.Key.Contractor,
                    g.Key.Consultant,
                    g.Key.Office,
                    g.Key.District,
                    g.Key.Situation,
                    g.Key.WorkOrderType,
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Day,
                    EstVal = g.Sum(x => x.EstVal) ?? 0,
                    ActVal = g.Sum(x => x.ActVal) ?? 0
                })
                .ToListAsync();

            var pPricingRaw = await pq
                .Select(x => new {
                    Branch = x.BranchName ?? "غير محدد",
                    Contractor = x.Contractor,
                    Consultant = x.Consultant,
                    Office = (string?)null,
                    District = (string?)null,
                    Situation = (string?)null,
                    WorkOrderType = (string?)null,
                    x.CreateAt.Year,
                    x.CreateAt.Month,
                    x.CreateAt.Day,
                    ProjectValueStr = x.ProjectValue
                })
                .ToListAsync();

            var pPricingFiltered = pPricingRaw
                .Select(x => new {
                    x.Branch,
                    x.Contractor,
                    x.Consultant,
                    x.Office,
                    x.District,
                    x.Situation,
                    x.WorkOrderType,
                    x.Year,
                    x.Month,
                    x.Day,
                    EstVal = TryParseDouble(x.ProjectValueStr),
                    ActVal = 0.0
                })
                .GroupBy(x => new { x.Branch, x.Contractor, x.Consultant, x.Office, x.District, x.Situation, x.WorkOrderType, x.Year, x.Month, x.Day })
                .Select(g => new {
                    g.Key.Branch,
                    g.Key.Contractor,
                    g.Key.Consultant,
                    g.Key.Office,
                    g.Key.District,
                    g.Key.Situation,
                    g.Key.WorkOrderType,
                    g.Key.Year,
                    g.Key.Month,
                    g.Key.Day,
                    EstVal = g.Sum(x => x.EstVal),
                    ActVal = g.Sum(x => x.ActVal)
                })
                .ToList();

            var allPricingItems = cPricingFiltered
                .Concat(mPricingFiltered)
                .Concat(ePricingFiltered)
                .Concat(nPricingFiltered)
                .Concat(pPricingFiltered)
                .ToList();

            var branchPricingDict = allPricingItems
                .GroupBy(x => (Branch: NormalizeBranchName(x.Branch), x.Year, x.Month, x.Day))
                .ToDictionary(g => g.Key, g => (Est: g.Sum(x => x.EstVal), Act: g.Sum(x => x.ActVal)));

            var contractorPricingDict = allPricingItems
                .Where(x => x.Contractor != null)
                .GroupBy(x => (x.Branch, x.Contractor!, x.Year, x.Month, x.Day))
                .ToDictionary(g => g.Key, g => (Est: g.Sum(x => x.EstVal), Act: g.Sum(x => x.ActVal)));

            var consultantPricingDict = allPricingItems
                .Where(x => x.Consultant != null)
                .GroupBy(x => (x.Branch, x.Consultant!, x.Year, x.Month, x.Day))
                .ToDictionary(g => g.Key, g => (Est: g.Sum(x => x.EstVal), Act: g.Sum(x => x.ActVal)));

            var officePricingDict = allPricingItems
                .Where(x => x.Office != null)
                .GroupBy(x => (x.Branch, x.Office!, x.Year, x.Month, x.Day))
                .ToDictionary(g => g.Key, g => (Est: g.Sum(x => x.EstVal), Act: g.Sum(x => x.ActVal)));

            var districtPricingDict = allPricingItems
                .Where(x => x.District != null)
                .GroupBy(x => (x.Branch, x.District!, x.Year, x.Month, x.Day))
                .ToDictionary(g => g.Key, g => (Est: g.Sum(x => x.EstVal), Act: g.Sum(x => x.ActVal)));

            var situationPricingDict = allPricingItems
                .Where(x => x.Situation != null)
                .GroupBy(x => (x.Branch, x.Situation!, x.Year, x.Month, x.Day))
                .ToDictionary(g => g.Key, g => (Est: g.Sum(x => x.EstVal), Act: g.Sum(x => x.ActVal)));

            var workOrderTypePricingDict = allPricingItems
                .Where(x => x.WorkOrderType != null)
                .GroupBy(x => (x.Branch, x.WorkOrderType!, x.Year, x.Month, x.Day))
                .ToDictionary(g => g.Key, g => (Est: g.Sum(x => x.EstVal), Act: g.Sum(x => x.ActVal)));

            // ── التوزيعات (كلها مع التاريخ) ────────────

            // ── perBranch ──
            var cBranch = await cq.Where(x => x.BranchName != null)
                .GroupBy(x => new { Branch = x.BranchName!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { Label = g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mBranch = await mq.Where(x => x.BranchName != null)
                .GroupBy(x => new { Branch = x.BranchName!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { Label = g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eBranch = await eq.Where(x => x.BranchName != null)
                .GroupBy(x => new { Branch = x.BranchName!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { Label = g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nBranch = await nq.Where(x => x.BranchName != null)
                .GroupBy(x => new { Branch = x.BranchName!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { Label = g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var pBranch = await pq.Where(x => x.BranchName != null)
                .GroupBy(x => new { Branch = x.BranchName!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { Label = g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var perBranch = cBranch.Concat(mBranch).Concat(eBranch).Concat(nBranch).Concat(pBranch)
                .GroupBy(x => new { Branch = NormalizeBranchName(x.Label), x.Year, x.Month, x.Day })
                .Select(g => {
                    branchPricingDict.TryGetValue((g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day), out var pr);
                    return new StatusCountDto
                    {
                        Label = g.Key.Branch,
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Day = g.Key.Day,
                        MonthName = arCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                        Count = g.Sum(x => x.Count),
                        EstimatedValue = pr.Est,
                        ActualValue = pr.Act
                    };
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            // ── perContractor ──
            var cContractor = await cq.Where(x => x.Contractor != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Contractor = x.Contractor!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mContractor = await mq.Where(x => x.Contractor != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Contractor = x.Contractor!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eContractor = await eq.Where(x => x.Contractor != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Contractor = x.Contractor!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nContractor = await nq.Where(x => x.Contractor != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Contractor = x.Contractor!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var pContractor = await pq.Where(x => x.Contractor != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Contractor = x.Contractor!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var perContractor = cContractor.Concat(mContractor).Concat(eContractor).Concat(nContractor).Concat(pContractor)
                .GroupBy(x => new { x.Branch, x.Label, x.Year, x.Month, x.Day })
                .Select(g => {
                    contractorPricingDict.TryGetValue((g.Key.Branch, g.Key.Label, g.Key.Year, g.Key.Month, g.Key.Day), out var pr);
                    return new BranchedStatusCountDto
                    {
                        BranchName = g.Key.Branch,
                        Label = g.Key.Label,
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Day = g.Key.Day,
                        MonthName = arCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                        Count = g.Sum(x => x.Count),
                        EstimatedValue = pr.Est,
                        ActualValue = pr.Act
                    };
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            // ── perConsultant ──
            var cConsultant = await cq.Where(x => x.Consultant != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Consultant = x.Consultant!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mConsultant = await mq.Where(x => x.Consultant != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Consultant = x.Consultant!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eConsultant = await eq.Where(x => x.Consultant != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Consultant = x.Consultant!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nConsultant = await nq.Where(x => x.Consultant != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Consultant = x.Consultant!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var pConsultant = await pq.Where(x => x.Consultant != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Consultant = x.Consultant!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var perConsultant = cConsultant.Concat(mConsultant).Concat(eConsultant).Concat(nConsultant).Concat(pConsultant)
                .GroupBy(x => new { x.Branch, x.Label, x.Year, x.Month, x.Day })
                .Select(g => {
                    consultantPricingDict.TryGetValue((g.Key.Branch, g.Key.Label, g.Key.Year, g.Key.Month, g.Key.Day), out var pr);
                    return new BranchedStatusCountDto
                    {
                        BranchName = g.Key.Branch,
                        Label = g.Key.Label,
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Day = g.Key.Day,
                        MonthName = arCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                        Count = g.Sum(x => x.Count),
                        EstimatedValue = pr.Est,
                        ActualValue = pr.Act
                    };
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            // ── perOffice ──
            var cOffice = await cq.Where(x => x.Office != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Office = x.Office!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Office, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mOffice = await mq.Where(x => x.Office != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Office = x.Office!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Office, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eOffice = await eq.Where(x => x.Office != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Office = x.Office!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Office, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nOffice = await nq.Where(x => x.Office != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Office = x.Office!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Office, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var perOffice = cOffice.Concat(mOffice).Concat(eOffice).Concat(nOffice)
                .GroupBy(x => new { x.Branch, x.Label, x.Year, x.Month, x.Day })
                .Select(g => {
                    officePricingDict.TryGetValue((g.Key.Branch, g.Key.Label, g.Key.Year, g.Key.Month, g.Key.Day), out var pr);
                    return new BranchedStatusCountDto
                    {
                        BranchName = g.Key.Branch,
                        Label = g.Key.Label,
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Day = g.Key.Day,
                        MonthName = arCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                        Count = g.Sum(x => x.Count),
                        EstimatedValue = pr.Est,
                        ActualValue = pr.Act
                    };
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            // ── perDistrict ──
            var cDistrict = await cq.Where(x => x.District != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", District = x.District!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.District, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mDistrict = await mq.Where(x => x.District != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", District = x.District!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.District, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eDistrict = await eq.Where(x => x.District != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", District = x.District!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.District, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nDistrict = await nq.Where(x => x.District != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", District = x.District!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.District, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var perDistrict = cDistrict.Concat(mDistrict).Concat(eDistrict).Concat(nDistrict)
                .GroupBy(x => new { x.Branch, x.Label, x.Year, x.Month, x.Day })
                .Select(g => {
                    districtPricingDict.TryGetValue((g.Key.Branch, g.Key.Label, g.Key.Year, g.Key.Month, g.Key.Day), out var pr);
                    return new BranchedStatusCountDto
                    {
                        BranchName = g.Key.Branch,
                        Label = g.Key.Label,
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Day = g.Key.Day,
                        MonthName = arCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                        Count = g.Sum(x => x.Count),
                        EstimatedValue = pr.Est,
                        ActualValue = pr.Act
                    };
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            // ── perSituation ──
            var cSituation = await cq.Where(x => x.Situation != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Situation = x.Situation!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Situation, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mSituation = await mq.Where(x => x.Situation != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Situation = x.Situation!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Situation, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eSituation = await eq.Where(x => x.Situation != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Situation = x.Situation!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Situation, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nSituation = await nq.Where(x => x.Situation != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", Situation = x.Situation!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.Situation, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var perSituation = cSituation.Concat(mSituation).Concat(eSituation).Concat(nSituation)
                .GroupBy(x => new { x.Branch, x.Label, x.Year, x.Month, x.Day })
                .Select(g => {
                    situationPricingDict.TryGetValue((g.Key.Branch, g.Key.Label, g.Key.Year, g.Key.Month, g.Key.Day), out var pr);
                    return new BranchedStatusCountDto
                    {
                        BranchName = g.Key.Branch,
                        Label = g.Key.Label,
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Day = g.Key.Day,
                        MonthName = arCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                        Count = g.Sum(x => x.Count),
                        EstimatedValue = pr.Est,
                        ActualValue = pr.Act
                    };
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            // ── perWorkOrderType ──
            var cWorkOrder = await cq.Where(x => x.WorkOrderType != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", WorkOrderType = x.WorkOrderType!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.WorkOrderType, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mWorkOrder = await mq.Where(x => x.WorkOrderType != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", WorkOrderType = x.WorkOrderType!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.WorkOrderType, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eWorkOrder = await eq.Where(x => x.WorkOrderType != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", WorkOrderType = x.WorkOrderType!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.WorkOrderType, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nWorkOrder = await nq.Where(x => x.WorkOrderType != null)
                .GroupBy(x => new { Branch = x.BranchName ?? "غير محدد", WorkOrderType = x.WorkOrderType!, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Branch, Label = g.Key.WorkOrderType, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var perWorkOrderType = cWorkOrder.Concat(mWorkOrder).Concat(eWorkOrder).Concat(nWorkOrder)
                .GroupBy(x => new { x.Branch, x.Label, x.Year, x.Month, x.Day })
                .Select(g => {
                    workOrderTypePricingDict.TryGetValue((g.Key.Branch, g.Key.Label, g.Key.Year, g.Key.Month, g.Key.Day), out var pr);
                    return new BranchedStatusCountDto
                    {
                        BranchName = g.Key.Branch,
                        Label = g.Key.Label,
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Day = g.Key.Day,
                        MonthName = arCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                        Count = g.Sum(x => x.Count),
                        EstimatedValue = pr.Est,
                        ActualValue = pr.Act
                    };
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            // ── بناء الـ Trend الشهري ──────────────────────────────────────
            var monthlyTrend = await BuildMonthlyTrend(cq, mq, eq, nq, pq, arCulture);

            // ── القيم حسب الفرع/المقاول/الاستشاري (مع التاريخ) ──────────────
            var branchCountsDict = perBranch.ToDictionary(x => (x.Label, x.Year, x.Month, x.Day), x => x.Count);

            var valuePerBranch = allPricingItems
                .GroupBy(x => (Branch: x.Branch, x.Year, x.Month, x.Day))
                .Select(g => new ValuePerBranchDto
                {
                    BranchName = g.Key.Branch,
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Day = g.Key.Day,
                    MonthName = arCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                    EstimatedValue = g.Sum(x => x.EstVal),
                    ActualValue = g.Sum(x => x.ActVal),
                    TotalProjects = branchCountsDict.TryGetValue((g.Key.Branch, g.Key.Year, g.Key.Month, g.Key.Day), out var count) ? count : 0
                })
                .OrderByDescending(x => x.EstimatedValue)
                .ToList();

            var contractorCountsDict = perContractor.ToDictionary(x => (x.BranchName, x.Label, x.Year, x.Month, x.Day), x => x.Count);

            var valuePerContractor = allPricingItems
                .Where(x => x.Contractor != null)
                .GroupBy(x => new { x.Branch, Contractor = x.Contractor!, x.Year, x.Month, x.Day })
                .Select(g => new ValuePerEntityDto
                {
                    BranchName = g.Key.Branch,
                    EntityName = g.Key.Contractor,
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Day = g.Key.Day,
                    MonthName = arCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                    TotalOrders = contractorCountsDict.TryGetValue((g.Key.Branch, g.Key.Contractor, g.Key.Year, g.Key.Month, g.Key.Day), out var count) ? count : 0,
                    EstimatedValue = g.Sum(x => x.EstVal),
                    ActualValue = g.Sum(x => x.ActVal),
                })
                .OrderByDescending(x => x.EstimatedValue)
                .ToList();

            var consultantCountsDict = perConsultant.ToDictionary(x => (x.BranchName, x.Label, x.Year, x.Month, x.Day), x => x.Count);

            var valuePerConsultant = allPricingItems
                .Where(x => x.Consultant != null)
                .GroupBy(x => new { x.Branch, Consultant = x.Consultant!, x.Year, x.Month, x.Day })
                .Select(g => new ValuePerEntityDto
                {
                    BranchName = g.Key.Branch,
                    EntityName = g.Key.Consultant,
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Day = g.Key.Day,
                    MonthName = arCulture.DateTimeFormat.GetMonthName(g.Key.Month),
                    TotalOrders = consultantCountsDict.TryGetValue((g.Key.Branch, g.Key.Consultant, g.Key.Year, g.Key.Month, g.Key.Day), out var count) ? count : 0,
                    EstimatedValue = g.Sum(x => x.EstVal),
                    ActualValue = g.Sum(x => x.ActVal),
                })
                .OrderByDescending(x => x.EstimatedValue)
                .ToList();

            // ── إحصائيات المستخدمين مفلترة بالفرع ────────────────────────
            var filteredBranchIds = string.IsNullOrEmpty(f.BranchName)
                ? (IEnumerable<int>)BranchIdToName.Keys
                : BranchIdToName.Where(kv => kv.Value == f.BranchName).Select(kv => kv.Key).ToList();

            var uq = _identityDb.AppUsers.AsNoTracking()
                     .Where(u => filteredBranchIds.Contains(u.BranchId));

            var usersTotal = await uq.CountAsync();
            var usersWithCanCreate = await uq.CountAsync(u => u.CanCreateProjectOutsideCity);

            var usersPerUserType = await uq
                .GroupBy(u => u.UserType ?? "غير محدد")
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var usersBranchedGrouped = await uq
                .GroupBy(u => new { u.BranchId, UserType = u.UserType ?? "غير محدد" })
                .Select(g => new { g.Key.BranchId, g.Key.UserType, Count = g.Count() })
                .ToListAsync();

            var usersPerTypeBranched = usersBranchedGrouped
                .Select(g => new BranchedStatusCountDto
                {
                    BranchName = ResolveBranchName(g.BranchId),
                    Label = g.UserType,
                    Count = g.Count
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            var filteredUsers = new FilteredUsersStatsDto
            {
                Total = usersTotal,
                WithCanCreateOutsideCity = usersWithCanCreate,
                PerUserType = usersPerUserType,
                PerUserTypeBranched = usersPerTypeBranched,
            };

            // ── إحصائيات الموظفين مفلترة بالفرع ──
            // كان الربط يمرّ بـ EngineerProfiles.UserId إلى الحساب. وبعد أن صار
            // الحساب هو المصدر، الربط زائد: الاستعلام على الحسابات نفسها.
            var today = DateTime.UtcNow.Date;
            var in30Days = today.AddDays(30);

            var filteredUserIds = await uq.Select(u => u.Id).ToListAsync();

            var eq2 = _identityDb.Users.AsNoTracking()
                         .Where(e => e.IsActiveEmployee && filteredUserIds.Contains(e.Id));

            var engAggFiltered = await eq2.GroupBy(x => 1).Select(g => new
            {
                Total = g.Count(),
                Expired = g.Count(x => x.ResidenceExpiryDate.HasValue && x.ResidenceExpiryDate.Value.Date < today),
                Expiring = g.Count(x => x.ResidenceExpiryDate.HasValue
                                     && x.ResidenceExpiryDate.Value.Date >= today
                                     && x.ResidenceExpiryDate.Value.Date <= in30Days)
            }).FirstOrDefaultAsync();

            var engPerSpecFiltered = await eq2.Where(x => x.Specialization != null)
                .GroupBy(x => x.Specialization!)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var engPerJobFiltered = await eq2.Where(x => x.JobTitle != null)
                .GroupBy(x => x.JobTitle!)
                .Select(g => new StatusCountDto { Label = g.Key, Count = g.Count() })
                .ToListAsync();

            var filteredEmployees = new FilteredEmployeesStatsDto
            {
                Total = usersTotal,
                EngineersTotal = engAggFiltered?.Total ?? 0,
                EngineersWithExpiredResidence = engAggFiltered?.Expired ?? 0,
                EngineersWithExpiringResidence = engAggFiltered?.Expiring ?? 0,
                EngineersPerSpecialization = engPerSpecFiltered,
                EngineersPerJobTitle = engPerJobFiltered,
            };

            return new FilteredDashboardStatsDto
            {
                TotalWorkOrders = cResult.Total + mResult.Total + eResult.Total + nResult.Total + pResult.Total,
                TotalActive = cResult.Active + mResult.Active + eResult.Active + nResult.Active + pResult.Active,
                TotalArchived = cResult.Archived + mResult.Archived + eResult.Archived + nResult.Archived + pResult.Archived,
                TotalApproved = cResult.Approved + mResult.Approved + eResult.Approved + nResult.Approved + pResult.Approved,
                TotalRejected = cResult.Rejected + mResult.Rejected + eResult.Rejected + nResult.Rejected + pResult.Rejected,
                TotalPendingApproval = cResult.PendingApproval + mResult.PendingApproval + eResult.PendingApproval + nResult.PendingApproval + pResult.PendingApproval,
                TotalSafetyViolations = cResult.WithSafetyViolations + mResult.WithSafetyViolations + eResult.WithSafetyViolations + nResult.WithSafetyViolations + pResult.WithSafetyViolations,
                TotalEstimatedValue = totalEst,
                TotalActualValue = totalAct,
                Construction = cResult,
                Maintenance = mResult,
                Emergency = eResult,
                NewProject = nResult,
                PrivateProject = pResult,
                ConsultantBreakdown = await BuildConsultantBreakdown(cq, mq, eq, nq, pq, arCulture),
                ContractorBreakdown = await BuildContractorBreakdown(cq, mq, eq, nq, pq, arCulture),
                PerBranch = perBranch,
                PerContractor = perContractor,
                PerConsultant = perConsultant,
                PerOffice = perOffice,
                PerDistrict = perDistrict,
                PerSituation = perSituation,
                PerWorkOrderType = perWorkOrderType,
                MonthlyTrend = monthlyTrend,
                ValuePerBranch = valuePerBranch,
                ValuePerContractor = valuePerContractor,
                ValuePerConsultant = valuePerConsultant,
                Users = filteredUsers,
                Employees = filteredEmployees,
            };
        }
        private static async Task<ProjectTypeFilterResultDto> BuildProjectTypeResult<T>(IQueryable<T> q)
            where T : class, ASF.Core.Entities.IProjectEntity
        {
            var res = await q.GroupBy(x => 1).Select(g => new ProjectTypeFilterResultDto
            {
                Total = g.Count(),
                Active = g.Count(x => !x.IsArchived),
                Archived = g.Count(x => x.IsArchived),
                Approved = g.Count(x => x.IsApprove == true),
                Rejected = g.Count(x => x.IsApprove == false),
                PendingApproval = g.Count(x => x.IsApprove == null),
                WithSafetyViolations = g.Count(x => x.SafetyViolationsExist),
            }).FirstOrDefaultAsync();

            return res ?? new ProjectTypeFilterResultDto();
        }

        private static async Task<List<MonthlyTrendDto>> BuildMonthlyTrend(
            IQueryable<ASF.Core.Entities.Construction.Construction> cq,
            IQueryable<ASF.Core.Entities.Maintenance.Maintenance> mq,
            IQueryable<ASF.Core.Entities.Emergency.Emergency> eq,
            IQueryable<ASF.Core.Entities.NewProject.NewProject> nq,
            IQueryable<ASF.Core.Entities.PrivateProject.PrivateProject> pq,
            CultureInfo culture)
        {
            const string na = "غير محدد";

            var cRaw = await cq.GroupBy(x => new {
                x.CreateAt.Year,
                x.CreateAt.Month,
                x.CreateAt.Day,
                Branch = x.BranchName ?? na,
                Office = x.Office ?? na,
                Contractor = x.Contractor ?? na,
                Consultant = x.Consultant ?? na
            }).Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

            var mRaw = await mq.GroupBy(x => new {
                x.CreateAt.Year,
                x.CreateAt.Month,
                x.CreateAt.Day,
                Branch = x.BranchName ?? na,
                Office = x.Office ?? na,
                Contractor = x.Contractor ?? na,
                Consultant = x.Consultant ?? na
            }).Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

            var eRaw = await eq.GroupBy(x => new {
                x.CreateAt.Year,
                x.CreateAt.Month,
                x.CreateAt.Day,
                Branch = x.BranchName ?? na,
                Office = x.Office ?? na,
                Contractor = x.Contractor ?? na,
                Consultant = x.Consultant ?? na
            }).Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

            var nRaw = await nq.GroupBy(x => new {
                x.CreateAt.Year,
                x.CreateAt.Month,
                x.CreateAt.Day,
                Branch = x.BranchName ?? na,
                Office = x.Office ?? na,
                Contractor = x.Contractor ?? na,
                Consultant = x.Consultant ?? na
            }).Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

            var pRaw = await pq.GroupBy(x => new {
                x.CreateAt.Year,
                x.CreateAt.Month,
                x.CreateAt.Day,
                Branch = x.BranchName ?? na,
                Office = na,
                Contractor = x.Contractor ?? na,
                Consultant = x.Consultant ?? na
            }).Select(g => new { g.Key, Count = g.Count() }).ToListAsync();

            var cCounts = cRaw.ToDictionary(g => (g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Branch, g.Key.Office, g.Key.Contractor, g.Key.Consultant), g => g.Count);
            var mCounts = mRaw.ToDictionary(g => (g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Branch, g.Key.Office, g.Key.Contractor, g.Key.Consultant), g => g.Count);
            var eCounts = eRaw.ToDictionary(g => (g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Branch, g.Key.Office, g.Key.Contractor, g.Key.Consultant), g => g.Count);
            var nCounts = nRaw.ToDictionary(g => (g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Branch, g.Key.Office, g.Key.Contractor, g.Key.Consultant), g => g.Count);
            var pCounts = pRaw.ToDictionary(g => (g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Branch, g.Key.Office, g.Key.Contractor, g.Key.Consultant), g => g.Count);

            var periods = cCounts.Keys
                .Union(mCounts.Keys).Union(eCounts.Keys)
                .Union(nCounts.Keys).Union(pCounts.Keys)
                .OrderBy(x => x.Year).ThenBy(x => x.Month).ThenBy(x => x.Day)
                .ThenBy(x => x.Branch).ThenBy(x => x.Office)
                .ThenBy(x => x.Contractor).ThenBy(x => x.Consultant)
                .ToList();

            return periods.Select(p =>
            {
                cCounts.TryGetValue(p, out var cCount);
                mCounts.TryGetValue(p, out var mCount);
                eCounts.TryGetValue(p, out var eCount);
                nCounts.TryGetValue(p, out var nCount);
                pCounts.TryGetValue(p, out var pCount);

                return new MonthlyTrendDto
                {
                    Year = p.Year,
                    Month = p.Month,
                    Day = p.Day,
                    MonthName = culture.DateTimeFormat.GetMonthName(p.Month),
                    BranchName = p.Branch,
                    Office = p.Office,
                    Contractor = p.Contractor,
                    Consultant = p.Consultant,
                    Construction = cCount,
                    Maintenance = mCount,
                    Emergency = eCount,
                    NewProject = nCount,
                    PrivateProject = pCount,
                    Total = cCount + mCount + eCount + nCount + pCount,
                };
            }).ToList();
        }

        private static async Task<List<ConsultantBreakdownDto>> BuildConsultantBreakdown(
       IQueryable<ASF.Core.Entities.Construction.Construction> cq,
       IQueryable<ASF.Core.Entities.Maintenance.Maintenance> mq,
       IQueryable<ASF.Core.Entities.Emergency.Emergency> eq,
       IQueryable<ASF.Core.Entities.NewProject.NewProject> nq,
       IQueryable<ASF.Core.Entities.PrivateProject.PrivateProject> pq,
       CultureInfo culture)
        {
            const string na = "غير محدد";

            var cC = await cq.GroupBy(x => new { Name = x.Consultant ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Name, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mC = await mq.GroupBy(x => new { Name = x.Consultant ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Name, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eC = await eq.GroupBy(x => new { Name = x.Consultant ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Name, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nC = await nq.GroupBy(x => new { Name = x.Consultant ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Name, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var pC = await pq.GroupBy(x => new { Name = x.Consultant ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Name, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var cDict = cC.ToDictionary(x => (x.Name, x.Year, x.Month, x.Day), x => x.Count);
            var mDict = mC.ToDictionary(x => (x.Name, x.Year, x.Month, x.Day), x => x.Count);
            var eDict = eC.ToDictionary(x => (x.Name, x.Year, x.Month, x.Day), x => x.Count);
            var nDict = nC.ToDictionary(x => (x.Name, x.Year, x.Month, x.Day), x => x.Count);
            var pDict = pC.ToDictionary(x => (x.Name, x.Year, x.Month, x.Day), x => x.Count);

            var allKeys = cDict.Keys.Union(mDict.Keys).Union(eDict.Keys).Union(nDict.Keys).Union(pDict.Keys).Distinct().ToList();

            return allKeys.Select(k =>
            {
                cDict.TryGetValue(k, out var cCount);
                mDict.TryGetValue(k, out var mCount);
                eDict.TryGetValue(k, out var eCount);
                nDict.TryGetValue(k, out var nCount);
                pDict.TryGetValue(k, out var pCount);

                return new ConsultantBreakdownDto
                {
                    ConsultantName = k.Name,
                    Year = k.Year,
                    Month = k.Month,
                    Day = k.Day,
                    MonthName = culture.DateTimeFormat.GetMonthName(k.Month),
                    Construction = cCount,
                    Maintenance = mCount,
                    Emergency = eCount,
                    NewProject = nCount,
                    PrivateProject = pCount,
                    Total = cCount + mCount + eCount + nCount + pCount,
                };
            }).OrderByDescending(x => x.Total).ToList();
        }

        private static async Task<List<ContractorBreakdownDto>> BuildContractorBreakdown(
            IQueryable<ASF.Core.Entities.Construction.Construction> cq,
            IQueryable<ASF.Core.Entities.Maintenance.Maintenance> mq,
            IQueryable<ASF.Core.Entities.Emergency.Emergency> eq,
            IQueryable<ASF.Core.Entities.NewProject.NewProject> nq,
            IQueryable<ASF.Core.Entities.PrivateProject.PrivateProject> pq,
            CultureInfo culture)
        {
            const string na = "غير محدد";

            var cC = await cq.GroupBy(x => new { Name = x.Contractor ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Name, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var mC = await mq.GroupBy(x => new { Name = x.Contractor ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Name, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var eC = await eq.GroupBy(x => new { Name = x.Contractor ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Name, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var nC = await nq.GroupBy(x => new { Name = x.Contractor ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Name, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();
            var pC = await pq.GroupBy(x => new { Name = x.Contractor ?? na, x.CreateAt.Year, x.CreateAt.Month, x.CreateAt.Day })
                .Select(g => new { g.Key.Name, g.Key.Year, g.Key.Month, g.Key.Day, Count = g.Count() }).ToListAsync();

            var cDict = cC.ToDictionary(x => (x.Name, x.Year, x.Month, x.Day), x => x.Count);
            var mDict = mC.ToDictionary(x => (x.Name, x.Year, x.Month, x.Day), x => x.Count);
            var eDict = eC.ToDictionary(x => (x.Name, x.Year, x.Month, x.Day), x => x.Count);
            var nDict = nC.ToDictionary(x => (x.Name, x.Year, x.Month, x.Day), x => x.Count);
            var pDict = pC.ToDictionary(x => (x.Name, x.Year, x.Month, x.Day), x => x.Count);

            var allKeys = cDict.Keys.Union(mDict.Keys).Union(eDict.Keys).Union(nDict.Keys).Union(pDict.Keys).Distinct().ToList();

            return allKeys.Select(k =>
            {
                cDict.TryGetValue(k, out var cCount);
                mDict.TryGetValue(k, out var mCount);
                eDict.TryGetValue(k, out var eCount);
                nDict.TryGetValue(k, out var nCount);
                pDict.TryGetValue(k, out var pCount);

                return new ContractorBreakdownDto
                {
                    ContractorName = k.Name,
                    Year = k.Year,
                    Month = k.Month,
                    Day = k.Day,
                    MonthName = culture.DateTimeFormat.GetMonthName(k.Month),
                    Construction = cCount,
                    Maintenance = mCount,
                    Emergency = eCount,
                    NewProject = nCount,
                    PrivateProject = pCount,
                    Total = cCount + mCount + eCount + nCount + pCount,
                };
            }).OrderByDescending(x => x.Total).ToList();
        }
        private static double TryParseDouble(string? s)
            => double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var v) ? v : 0;

        /// <summary>
        /// توحيد اسم الفرع: مسح المسافات + تحويل هاء النسب في آخر الكلمات إلى تاء مربوطة
        /// يحل مشكلة "منطقه الرياض" و "منطقة الرياض"
        /// </summary>
        private static string NormalizeBranchName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "غير محدد";
            // مسح المسافات الزائدة
            var trimmed = name.Trim();
            // تحويل الهاء في نهاية كل كلمة تليها مسافة أو نهاية النص إلى تاء مربوطة
            // مثال: "منطقه الرياض" → "منطقة الرياض"
            var normalized = System.Text.RegularExpressions.Regex.Replace(
                trimmed,
                @"ه(?=\s|$)",
                "ة"
            );
            return normalized;
        }

        private static readonly Dictionary<int, string> BranchIdToName = new()
        {
            { 1, "جدة" },
            { 2, "منطقة الرياض" },
        };

        private static string ResolveBranchName(int branchId)
            => BranchIdToName.TryGetValue(branchId, out var name) ? name : "غير محدد";
    }
}