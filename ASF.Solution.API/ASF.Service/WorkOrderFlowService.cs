using ASF.Core.DTOs.Workflow;
using ASF.Core.Entities.Workflow;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using Microsoft.EntityFrameworkCore;

namespace ASF.Service
{
    /// <summary>
    /// حركة أمر العمل داخل مسار السلال.
    ///
    /// الموقع والمهام المنجزة تُحفظ بالمفاتيح الثابتة لا بمعرّفات الصفوف، فاعتماد
    /// نسخة جديدة من المسار لا ينقل أمر عمل من سلته ولا يمحو ما أُنجز.
    /// </summary>
    public class WorkOrderFlowService : IWorkOrderFlowService
    {
        private readonly ApplicationDbContext _db;

        public WorkOrderFlowService(ApplicationDbContext db)
        {
            _db = db;
        }

        // ─────────────────────────── القراءة ───────────────────────────

        public async Task<PlacementDto?> GetPlacementAsync(string projectTypeCode, int workOrderId)
        {
            var placement = await LoadPlacementAsync(projectTypeCode, workOrderId);
            return placement is null ? null : await BuildDtoAsync(placement);
        }

        public async Task<List<BasketHistoryDto>> GetHistoryAsync(string projectTypeCode, int workOrderId)
        {
            var placement = await LoadPlacementAsync(projectTypeCode, workOrderId);
            if (placement is null) return new List<BasketHistoryDto>();

            return await _db.WorkOrderBasketHistories.AsNoTracking()
                .Where(h => h.PlacementId == placement.Id)
                .OrderByDescending(h => h.MovedAt).ThenByDescending(h => h.Id)
                .Select(h => new BasketHistoryDto
                {
                    Id = h.Id,
                    FromBasketStableKey = h.FromBasketStableKey,
                    FromBasketName = h.FromBasketName,
                    ToBasketStableKey = h.ToBasketStableKey,
                    ToBasketName = h.ToBasketName,
                    MovedAt = h.MovedAt,
                    MovedByUserId = h.MovedByUserId,
                    MovedByUserName = h.MovedByUserName,
                    Note = h.Note
                })
                .ToListAsync();
        }

        public async Task<List<BasketLoadDto>> GetBasketLoadAsync(int departmentId)
        {
            var baskets = await GetPublishedBasketsAsync(departmentId);
            if (baskets.Count == 0) return new List<BasketLoadDto>();

            var counts = await _db.WorkOrderPlacements.AsNoTracking()
                .Where(p => p.DepartmentId == departmentId)
                .GroupBy(p => p.BasketStableKey)
                .Select(g => new { Key = g.Key, Count = g.Count() })
                .ToListAsync();

            var byKey = counts.ToDictionary(c => c.Key, c => c.Count);

            return baskets
                .OrderBy(b => b.SortOrder)
                .Select((b, i) => new BasketLoadDto
                {
                    BasketStableKey = b.StableKey,
                    BasketId = b.Id,
                    BasketName = b.Name,
                    Order = i + 1,
                    WorkOrdersCount = byKey.TryGetValue(b.StableKey, out var n) ? n : 0
                })
                .ToList();
        }

        // ─────────────────────────── الدخول والحركة ───────────────────────────

        public async Task<(PlacementDto?, string?)> EnterWorkflowAsync(
            EnterWorkflowDto dto, string userId, string? userName)
        {
            if (!ProjectTypeCodes.IsValid(dto.ProjectTypeCode))
                return (null, "نوع المشروع غير معروف.");

            var existing = await LoadPlacementAsync(dto.ProjectTypeCode, dto.WorkOrderId);
            if (existing is not null)
                return (await BuildDtoAsync(existing), null);

            // بدون هذا التحقّق يمكن تسجيل موقع لأمر عمل لا وجود له، فيُحسب في
            // تحميل السلة ويمنع حذفها إلى الأبد.
            if (!await WorkOrderExistsAsync(dto.ProjectTypeCode, dto.WorkOrderId))
                return (null, "أمر العمل غير موجود.");

            var department = await _db.WorkflowDepartments.AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == dto.DepartmentId);
            if (department is null) return (null, "القسم غير موجود.");
            if (!department.IsActive) return (null, "القسم معطّل.");

            if (department.ProjectTypeCode is not null &&
                !string.Equals(department.ProjectTypeCode, dto.ProjectTypeCode, StringComparison.Ordinal))
            {
                return (null, $"القسم «{department.Name}» مرتبط بنوع مشروع آخر.");
            }

            var baskets = await GetPublishedBasketsAsync(dto.DepartmentId);
            var first = baskets.OrderBy(b => b.SortOrder).FirstOrDefault();
            if (first is null)
                return (null, "لا يوجد مسار معتمد بسلال مفعّلة لهذا القسم.");

            var placement = new WorkOrderPlacement
            {
                ProjectTypeCode = dto.ProjectTypeCode,
                WorkOrderId = dto.WorkOrderId,
                ContractId = department.ContractId,
                DepartmentId = department.Id,
                BasketStableKey = first.StableKey
            };

            placement.History.Add(new WorkOrderBasketHistory
            {
                FromBasketStableKey = null,
                ToBasketStableKey = first.StableKey,
                ToBasketName = first.Name,
                MovedByUserId = userId,
                MovedByUserName = userName,
                Note = dto.Note
            });

            _db.WorkOrderPlacements.Add(placement);
            await _db.SaveChangesAsync();

            return (await BuildDtoAsync(placement), null);
        }

        public async Task<string?> AutoEnterAsync(string projectTypeCode, int workOrderId,
            string? contractNumber, string userId, string? userName)
        {
            try
            {
                if (!ProjectTypeCodes.IsValid(projectTypeCode))
                    return "نوع مشروع غير معروف.";

                if (await _db.WorkOrderPlacements.AnyAsync(p =>
                        p.ProjectTypeCode == projectTypeCode && p.WorkOrderId == workOrderId))
                    return null; // مسجَّل أصلاً

                var department = await ResolveDepartmentAsync(projectTypeCode, contractNumber);
                if (department is null)
                    return "تعذّر تحديد عقد أمر العمل، فلم يُدخَل المسار.";

                var baskets = await GetPublishedBasketsAsync(department.Id);
                var first = baskets.OrderBy(b => b.SortOrder).FirstOrDefault();
                if (first is null)
                    return "لا يوجد مسار معتمد لهذا القسم، فلم يُدخَل المسار.";

                var placement = new WorkOrderPlacement
                {
                    ProjectTypeCode = projectTypeCode,
                    WorkOrderId = workOrderId,
                    ContractId = department.ContractId,
                    DepartmentId = department.Id,
                    BasketStableKey = first.StableKey
                };

                placement.History.Add(new WorkOrderBasketHistory
                {
                    FromBasketStableKey = null,
                    ToBasketStableKey = first.StableKey,
                    ToBasketName = first.Name,
                    MovedByUserId = userId,
                    MovedByUserName = userName,
                    Note = "دخول تلقائي عند إنشاء أمر العمل"
                });

                _db.WorkOrderPlacements.Add(placement);
                await _db.SaveChangesAsync();
                return null;
            }
            catch (Exception ex)
            {
                // إنشاء أمر العمل نجح بالفعل. فشل تسجيل الموقع لا يجوز أن يُبطله.
                return "تعذّر إدخال أمر العمل المسار: " + ex.Message;
            }
        }

