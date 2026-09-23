using ASF.Core.Dtos.Monitoring;
using ASF.Core.Entities;
using ASF.Core.Helpers;
using ASF.Core.Entities.Workflow;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using Microsoft.EntityFrameworkCore;

namespace ASF.Service
{
    /// <summary>
    /// لوحة المتابعة: مراحل الطلب، واللوحة المالية، ومؤشّرات الموظفين.
    ///
    /// كل ما تعيده محكوم بصلاحية المستخدم أولاً، ثم بالفلاتر. الصيغة واحدة في
    /// كل نقاط هذه الخدمة:
    ///
    ///     النتيجة = صلاحيات المستخدم ∩ نطاق الصفحة ∩ الفلاتر الاختيارية
    ///
    /// فبلا فلتر يُعرض كل ما يحقّ له رؤيته، والفلتر يُضيّق ولا يوسّع، ولا
    /// يتجاوز الصلاحية بحال. التطبيق هنا في الخادم لا في الواجهة.
    /// </summary>
    public class MonitoringService : IMonitoringService
    {
        private readonly ApplicationDbContext _db;

        public MonitoringService(ApplicationDbContext db)
        {
            _db = db;
        }

        // ───────────────── اللوحة ─────────────────

        public async Task<MonitoringBoardDto> GetBoardAsync(MonitoringFilterDto filter, string userId)
        {
            filter ??= new MonitoringFilterDto();

            var board = new MonitoringBoardDto();

            var allowed = await GetAllowedDepartmentIdsAsync(userId);

            var placements = await ReadPlacementsAsync(filter, allowed);
            if (placements.Count == 0)
            {
                board.Notices.Add("لا أوامر عمل ضمن النطاق والفلاتر الحالية.");
                await FillEmployeesAsync(board, filter, allowed, new List<int>());
                return board;
            }

            var facts = await ReadFactsAsync(placements);

            // الفلاتر التي تخصّ أمر العمل نفسه — لا الموقع — تُطبَّق بعد قراءته.
            var rows = placements
                .Select(p => new { Placement = p, Fact = facts.GetValueOrDefault((p.ProjectTypeCode, p.WorkOrderId)) })
                .Where(x => x.Fact is not null)
                .Where(x => Matches(x.Fact!, filter))
                .ToList();

            board.TotalOrders = rows.Count;

            if (rows.Count == 0)
            {
                board.Notices.Add("الفلاتر استبعدت كل أوامر العمل في هذا النطاق.");
                await FillEmployeesAsync(board, filter, allowed, new List<int>());
                return board;
            }

            // ── مراحل الطلب ──
            var basketNames = await ReadBasketNamesAsync(rows.Select(r => r.Placement.DepartmentId).Distinct().ToList());
            var now = DateTime.UtcNow;

            board.Stages = rows
                .GroupBy(r => (r.Placement.DepartmentId, r.Placement.BasketStableKey))
                .Select(g =>
                {
                    var key = (g.Key.DepartmentId, g.Key.BasketStableKey);
                    var meta = basketNames.GetValueOrDefault(key);

                    return new StageStatDto
                    {
                        DepartmentId = g.Key.DepartmentId,
                        DepartmentName = meta?.DepartmentName,
                        BasketStableKey = g.Key.BasketStableKey,
                        BasketName = meta?.Name ?? $"سلة {g.Key.BasketStableKey}",
                        SortOrder = meta?.SortOrder ?? int.MaxValue,

                        Count = g.Count(),
                        EstimatedValue = g.Sum(x => x.Fact!.Estimated ?? 0m),
                        ActualValue = g.Sum(x => x.Fact!.Actual ?? 0m),

                        MissingEstimated = g.Count(x => x.Fact!.Estimated is null),
                        MissingActual = g.Count(x => x.Fact!.Actual is null),

                        AverageDaysInStage = Math.Round(
                            g.Average(x => (now - x.Placement.EnteredBasketAt).TotalDays), 1),

                        // المتوسّط وحده يخفي أمر عمل واقفاً منذ شهور بين عشرة
                        // دخلت أمس، فيُعرض الأطول بجانبه.
                        LongestDaysInStage = Math.Round(
                            g.Max(x => (now - x.Placement.EnteredBasketAt).TotalDays), 1),
                    };
                })
                .OrderBy(s => s.DepartmentName).ThenBy(s => s.SortOrder)
                .ToList();

            // ── المسند والمصروف والمتبقي ──
            board.Financial = BuildFinancial(
                rows.Select(r => (r.Placement, r.Fact!)).ToList(),
                basketNames);

            // ── مدة الإنجاز ──
            await FillCompletionAsync(board, rows.Select(r => r.Placement).ToList());

            // ── مؤشّرات الموظفين ──
            await FillEmployeesAsync(board, filter, allowed,
                rows.Select(r => r.Placement.Id).ToList());

            var missing = rows.Count(r => r.Fact!.Estimated is null);
            if (missing > 0)
            {
                board.Notices.Add(
                    $"{missing} من {rows.Count} أمر عمل بلا قيمة تقديرية مقروءة — غير محسوبة في المجاميع.");
            }

            return board;
        }

