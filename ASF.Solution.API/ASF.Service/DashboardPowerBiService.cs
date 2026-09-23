using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos.Dashboard;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace ASF.Service
{
    public class DashboardPowerBiService : IDashboardPowerBiService
    {
        private readonly ApplicationDbContext _context;

        // أسماء الفئات الرئيسية - مركزية في مكان واحد لتفادي الأخطاء الإملائية في أي مكان تاني
        private const string CategoryConstruction = "الإنشاءات";
        private const string CategoryOperationsMaintenance = "عمليات وصيانة";
        private const string CategoryOther = "أعمال أخرى";

        public DashboardPowerBiService(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==========================================================
        //  تمثيل موحّد لأي "عمل" بغض النظر عن نوع الكيان الأصلي
        //  ده بيسهّل تجميع الإحصائيات من 5 جداول مختلفة الشكل
        // ==========================================================
        private class ProjectRecord
        {
            public string Category { get; set; } = string.Empty;     // الإنشاءات / عمليات وصيانة / أعمال أخرى
            public string SubType { get; set; } = string.Empty;      // مشاريع / توصيلات / صيانة / طوارئ / تأهيل / خاص
            public string? Situation { get; set; }                   // null لو الكيان مفيهوش مرحلة (مثال: المشاريع الخاصة)
            public bool IsArchived { get; set; }
            public string? BranchName { get; set; }
            public string? Office { get; set; }
            public DateTime EffectiveDate { get; set; }               // OrderDate لو موجود وإلا CreateAt
            public decimal EstimatedValue { get; set; }
            public decimal ActualValue { get; set; }
            public string? ContractNumber { get; set; }
            public string? Subscriber { get; set; }
            public string? WorkType { get; set; }
        }

        // ==========================================================
        //  Public API
        // ==========================================================
        public async Task<OverviewDashboardDto> GetOverviewAsync(DashboardFilterDto filter)
        {
            var construction = await LoadConstructionAsync(filter);
            var maintenance = await LoadMaintenanceAsync(filter);
            var emergency = await LoadEmergencyAsync(filter);
            var newProject = await LoadNewProjectAsync(filter);
            var privateProject = await LoadPrivateProjectAsync(filter);

            var all = construction
                .Concat(maintenance)
                .Concat(emergency)
                .Concat(newProject)
                .Concat(privateProject)
                .ToList();

            var summaryMatrix = BuildSummaryMatrix(construction, emergency, maintenance, privateProject, all);

            var dto = new OverviewDashboardDto
            {
                SummaryMatrix = summaryMatrix,
                SummaryMatrixList = new List<CategorySummaryItemDto>
                {
                    summaryMatrix.Constructions,
                    summaryMatrix.Emergency,
                    summaryMatrix.OperationsMaintenance,
                    summaryMatrix.PrivateProjects,
                    summaryMatrix.Total
                },
                Overall = BuildFinishedStats(all),
                StageBreakdown = BuildStageBreakdown(all.Where(r => r.Situation != null)),
                BranchBreakdown = BuildLabeledStats(all, r => r.BranchName),
                PeriodTrend = BuildPeriodTrend(all, filter.PeriodType),
                Categories = new List<CategoryDashboardDto>
                {
                    BuildCategory(CategoryConstruction, construction),
                    BuildCategory("الطوارئ", emergency),
                    BuildCategory(CategoryOperationsMaintenance, maintenance),
                    BuildCategory("خاص", privateProject),
                    BuildCategory(CategoryOther, newProject)
                }
            };

            return dto;
        }

        private static SummaryMatrixDto BuildSummaryMatrix(
            List<ProjectRecord> construction,
            List<ProjectRecord> emergency,
            List<ProjectRecord> maintenance,
            List<ProjectRecord> privateProject,
            List<ProjectRecord> all)
        {
            CategorySummaryItemDto CreateItem(string key, string name, List<ProjectRecord> records)
            {
                var count = records.Count;
                var est = records.Sum(r => r.EstimatedValue);
                var act = records.Sum(r => r.ActualValue);
                var totalVal = records.Sum(r => r.ActualValue > 0 ? r.ActualValue : r.EstimatedValue);

                return new CategorySummaryItemDto
                {
                    CategoryKey = key,
                    CategoryName = name,
                    TotalRequests = count,
                    EstimatedValue = est,
                    ActualValue = act,
                    TotalWorksValue = totalVal > 0 ? totalVal : (act > 0 ? act : est)
                };
            }

            return new SummaryMatrixDto
            {
                Constructions = CreateItem("constructions", "الإنشاءات", construction),
                Emergency = CreateItem("emergency", "الطوارئ", emergency),
                OperationsMaintenance = CreateItem("operationsMaintenance", "صيانة وعمليات", maintenance),
                PrivateProjects = CreateItem("privateProjects", "خاص", privateProject),
                Total = CreateItem("total", "الإجمالي", all)
            };
        }

        public async Task<BranchDashboardDto> GetBranchDashboardAsync(string branchName, DashboardFilterDto filter)
        {
            if (string.IsNullOrWhiteSpace(branchName))
                throw new ArgumentException("اسم الفرع مطلوب", nameof(branchName));

            // فرض اسم الفرع بغض النظر عما أُرسل في الفلتر (الـ Route هو مصدر الحقيقة هنا)
            filter.BranchName = branchName.Trim();

            var construction = await LoadConstructionAsync(filter);
            var maintenance = await LoadMaintenanceAsync(filter);
            var emergency = await LoadEmergencyAsync(filter);

            var all = construction.Concat(maintenance).Concat(emergency).ToList();

            var dto = new BranchDashboardDto
            {
                BranchName = branchName,
                Overall = BuildFinishedStats(all),
                OfficeBreakdown = BuildLabeledStats(all, r => r.Office),
                StageBreakdown = BuildStageBreakdown(all.Where(r => r.Situation != null)),
                PeriodTrend = BuildPeriodTrend(all, filter.PeriodType),
                Categories = new List<CategoryDashboardDto>
                {
                    BuildCategory(CategoryConstruction, construction),
                    BuildCategory(CategoryOperationsMaintenance, maintenance.Concat(emergency))
                }
            };

            return dto;
        }

        public async Task<DashboardFilterOptionsDto> GetFilterOptionsAsync()
        {
            var branches = new HashSet<string>();
            var offices = new HashSet<string>();
            var situations = new HashSet<string>();
            var constructionTypes = new HashSet<string>();
            var subscribers = new HashSet<string>();
            var workTypes = new HashSet<string>();
            var contractNumbers = new HashSet<string>();

            async Task CollectAsync<T>(IQueryable<T> query,
                Func<T, string?> branch,
                Func<T, string?> office,
                Func<T, string?>? situation = null,
                Func<T, string?>? owner = null,
                Func<T, string?>? workType = null,
                Func<T, string?>? contractNo = null)
            {
                var rows = await query.ToListAsync();
                foreach (var row in rows)
                {
                    AddIfNotEmpty(branches, branch(row));
                    AddIfNotEmpty(offices, office(row));
                    if (situation != null) AddIfNotEmpty(situations, situation(row));
                    if (owner != null) AddIfNotEmpty(subscribers, owner(row));
                    if (workType != null) AddIfNotEmpty(workTypes, workType(row));
                    if (contractNo != null) AddIfNotEmpty(contractNumbers, contractNo(row));
                }
            }

            await CollectAsync(_context.Constructions.Select(c => new { c.BranchName, c.Office, c.Situation, c.ProjectOwner, c.OrderType, c.FaultNumber }).AsQueryable(),
                x => x.BranchName, x => x.Office, x => x.Situation, x => x.ProjectOwner, x => x.OrderType, x => x.FaultNumber);

            await CollectAsync(_context.Maintenances.Select(c => new { c.BranchName, c.Office, c.Situation, c.ProjectOwner, c.OrderType, c.FaultNumber }).AsQueryable(),
                x => x.BranchName, x => x.Office, x => x.Situation, x => x.ProjectOwner, x => x.OrderType, x => x.FaultNumber);

            await CollectAsync(_context.Emergencys.Select(c => new { c.BranchName, c.Office, c.Situation, c.ProjectOwner, c.OrderType, c.FaultNumber }).AsQueryable(),
                x => x.BranchName, x => x.Office, x => x.Situation, x => x.ProjectOwner, x => x.OrderType, x => x.FaultNumber);

            await CollectAsync(_context.NewProjects.Select(c => new { c.BranchName, c.Office, c.Situation, c.ProjectOwner, c.OrderType, c.StationNumber }).AsQueryable(),
                x => x.BranchName, x => x.Office, x => x.Situation, x => x.ProjectOwner, x => x.OrderType, x => x.StationNumber);

            await CollectAsync(_context.PrivateProjects.Select(c => new { c.BranchName, c.ProjectPlace, c.Customer, c.ProjectName, c.StationNumber }).AsQueryable(),
                x => x.BranchName, x => x.ProjectPlace, null, x => x.Customer, x => x.ProjectName, x => x.StationNumber);

            var types = await _context.Constructions
                .Where(c => c.OrderType != null && c.OrderType != "")
                .Select(c => c.OrderType!)
                .Distinct()
                .ToListAsync();
            foreach (var t in types) AddIfNotEmpty(constructionTypes, t);

            return new DashboardFilterOptionsDto
            {
                Branches = branches.OrderBy(x => x).ToList(),
                Offices = offices.OrderBy(x => x).ToList(),
                Situations = situations.OrderBy(x => x).ToList(),
                ConstructionTypes = constructionTypes.OrderBy(x => x).ToList(),
                Subscribers = subscribers.OrderBy(x => x).ToList(),
                WorkTypes = workTypes.OrderBy(x => x).ToList(),
                ContractNumbers = contractNumbers.OrderBy(x => x).ToList()
            };
        }

        // ==========================================================
        //  Loaders - كل واحد بيطبّق الفلاتر المشتركة على مستوى الـ DB
        // ==========================================================
        private async Task<List<ProjectRecord>> LoadConstructionAsync(DashboardFilterDto filter)
        {
            var query = _context.Constructions.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.BranchName))
                query = query.Where(c => c.BranchName != null && c.BranchName.Trim() == filter.BranchName.Trim());

            if (!string.IsNullOrWhiteSpace(filter.Office))
                query = query.Where(c => c.Office != null && c.Office.Trim() == filter.Office.Trim());

            if (!string.IsNullOrWhiteSpace(filter.Situation))
                query = query.Where(c => c.Situation != null && c.Situation.Trim() == filter.Situation.Trim());

            if (filter.IsFinished.HasValue)
                query = query.Where(c => c.IsArchived == filter.IsFinished.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(c => (c.OrderDate ?? c.CreateAt) >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(c => (c.OrderDate ?? c.CreateAt) <= filter.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(filter.ConstructionType))
                query = query.Where(c => c.OrderType != null && c.OrderType.Trim() == filter.ConstructionType.Trim());

            if (filter.ContractNumbers != null && filter.ContractNumbers.Any())
            {
                var contracts = filter.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                if (contracts.Any())
                {
                    query = query.Where(c => (c.ContractNumber != null && contracts.Contains(c.ContractNumber)) ||
                                             (c.FaultNumber != null && contracts.Contains(c.FaultNumber)) ||
                                             (c.StationNumber != null && contracts.Contains(c.StationNumber)));
                }
            }
            else if (!string.IsNullOrWhiteSpace(filter.ContractNumber))
            {
                var cn = filter.ContractNumber.Trim();
                query = query.Where(c => (c.ContractNumber != null && c.ContractNumber.Contains(cn)) ||
                                         (c.FaultNumber != null && c.FaultNumber.Contains(cn)) ||
                                         (c.ExtractNumber != null && c.ExtractNumber.Contains(cn)) ||
                                         (c.StationNumber != null && c.StationNumber.Contains(cn)) ||
                                         c.Id.ToString() == cn);
            }

            if (!string.IsNullOrWhiteSpace(filter.Subscriber))
            {
                var sub = filter.Subscriber.Trim();
                query = query.Where(c => (c.ProjectOwner != null && c.ProjectOwner.Contains(sub)) ||
                                         (c.ProjectParty != null && c.ProjectParty.Contains(sub)));
            }

            if (!string.IsNullOrWhiteSpace(filter.WorkType))
            {
                var wt = filter.WorkType.Trim();
                query = query.Where(c => (c.OrderType != null && c.OrderType.Trim() == wt) ||
                                         (c.WorkOrderType != null && c.WorkOrderType.Trim() == wt));
            }

            var rows = await query
                .Select(c => new
                {
                    c.OrderType,
                    c.WorkOrderType,
                    c.Situation,
                    c.IsArchived,
                    c.BranchName,
                    c.Office,
                    c.FaultNumber,
                    c.ProjectOwner,
                    Date = c.OrderDate ?? c.CreateAt,
                    c.EstimatedValue,
                    c.ActualValue
                })
                .ToListAsync();

            return rows.Select(r => new ProjectRecord
            {
                Category = CategoryConstruction,
                SubType = NormalizeConstructionType(r.OrderType),
                Situation = r.Situation,
                IsArchived = r.IsArchived,
                BranchName = r.BranchName,
                Office = r.Office,
                ContractNumber = r.FaultNumber,
                Subscriber = r.ProjectOwner,
                WorkType = r.OrderType ?? r.WorkOrderType,
                EffectiveDate = r.Date,
                EstimatedValue = ParseDecimal(r.EstimatedValue),
                ActualValue = ParseDecimal(r.ActualValue)
            }).ToList();
        }

        private async Task<List<ProjectRecord>> LoadMaintenanceAsync(DashboardFilterDto filter)
        {
            var query = _context.Maintenances.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.BranchName))
                query = query.Where(c => c.BranchName != null && c.BranchName.Trim() == filter.BranchName.Trim());

            if (!string.IsNullOrWhiteSpace(filter.Office))
                query = query.Where(c => c.Office != null && c.Office.Trim() == filter.Office.Trim());

            if (!string.IsNullOrWhiteSpace(filter.Situation))
                query = query.Where(c => c.Situation != null && c.Situation.Trim() == filter.Situation.Trim());

            if (filter.IsFinished.HasValue)
                query = query.Where(c => c.IsArchived == filter.IsFinished.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(c => (c.OrderDate ?? c.CreateAt) >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(c => (c.OrderDate ?? c.CreateAt) <= filter.ToDate.Value);

            if (filter.ContractNumbers != null && filter.ContractNumbers.Any())
            {
                var contracts = filter.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                if (contracts.Any())
                {
                    query = query.Where(c => (c.ContractNumber != null && contracts.Contains(c.ContractNumber)) ||
                                             (c.FaultNumber != null && contracts.Contains(c.FaultNumber)) ||
                                             (c.StationNumber != null && contracts.Contains(c.StationNumber)));
                }
            }
            else if (!string.IsNullOrWhiteSpace(filter.ContractNumber))
            {
                var cn = filter.ContractNumber.Trim();
                query = query.Where(c => (c.ContractNumber != null && c.ContractNumber.Contains(cn)) ||
                                         (c.FaultNumber != null && c.FaultNumber.Contains(cn)) ||
                                         (c.ExtractNumber != null && c.ExtractNumber.Contains(cn)) ||
                                         (c.StationNumber != null && c.StationNumber.Contains(cn)) ||
                                         c.Id.ToString() == cn);
            }

            if (!string.IsNullOrWhiteSpace(filter.Subscriber))
            {
                var sub = filter.Subscriber.Trim();
                query = query.Where(c => (c.ProjectOwner != null && c.ProjectOwner.Contains(sub)) ||
                                         (c.ProjectParty != null && c.ProjectParty.Contains(sub)));
            }

            if (!string.IsNullOrWhiteSpace(filter.WorkType))
            {
                var wt = filter.WorkType.Trim();
                query = query.Where(c => (c.OrderType != null && c.OrderType.Trim() == wt) ||
                                         (c.WorkOrderType != null && c.WorkOrderType.Trim() == wt));
            }

            var rows = await query
                .Select(c => new
                {
                    c.OrderType,
                    c.WorkOrderType,
                    c.Situation,
                    c.IsArchived,
                    c.BranchName,
                    c.Office,
                    c.FaultNumber,
                    c.ProjectOwner,
                    Date = c.OrderDate ?? c.CreateAt,
                    c.EstimatedValue,
                    c.ActualValue
                })
                .ToListAsync();

            return rows.Select(r => new ProjectRecord
            {
                Category = CategoryOperationsMaintenance,
                SubType = "صيانة",
                Situation = r.Situation,
                IsArchived = r.IsArchived,
                BranchName = r.BranchName,
                Office = r.Office,
                ContractNumber = r.FaultNumber,
                Subscriber = r.ProjectOwner,
                WorkType = r.OrderType ?? r.WorkOrderType,
                EffectiveDate = r.Date,
                EstimatedValue = ParseDecimal(r.EstimatedValue),
                ActualValue = ParseDecimal(r.ActualValue)
            }).ToList();
        }

        private async Task<List<ProjectRecord>> LoadEmergencyAsync(DashboardFilterDto filter)
        {
            var query = _context.Emergencys.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.BranchName))
                query = query.Where(c => c.BranchName != null && c.BranchName.Trim() == filter.BranchName.Trim());

            if (!string.IsNullOrWhiteSpace(filter.Office))
                query = query.Where(c => c.Office != null && c.Office.Trim() == filter.Office.Trim());

            if (!string.IsNullOrWhiteSpace(filter.Situation))
                query = query.Where(c => c.Situation != null && c.Situation.Trim() == filter.Situation.Trim());

            if (filter.IsFinished.HasValue)
                query = query.Where(c => c.IsArchived == filter.IsFinished.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(c => (c.OrderDate ?? c.CreateAt) >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(c => (c.OrderDate ?? c.CreateAt) <= filter.ToDate.Value);

            if (filter.ContractNumbers != null && filter.ContractNumbers.Any())
            {
                var contracts = filter.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                if (contracts.Any())
                {
                    query = query.Where(c => (c.ContractNumber != null && contracts.Contains(c.ContractNumber)) ||
                                             (c.FaultNumber != null && contracts.Contains(c.FaultNumber)) ||
                                             (c.StationNumber != null && contracts.Contains(c.StationNumber)));
                }
            }
            else if (!string.IsNullOrWhiteSpace(filter.ContractNumber))
            {
                var cn = filter.ContractNumber.Trim();
                query = query.Where(c => (c.ContractNumber != null && c.ContractNumber.Contains(cn)) ||
                                         (c.FaultNumber != null && c.FaultNumber.Contains(cn)) ||
                                         (c.ExtractNumber != null && c.ExtractNumber.Contains(cn)) ||
                                         (c.StationNumber != null && c.StationNumber.Contains(cn)) ||
                                         c.Id.ToString() == cn);
            }

            if (!string.IsNullOrWhiteSpace(filter.Subscriber))
            {
                var sub = filter.Subscriber.Trim();
                query = query.Where(c => (c.ProjectOwner != null && c.ProjectOwner.Contains(sub)) ||
                                         (c.ProjectParty != null && c.ProjectParty.Contains(sub)));
            }

            if (!string.IsNullOrWhiteSpace(filter.WorkType))
            {
                var wt = filter.WorkType.Trim();
                query = query.Where(c => (c.OrderType != null && c.OrderType.Trim() == wt) ||
                                         (c.WorkOrderType != null && c.WorkOrderType.Trim() == wt));
            }

            var rows = await query
                .Select(c => new
                {
                    c.OrderType,
                    c.WorkOrderType,
                    c.Situation,
                    c.IsArchived,
                    c.BranchName,
                    c.Office,
                    c.FaultNumber,
                    c.ProjectOwner,
                    Date = c.OrderDate ?? c.CreateAt,
                    c.EstimatedValue,
                    c.ActualValue
                })
                .ToListAsync();

            return rows.Select(r => new ProjectRecord
            {
                Category = CategoryOperationsMaintenance,
                SubType = "طوارئ",
                Situation = r.Situation,
                IsArchived = r.IsArchived,
                BranchName = r.BranchName,
                Office = r.Office,
                ContractNumber = r.FaultNumber,
                Subscriber = r.ProjectOwner,
                WorkType = r.OrderType ?? r.WorkOrderType,
                EffectiveDate = r.Date,
                EstimatedValue = ParseDecimal(r.EstimatedValue),
                ActualValue = ParseDecimal(r.ActualValue)
            }).ToList();
        }

        private async Task<List<ProjectRecord>> LoadNewProjectAsync(DashboardFilterDto filter)
        {
            var query = _context.NewProjects.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.BranchName))
                query = query.Where(c => c.BranchName != null && c.BranchName.Trim() == filter.BranchName.Trim());

            if (!string.IsNullOrWhiteSpace(filter.Office))
                query = query.Where(c => c.Office != null && c.Office.Trim() == filter.Office.Trim());

            if (!string.IsNullOrWhiteSpace(filter.Situation))
                query = query.Where(c => c.Situation != null && c.Situation.Trim() == filter.Situation.Trim());

            if (filter.IsFinished.HasValue)
                query = query.Where(c => c.IsArchived == filter.IsFinished.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(c => (c.OrderDate ?? c.CreateAt) >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(c => (c.OrderDate ?? c.CreateAt) <= filter.ToDate.Value);

            if (filter.ContractNumbers != null && filter.ContractNumbers.Any())
            {
                var contracts = filter.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                if (contracts.Any())
                {
                    query = query.Where(c => (c.ContractNumber != null && contracts.Contains(c.ContractNumber)) ||
                                             (c.StationNumber != null && contracts.Contains(c.StationNumber)));
                }
            }
            else if (!string.IsNullOrWhiteSpace(filter.ContractNumber))
            {
                var cn = filter.ContractNumber.Trim();
                query = query.Where(c => (c.ContractNumber != null && c.ContractNumber.Contains(cn)) ||
                                         (c.StationNumber != null && c.StationNumber.Contains(cn)) ||
                                         (c.ExtractNumber != null && c.ExtractNumber.Contains(cn)) ||
                                         c.Id.ToString() == cn);
            }

            if (!string.IsNullOrWhiteSpace(filter.Subscriber))
            {
                var sub = filter.Subscriber.Trim();
                query = query.Where(c => (c.ProjectOwner != null && c.ProjectOwner.Contains(sub)) ||
                                         (c.ProjectParty != null && c.ProjectParty.Contains(sub)));
            }

            if (!string.IsNullOrWhiteSpace(filter.WorkType))
            {
                var wt = filter.WorkType.Trim();
                query = query.Where(c => (c.OrderType != null && c.OrderType.Trim() == wt) ||
                                         (c.WorkOrderType != null && c.WorkOrderType.Trim() == wt));
            }

            var rows = await query
                .Select(c => new
                {
                    c.OrderType,
                    c.WorkOrderType,
                    c.Situation,
                    c.IsArchived,
                    c.BranchName,
                    c.Office,
                    c.StationNumber,
                    c.ProjectOwner,
                    Date = c.OrderDate ?? c.CreateAt,
                    c.EstimatedValue,
                    c.ActualValue
                })
                .ToListAsync();

            return rows.Select(r => new ProjectRecord
            {
                Category = CategoryOther,
                SubType = "أعمال التأهيل",
                Situation = r.Situation,
                IsArchived = r.IsArchived,
                BranchName = r.BranchName,
                Office = r.Office,
                ContractNumber = r.StationNumber,
                Subscriber = r.ProjectOwner,
                WorkType = r.OrderType ?? r.WorkOrderType,
                EffectiveDate = r.Date,
                EstimatedValue = ParseDecimal(r.EstimatedValue),
                ActualValue = ParseDecimal(r.ActualValue)
            }).ToList();
        }

        private async Task<List<ProjectRecord>> LoadPrivateProjectAsync(DashboardFilterDto filter)
        {
            if (!string.IsNullOrWhiteSpace(filter.Situation))
                return new List<ProjectRecord>();

            var query = _context.PrivateProjects.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.BranchName))
                query = query.Where(p => p.BranchName != null && p.BranchName.Trim() == filter.BranchName.Trim());

            if (!string.IsNullOrWhiteSpace(filter.Office))
                query = query.Where(p => p.ProjectPlace != null && p.ProjectPlace.Trim() == filter.Office.Trim());

            if (filter.IsFinished.HasValue)
                query = query.Where(p => p.IsArchived == filter.IsFinished.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(p => (p.OrderDate ?? p.CreateAt) >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(p => (p.OrderDate ?? p.CreateAt) <= filter.ToDate.Value);

            if (filter.ContractNumbers != null && filter.ContractNumbers.Any())
            {
                var contracts = filter.ContractNumbers.Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c.Trim()).ToList();
                if (contracts.Any())
                {
                    query = query.Where(p => (p.ContractNumber != null && contracts.Contains(p.ContractNumber)) ||
                                             (p.StationNumber != null && contracts.Contains(p.StationNumber)));
                }
            }
            else if (!string.IsNullOrWhiteSpace(filter.ContractNumber))
            {
                var cn = filter.ContractNumber.Trim();
                query = query.Where(p => (p.ContractNumber != null && p.ContractNumber.Contains(cn)) ||
                                         (p.StationNumber != null && p.StationNumber.Contains(cn)) ||
                                         p.Id.ToString() == cn);
            }

            if (!string.IsNullOrWhiteSpace(filter.Subscriber))
            {
                var sub = filter.Subscriber.Trim();
                query = query.Where(p => (p.Customer != null && p.Customer.Contains(sub)) ||
                                         (p.ProjectOwner != null && p.ProjectOwner.Contains(sub)) ||
                                         (p.ProjectParty != null && p.ProjectParty.Contains(sub)));
            }

            if (!string.IsNullOrWhiteSpace(filter.WorkType))
            {
                var wt = filter.WorkType.Trim();
                query = query.Where(p => (p.ProjectName != null && p.ProjectName.Contains(wt)) ||
                                         (p.WorkDescription != null && p.WorkDescription.Contains(wt)));
            }

            var rows = await query
                .Select(p => new
                {
                    p.IsArchived,
                    p.BranchName,
                    p.ProjectPlace,
                    p.StationNumber,
                    p.Customer,
                    p.ProjectName,
                    Date = p.OrderDate ?? p.CreateAt,
                    p.ProjectValue
                })
                .ToListAsync();

            return rows.Select(r => new ProjectRecord
            {
                Category = CategoryOther,
                SubType = "مشاريع خاصة",
                Situation = null,
                IsArchived = r.IsArchived,
                BranchName = r.BranchName,
                Office = r.ProjectPlace,
                ContractNumber = r.StationNumber,
                Subscriber = r.Customer,
                WorkType = r.ProjectName,
                EffectiveDate = r.Date,
                EstimatedValue = ParseDecimal(r.ProjectValue),
                ActualValue = 0m
            }).ToList();
        }

        // ==========================================================
        //  Aggregation Helpers
        // ==========================================================
        private static FinishedStatsDto BuildFinishedStats(IEnumerable<ProjectRecord> records)
        {
            var list = records.ToList();
            var finished = list.Where(r => r.IsArchived).ToList();
            var unfinished = list.Where(r => !r.IsArchived).ToList();

            return new FinishedStatsDto
            {
                Finished = ToValueStats(finished),
                Unfinished = ToValueStats(unfinished),
                Total = ToValueStats(list)
            };
        }

        private static ValueStatsDto ToValueStats(List<ProjectRecord> list) => new()
        {
            Count = list.Count,
            EstimatedValue = list.Sum(r => r.EstimatedValue),
            ActualValue = list.Sum(r => r.ActualValue)
        };

        private static List<LabeledStatDto> BuildLabeledStats(IEnumerable<ProjectRecord> records, Func<ProjectRecord, string?> keySelector)
        {
            return records
                .Where(r => !string.IsNullOrWhiteSpace(keySelector(r)))
                .GroupBy(r => keySelector(r)!.Trim())
                .Select(g => new LabeledStatDto
                {
                    Label = g.Key,
                    Count = g.Count(),
                    EstimatedValue = g.Sum(r => r.EstimatedValue),
                    ActualValue = g.Sum(r => r.ActualValue)
                })
                .OrderByDescending(x => x.Count)
                .ToList();
        }

        private static List<LabeledStatDto> BuildStageBreakdown(IEnumerable<ProjectRecord> records)
            => BuildLabeledStats(records, r => r.Situation);

        private static List<LabeledStatDto> BuildPeriodTrend(IEnumerable<ProjectRecord> records, PeriodGroupType periodType)
        {
            return records
                .GroupBy(r => PeriodLabel(r.EffectiveDate, periodType))
                .Select(g => new LabeledStatDto
                {
                    Label = g.Key,
                    Count = g.Count(),
                    EstimatedValue = g.Sum(r => r.EstimatedValue),
                    ActualValue = g.Sum(r => r.ActualValue)
                })
                .OrderBy(x => x.Label)
                .ToList();
        }

        private static CategoryDashboardDto BuildCategory(string name, IEnumerable<ProjectRecord> records)
        {
            var list = records.ToList();
            return new CategoryDashboardDto
            {
                CategoryName = name,
                Stats = BuildFinishedStats(list),
                SubTypes = BuildLabeledStats(list, r => r.SubType),
                StageBreakdown = BuildStageBreakdown(list.Where(r => r.Situation != null))
            };
        }

        private static string PeriodLabel(DateTime date, PeriodGroupType type) => type switch
        {
            PeriodGroupType.Day => date.ToString("yyyy-MM-dd"),
            PeriodGroupType.Year => date.ToString("yyyy"),
            _ => date.ToString("yyyy-MM")
        };

        private static string NormalizeConstructionType(string? orderType)
        {
            if (string.IsNullOrWhiteSpace(orderType)) return "غير محدد";
            var trimmed = orderType.Trim();
            return trimmed; // القيم الفعلية بتيجي من DB (مشاريع / توصيلات) ومفيش داعي لتقييدها هنا
        }

        private static decimal ParseDecimal(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return 0m;
            var cleaned = value.Replace(",", "").Trim();
            return decimal.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out var result) ? result : 0m;
        }

        private static void AddIfNotEmpty(HashSet<string> set, string? value)
        {
            if (!string.IsNullOrWhiteSpace(value)) set.Add(value.Trim());
        }
    }
}