        /// <summary>
        /// قسم العقد الذي يتبعه أمر عمل من هذا النوع.
        ///
        /// يُطابَق برقم العقد إن وُجد. وإن لم يوجد، يُقبل عقد واحد فقط: لو كان
        /// أكثر من عقد يملك قسماً لهذا النوع، فالتخمين يضع أمر العمل في عقد خاطئ،
        /// والتخطّي أسلم.
        /// </summary>
        private async Task<WorkflowDepartment?> ResolveDepartmentAsync(
            string projectTypeCode, string? contractNumber)
        {
            var candidates = _db.WorkflowDepartments.AsNoTracking()
                .Where(d => d.IsActive &&
                            d.ProjectTypeCode == projectTypeCode &&
                            d.Contract.IsActive);

            if (!string.IsNullOrWhiteSpace(contractNumber))
            {
                var number = contractNumber.Trim();
                var byNumber = await candidates
                    .Where(d => d.Contract.ContractNumber == number)
                    .FirstOrDefaultAsync();

                if (byNumber is not null) return byNumber;
            }

            var all = await candidates.Take(2).ToListAsync();
            return all.Count == 1 ? all[0] : null;
        }

        public async Task<(PlacementDto?, string?)> MoveAsync(
            string projectTypeCode, int workOrderId, MoveWorkOrderDto dto, string userId, string? userName)
        {
            var placement = await LoadPlacementAsync(projectTypeCode, workOrderId);
            if (placement is null) return (null, "أمر العمل لم يدخل المسار بعد.");

            var baskets = await GetPublishedBasketsAsync(placement.DepartmentId);
            if (baskets.Count == 0) return (null, "لا يوجد مسار معتمد لهذا القسم.");

            var current = baskets.FirstOrDefault(b => b.StableKey == placement.BasketStableKey);
            var target = baskets.FirstOrDefault(b => b.StableKey == dto.ToBasketStableKey);

            if (target is null)
                return (null, "السلة المطلوبة غير موجودة في المسار المعتمد أو معطّلة.");

            if (target.StableKey == placement.BasketStableKey)
                return (null, "أمر العمل في هذه السلة أصلاً.");

            // الرجوع إلى الخلف (الإرجاع) لا يشترط إنجاز مهام السلة الحالية،
            // فالهدف منه إعادة العمل لا إنهاؤه. التقدّم وحده يخضع للشروط.
            var movingForward = current is null || target.SortOrder > current.SortOrder;

            if (movingForward && current is not null)
            {
                var blockers = await EvaluateExitBlockersAsync(placement, current);
                if (blockers.Count > 0)
                    return (null, string.Join(" ", blockers));
            }

            var from = placement.BasketStableKey;

            placement.BasketStableKey = target.StableKey;
            placement.EnteredBasketAt = DateTime.UtcNow;

            _db.WorkOrderBasketHistories.Add(new WorkOrderBasketHistory
            {
                PlacementId = placement.Id,
                FromBasketStableKey = from,
                FromBasketName = current?.Name,
                ToBasketStableKey = target.StableKey,
                ToBasketName = target.Name,
                MovedByUserId = userId,
                MovedByUserName = userName,
                Note = dto.Note
            });

            await _db.SaveChangesAsync();
            return (await BuildDtoAsync(placement), null);
        }

        public async Task<(PlacementDto?, string?)> SetTaskStateAsync(
            string projectTypeCode, int workOrderId, SetTaskStateDto dto, string userId, string? userName)
        {
            var placement = await LoadPlacementAsync(projectTypeCode, workOrderId);
            if (placement is null) return (null, "أمر العمل لم يدخل المسار بعد.");

            var baskets = await GetPublishedBasketsAsync(placement.DepartmentId);
            var current = baskets.FirstOrDefault(b => b.StableKey == placement.BasketStableKey);
            if (current is null) return (null, "السلة الحالية غير موجودة في المسار المعتمد.");

            var task = current.Tasks.FirstOrDefault(t => t.IsActive && t.StableKey == dto.TaskStableKey);
            if (task is null) return (null, "المهمة غير موجودة في السلة الحالية.");

            var state = await _db.WorkOrderTaskStates.FirstOrDefaultAsync(t =>
                t.PlacementId == placement.Id &&
                t.BasketStableKey == current.StableKey &&
                t.TaskStableKey == dto.TaskStableKey);

            if (state is null)
            {
                state = new WorkOrderTaskState
                {
                    PlacementId = placement.Id,
                    BasketStableKey = current.StableKey,
                    TaskStableKey = dto.TaskStableKey
                };
                _db.WorkOrderTaskStates.Add(state);
            }

            state.IsDone = dto.IsDone;
            state.Note = dto.Note;
            state.DoneAt = dto.IsDone ? DateTime.UtcNow : null;
            state.DoneByUserId = dto.IsDone ? userId : null;
            state.DoneByUserName = dto.IsDone ? userName : null;

            await _db.SaveChangesAsync();
            return (await BuildDtoAsync(placement), null);
        }

        // ─────────────────────── التصدير ───────────────────────

        private static readonly Dictionary<string, string> ProjectTypeLabels = new()
        {
            [ProjectTypeCodes.Construction] = "الإنشاءات",
            [ProjectTypeCodes.Maintenance] = "الصيانة",
            [ProjectTypeCodes.Emergency] = "الطوارئ",
            [ProjectTypeCodes.NewProject] = "أعمال التأهيل",
            [ProjectTypeCodes.PrivateProject] = "المشاريع الخاصة",
        };

