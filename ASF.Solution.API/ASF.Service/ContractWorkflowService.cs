using ASF.Core.DTOs.Workflow;
using ASF.Core.Entities.Workflow;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using Microsoft.EntityFrameworkCore;

namespace ASF.Service
{
    /// <summary>
    /// إدارة الأقسام والسلال من إعدادات العقد.
    ///
    /// مبدأ العمل: التعديل يجري دائماً على مسودة. النسخة المنشورة لا تُمسّ، فلا
    /// يتأثر أمر عمل قائم بأي تعديل حتى لحظة الاعتماد. وعند الاعتماد تُنسخ
    /// المفاتيح الثابتة للسلال (StableKey) كما هي، فيبقى أمر العمل في سلته.
    /// </summary>
    public class ContractWorkflowService : IContractWorkflowService
    {
        private readonly ApplicationDbContext _db;
        private readonly IWorkOrderFlowService _placement;

        public ContractWorkflowService(ApplicationDbContext db, IWorkOrderFlowService placement)
        {
            _db = db;
            _placement = placement;
        }

        // ─────────────────────────── العقود ───────────────────────────

        public async Task<List<ContractDto>> GetContractsAsync(bool includeInactive)
        {
            var query = _db.Contracts.AsNoTracking();
            if (!includeInactive) query = query.Where(c => c.IsActive);

            return await query
                .OrderBy(c => c.Name)
                .Select(c => new ContractDto
                {
                    Id = c.Id,
                    ContractNumber = c.ContractNumber,
                    Name = c.Name,
                    Kind = c.Kind,
                    ClientName = c.ClientName,
                    WorkOrderTypesCount = c.WorkOrderTypes.Count(t => t.IsActive),
                    BranchId = c.BranchId,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    IsActive = c.IsActive,
                    DepartmentsCount = c.Departments.Count(d => d.IsActive)
                })
                .ToListAsync();
        }

        public async Task<ContractDto?> GetContractAsync(int contractId)
        {
            return await _db.Contracts.AsNoTracking()
                .Where(c => c.Id == contractId)
                .Select(c => new ContractDto
                {
                    Id = c.Id,
                    ContractNumber = c.ContractNumber,
                    Name = c.Name,
                    Kind = c.Kind,
                    ClientName = c.ClientName,
                    WorkOrderTypesCount = c.WorkOrderTypes.Count(t => t.IsActive),
                    BranchId = c.BranchId,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    IsActive = c.IsActive,
                    DepartmentsCount = c.Departments.Count(d => d.IsActive)
                })
                .FirstOrDefaultAsync();
        }

        public async Task<ContractDto> CreateContractAsync(ContractUpsertDto dto, string userId, string? userName)
        {
            var entity = new Contract
            {
                ContractNumber = dto.ContractNumber.Trim(),
                Name = dto.Name.Trim(),
                Kind = ContractKinds.IsValid(dto.Kind) ? dto.Kind! : ContractKinds.Unified,
                ClientName = dto.ClientName,
                BranchId = dto.BranchId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsActive = dto.IsActive,
                CreatedByUserId = userId
            };

            _db.Contracts.Add(entity);
            await _db.SaveChangesAsync();

            Audit(entity.Id, null, null, null, "CreateContract", null, entity.Name, null, userId, userName);
            await _db.SaveChangesAsync();

            return (await GetContractAsync(entity.Id))!;
        }

        public async Task<ContractDto?> UpdateContractAsync(int contractId, ContractUpsertDto dto, string userId, string? userName)
        {
            var entity = await _db.Contracts.FirstOrDefaultAsync(c => c.Id == contractId);
            if (entity is null) return null;

            var before = $"{entity.ContractNumber} — {entity.Name} — {(entity.IsActive ? "مفعّل" : "معطّل")}";

            entity.ContractNumber = dto.ContractNumber.Trim();
            entity.Name = dto.Name.Trim();
            if (ContractKinds.IsValid(dto.Kind)) entity.Kind = dto.Kind!;
            entity.ClientName = dto.ClientName;
            entity.BranchId = dto.BranchId;
            entity.StartDate = dto.StartDate;
            entity.EndDate = dto.EndDate;
            entity.IsActive = dto.IsActive;

            var after = $"{entity.ContractNumber} — {entity.Name} — {(entity.IsActive ? "مفعّل" : "معطّل")}";
            Audit(contractId, null, null, null, "UpdateContract", before, after, null, userId, userName);

            await _db.SaveChangesAsync();
            return await GetContractAsync(contractId);
        }