        // ───────────────── المواقع ─────────────────

        private async Task<List<WorkOrderPlacement>> ReadPlacementsAsync(
            MonitoringFilterDto filter, HashSet<int>? allowed)
        {
            var query = _db.WorkOrderPlacements.AsNoTracking();

            // الصلاحية أولاً: ما بعدها فلاتر تُضيّق داخلها لا تتجاوزها.
            if (allowed is not null) query = query.Where(p => allowed.Contains(p.DepartmentId));

            if (filter.ContractId is int contract) query = query.Where(p => p.ContractId == contract);
            if (filter.DepartmentId is int department) query = query.Where(p => p.DepartmentId == department);
            if (filter.BasketStableKey is int basket) query = query.Where(p => p.BasketStableKey == basket);

            if (!string.IsNullOrWhiteSpace(filter.ProjectTypeCode))
                query = query.Where(p => p.ProjectTypeCode == filter.ProjectTypeCode);

            return await query.ToListAsync();
        }

        // ───────────────── حقائق أمر العمل ─────────────────

        /// <summary>ما تحتاجه اللوحة من أمر العمل، استعلام واحد لكل نوع.</summary>
        private sealed class OrderFact
        {
            public decimal? Estimated { get; init; }
            public decimal? Actual { get; init; }
            public DateTime? ReceivedAt { get; init; }
            public int? TypeRefId { get; init; }
            public int? ContractorRefId { get; init; }
            public int? DistrictRefId { get; init; }
            public string? CreatedByUserId { get; init; }
            public string? CreatedByUserName { get; init; }
            public DateTime CreatedAt { get; init; }
        }