        public async Task<List<WorkOrderExportRowDto>> ExportAsync(TrackingFilterDto filter, string userId)
        {
            // نفس مسار البحث: الصلاحية ثم نطاق الصفحة ثم الفلاتر. فلا يمكن أن
            // يحمل التصدير صفاً لا يظهر في الجدول.
            var visible = await SearchAsync(filter, userId);
            if (visible.Count == 0) return new List<WorkOrderExportRowDto>();

            var wanted = visible
                .Select(v => (v.ProjectTypeCode, v.WorkOrderId))
                .ToHashSet();

            var rows = new List<WorkOrderExportRowDto>();

            foreach (var group in wanted.GroupBy(x => x.ProjectTypeCode))
            {
                var ids = group.Select(x => x.WorkOrderId).ToList();

                switch (group.Key)
                {
                    case ProjectTypeCodes.Construction:
                        rows.AddRange((await _db.Constructions.AsNoTracking()
                            .Where(x => ids.Contains(x.Id)).ToListAsync())
                            .Select(x => new WorkOrderExportRowDto
                            {
                                ProjectTypeCode = group.Key, WorkOrderId = x.Id,
                                OrderNumber = x.FaultNumber, WorkOrderType = x.WorkOrderType, OrderType = x.OrderType,
                                WorkDescription = x.WorkDescription, StationNumber = x.StationNumber,
                                District = x.District, ProjectPlace = x.ProjectPlace, Office = x.Office,
                                BranchName = x.BranchName, Contractor = x.Contractor, Consultant = x.Consultant,
                                ProjectOwner = x.ProjectOwner, ProjectParty = x.ProjectParty, Coordinates = x.Coordinates,
                                OrderDate = x.OrderDate, ReceiveDateTime = x.ReceiveDateTime, CreateAt = x.CreateAt,
                                DurationOfImplementation = x.DurationOfImplementation, CompletionDate = x.CompletionDate,
                                NumberOfDaysDelayed = x.NumberOfDaysDelayed, NumberOfDaysRemaining = x.NumberOfDaysRemaining,
                                EstimatedValue = x.EstimatedValue, ActualValue = x.ActualValue,
                                ProjectValue = x.ProjectValue, ExtractNumber = x.ExtractNumber,
                                Situation = x.Situation, ImplementationPhase = x.ImplementationPhase,
                                CompletionStatusReport = x.CompletionStatusReport, CableCompletion = x.CableCompletion,
                                SafetyViolationsExist = x.SafetyViolationsExist, DescriptionViolation = x.DescriptionViolation,
                                TypeOfStomachTest = x.TypeOfStomachTest, NumberOfEquipment = x.NumberOfEquipment,
                                IsApprove = x.IsApprove, RejectionReason = x.RejectionReason, IsArchived = x.IsArchived,
                                UserName = x.UserName, Note = x.Note, ContractNumber = x.ContractNumber,
                                TaskNumber = x.TaskNumber, WorkOrderCode = x.WorkOrderCode,
                                Priority = x.Priority, VoltageLevel = x.VoltageLevel,
                                PlotNumber = x.PlotNumber, PlanNumber = x.PlanNumber,
                                SubscriberName = x.SubscriberName, ApprovalDate = x.ApprovalDate,
                                IsDraft = x.IsDraft
                            }));
                        break;

                    case ProjectTypeCodes.Maintenance:
                        rows.AddRange((await _db.Maintenances.AsNoTracking()
                            .Where(x => ids.Contains(x.Id)).ToListAsync())
                            .Select(x => new WorkOrderExportRowDto
                            {
                                ProjectTypeCode = group.Key, WorkOrderId = x.Id,
                                OrderNumber = x.FaultNumber, WorkOrderType = x.WorkOrderType, OrderType = x.OrderType,
                                WorkDescription = x.WorkDescription, StationNumber = x.StationNumber,
                                District = x.District, ProjectPlace = x.ProjectPlace, Office = x.Office,
                                BranchName = x.BranchName, Contractor = x.Contractor, Consultant = x.Consultant,
                                ProjectOwner = x.ProjectOwner, ProjectParty = x.ProjectParty, Coordinates = x.Coordinates,
                                OrderDate = x.OrderDate, ReceiveDateTime = x.ReceiveDateTime, CreateAt = x.CreateAt,
                                DurationOfImplementation = x.DurationOfImplementation,
                                EstimatedValue = x.EstimatedValue, ActualValue = x.ActualValue,
                                ProjectValue = x.ProjectValue, ExtractNumber = x.ExtractNumber,
                                Situation = x.Situation, ImplementationPhase = x.ImplementationPhase,
                                NotificationNumber = x.NotificationNumber, TaskNumber = x.TaskNumber,
                                SafetyViolationsExist = x.SafetyViolationsExist, DescriptionViolation = x.DescriptionViolation,
                                TypeOfStomachTest = x.TypeOfStomachTest, NumberOfEquipment = x.NumberOfEquipment,
                                IsApprove = x.IsApprove, RejectionReason = x.RejectionReason, IsArchived = x.IsArchived,
                                UserName = x.UserName, Note = x.Note, ContractNumber = x.ContractNumber
                            }));
                        break;

                    case ProjectTypeCodes.Emergency:
                        rows.AddRange((await _db.Emergencys.AsNoTracking()
                            .Where(x => ids.Contains(x.Id)).ToListAsync())
                            .Select(x => new WorkOrderExportRowDto
                            {
                                ProjectTypeCode = group.Key, WorkOrderId = x.Id,
                                OrderNumber = x.FaultNumber, WorkOrderType = x.WorkOrderType, OrderType = x.OrderType,
                                WorkDescription = x.WorkDescription, StationNumber = x.StationNumber,
                                District = x.District, ProjectPlace = x.ProjectPlace, Office = x.Office,
                                BranchName = x.BranchName, Contractor = x.Contractor, Consultant = x.Consultant,
                                ProjectOwner = x.ProjectOwner, ProjectParty = x.ProjectParty, Coordinates = x.Coordinates,
                                OrderDate = x.OrderDate, ReceiveDateTime = x.ReceiveDateTime, CreateAt = x.CreateAt,
                                DurationOfImplementation = x.DurationOfImplementation,
                                EstimatedValue = x.EstimatedValue, ActualValue = x.ActualValue,
                                ProjectValue = x.ProjectValue, ExtractNumber = x.ExtractNumber,
                                Situation = x.Situation, ImplementationPhase = x.ImplementationPhase,
                                NotificationNumber = x.NotificationNumber, TaskNumber = x.TaskNumber,
                                SafetyViolationsExist = x.SafetyViolationsExist, DescriptionViolation = x.DescriptionViolation,
                                TypeOfStomachTest = x.TypeOfStomachTest, NumberOfEquipment = x.NumberOfEquipment,
                                IsApprove = x.IsApprove, RejectionReason = x.RejectionReason, IsArchived = x.IsArchived,
                                UserName = x.UserName, Note = x.Note, ContractNumber = x.ContractNumber
                            }));
                        break;
                }
            }

            // سياق المسار يُضاف من صفوف الجدول نفسها، فلا يُعاد استعلامه.
            var context = visible.ToDictionary(v => (v.ProjectTypeCode, v.WorkOrderId));

            foreach (var row in rows)
            {
                row.ProjectTypeLabel = ProjectTypeLabels.TryGetValue(row.ProjectTypeCode, out var label)
                    ? label : row.ProjectTypeCode;

                if (!context.TryGetValue((row.ProjectTypeCode, row.WorkOrderId), out var ctx)) continue;

                row.DepartmentName = ctx.DepartmentName;
                row.BasketName = ctx.BasketName;
                row.EnteredBasketAt = ctx.EnteredBasketAt;
                row.DaysInBasket = ctx.DaysInBasket;
                row.MandatoryTasksDone = ctx.MandatoryTasksDone;
                row.MandatoryTasksTotal = ctx.MandatoryTasksTotal;
            }

            // الفرز بالقسم ثم بتاريخ دخول السلة: الأقدم مكوثاً أولاً، وهو ما
            // يهمّ المدقّق. الفرز برقم السلة كان يعتمد حقلاً لا يُعبّأ.
            return rows
                .OrderBy(r => r.DepartmentName)
                .ThenBy(r => r.BasketName)
                .ThenBy(r => r.EnteredBasketAt)
                .ToList();
        }

        // ────────────────────── متابعة التنفيذ ──────────────────────