        // ─────────────────────────── الأقسام ───────────────────────────

        public async Task<List<DepartmentDto>> GetDepartmentsAsync(int contractId, bool includeInactive)
        {
            var query = _db.WorkflowDepartments.AsNoTracking().Where(d => d.ContractId == contractId);
            if (!includeInactive) query = query.Where(d => d.IsActive);

            return await query
                .OrderBy(d => d.SortOrder).ThenBy(d => d.Id)
                .Select(d => new DepartmentDto
                {
                    Id = d.Id,
                    ContractId = d.ContractId,
                    Name = d.Name,
                    ProjectTypeCode = d.ProjectTypeCode,
                    SortOrder = d.SortOrder,
                    IsActive = d.IsActive,
                    HasPublishedWorkflow = d.Workflows.Any(w => w.Status == WorkflowStatus.Published),
                    HasDraftWorkflow = d.Workflows.Any(w => w.Status == WorkflowStatus.Draft),
                    BasketsCount = d.Workflows
                        .Where(w => w.Status == WorkflowStatus.Published)
                        .SelectMany(w => w.Baskets).Count(b => b.IsActive)
                })
                .ToListAsync();
        }

        public async Task<DepartmentDto> CreateDepartmentAsync(int contractId, DepartmentUpsertDto dto, string userId, string? userName)
        {
            var maxOrder = await _db.WorkflowDepartments
                .Where(d => d.ContractId == contractId)
                .Select(d => (int?)d.SortOrder).MaxAsync() ?? 0;

            var entity = new WorkflowDepartment
            {
                ContractId = contractId,
                Name = dto.Name.Trim(),
                ProjectTypeCode = string.IsNullOrWhiteSpace(dto.ProjectTypeCode) ? null : dto.ProjectTypeCode.Trim(),
                IsActive = dto.IsActive,
                SortOrder = maxOrder + 1
            };

            _db.WorkflowDepartments.Add(entity);
            await _db.SaveChangesAsync();

            Audit(contractId, entity.Id, null, null, "CreateDepartment", null, entity.Name, null, userId, userName);
            await _db.SaveChangesAsync();

            return (await GetDepartmentsAsync(contractId, true)).First(d => d.Id == entity.Id);
        }

        public async Task<DepartmentDto?> UpdateDepartmentAsync(int departmentId, DepartmentUpsertDto dto, string userId, string? userName)
        {
            var entity = await _db.WorkflowDepartments.FirstOrDefaultAsync(d => d.Id == departmentId);
            if (entity is null) return null;

            var before = $"{entity.Name} — {(entity.IsActive ? "مفعّل" : "معطّل")}";

            entity.Name = dto.Name.Trim();
            entity.ProjectTypeCode = string.IsNullOrWhiteSpace(dto.ProjectTypeCode) ? null : dto.ProjectTypeCode.Trim();
            entity.IsActive = dto.IsActive;

            var after = $"{entity.Name} — {(entity.IsActive ? "مفعّل" : "معطّل")}";
            Audit(entity.ContractId, departmentId, null, null, "UpdateDepartment", before, after, null, userId, userName);

            await _db.SaveChangesAsync();
            return (await GetDepartmentsAsync(entity.ContractId, true)).FirstOrDefault(d => d.Id == departmentId);
        }

        public async Task<bool> ReorderDepartmentsAsync(int contractId, ReorderDto dto, string userId, string? userName)
        {
            var items = await _db.WorkflowDepartments.Where(d => d.ContractId == contractId).ToListAsync();
            if (items.Count == 0) return false;

            var before = string.Join(" ← ", items.OrderBy(d => d.SortOrder).Select(d => d.Name));
            if (!ApplyOrder(dto.OrderedIds, items, d => d.Id, (d, o) => d.SortOrder = o)) return false;
            var after = string.Join(" ← ", items.OrderBy(d => d.SortOrder).Select(d => d.Name));

            Audit(contractId, null, null, null, "ReorderDepartments", before, after, null, userId, userName);
            await _db.SaveChangesAsync();
            return true;
        }

        // ─────────────────────────── المسار ───────────────────────────