        private async Task<Dictionary<(string, int), OrderFact>> ReadFactsAsync(
            List<WorkOrderPlacement> placements)
        {
            var result = new Dictionary<(string, int), OrderFact>();

            foreach (var group in placements.GroupBy(p => p.ProjectTypeCode))
            {
                var ids = group.Select(p => p.WorkOrderId).ToList();

                // الأعمدة واحدة في الأنواع الأربعة، لكن الجداول منفصلة ولا يجمعها
                // نوعٌ واحد في EF — فلكلٍّ استعلامه.
                switch (group.Key)
                {
                    case ProjectTypeCodes.Construction:
                        foreach (var x in await _db.Constructions.AsNoTracking()
                                     .Where(x => ids.Contains(x.Id))
                                     .Select(x => new { x.Id, x.EstimatedAmount, x.ActualAmount, x.ReceiveDateTime,
                                         x.WorkOrderTypeRefId, x.ContractorRefId, x.DistrictRefId,
                                         x.AppUserId, x.UserName, x.CreateAt })
                                     .ToListAsync())
                            result[(group.Key, x.Id)] = Fact(x.EstimatedAmount, x.ActualAmount, x.ReceiveDateTime,
                                x.WorkOrderTypeRefId, x.ContractorRefId, x.DistrictRefId, x.AppUserId, x.UserName, x.CreateAt);
                        break;

                    case ProjectTypeCodes.Maintenance:
                        foreach (var x in await _db.Maintenances.AsNoTracking()
                                     .Where(x => ids.Contains(x.Id))
                                     .Select(x => new { x.Id, x.EstimatedAmount, x.ActualAmount, x.ReceiveDateTime,
                                         x.WorkOrderTypeRefId, x.ContractorRefId, x.DistrictRefId,
                                         x.AppUserId, x.UserName, x.CreateAt })
                                     .ToListAsync())
                            result[(group.Key, x.Id)] = Fact(x.EstimatedAmount, x.ActualAmount, x.ReceiveDateTime,
                                x.WorkOrderTypeRefId, x.ContractorRefId, x.DistrictRefId, x.AppUserId, x.UserName, x.CreateAt);
                        break;

                    case ProjectTypeCodes.Emergency:
                        foreach (var x in await _db.Emergencys.AsNoTracking()
                                     .Where(x => ids.Contains(x.Id))
                                     .Select(x => new { x.Id, x.EstimatedAmount, x.ActualAmount, x.ReceiveDateTime,
                                         x.WorkOrderTypeRefId, x.ContractorRefId, x.DistrictRefId,
                                         x.AppUserId, x.UserName, x.CreateAt })
                                     .ToListAsync())
                            result[(group.Key, x.Id)] = Fact(x.EstimatedAmount, x.ActualAmount, x.ReceiveDateTime,
                                x.WorkOrderTypeRefId, x.ContractorRefId, x.DistrictRefId, x.AppUserId, x.UserName, x.CreateAt);
                        break;

                    case ProjectTypeCodes.NewProject:
                        foreach (var x in await _db.NewProjects.AsNoTracking()
                                     .Where(x => ids.Contains(x.Id))
                                     .Select(x => new { x.Id, x.EstimatedAmount, x.ActualAmount, x.ReceiveDateTime,
                                         x.WorkOrderTypeRefId, x.ContractorRefId, x.DistrictRefId,
                                         x.AppUserId, x.UserName, x.CreateAt })
                                     .ToListAsync())
                            result[(group.Key, x.Id)] = Fact(x.EstimatedAmount, x.ActualAmount, x.ReceiveDateTime,
                                x.WorkOrderTypeRefId, x.ContractorRefId, x.DistrictRefId, x.AppUserId, x.UserName, x.CreateAt);
                        break;
                }
            }

            return result;
        }

        private static OrderFact Fact(decimal? estimated, decimal? actual, DateTime? received,
            int? typeRef, int? contractorRef, int? districtRef,
            string? userId, string? userName, DateTime createdAt) =>
            new()
            {
                Estimated = estimated,
                Actual = actual,
                ReceivedAt = received,
                TypeRefId = typeRef,
                ContractorRefId = contractorRef,
                DistrictRefId = districtRef,
                CreatedByUserId = userId,
                CreatedByUserName = userName,
                CreatedAt = createdAt,
            };

        /// <summary>فلاتر تخصّ أمر العمل نفسه.</summary>
        private static bool Matches(OrderFact fact, MonitoringFilterDto filter)
        {
            if (filter.WorkOrderTypeRefId is int type && fact.TypeRefId != type) return false;
            if (filter.ContractorRefId is int contractor && fact.ContractorRefId != contractor) return false;
            if (filter.DistrictRefId is int district && fact.DistrictRefId != district) return false;

            if (filter.ReceivedFrom is DateTime from &&
                (fact.ReceivedAt is null || fact.ReceivedAt < from.Date)) return false;

            // النهاية تشمل يومها كاملاً: «إلى ١ سبتمبر» يعني حتى آخره.
            if (filter.ReceivedTo is DateTime to &&
                (fact.ReceivedAt is null || fact.ReceivedAt > to.Date.AddDays(1).AddTicks(-1))) return false;

            return true;
        }

        // ───────────────── مدة الإنجاز ─────────────────