        public async Task<List<TrackingDepartmentDto>> GetTrackingAsync(string userId, string? projectTypeCode)
        {
            var allowed = await GetAllowedDepartmentIdsAsync(userId);

            var query = _db.WorkflowDepartments.AsNoTracking()
                .Include(d => d.Contract)
                .Where(d => d.IsActive && d.Contract.IsActive);

            if (!string.IsNullOrWhiteSpace(projectTypeCode))
                query = query.Where(d => d.ProjectTypeCode == projectTypeCode);

            if (allowed is not null)
                query = query.Where(d => allowed.Contains(d.Id));

            var departments = await query
                .OrderBy(d => d.Contract.Name).ThenBy(d => d.SortOrder)
                .ToListAsync();

            var result = new List<TrackingDepartmentDto>();

            foreach (var department in departments)
            {
                var baskets = await GetBasketLoadAsync(department.Id);

                // حالة المسودة تُعرض صراحةً: أكثر ما يربك المستخدم أن يعرّف
                // سلالاً ثم لا يراها، والسبب أنها لم تُعتمد بعد.
                var draft = await _db.Workflows.AsNoTracking()
                    .Where(w => w.DepartmentId == department.Id && w.Status == WorkflowStatus.Draft)
                    .Select(w => new { w.Id, Count = w.Baskets.Count(b => b.IsActive) })
                    .FirstOrDefaultAsync();

                result.Add(new TrackingDepartmentDto
                {
                    ContractId = department.ContractId,
                    ContractNumber = department.Contract.ContractNumber,
                    ContractName = department.Contract.Name,
                    DepartmentId = department.Id,
                    DepartmentName = department.Name,
                    ProjectTypeCode = department.ProjectTypeCode,
                    HasPublishedWorkflow = baskets.Count > 0,
                    TotalWorkOrders = baskets.Sum(b => b.WorkOrdersCount),
                    HasUnpublishedDraft = draft is not null && draft.Count > 0,
                    DraftBasketsCount = draft?.Count ?? 0,
                    DraftWorkflowId = draft?.Id ?? 0,
                    UnplacedWorkOrders = await CountUnplacedAsync(department.Id),
                    Baskets = baskets
                });
            }

            return result;
        }

        public async Task<List<TrackedWorkOrderDto>> SearchAsync(TrackingFilterDto filter, string userId)
        {
            var allowed = await GetAllowedDepartmentIdsAsync(userId);

            var query = _db.WorkOrderPlacements.AsNoTracking()
                .Include(p => p.Department).ThenInclude(d => d.Contract)
                .AsQueryable();

            if (allowed is not null)
                query = query.Where(p => allowed.Contains(p.DepartmentId));

            if (filter.ContractId is int contractId)
                query = query.Where(p => p.ContractId == contractId);

            if (!string.IsNullOrWhiteSpace(filter.ContractNumber))
            {
                var number = filter.ContractNumber.Trim();
                query = query.Where(p => p.Department.Contract.ContractNumber.Contains(number));
            }

            if (!string.IsNullOrWhiteSpace(filter.ProjectTypeCode))
                query = query.Where(p => p.Department.ProjectTypeCode == filter.ProjectTypeCode);

            var placements = await query.OrderByDescending(p => p.EnteredBasketAt).Take(2000).ToListAsync();
            if (placements.Count == 0) return new List<TrackedWorkOrderDto>();

            // نوع أمر العمل محفوظ نصاً على صف المشروع، لا كمفتاح. فنحوّل النوع
            // المختار إلى اسمه ونطابق عليه.
            string? typeName = null;
            if (filter.WorkOrderTypeId is int typeId)
            {
                typeName = await _db.ContractWorkOrderTypes.AsNoTracking()
                    .Where(t => t.Id == typeId).Select(t => t.Name).FirstOrDefaultAsync();
            }

            var cards = await ReadWorkOrderCardsAsync(placements);

            // أسماء السلال من النسخة المنشورة لكل قسم، استعلام واحد لكل قسم.
            var basketNames = new Dictionary<(int, int), string>();
            foreach (var departmentId in placements.Select(p => p.DepartmentId).Distinct())
            {
                foreach (var basket in await GetPublishedBasketsAsync(departmentId))
                    basketNames[(departmentId, basket.StableKey)] = basket.Name;
            }

            var results = new List<TrackedWorkOrderDto>();

            foreach (var p in placements)
            {
                cards.TryGetValue((p.ProjectTypeCode, p.WorkOrderId), out var card);
                card ??= new WorkOrderCard();

                if (typeName is not null &&
                    !string.Equals(card.TypeName, typeName, StringComparison.Ordinal))
                    continue;

                if (filter.ReceivedFrom is DateTime from &&
                    (card.ReceivedAt is null || card.ReceivedAt < from))
                    continue;

                if (filter.ReceivedTo is DateTime to &&
                    (card.ReceivedAt is null || card.ReceivedAt > to.Date.AddDays(1).AddTicks(-1)))
                    continue;

                var days = (int)(DateTime.UtcNow - p.EnteredBasketAt).TotalDays;
                if (filter.MinDaysInBasket is int minDays && days < minDays) continue;

                if (!string.IsNullOrWhiteSpace(filter.Search))
                {
                    var needle = filter.Search.Trim();
                    var hay = string.Join(" ", new[]
                    {
                        card.OrderNumber, card.Title, card.Contractor, card.District, card.TypeName
                    }.Where(x => x is not null));

                    if (hay.IndexOf(needle, StringComparison.OrdinalIgnoreCase) < 0) continue;
                }

                basketNames.TryGetValue((p.DepartmentId, p.BasketStableKey), out var basketName);

                results.Add(new TrackedWorkOrderDto
                {
                    ProjectTypeCode = p.ProjectTypeCode,
                    WorkOrderId = p.WorkOrderId,
                    OrderNumber = card.OrderNumber,
                    Title = card.Title,
                    Contractor = card.Contractor,
                    District = card.District,
                    Office = card.Office,
                    ReceivedAt = card.ReceivedAt,
                    OrderDate = card.OrderDate,
                    Duration = card.Duration,
                    EstimatedValue = card.EstimatedValue,
                    ActualValue = card.ActualValue,
                    CompletionPercent = card.CompletionPercent,
                    WorkOrderTypeName = card.TypeName,
                    DepartmentName = p.Department.Name,
                    BasketStableKey = p.BasketStableKey,
                    BasketName = basketName,
                    EnteredBasketAt = p.EnteredBasketAt,
                    DaysInBasket = days
                });
            }

            return results;
        }