        public async Task<WorkflowDto?> GetOrCreateDraftAsync(int departmentId, string userId, string? userName)
        {
            var department = await _db.WorkflowDepartments.FirstOrDefaultAsync(d => d.Id == departmentId);
            if (department is null) return null;

            var draft = await _db.Workflows
                .FirstOrDefaultAsync(w => w.DepartmentId == departmentId && w.Status == WorkflowStatus.Draft);

            if (draft is null)
            {
                var published = await _db.Workflows
                    .Include(w => w.Baskets).ThenInclude(b => b.Tasks)
                    .FirstOrDefaultAsync(w => w.DepartmentId == departmentId && w.Status == WorkflowStatus.Published);

                var maxVersion = await _db.Workflows
                    .Where(w => w.DepartmentId == departmentId)
                    .Select(w => (int?)w.Version).MaxAsync() ?? 0;

                draft = new Workflow
                {
                    DepartmentId = departmentId,
                    Version = maxVersion + 1,
                    Status = WorkflowStatus.Draft,
                    CreatedByUserId = userId
                };

                // نسخة طبق الأصل من المنشور، مع الحفاظ على المفاتيح الثابتة حتى
                // لا يفقد أي أمر عمل سلته بعد الاعتماد.
                if (published is not null)
                {
                    foreach (var b in published.Baskets.OrderBy(b => b.SortOrder))
                    {
                        var copy = new WorkflowBasket
                        {
                            StableKey = b.StableKey,
                            Name = b.Name,
                            Description = b.Description,
                            Purpose = b.Purpose,
                            SortOrder = b.SortOrder,
                            IsActive = b.IsActive,
                            TransitionRequirements = b.TransitionRequirements,
                            RequireMandatoryTasks = b.RequireMandatoryTasks,
                            RequireAttachments = b.RequireAttachments
                        };

                        foreach (var t in b.Tasks.OrderBy(t => t.SortOrder))
                        {
                            copy.Tasks.Add(new BasketTask
                            {
                                StableKey = t.StableKey,
                                Name = t.Name,
                                Description = t.Description,
                                SortOrder = t.SortOrder,
                                IsMandatory = t.IsMandatory,
                                IsActive = t.IsActive,
                                DefaultAssigneeRole = t.DefaultAssigneeRole,
                                DurationDays = t.DurationDays,
                                RequiredAttachments = t.RequiredAttachments,
                                RequiredForms = t.RequiredForms
                            });
                        }

                        draft.Baskets.Add(copy);
                    }
                }

                _db.Workflows.Add(draft);
                await _db.SaveChangesAsync();

                Audit(department.ContractId, departmentId, draft.Id, null, "CreateDraft", null,
                    $"نسخة {draft.Version}", published is null ? "مسودة جديدة" : $"منسوخة من النسخة {published.Version}",
                    userId, userName);
                await _db.SaveChangesAsync();
            }

            return await LoadWorkflowAsync(draft.Id);
        }

        public async Task<WorkflowDto?> GetPublishedAsync(int departmentId)
        {
            var id = await _db.Workflows
                .Where(w => w.DepartmentId == departmentId && w.Status == WorkflowStatus.Published)
                .Select(w => (int?)w.Id).FirstOrDefaultAsync();

            return id is null ? null : await LoadWorkflowAsync(id.Value);
        }

        public async Task<WorkflowPreviewDto?> PreviewAsync(int workflowId)
        {
            var wf = await _db.Workflows.AsNoTracking()
                .Include(w => w.Department)
                .Include(w => w.Baskets).ThenInclude(b => b.Tasks)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (wf is null) return null;

            var active = wf.Baskets.Where(b => b.IsActive).OrderBy(b => b.SortOrder).ToList();

            var preview = new WorkflowPreviewDto
            {
                WorkflowId = wf.Id,
                DepartmentName = wf.Department.Name,
                Version = wf.Version,
                Status = wf.Status,
                Steps = active.Select((b, i) => new WorkflowPreviewStepDto
                {
                    Order = i + 1,
                    BasketId = b.Id,
                    BasketName = b.Name,
                    Purpose = b.Purpose,
                    TasksCount = b.Tasks.Count(t => t.IsActive),
                    MandatoryTasksCount = b.Tasks.Count(t => t.IsActive && t.IsMandatory),
                    TransitionRequirements = b.TransitionRequirements
                }).ToList()
            };

            if (active.Count == 0)
                preview.Warnings.Add("المسار لا يحتوي على أي سلة مفعّلة.");

            foreach (var b in active.Where(b => b.RequireMandatoryTasks && !b.Tasks.Any(t => t.IsActive && t.IsMandatory)))
                preview.Warnings.Add($"السلة «{b.Name}» تشترط إنجاز المهام الإلزامية ولا تحتوي على أي مهمة إلزامية.");

            return preview;
        }