        /// <summary>
        /// متوسّط الزمن من دخول المسار إلى بلوغ المرحلة الأخيرة.
        ///
        /// يُقاس من سجلّ الحركة — تواريخ حقيقية سجّلها النظام — لا من حقل
        /// «تاريخ الإنجاز» النصّي الذي قد يُترك فارغاً أو يُكتب بصيغة لا تُقرأ.
        ///
        /// «الأخيرة» هي أعلى ترتيباً في مسار القسم المعتمد، فلكل قسم نهايته.
        /// </summary>
        private async Task FillCompletionAsync(MonitoringBoardDto board, List<WorkOrderPlacement> placements)
        {
            var departmentIds = placements.Select(p => p.DepartmentId).Distinct().ToList();
            if (departmentIds.Count == 0) return;

            var baskets = await ReadBasketNamesAsync(departmentIds);

            // آخر مرحلة في كل قسم.
            var finalKey = baskets
                .GroupBy(b => b.Key.Item1)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(x => x.Value.SortOrder).First().Key.Item2);

            var ids = placements.Select(p => p.Id).ToList();

            var arrivals = await _db.WorkOrderBasketHistories.AsNoTracking()
                .Where(h => ids.Contains(h.PlacementId))
                .Select(h => new { h.PlacementId, h.ToBasketStableKey, h.MovedAt })
                .ToListAsync();

            // أوّل وصول إلى المرحلة الأخيرة: العودة إليها مرّة ثانية لا تُعيد
            // احتساب المدة من جديد.
            var reachedFinal = arrivals
                .GroupBy(a => a.PlacementId)
                .ToDictionary(g => g.Key, g => g.OrderBy(a => a.MovedAt).ToList());

            var durations = new List<double>();

            foreach (var placement in placements)
            {
                if (!finalKey.TryGetValue(placement.DepartmentId, out var last)) continue;
                if (!reachedFinal.TryGetValue(placement.Id, out var history)) continue;

                var arrival = history.FirstOrDefault(h => h.ToBasketStableKey == last);
                if (arrival is null) continue;

                var days = (arrival.MovedAt - placement.CreatedAt).TotalDays;

                // المدة السالبة تعني بيانات مرحّلة بتواريخ غير متّسقة — تُستبعد
                // ولا تُصفَّر، فتصفيرها يجرّ المتوسّط إلى أسفل بلا سبب.
                if (days >= 0) durations.Add(days);
            }

            board.CompletedCount = durations.Count;
            board.InProgressCount = placements.Count - durations.Count;
            board.AverageCompletionDays = durations.Count == 0
                ? 0
                : Math.Round(durations.Average(), 1);
        }

        // ───────────────── اللوحة المالية ─────────────────

        private FinancialSummaryDto BuildFinancial(
            List<(WorkOrderPlacement Placement, OrderFact Fact)> rows,
            Dictionary<(int, int), BasketMeta> baskets)
        {
            var assigned = rows.Sum(r => r.Fact.Estimated ?? 0m);
            var spent = rows.Sum(r => r.Fact.Actual ?? 0m);

            var summary = new FinancialSummaryDto
            {
                Assigned = assigned,
                Spent = spent,
                Remaining = assigned - spent,
                SpentPercent = assigned == 0 ? 0 : Math.Round((double)(spent / assigned) * 100, 1),
                OrdersCount = rows.Count,
                OrdersWithoutEstimate = rows.Count(r => r.Fact.Estimated is null),
                OrdersWithoutActual = rows.Count(r => r.Fact.Actual is null),
            };

            summary.ByDepartment = rows
                .GroupBy(r => r.Placement.DepartmentId)
                .Select(g =>
                {
                    var a = g.Sum(x => x.Fact.Estimated ?? 0m);
                    var s = g.Sum(x => x.Fact.Actual ?? 0m);

                    var name = baskets
                        .Where(b => b.Key.Item1 == g.Key)
                        .Select(b => b.Value.DepartmentName)
                        .FirstOrDefault();

                    return new FinancialBreakdownDto
                    {
                        Id = g.Key,
                        Name = name ?? $"قسم {g.Key}",
                        Count = g.Count(),
                        Assigned = a,
                        Spent = s,
                        Remaining = a - s,
                    };
                })
                .OrderByDescending(x => x.Assigned)
                .ToList();

            summary.ByContract = rows
                .GroupBy(r => r.Placement.ContractId)
                .Select(g =>
                {
                    var a = g.Sum(x => x.Fact.Estimated ?? 0m);
                    var s = g.Sum(x => x.Fact.Actual ?? 0m);

                    return new FinancialBreakdownDto
                    {
                        Id = g.Key,
                        Name = $"عقد {g.Key}",
                        Count = g.Count(),
                        Assigned = a,
                        Spent = s,
                        Remaining = a - s,
                    };
                })
                .OrderByDescending(x => x.Assigned)
                .ToList();

            return summary;
        }