        public async Task<(List<TrackedWorkOrderDto>?, string?)> GetBasketWorkOrdersAsync(
            int departmentId, int basketStableKey, string userId)
        {
            if (!await CanSeeDepartmentAsync(userId, departmentId))
                return (null, "لا تملك صلاحية على هذا القسم.");

            var placements = await _db.WorkOrderPlacements.AsNoTracking()
                .Where(p => p.DepartmentId == departmentId && p.BasketStableKey == basketStableKey)
                .OrderBy(p => p.EnteredBasketAt)
                .ToListAsync();

            if (placements.Count == 0) return (new List<TrackedWorkOrderDto>(), null);

            var baskets = await GetPublishedBasketsAsync(departmentId);
            var basket = baskets.FirstOrDefault(b => b.StableKey == basketStableKey);
            var mandatoryKeys = basket?.Tasks
                .Where(t => t.IsActive && t.IsMandatory)
                .Select(t => t.StableKey).ToHashSet() ?? new HashSet<int>();

            var placementIds = placements.Select(p => p.Id).ToList();
            var doneStates = await _db.WorkOrderTaskStates.AsNoTracking()
                .Where(t => placementIds.Contains(t.PlacementId) &&
                            t.BasketStableKey == basketStableKey && t.IsDone)
                .Select(t => new { t.PlacementId, t.TaskStableKey })
                .ToListAsync();

            var doneByPlacement = doneStates
                .GroupBy(t => t.PlacementId)
                .ToDictionary(g => g.Key, g => g.Count(x => mandatoryKeys.Contains(x.TaskStableKey)));

            // بطاقات أوامر العمل تُقرأ من جدول النوع، استعلام واحد لكل نوع.
            var details = await ReadWorkOrderCardsAsync(placements);

            var items = placements.Select(p =>
            {
                details.TryGetValue((p.ProjectTypeCode, p.WorkOrderId), out var card);
                card ??= new WorkOrderCard();

                return new TrackedWorkOrderDto
                {
                    ProjectTypeCode = p.ProjectTypeCode,
                    WorkOrderId = p.WorkOrderId,
                    OrderNumber = card.OrderNumber,
                    Title = card.Title,
                    Contractor = card.Contractor,
                    District = card.District,
                    Office = card.Office,
                    ReceivedAt = card.ReceivedAt,
                    OrderDate = card.OrderDate,
                    Duration = card.Duration,
                    EstimatedValue = card.EstimatedValue,
                    ActualValue = card.ActualValue,
                    CompletionPercent = card.CompletionPercent,
                    WorkOrderTypeName = card.TypeName,
                    EnteredBasketAt = p.EnteredBasketAt,
                    DaysInBasket = (int)(DateTime.UtcNow - p.EnteredBasketAt).TotalDays,
                    MandatoryTasksDone = doneByPlacement.TryGetValue(p.Id, out var n) ? n : 0,
                    MandatoryTasksTotal = mandatoryKeys.Count
                };
            }).ToList();

            return (items, null);
        }

        // ───────────────────── نطاق بيانات المستخدم ─────────────────────