        public async Task<WorkflowDto?> PublishAsync(int workflowId, string userId, string? userName, string? note)
        {
            var draft = await _db.Workflows
                .Include(w => w.Department)
                .Include(w => w.Baskets)
                .FirstOrDefaultAsync(w => w.Id == workflowId && w.Status == WorkflowStatus.Draft);

            if (draft is null) return null;

            var current = await _db.Workflows
                .Where(w => w.DepartmentId == draft.DepartmentId && w.Status == WorkflowStatus.Published)
                .ToListAsync();

            foreach (var w in current) w.Status = WorkflowStatus.Archived;

            draft.Status = WorkflowStatus.Published;
            draft.PublishedAt = DateTime.UtcNow;
            draft.PublishedByUserId = userId;

            Audit(draft.Department.ContractId, draft.DepartmentId, draft.Id, null, "PublishWorkflow",
                current.Count == 0 ? null : $"النسخة {current[0].Version}",
                $"النسخة {draft.Version}", note, userId, userName);

            await _db.SaveChangesAsync();

            // أول اعتماد للقسم: تدخل أوامر عمله القائمة أول سلة فوراً.
            // بدونه يرى المستخدم سلالاً فارغة بعد الاعتماد فيظنّ أن شيئاً لم يعمل.
            if (current.Count == 0)
            {
                await _placement.PlaceUnplacedAsync(draft.DepartmentId, false, userId, userName);
            }

            return await LoadWorkflowAsync(draft.Id);
        }

        // ─────────────────────── السلال المقترحة ───────────────────────

        public async Task<BasketTemplateDto?> GetTemplateAsync(int departmentId)
        {
            var department = await _db.WorkflowDepartments.AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == departmentId);
            if (department is null) return null;

            var template = BasketTemplates.For(department.ProjectTypeCode);
            if (template is null) return null;

            // القالب يُطبَّق على مسودة فارغة فقط، حتى لا يخلط باقتراحاته عملاً
            // بناه المستخدم بنفسه.
            var draftBaskets = await _db.Workflows
                .Where(w => w.DepartmentId == departmentId && w.Status == WorkflowStatus.Draft)
                .SelectMany(w => w.Baskets)
                .CountAsync();

            return new BasketTemplateDto
            {
                ProjectTypeCode = template.ProjectTypeCode,
                DepartmentName = template.DepartmentName,
                Source = template.Source,
                CanApply = draftBaskets == 0,
                BlockedReason = draftBaskets == 0
                    ? null
                    : "المسودة تحتوي على سلال بالفعل. احذفها أولاً أو أضف السلال يدوياً.",
                Baskets = template.Baskets.Select((b, i) => new BasketTemplateItemDto
                {
                    Order = i + 1,
                    Name = b.Name,
                    Purpose = b.Purpose,
                    Tasks = b.Tasks.Select(t => t.Name).ToList(),
                    MandatoryTasksCount = b.Tasks.Count(t => t.IsMandatory)
                }).ToList()
            };
        }

        public async Task<(WorkflowDto?, string?)> ApplyTemplateAsync(
            int departmentId, string userId, string? userName)
        {
            var department = await _db.WorkflowDepartments
                .FirstOrDefaultAsync(d => d.Id == departmentId);
            if (department is null) return (null, "القسم غير موجود.");

            var template = BasketTemplates.For(department.ProjectTypeCode);
            if (template is null)
                return (null, "لا يوجد قالب مقترح لنوع مشروع هذا القسم.");

            // نضمن وجود مسودة أولاً، ثم نتحقّق أنها فارغة.
            var draftDto = await GetOrCreateDraftAsync(departmentId, userId, userName);
            if (draftDto is null) return (null, "تعذّر فتح المسودة.");

            var draft = await _db.Workflows.Include(w => w.Baskets)
                .FirstAsync(w => w.Id == draftDto.Id);

            if (draft.Baskets.Count > 0)
                return (null, "المسودة تحتوي على سلال بالفعل.");

            var order = 0;
            foreach (var item in template.Baskets)
            {
                order++;
                var basket = new WorkflowBasket
                {
                    WorkflowId = draft.Id,
                    StableKey = order,
                    Name = item.Name,
                    Purpose = item.Purpose,
                    SortOrder = order,
                    IsActive = true,
                    RequireMandatoryTasks = item.RequireMandatoryTasks,
                    RequireAttachments = item.RequireAttachments
                };

                var taskOrder = 0;
                foreach (var task in item.Tasks)
                {
                    taskOrder++;
                    basket.Tasks.Add(new BasketTask
                    {
                        StableKey = taskOrder,
                        SortOrder = taskOrder,
                        Name = task.Name,
                        IsMandatory = task.IsMandatory,
                        IsActive = true,
                        RequiredAttachments = task.RequiredAttachments
                    });
                }

                _db.WorkflowBaskets.Add(basket);
            }

            Audit(department.ContractId, departmentId, draft.Id, null, "ApplyTemplate",
                null, $"{template.Baskets.Count} سلة مقترحة",
                template.Source == "Spec" ? "قالب منصوص عليه" : "قالب مقترح",
                userId, userName);

            await _db.SaveChangesAsync();
            return (await LoadWorkflowAsync(draft.Id), null);
        }