        // ───────────────── مؤشّرات الموظفين ─────────────────

        private async Task FillEmployeesAsync(MonitoringBoardDto board, MonitoringFilterDto filter,
            HashSet<int>? allowed, List<int> placementIds)
        {
            var from = filter.ActivityFrom?.Date;
            var to = filter.ActivityTo?.Date.AddDays(1).AddTicks(-1);

            var movesQuery = _db.WorkOrderBasketHistories.AsNoTracking().AsQueryable();
            var tasksQuery = _db.WorkOrderTaskStates.AsNoTracking().Where(t => t.IsDone);

            // النشاط يُقصر على أوامر العمل الظاهرة، فلا يُحسب للموظّف عملٌ على
            // ما لا يحقّ للقارئ رؤيته.
            if (placementIds.Count > 0)
            {
                movesQuery = movesQuery.Where(h => placementIds.Contains(h.PlacementId));
                tasksQuery = tasksQuery.Where(t => placementIds.Contains(t.PlacementId));
            }
            else if (allowed is not null)
            {
                var visible = _db.WorkOrderPlacements.AsNoTracking()
                    .Where(p => allowed.Contains(p.DepartmentId))
                    .Select(p => p.Id);

                movesQuery = movesQuery.Where(h => visible.Contains(h.PlacementId));
                tasksQuery = tasksQuery.Where(t => visible.Contains(t.PlacementId));
            }

            if (from is DateTime f)
            {
                movesQuery = movesQuery.Where(h => h.MovedAt >= f);
                tasksQuery = tasksQuery.Where(t => t.DoneAt >= f);
            }

            if (to is DateTime t2)
            {
                movesQuery = movesQuery.Where(h => h.MovedAt <= t2);
                tasksQuery = tasksQuery.Where(t => t.DoneAt <= t2);
            }

            var moves = await movesQuery
                .Select(h => new { h.MovedByUserId, h.MovedByUserName, h.MovedAt, h.PlacementId })
                .ToListAsync();

            var tasks = await tasksQuery
                .Select(t => new { t.DoneByUserId, t.DoneByUserName, t.DoneAt, t.PlacementId })
                .ToListAsync();

            var byUser = new Dictionary<string, EmployeeActivityDto>();
            var touched = new Dictionary<string, HashSet<int>>();

            EmployeeActivityDto Row(string id, string? name)
            {
                if (!byUser.TryGetValue(id, out var row))
                {
                    row = new EmployeeActivityDto { UserId = id, UserName = name };
                    byUser[id] = row;
                    touched[id] = new HashSet<int>();
                }

                // الاسم قد يكون فارغاً في سطر وموجوداً في آخر.
                if (string.IsNullOrWhiteSpace(row.UserName) && !string.IsNullOrWhiteSpace(name))
                    row.UserName = name;

                return row;
            }

            foreach (var move in moves)
            {
                if (string.IsNullOrWhiteSpace(move.MovedByUserId)) continue;

                var row = Row(move.MovedByUserId, move.MovedByUserName);
                row.Moves++;
                touched[move.MovedByUserId].Add(move.PlacementId);

                if (row.LastActivityAt is null || move.MovedAt > row.LastActivityAt)
                    row.LastActivityAt = move.MovedAt;
            }

            foreach (var task in tasks)
            {
                if (string.IsNullOrWhiteSpace(task.DoneByUserId)) continue;

                var row = Row(task.DoneByUserId, task.DoneByUserName);
                row.TasksDone++;
                touched[task.DoneByUserId].Add(task.PlacementId);

                if (task.DoneAt is DateTime done && (row.LastActivityAt is null || done > row.LastActivityAt))
                    row.LastActivityAt = done;
            }

            foreach (var row in byUser.Values)
            {
                row.OrdersTouched = touched[row.UserId].Count;
                row.TotalActions = row.Moves + row.TasksDone + row.Created;
            }

            board.Employees = byUser.Values
                .OrderByDescending(e => e.TotalActions)
                .ThenByDescending(e => e.LastActivityAt)
                .ToList();

            // ── الحركة عبر الزمن ──
            board.Activity = moves
                .Select(m => new { Date = m.MovedAt.Date, Move = 1, Task = 0 })
                .Concat(tasks.Where(x => x.DoneAt != null)
                    .Select(x => new { Date = x.DoneAt!.Value.Date, Move = 0, Task = 1 }))
                .GroupBy(x => x.Date)
                .Select(g => new ActivityPointDto
                {
                    Date = g.Key,
                    Moves = g.Sum(x => x.Move),
                    TasksDone = g.Sum(x => x.Task),
                })
                .OrderBy(p => p.Date)
                .ToList();
        }