        public async Task<List<UserScopeDto>> GetUserScopesAsync(string targetUserId)
        {
            return await _db.UserDataScopes.AsNoTracking()
                .Where(x => x.UserId == targetUserId)
                .Select(x => new UserScopeDto
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    ContractId = x.ContractId,
                    ContractName = x.Contract.Name,
                    DepartmentId = x.DepartmentId,
                    DepartmentName = x.Department == null ? null : x.Department.Name
                })
                .ToListAsync();
        }

        public async Task<(UserScopeDto?, string?)> AddUserScopeAsync(
            string targetUserId, SetUserScopeDto dto, string adminUserId)
        {
            if (string.IsNullOrWhiteSpace(targetUserId))
                return (null, "المستخدم غير محدّد.");

            if (!await _db.Contracts.AnyAsync(c => c.Id == dto.ContractId))
                return (null, "العقد غير موجود.");

            if (dto.DepartmentId is int departmentId &&
                !await _db.WorkflowDepartments.AnyAsync(d => d.Id == departmentId && d.ContractId == dto.ContractId))
            {
                return (null, "القسم لا يتبع هذا العقد.");
            }

            var exists = await _db.UserDataScopes.AnyAsync(x =>
                x.UserId == targetUserId && x.ContractId == dto.ContractId &&
                x.DepartmentId == dto.DepartmentId);

            if (exists) return (null, "هذا النطاق مسند للمستخدم بالفعل.");

            var entity = new UserDataScope
            {
                UserId = targetUserId,
                ContractId = dto.ContractId,
                DepartmentId = dto.DepartmentId,
                GrantedByUserId = adminUserId
            };

            _db.UserDataScopes.Add(entity);
            await _db.SaveChangesAsync();

            return ((await GetUserScopesAsync(targetUserId)).First(x => x.Id == entity.Id), null);
        }

        public async Task<bool> RemoveUserScopeAsync(int scopeId)
        {
            var entity = await _db.UserDataScopes.FirstOrDefaultAsync(x => x.Id == scopeId);
            if (entity is null) return false;

            _db.UserDataScopes.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CanSeeDepartmentAsync(string userId, int departmentId)
        {
            var allowed = await GetAllowedDepartmentIdsAsync(userId);
            return allowed is null || allowed.Contains(departmentId);
        }

        /// <summary>
        /// معرّفات الأقسام المسموح بها لهذا المستخدم، أو null إن كان بلا قيد.
        ///
        /// مستخدم بلا أي سطر نطاق يرى كل شيء — هذا يحافظ على سلوك النظام القائم
        /// ولا يقفل الباب فجأة في وجه من لم يُسند له نطاق بعد.
        /// </summary>
        private async Task<HashSet<int>?> GetAllowedDepartmentIdsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return null;

            var scopes = await _db.UserDataScopes.AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => new { x.ContractId, x.DepartmentId })
                .ToListAsync();

            // صلاحيات فريق العقد مصدر منح آخر للاطّلاع. لو قُرئ نطاق البيانات
            // وحده لظهرت لموظّف أُسند لعقد واحد كلُ العقود، لأنه بلا سطر نطاق.
            var grants = await _db.ContractTeamPermissions.AsNoTracking()
                .Where(x => x.UserId == userId && x.CanView)
                .Select(x => new { x.ContractId, x.DepartmentId })
                .ToListAsync();

            // بلا أي منح = بلا تخصيص، فيبقى الأمر لصلاحيات النظام العامة.
            if (scopes.Count == 0 && grants.Count == 0) return null;

            scopes = scopes.Concat(grants).ToList();

            var explicitDepartments = scopes
                .Where(x => x.DepartmentId != null)
                .Select(x => x.DepartmentId!.Value)
                .ToHashSet();

            // نطاق على مستوى العقد يعني كل أقسامه.
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

                foreach (var id in ids) explicitDepartments.Add(id);
            }

            return explicitDepartments;
        }

        /// <summary>
        /// بيانات بطاقة أمر العمل. نوع صغير بدل مجموعة قيم: الأعمدة تجاوزت
        /// الأربعة فصارت المجموعة تُقرأ بالترتيب لا بالاسم.
        /// </summary>
        private sealed class WorkOrderCard
        {
            public string? OrderNumber { get; init; }
            public string? Title { get; init; }
            public string? Contractor { get; init; }
            public string? District { get; init; }
            public string? Office { get; init; }
            public DateTime? ReceivedAt { get; init; }
            public DateTime? OrderDate { get; init; }
            public string? Duration { get; init; }
            public string? EstimatedValue { get; init; }
            public string? ActualValue { get; init; }
            public string? CompletionPercent { get; init; }
            public string? TypeName { get; init; }
        }

        /// <summary>
        /// بطاقات أوامر العمل من جداول أنواعها، استعلام واحد لكل نوع.
        /// </summary>
        private async Task<Dictionary<(string, int), WorkOrderCard>> ReadWorkOrderCardsAsync(
            List<WorkOrderPlacement> placements)
        {
            var result = new Dictionary<(string, int), WorkOrderCard>();

            foreach (var group in placements.GroupBy(p => p.ProjectTypeCode))
            {
                var ids = group.Select(p => p.WorkOrderId).ToList();

                switch (group.Key)
                {
                    case ProjectTypeCodes.Construction:
                        foreach (var x in await _db.Constructions.AsNoTracking().Where(x => ids.Contains(x.Id))
                                     .Select(x => new { x.Id, x.FaultNumber, x.WorkDescription, x.Contractor, x.District,
                                                        x.Office, x.ReceiveDateTime, x.OrderDate, x.DurationOfImplementation,
                                                        x.EstimatedValue, x.ActualValue, x.CompletionStatusReport, x.WorkOrderType })
                                     .ToListAsync())
                            result[(group.Key, x.Id)] = new WorkOrderCard
                            {
                                OrderNumber = x.FaultNumber, Title = x.WorkDescription, Contractor = x.Contractor,
                                District = x.District, Office = x.Office, ReceivedAt = x.ReceiveDateTime,
                                OrderDate = x.OrderDate, Duration = x.DurationOfImplementation,
                                EstimatedValue = x.EstimatedValue, ActualValue = x.ActualValue,
                                CompletionPercent = x.CompletionStatusReport, TypeName = x.WorkOrderType
                            };
                        break;

                    case ProjectTypeCodes.Maintenance:
                        foreach (var x in await _db.Maintenances.AsNoTracking().Where(x => ids.Contains(x.Id))
                                     .Select(x => new { x.Id, x.FaultNumber, x.WorkDescription, x.Contractor, x.District,
                                                        x.Office, x.ReceiveDateTime, x.OrderDate, x.DurationOfImplementation,
                                                        x.EstimatedValue, x.ActualValue, x.WorkOrderType })
                                     .ToListAsync())
                            result[(group.Key, x.Id)] = new WorkOrderCard
                            {
                                OrderNumber = x.FaultNumber, Title = x.WorkDescription, Contractor = x.Contractor,
                                District = x.District, Office = x.Office, ReceivedAt = x.ReceiveDateTime,
                                OrderDate = x.OrderDate, Duration = x.DurationOfImplementation,
                                EstimatedValue = x.EstimatedValue, ActualValue = x.ActualValue,
                                TypeName = x.WorkOrderType
                            };
                        break;

                    case ProjectTypeCodes.Emergency:
                        foreach (var x in await _db.Emergencys.AsNoTracking().Where(x => ids.Contains(x.Id))
                                     .Select(x => new { x.Id, x.FaultNumber, x.WorkDescription, x.Contractor, x.District,
                                                        x.Office, x.ReceiveDateTime, x.OrderDate, x.DurationOfImplementation,
                                                        x.EstimatedValue, x.ActualValue, x.WorkOrderType })
                                     .ToListAsync())
                            result[(group.Key, x.Id)] = new WorkOrderCard
                            {
                                OrderNumber = x.FaultNumber, Title = x.WorkDescription, Contractor = x.Contractor,
                                District = x.District, Office = x.Office, ReceivedAt = x.ReceiveDateTime,
                                OrderDate = x.OrderDate, Duration = x.DurationOfImplementation,
                                EstimatedValue = x.EstimatedValue, ActualValue = x.ActualValue,
                                TypeName = x.WorkOrderType
                            };
                        break;

                    case ProjectTypeCodes.NewProject:
                        foreach (var x in await _db.NewProjects.AsNoTracking().Where(x => ids.Contains(x.Id))
                                     .Select(x => new { x.Id, x.FaultNumber, x.WorkDescription, x.Contractor, x.District,
                                                        x.ReceiveDateTime, x.OrderDate, x.DurationOfImplementation, x.WorkOrderType })
                                     .ToListAsync())
                            result[(group.Key, x.Id)] = new WorkOrderCard
                            {
                                OrderNumber = x.FaultNumber, Title = x.WorkDescription, Contractor = x.Contractor,
                                District = x.District, ReceivedAt = x.ReceiveDateTime, OrderDate = x.OrderDate,
                                Duration = x.DurationOfImplementation, TypeName = x.WorkOrderType
                            };
                        break;

                    case ProjectTypeCodes.PrivateProject:
                        foreach (var x in await _db.PrivateProjects.AsNoTracking().Where(x => ids.Contains(x.Id))
                                     .Select(x => new { x.Id, x.ProjectName, x.WorkDescription, x.Contractor,
                                                        x.OrderDate, x.ProjectValue })
                                     .ToListAsync())
                            result[(group.Key, x.Id)] = new WorkOrderCard
                            {
                                OrderNumber = x.ProjectName, Title = x.WorkDescription, Contractor = x.Contractor,
                                OrderDate = x.OrderDate, ReceivedAt = x.OrderDate, EstimatedValue = x.ProjectValue
                            };
                        break;
                }
            }

            return result;
        }

        public async Task<int> CountUnplacedAsync(int departmentId)
        {
            var department = await _db.WorkflowDepartments.AsNoTracking()
                .Include(d => d.Contract)
                .FirstOrDefaultAsync(d => d.Id == departmentId);

            if (department is null || !ProjectTypeCodes.IsValid(department.ProjectTypeCode))
                return 0;

            var typeCode = department.ProjectTypeCode!;

            // يشمل ما بلا رقم عقد، لأن العدّ للعرض لا للكتابة: المستخدم يرى أن
            // هناك أوامر خارج السلال ثم يقرّر.
            var orders = await ReadWorkOrdersAsync(typeCode, department.Contract.ContractNumber, true);
            if (orders.Count == 0) return 0;

            var placed = (await _db.WorkOrderPlacements.AsNoTracking()
                .Where(p => p.ProjectTypeCode == typeCode)
                .Select(p => p.WorkOrderId)
                .ToListAsync()).ToHashSet();

            return orders.Count(o => !placed.Contains(o.Id));
        }

        public async Task<int> PlaceUnplacedAsync(int departmentId, bool includeUnassigned,
            string userId, string? userName)
        {
            var department = await _db.WorkflowDepartments.AsNoTracking()
                .Include(d => d.Contract)
                .FirstOrDefaultAsync(d => d.Id == departmentId);

            if (department is null || !ProjectTypeCodes.IsValid(department.ProjectTypeCode))
                return 0;

            var typeCode = department.ProjectTypeCode!;

            var baskets = await GetPublishedBasketsAsync(departmentId);
            var first = baskets.OrderBy(b => b.SortOrder).FirstOrDefault();
            if (first is null) return 0;

            var orders = await ReadWorkOrdersAsync(
                typeCode, department.Contract.ContractNumber, includeUnassigned);

            if (orders.Count == 0) return 0;

            var placed = (await _db.WorkOrderPlacements.AsNoTracking()
                .Where(p => p.ProjectTypeCode == typeCode)
                .Select(p => p.WorkOrderId)
                .ToListAsync()).ToHashSet();

            var written = 0;

            foreach (var order in orders.Where(o => !placed.Contains(o.Id)))
            {
                var placement = new WorkOrderPlacement
                {
                    ProjectTypeCode = typeCode,
                    WorkOrderId = order.Id,
                    ContractId = department.ContractId,
                    DepartmentId = department.Id,
                    BasketStableKey = first.StableKey,
                    MigratedFromSituation = order.Situation
                };

                placement.History.Add(new WorkOrderBasketHistory
                {
                    FromBasketStableKey = null,
                    ToBasketStableKey = first.StableKey,
                    ToBasketName = first.Name,
                    MovedByUserId = userId,
                    MovedByUserName = userName,
                    Note = "وضع تلقائي عند اعتماد المسار"
                });

                _db.WorkOrderPlacements.Add(placement);
                written++;
            }

            if (written > 0) await _db.SaveChangesAsync();
            return written;
        }

        // ─────────────────────────── الترحيل ───────────────────────────

        public async Task<(BackfillResultDto?, string?)> BackfillAsync(
            BackfillRequestDto dto, string userId, string? userName)
        {
            var department = await _db.WorkflowDepartments.AsNoTracking()
                .Include(d => d.Contract)
                .FirstOrDefaultAsync(d => d.Id == dto.DepartmentId);
            if (department is null) return (null, "القسم غير موجود.");

            if (!ProjectTypeCodes.IsValid(department.ProjectTypeCode))
                return (null, "القسم غير مرتبط بنوع مشروع، فلا تُعرف أوامر العمل التي تتبعه.");

            var typeCode = department.ProjectTypeCode!;

            var baskets = await GetPublishedBasketsAsync(dto.DepartmentId);
            if (baskets.Count == 0)
                return (null, "لا يوجد مسار معتمد بسلال مفعّلة لهذا القسم.");

            if (dto.FallbackBasketStableKey is int fb && baskets.All(b => b.StableKey != fb))
                return (null, "السلة الاحتياطية غير موجودة في المسار المعتمد.");

            var orders = await ReadWorkOrdersAsync(
                typeCode, department.Contract.ContractNumber, dto.IncludeUnassigned);

            var placed = await _db.WorkOrderPlacements.AsNoTracking()
                .Where(p => p.ProjectTypeCode == typeCode)
                .Select(p => p.WorkOrderId)
                .ToListAsync();
            var placedSet = placed.ToHashSet();

            // المطابقة بالاسم المجرّد: المسافات الزائدة والتشكيل الطرفي لا تُفشل المطابقة.
            var byName = baskets
                .GroupBy(b => Normalize(b.Name))
                .ToDictionary(g => g.Key, g => g.First());

            var result = new BackfillResultDto
            {
                DryRun = dto.DryRun,
                ProjectTypeCode = typeCode,
                DepartmentName = department.Name,
                TotalWorkOrders = orders.Count,
                AlreadyPlaced = orders.Count(o => placedSet.Contains(o.Id))
            };

            var pending = orders.Where(o => !placedSet.Contains(o.Id)).ToList();

            foreach (var group in pending.GroupBy(o => o.Situation ?? string.Empty))
            {
                byName.TryGetValue(Normalize(group.Key), out var match);

                var kind = match is not null ? "ExactName"
                    : dto.FallbackBasketStableKey is not null ? "Fallback"
                    : "NoMatch";

                var targetKey = match?.StableKey ?? dto.FallbackBasketStableKey;
                var targetName = match?.Name
                    ?? baskets.FirstOrDefault(b => b.StableKey == dto.FallbackBasketStableKey)?.Name;

                result.Mappings.Add(new BackfillMappingDto
                {
                    Situation = string.IsNullOrWhiteSpace(group.Key) ? null : group.Key,
                    Count = group.Count(),
                    BasketStableKey = targetKey,
                    BasketName = targetName,
                    MatchKind = kind
                });

                if (kind == "ExactName") result.Matched += group.Count();
                else if (kind == "Fallback") result.FellBackToDefault += group.Count();
                else { result.Unmatched += group.Count(); continue; }

                if (dto.DryRun) continue;

                foreach (var order in group)
                {
                    var placement = new WorkOrderPlacement
                    {
                        ProjectTypeCode = typeCode,
                        WorkOrderId = order.Id,
                        ContractId = department.ContractId,
                        DepartmentId = department.Id,
                        BasketStableKey = targetKey!.Value,
                        MigratedFromSituation = string.IsNullOrWhiteSpace(group.Key) ? null : group.Key
                    };

                    placement.History.Add(new WorkOrderBasketHistory
                    {
                        FromBasketStableKey = null,
                        ToBasketStableKey = targetKey.Value,
                        ToBasketName = targetName,
                        MovedByUserId = userId,
                        MovedByUserName = userName,
                        Note = $"ترحيل آلي من الحالة النصّية «{group.Key}»"
                    });

                    _db.WorkOrderPlacements.Add(placement);
                    result.Written++;
                }
            }

            result.Mappings = result.Mappings.OrderByDescending(m => m.Count).ToList();

            if (!dto.DryRun && result.Written > 0)
                await _db.SaveChangesAsync();

            return (result, null);
        }

        // ─────────────────────────── مساعدات ───────────────────────────

        private Task<WorkOrderPlacement?> LoadPlacementAsync(string projectTypeCode, int workOrderId) =>
            _db.WorkOrderPlacements.FirstOrDefaultAsync(p =>
                p.ProjectTypeCode == projectTypeCode && p.WorkOrderId == workOrderId);

        /// <summary>
        /// سلال المسار المعتمد للقسم، مفعّلة فقط، ومعها مهامها.
        /// </summary>
        private async Task<List<WorkflowBasket>> GetPublishedBasketsAsync(int departmentId)
        {
            var workflow = await _db.Workflows.AsNoTracking()
                .Include(w => w.Baskets).ThenInclude(b => b.Tasks)
                .FirstOrDefaultAsync(w =>
                    w.DepartmentId == departmentId && w.Status == WorkflowStatus.Published);

            return workflow is null
                ? new List<WorkflowBasket>()
                : workflow.Baskets.Where(b => b.IsActive).OrderBy(b => b.SortOrder).ToList();
        }

        /// <summary>
        /// أسباب منع الخروج من السلة الحالية إلى الأمام.
        ///
        /// RequireAttachments لا يوجد له مخزن مرفقات مرتبط بالسلة في النظام، فيُطبَّق
        /// على ما هو متاح فعلاً: المهام التي تُصرّح بمرفقات مطلوبة يجب أن تُنجَز.
        /// </summary>
        private async Task<List<string>> EvaluateExitBlockersAsync(
            WorkOrderPlacement placement, WorkflowBasket current)
        {
            var blockers = new List<string>();
            var activeTasks = current.Tasks.Where(t => t.IsActive).ToList();
            if (activeTasks.Count == 0) return blockers;

            var done = await _db.WorkOrderTaskStates.AsNoTracking()
                .Where(t => t.PlacementId == placement.Id &&
                            t.BasketStableKey == current.StableKey && t.IsDone)
                .Select(t => t.TaskStableKey)
                .ToListAsync();
            var doneSet = done.ToHashSet();

            if (current.RequireMandatoryTasks)
            {
                var missing = activeTasks
                    .Where(t => t.IsMandatory && !doneSet.Contains(t.StableKey))
                    .Select(t => t.Name)
                    .ToList();

                if (missing.Count > 0)
                    blockers.Add($"لم تُنجَز مهام إلزامية في «{current.Name}»: {string.Join("، ", missing)}.");
            }

            if (current.RequireAttachments)
            {
                var missing = activeTasks
                    .Where(t => !string.IsNullOrWhiteSpace(t.RequiredAttachments) &&
                                !doneSet.Contains(t.StableKey))
                    .Select(t => t.Name)
                    .ToList();

                if (missing.Count > 0)
                    blockers.Add($"مهام تتطلّب مرفقات ولم تُنجَز في «{current.Name}»: {string.Join("، ", missing)}.");
            }

            return blockers;
        }

        private async Task<PlacementDto> BuildDtoAsync(WorkOrderPlacement placement)
        {
            var department = await _db.WorkflowDepartments.AsNoTracking()
                .Include(d => d.Contract)
                .FirstAsync(d => d.Id == placement.DepartmentId);

            var baskets = await GetPublishedBasketsAsync(placement.DepartmentId);
            var current = baskets.FirstOrDefault(b => b.StableKey == placement.BasketStableKey);

            var states = await _db.WorkOrderTaskStates.AsNoTracking()
                .Where(t => t.PlacementId == placement.Id &&
                            t.BasketStableKey == placement.BasketStableKey)
                .ToListAsync();
            var byKey = states.ToDictionary(t => t.TaskStableKey);

            var dto = new PlacementDto
            {
                Id = placement.Id,
                ProjectTypeCode = placement.ProjectTypeCode,
                WorkOrderId = placement.WorkOrderId,
                ContractId = placement.ContractId,
                ContractName = department.Contract.Name,
                DepartmentId = placement.DepartmentId,
                DepartmentName = department.Name,
                BasketStableKey = placement.BasketStableKey,
                CurrentBasketId = current?.Id,
                CurrentBasketName = current?.Name,
                CurrentBasketPurpose = current?.Purpose,
                CurrentBasketOrder = current is null ? 0 : baskets.IndexOf(current) + 1,
                EnteredBasketAt = placement.EnteredBasketAt,
                DaysInBasket = (int)(DateTime.UtcNow - placement.EnteredBasketAt).TotalDays
            };

            if (current is not null)
            {
                dto.Tasks = current.Tasks
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.SortOrder)
                    .Select(t =>
                    {
                        byKey.TryGetValue(t.StableKey, out var state);
                        return new PlacementTaskDto
                        {
                            TaskStableKey = t.StableKey,
                            Name = t.Name,
                            Description = t.Description,
                            SortOrder = t.SortOrder,
                            IsMandatory = t.IsMandatory,
                            DefaultAssigneeRole = t.DefaultAssigneeRole,
                            DurationDays = t.DurationDays,
                            RequiredAttachments = t.RequiredAttachments,
                            RequiredForms = t.RequiredForms,
                            IsDone = state?.IsDone ?? false,
                            DoneAt = state?.DoneAt,
                            DoneByUserName = state?.DoneByUserName,
                            Note = state?.Note
                        };
                    })
                    .ToList();

                dto.Blockers = await EvaluateExitBlockersAsync(placement, current);
            }

            var blocked = dto.Blockers.Count > 0 ? string.Join(" ", dto.Blockers) : null;

            dto.Transitions = baskets.Select((b, i) =>
            {
                var direction = current is null ? "Forward"
                    : b.StableKey == current.StableKey ? "Current"
                    : b.SortOrder > current.SortOrder ? "Forward"
                    : "Backward";

                return new TransitionOptionDto
                {
                    BasketStableKey = b.StableKey,
                    BasketId = b.Id,
                    BasketName = b.Name,
                    Order = i + 1,
                    Direction = direction,
                    IsAllowed = direction switch
                    {
                        "Current" => false,
                        "Forward" => blocked is null,
                        _ => true
                    },
                    BlockedReason = direction == "Forward" ? blocked : null
                };
            }).ToList();

            return dto;
        }

        /// <summary>
        /// معرّفات أوامر العمل وحالتها النصّية لنوع مشروع.
        ///
        /// المشاريع الخاصة وحدها بلا حقل Situation، فتُقرأ بحالة فارغة وتعتمد
        /// على السلة الاحتياطية في الترحيل.
        /// </summary>
        /// <summary>
        /// أوامر عمل نوعٍ ما، مصفّاة برقم العقد.
        ///
        /// بدون التصفية كان الترحيل يقرأ كل أوامر النوع مهما كان عقدها، فيسحب
        /// أوامر عقدٍ إلى قسم عقدٍ آخر متى اشتركا في نوع المشروع.
        ///
        /// includeUnassigned يضمّ ما لا يحمل رقم عقد أصلاً — وهو اختيار صريح
        /// لأن نسبتها إلى هذا العقد تخمين لا يصحّ افتراضه.
        /// </summary>
        private async Task<List<(int Id, string? Situation)>> ReadWorkOrdersAsync(
            string typeCode, string contractNumber, bool includeUnassigned)
        {
            var number = contractNumber?.Trim();

            bool Match(string? rowNumber)
            {
                if (string.IsNullOrWhiteSpace(rowNumber))
                    return includeUnassigned;

                return string.Equals(rowNumber.Trim(), number, StringComparison.OrdinalIgnoreCase);
            }

            var rows = typeCode switch
            {
                ProjectTypeCodes.Construction => (await _db.Constructions.AsNoTracking()
                    .Select(x => new { x.Id, Situation = (string?)x.Situation, x.ContractNumber }).ToListAsync())
                    .Where(x => Match(x.ContractNumber))
                    .Select(x => new { x.Id, x.Situation }).ToList(),

                ProjectTypeCodes.Maintenance => (await _db.Maintenances.AsNoTracking()
                    .Select(x => new { x.Id, Situation = (string?)x.Situation, x.ContractNumber }).ToListAsync())
                    .Where(x => Match(x.ContractNumber))
                    .Select(x => new { x.Id, x.Situation }).ToList(),

                ProjectTypeCodes.Emergency => (await _db.Emergencys.AsNoTracking()
                    .Select(x => new { x.Id, Situation = x.Situation, x.ContractNumber }).ToListAsync())
                    .Where(x => Match(x.ContractNumber))
                    .Select(x => new { x.Id, x.Situation }).ToList(),

                ProjectTypeCodes.NewProject => (await _db.NewProjects.AsNoTracking()
                    .Select(x => new { x.Id, Situation = (string?)x.Situation, x.ContractNumber }).ToListAsync())
                    .Where(x => Match(x.ContractNumber))
                    .Select(x => new { x.Id, x.Situation }).ToList(),

                ProjectTypeCodes.PrivateProject => (await _db.PrivateProjects.AsNoTracking()
                    .Select(x => new { x.Id, Situation = (string?)null, x.ContractNumber }).ToListAsync())
                    .Where(x => Match(x.ContractNumber))
                    .Select(x => new { x.Id, x.Situation }).ToList(),

                _ => new()
            };

            return rows.Select(r => (r.Id, r.Situation)).ToList();
        }

        /// <summary>هل أمر العمل موجود فعلاً في جدول نوعه؟</summary>
        private Task<bool> WorkOrderExistsAsync(string typeCode, int id) => typeCode switch
        {
            ProjectTypeCodes.Construction => _db.Constructions.AnyAsync(x => x.Id == id),
            ProjectTypeCodes.Maintenance => _db.Maintenances.AnyAsync(x => x.Id == id),
            ProjectTypeCodes.Emergency => _db.Emergencys.AnyAsync(x => x.Id == id),
            ProjectTypeCodes.NewProject => _db.NewProjects.AnyAsync(x => x.Id == id),
            ProjectTypeCodes.PrivateProject => _db.PrivateProjects.AnyAsync(x => x.Id == id),
            _ => Task.FromResult(false)
        };

        /// <summary>يوحّد النص للمقارنة: يزيل المسافات الزائدة ويوحّد الألف والياء.</summary>
        private static string Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var trimmed = string.Join(' ',
                value.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

            return trimmed
                .Replace('أ', 'ا')  // أ → ا
                .Replace('إ', 'ا')  // إ → ا
                .Replace('آ', 'ا')  // آ → ا
                .Replace('ى', 'ي')  // ى → ي
                .Replace('ة', 'ه'); // ة → ه
        }
    }
}