        // ─────────────────────────── السلال ───────────────────────────

        public async Task<BasketDto?> AddBasketAsync(int workflowId, BasketUpsertDto dto, string userId, string? userName)
        {
            var wf = await _db.Workflows.Include(w => w.Department)
                .FirstOrDefaultAsync(w => w.Id == workflowId);
            if (wf is null) return null;

            var maxOrder = await _db.WorkflowBaskets.Where(b => b.WorkflowId == workflowId)
                .Select(b => (int?)b.SortOrder).MaxAsync() ?? 0;

            // المفتاح الثابت فريد داخل المسار فقط، ويُورَّث عند نسخ المسودة.
            var maxKey = await _db.WorkflowBaskets.Where(b => b.WorkflowId == workflowId)
                .Select(b => (int?)b.StableKey).MaxAsync() ?? 0;

            var entity = new WorkflowBasket
            {
                WorkflowId = workflowId,
                StableKey = maxKey + 1,
                Name = dto.Name.Trim(),
                Description = dto.Description,
                Purpose = dto.Purpose,
                TransitionRequirements = dto.TransitionRequirements,
                RequireMandatoryTasks = dto.RequireMandatoryTasks,
                RequireAttachments = dto.RequireAttachments,
                IsActive = dto.IsActive,
                SortOrder = maxOrder + 1
            };

            _db.WorkflowBaskets.Add(entity);
            await _db.SaveChangesAsync();

            Audit(wf.Department.ContractId, wf.DepartmentId, workflowId, entity.Id, "AddBasket", null, entity.Name, null, userId, userName);
            await _db.SaveChangesAsync();

            return await LoadBasketAsync(entity.Id);
        }

        public async Task<(BasketDto?, string?)> UpdateBasketAsync(int basketId, BasketUpsertDto dto, string userId, string? userName)
        {
            var entity = await _db.WorkflowBaskets
                .Include(b => b.Workflow).ThenInclude(w => w.Department)
                .FirstOrDefaultAsync(b => b.Id == basketId);
            if (entity is null) return (null, "السلة غير موجودة.");

            // البند 6: لا يُعطّل مسار أمر عمل تحت قدميه. التعطيل يخفي
            // السلة من المسار المعتمد، فيصير أمر العمل بلا موقع قابل للعرض.
            if (entity.IsActive && !dto.IsActive)
            {
                var busy = await CountWorkOrdersInBasketAsync(entity.Id);
                if (busy > 0)
                {
                    return (null, $"لا يمكن تعطيل السلة لوجود {busy} أمر عمل بداخلها. انقلها إلى سلة أخرى أولاً.");
                }
            }

            var before = $"{entity.Name} — {(entity.IsActive ? "مفعّلة" : "معطّلة")}";

            entity.Name = dto.Name.Trim();
            entity.Description = dto.Description;
            entity.Purpose = dto.Purpose;
            entity.TransitionRequirements = dto.TransitionRequirements;
            entity.RequireMandatoryTasks = dto.RequireMandatoryTasks;
            entity.RequireAttachments = dto.RequireAttachments;
            entity.IsActive = dto.IsActive;

            var after = $"{entity.Name} — {(entity.IsActive ? "مفعّلة" : "معطّلة")}";
            Audit(entity.Workflow.Department.ContractId, entity.Workflow.DepartmentId, entity.WorkflowId, basketId,
                "UpdateBasket", before, after, null, userId, userName);

            await _db.SaveChangesAsync();
            return (await LoadBasketAsync(basketId), null);
        }