        // ───────────────── إعادة حساب المبالغ ─────────────────

        /// <summary>
        /// يعيد قراءة المبالغ النصّية إلى أرقام.
        ///
        /// الترحيل يملأ الشائع — أرقاماً وفواصل — لكنه لا يعرف «45000 ريال».
        /// هذه تستعمل قارئ الكود نفسه الذي يعمل وقت الحفظ، فما يُقرأ هنا هو
        /// ما سيُقرأ هناك بالضبط.
        ///
        /// تُشغَّل عند الطلب لا عند كل إقلاع: مسحٌ كامل للجداول في كل مرّة
        /// ثمنٌ يُدفع بلا مقابل بعد أوّل تشغيل.
        /// </summary>
        public async Task<Dictionary<string, int>> RecomputeAmountsAsync()
        {
            var report = new Dictionary<string, int>();

            report["Constructions"] = await RecomputeAsync(_db.Constructions);
            report["Emergencys"] = await RecomputeAsync(_db.Emergencys);
            report["Maintenances"] = await RecomputeAsync(_db.Maintenances);
            report["NewProjects"] = await RecomputeAsync(_db.NewProjects);

            return report;
        }

        private async Task<int> RecomputeAsync<T>(DbSet<T> set) where T : class, IListLinkedWorkOrder
        {
            // الصفوف التي نصّها غير فارغ فقط: الفارغ لا شيء فيه ليُقرأ.
            var rows = await set
                .Where(x => (x.EstimatedValue != null && x.EstimatedValue != "")
                         || (x.ActualValue != null && x.ActualValue != ""))
                .ToListAsync();

            var changed = 0;

            foreach (var row in rows)
            {
                var estimated = AmountText.Parse(row.EstimatedValue);
                var actual = AmountText.Parse(row.ActualValue);

                if (row.EstimatedAmount == estimated && row.ActualAmount == actual) continue;

                row.EstimatedAmount = estimated;
                row.ActualAmount = actual;
                changed++;
            }

            if (changed > 0) await _db.SaveChangesAsync();
            return changed;
        }

        // ───────────────── خيارات الفلاتر ─────────────────

        public async Task<MonitoringOptionsDto> GetOptionsAsync(string userId)
        {
            var allowed = await GetAllowedDepartmentIdsAsync(userId);

            var departmentsQuery = _db.WorkflowDepartments.AsNoTracking().Include(d => d.Contract).AsQueryable();
            if (allowed is not null) departmentsQuery = departmentsQuery.Where(d => allowed.Contains(d.Id));

            var departments = await departmentsQuery
                .Select(d => new { d.Id, d.Name, d.ContractId, ContractName = d.Contract.Name, d.Contract.ContractNumber })
                .ToListAsync();

            var options = new MonitoringOptionsDto
            {
                Departments = departments
                    .Select(d => new OptionDto
                    {
                        Id = d.Id,
                        Name = d.Name,
                        Group = d.ContractName,
                        ParentId = d.ContractId,
                    })
                    .ToList(),

                Contracts = departments
                    .GroupBy(d => new { d.ContractId, d.ContractName, d.ContractNumber })
                    .Select(g => new OptionDto
                    {
                        Id = g.Key.ContractId,
                        Name = $"{g.Key.ContractNumber} — {g.Key.ContractName}",
                    })
                    .ToList(),
            };

            var contractIds = departments.Select(d => d.ContractId).Distinct().ToList();

            // القوائم من مصدرها الموحّد: العامة وما يخصّ عقود المستخدم.
            var values = await _db.ContractWorkOrderTypes.AsNoTracking()
                .Where(t => t.IsActive && (t.ContractId == null || contractIds.Contains(t.ContractId.Value)))
                .Select(t => new { t.Id, t.Name, t.Category, t.SortOrder })
                .ToListAsync();

            List<OptionDto> Pick(string category) => values
                .Where(v => v.Category == category)
                .OrderBy(v => v.SortOrder).ThenBy(v => v.Name)
                .Select(v => new OptionDto { Id = v.Id, Name = v.Name })
                .ToList();

            options.WorkOrderTypes = Pick(ContractListCategories.WorkOrderType);
            options.Contractors = Pick(ContractListCategories.Contractor);
            options.Districts = Pick(ContractListCategories.District);

            var departmentIds = departments.Select(d => d.Id).ToList();
            var baskets = await ReadBasketNamesAsync(departmentIds);

            options.Baskets = baskets
                .GroupBy(b => b.Value.Name)
                .Select(g => new OptionDto
                {
                    Id = g.First().Key.Item2,
                    Name = g.Key,
                })
                .OrderBy(b => b.Name)
                .ToList();

            return options;
        }

        // ───────────────── مساعدات ─────────────────

        private sealed class BasketMeta
        {
            public string Name { get; init; }
            public int SortOrder { get; init; }
            public string? DepartmentName { get; init; }
        }

        /// <summary>
        /// أسماء السلال من النسخة المعتمدة.
        ///
        /// المفتاح الثابت هو ما يُخزَّن في الموقع، والاسم يُقرأ منه — فإعادة
        /// تسمية سلة تظهر في اللوحة فوراً ولا تُنشئ مرحلةً ثانية.
        /// </summary>
        private async Task<Dictionary<(int, int), BasketMeta>> ReadBasketNamesAsync(List<int> departmentIds)
        {
            if (departmentIds.Count == 0) return new Dictionary<(int, int), BasketMeta>();

            var rows = await _db.Workflows.AsNoTracking()
                .Where(w => departmentIds.Contains(w.DepartmentId) && w.Status == WorkflowStatus.Published)
                .SelectMany(w => w.Baskets.Select(b => new
                {
                    w.DepartmentId,
                    DepartmentName = w.Department.Name,
                    b.StableKey,
                    b.Name,
                    b.SortOrder,
                }))
                .ToListAsync();

            return rows
                .GroupBy(r => (r.DepartmentId, r.StableKey))
                .ToDictionary(
                    g => g.Key,
                    g => new BasketMeta
                    {
                        Name = g.First().Name,
                        SortOrder = g.First().SortOrder,
                        DepartmentName = g.First().DepartmentName,
                    });
        }

        /// <summary>
        /// الأقسام التي يحقّ للمستخدم رؤيتها. <c>null</c> = بلا تخصيص، فيبقى
        /// الأمر لصلاحيات النظام العامة.
        /// </summary>
        private async Task<HashSet<int>?> GetAllowedDepartmentIdsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return null;

            var scopes = await _db.UserDataScopes.AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => new { x.ContractId, x.DepartmentId })
                .ToListAsync();

            var grants = await _db.ContractTeamPermissions.AsNoTracking()
                .Where(x => x.UserId == userId && x.CanView)
                .Select(x => new { x.ContractId, x.DepartmentId })
                .ToListAsync();

            if (scopes.Count == 0 && grants.Count == 0) return null;

            scopes = scopes.Concat(grants).ToList();

            var departments = scopes
                .Where(x => x.DepartmentId != null)
                .Select(x => x.DepartmentId!.Value)
                .ToHashSet();

            var wholeContracts = scopes
                .Where(x => x.DepartmentId == null)
                .Select(x => x.ContractId)
                .ToList();

            if (wholeContracts.Count > 0)
            {
                var ids = await _db.WorkflowDepartments.AsNoTracking()
                    .Where(d => wholeContracts.Contains(d.ContractId))
                    .Select(d => d.Id)
                    .ToListAsync();

                foreach (var id in ids) departments.Add(id);
            }

            return departments;
        }
    }
}