        public async Task<bool> ReorderBasketsAsync(int workflowId, ReorderDto dto, string userId, string? userName)
        {
            var wf = await _db.Workflows.Include(w => w.Department).Include(w => w.Baskets)
                .FirstOrDefaultAsync(w => w.Id == workflowId);
            if (wf is null || wf.Baskets.Count == 0) return false;

            var items = wf.Baskets.ToList();
            var before = string.Join(" ← ", items.OrderBy(b => b.SortOrder).Select(b => b.Name));
            if (!ApplyOrder(dto.OrderedIds, items, b => b.Id, (b, o) => b.SortOrder = o)) return false;
            var after = string.Join(" ← ", items.OrderBy(b => b.SortOrder).Select(b => b.Name));

            Audit(wf.Department.ContractId, wf.DepartmentId, workflowId, null, "ReorderBaskets", before, after, null, userId, userName);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<(bool ok, string? error)> DeleteBasketAsync(int basketId, string userId, string? userName)
        {
            var entity = await _db.WorkflowBaskets
                .Include(b => b.Workflow).ThenInclude(w => w.Department)
                .FirstOrDefaultAsync(b => b.Id == basketId);
            if (entity is null) return (false, "السلة غير موجودة.");

            if (entity.Workflow.Status != WorkflowStatus.Draft)
                return (false, "لا يجوز حذف سلة من مسار منشور. عدّل المسودة ثم اعتمدها.");

            var count = await CountWorkOrdersInBasketAsync(entity.Id);
            if (count > 0)
                return (false, $"لا يمكن حذف السلة لوجود {count} أمر عمل بداخلها. عطّلها بدل حذفها.");

            Audit(entity.Workflow.Department.ContractId, entity.Workflow.DepartmentId, entity.WorkflowId, null,
                "DeleteBasket", entity.Name, null, null, userId, userName);

            _db.WorkflowBaskets.Remove(entity);
            await _db.SaveChangesAsync();
            return (true, null);
        }

        // ─────────────────────────── مهام السلة ───────────────────────────

        public async Task<BasketTaskDto?> AddTaskAsync(int basketId, BasketTaskUpsertDto dto, string userId, string? userName)
        {
            var basket = await _db.WorkflowBaskets
                .Include(b => b.Workflow).ThenInclude(w => w.Department)
                .FirstOrDefaultAsync(b => b.Id == basketId);
            if (basket is null) return null;

            var maxOrder = await _db.BasketTasks.Where(t => t.BasketId == basketId)
                .Select(t => (int?)t.SortOrder).MaxAsync() ?? 0;

            // المفتاح الثابت فريد داخل السلة، ويُورَّث عند نسخ المسودة.
            var maxKey = await _db.BasketTasks.Where(t => t.BasketId == basketId)
                .Select(t => (int?)t.StableKey).MaxAsync() ?? 0;

            var entity = new BasketTask
            {
                BasketId = basketId,
                StableKey = maxKey + 1,
                Name = dto.Name.Trim(),
                Description = dto.Description,
                IsMandatory = dto.IsMandatory,
                IsActive = dto.IsActive,
                DefaultAssigneeRole = dto.DefaultAssigneeRole,
                DurationDays = dto.DurationDays,
                RequiredAttachments = dto.RequiredAttachments,
                RequiredForms = dto.RequiredForms,
                SortOrder = maxOrder + 1
            };

            _db.BasketTasks.Add(entity);
            await _db.SaveChangesAsync();

            Audit(basket.Workflow.Department.ContractId, basket.Workflow.DepartmentId, basket.WorkflowId, basketId,
                "AddTask", null, entity.Name, null, userId, userName);
            await _db.SaveChangesAsync();

            return ToTaskDto(entity);
        }

        public async Task<BasketTaskDto?> UpdateTaskAsync(int taskId, BasketTaskUpsertDto dto, string userId, string? userName)
        {
            var entity = await _db.BasketTasks
                .Include(t => t.Basket).ThenInclude(b => b.Workflow).ThenInclude(w => w.Department)
                .FirstOrDefaultAsync(t => t.Id == taskId);
            if (entity is null) return null;

            var before = $"{entity.Name} — {(entity.IsMandatory ? "إلزامية" : "اختيارية")}";

            entity.Name = dto.Name.Trim();
            entity.Description = dto.Description;
            entity.IsMandatory = dto.IsMandatory;
            entity.IsActive = dto.IsActive;
            entity.DefaultAssigneeRole = dto.DefaultAssigneeRole;
            entity.DurationDays = dto.DurationDays;
            entity.RequiredAttachments = dto.RequiredAttachments;
            entity.RequiredForms = dto.RequiredForms;

            var after = $"{entity.Name} — {(entity.IsMandatory ? "إلزامية" : "اختيارية")}";
            Audit(entity.Basket.Workflow.Department.ContractId, entity.Basket.Workflow.DepartmentId,
                entity.Basket.WorkflowId, entity.BasketId, "UpdateTask", before, after, null, userId, userName);

            await _db.SaveChangesAsync();
            return ToTaskDto(entity);
        }

        public async Task<bool> ReorderTasksAsync(int basketId, ReorderDto dto, string userId, string? userName)
        {
            var basket = await _db.WorkflowBaskets
                .Include(b => b.Tasks)
                .Include(b => b.Workflow).ThenInclude(w => w.Department)
                .FirstOrDefaultAsync(b => b.Id == basketId);
            if (basket is null || basket.Tasks.Count == 0) return false;

            var items = basket.Tasks.ToList();
            var before = string.Join(" ← ", items.OrderBy(t => t.SortOrder).Select(t => t.Name));
            if (!ApplyOrder(dto.OrderedIds, items, t => t.Id, (t, o) => t.SortOrder = o)) return false;
            var after = string.Join(" ← ", items.OrderBy(t => t.SortOrder).Select(t => t.Name));

            Audit(basket.Workflow.Department.ContractId, basket.Workflow.DepartmentId, basket.WorkflowId, basketId,
                "ReorderTasks", before, after, null, userId, userName);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteTaskAsync(int taskId, string userId, string? userName)
        {
            var entity = await _db.BasketTasks
                .Include(t => t.Basket).ThenInclude(b => b.Workflow).ThenInclude(w => w.Department)
                .FirstOrDefaultAsync(t => t.Id == taskId);
            if (entity is null) return false;

            Audit(entity.Basket.Workflow.Department.ContractId, entity.Basket.Workflow.DepartmentId,
                entity.Basket.WorkflowId, entity.BasketId, "DeleteTask", entity.Name, null, null, userId, userName);

            _db.BasketTasks.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }

        // ─────────────────────────── سجل التغييرات ───────────────────────────

        public async Task<List<WorkflowAuditLogDto>> GetAuditLogAsync(int contractId, int? departmentId, int take)
        {
            var query = _db.WorkflowAuditLogs.AsNoTracking().Where(l => l.ContractId == contractId);
            if (departmentId is not null) query = query.Where(l => l.DepartmentId == departmentId);

            return await query
                .OrderByDescending(l => l.ChangedAt).ThenByDescending(l => l.Id)
                .Take(take <= 0 ? 100 : Math.Min(take, 500))
                .Select(l => new WorkflowAuditLogDto
                {
                    Id = l.Id,
                    ContractId = l.ContractId,
                    DepartmentId = l.DepartmentId,
                    WorkflowId = l.WorkflowId,
                    BasketId = l.BasketId,
                    ChangeType = l.ChangeType,
                    OldValue = l.OldValue,
                    NewValue = l.NewValue,
                    Note = l.Note,
                    ChangedByUserId = l.ChangedByUserId,
                    ChangedByUserName = l.ChangedByUserName,
                    ChangedAt = l.ChangedAt
                })
                .ToListAsync();
        }

        // ─────────────────────────── مساعدات ───────────────────────────

        /// <summary>
        /// عدد أوامر العمل داخل سلة.
        ///
        /// المواقع تُحفظ بـ (القسم + المفتاح الثابت)، لا بمعرّف صف السلة، فالعدّ
        /// يشمل أوامر العمل التي دخلت السلة في نسخ أقدم من المسار أيضاً.
        /// </summary>
        private async Task<int> CountWorkOrdersInBasketAsync(int basketId)
        {
            var basket = await _db.WorkflowBaskets.AsNoTracking()
                .Where(b => b.Id == basketId)
                .Select(b => new { b.StableKey, b.Workflow.DepartmentId })
                .FirstOrDefaultAsync();

            if (basket is null) return 0;

            return await _db.WorkOrderPlacements.AsNoTracking()
                .CountAsync(p => p.DepartmentId == basket.DepartmentId &&
                                 p.BasketStableKey == basket.StableKey);
        }

        /// <summary>
        /// يطبّق ترتيباً جديداً بالمعرّفات. يرفض القائمة إن لم تطابق العناصر
        /// الموجودة تماماً، حتى لا يسقط عنصر من الترتيب بصمت.
        /// </summary>
        private static bool ApplyOrder<T>(List<int> orderedIds, List<T> items,
            Func<T, int> idOf, Action<T, int> setOrder)
        {
            if (orderedIds.Count != items.Count) return false;
            if (orderedIds.Distinct().Count() != orderedIds.Count) return false;

            var byId = items.ToDictionary(idOf);
            if (!orderedIds.All(byId.ContainsKey)) return false;

            for (var i = 0; i < orderedIds.Count; i++)
                setOrder(byId[orderedIds[i]], i + 1);

            return true;
        }

        private void Audit(int contractId, int? departmentId, int? workflowId, int? basketId,
            string changeType, string? oldValue, string? newValue, string? note, string userId, string? userName)
        {
            _db.WorkflowAuditLogs.Add(new WorkflowAuditLog
            {
                ContractId = contractId,
                DepartmentId = departmentId,
                WorkflowId = workflowId,
                BasketId = basketId,
                ChangeType = changeType,
                OldValue = Truncate(oldValue, 2000),
                NewValue = Truncate(newValue, 2000),
                Note = Truncate(note, 1000),
                ChangedByUserId = userId,
                ChangedByUserName = userName
            });
        }

        private static string? Truncate(string? value, int max)
            => value is null || value.Length <= max ? value : value[..max];

        private async Task<WorkflowDto?> LoadWorkflowAsync(int workflowId)
        {
            var wf = await _db.Workflows.AsNoTracking()
                .Include(w => w.Department).ThenInclude(d => d.Contract)
                .Include(w => w.Baskets).ThenInclude(b => b.Tasks)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (wf is null) return null;

            var loads = await LoadBasketLoadsAsync(wf.DepartmentId);

            return new WorkflowDto
            {
                Id = wf.Id,
                DepartmentId = wf.DepartmentId,
                DepartmentName = wf.Department.Name,
                ContractId = wf.Department.ContractId,
                ContractName = wf.Department.Contract.Name,
                Version = wf.Version,
                Status = wf.Status,
                PublishedAt = wf.PublishedAt,
                Baskets = wf.Baskets.OrderBy(b => b.SortOrder)
                    .Select(b => ToBasketDto(b, LoadCount(loads, b.StableKey))).ToList()
            };
        }

        /// <summary>
        /// عدد أوامر العمل في كل مفتاح ثابت داخل قسم، باستعلام واحد
        /// بدل استعلام لكل سلة.
        /// </summary>
        private async Task<Dictionary<int, int>> LoadBasketLoadsAsync(int departmentId)
        {
            var rows = await _db.WorkOrderPlacements.AsNoTracking()
                .Where(p => p.DepartmentId == departmentId)
                .GroupBy(p => p.BasketStableKey)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToListAsync();

            return rows.ToDictionary(r => r.Key, r => r.Count);
        }

        private static int LoadCount(Dictionary<int, int> loads, int stableKey)
            => loads.TryGetValue(stableKey, out var n) ? n : 0;

        private async Task<BasketDto?> LoadBasketAsync(int basketId)
        {
            var b = await _db.WorkflowBaskets.AsNoTracking()
                .Include(x => x.Tasks)
                .Include(x => x.Workflow)
                .FirstOrDefaultAsync(x => x.Id == basketId);

            if (b is null) return null;

            var count = await CountWorkOrdersInBasketAsync(b.Id);
            return ToBasketDto(b, count);
        }

        private static BasketDto ToBasketDto(WorkflowBasket b, int workOrdersCount) => new()
        {
            Id = b.Id,
            StableKey = b.StableKey,
            Name = b.Name,
            Description = b.Description,
            Purpose = b.Purpose,
            SortOrder = b.SortOrder,
            IsActive = b.IsActive,
            TransitionRequirements = b.TransitionRequirements,
            RequireMandatoryTasks = b.RequireMandatoryTasks,
            RequireAttachments = b.RequireAttachments,
            WorkOrdersCount = workOrdersCount,
            Tasks = b.Tasks.OrderBy(t => t.SortOrder).Select(ToTaskDto).ToList()
        };

        private static BasketTaskDto ToTaskDto(BasketTask t) => new()
        {
            Id = t.Id,
            BasketId = t.BasketId,
            Name = t.Name,
            Description = t.Description,
            SortOrder = t.SortOrder,
            IsMandatory = t.IsMandatory,
            IsActive = t.IsActive,
            DefaultAssigneeRole = t.DefaultAssigneeRole,
            DurationDays = t.DurationDays,
            RequiredAttachments = t.RequiredAttachments,
            RequiredForms = t.RequiredForms
        };
    }
}
