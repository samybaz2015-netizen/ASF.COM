using ASF.Core.DTOs.Workflow;
using ASF.Core.Entities.Workflow;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using Microsoft.EntityFrameworkCore;

namespace ASF.Service
{
    /// <summary>
    /// أنواع أوامر العمل وفريق العمل وصلاحياته — كلها معلّقة على العقد.
    /// </summary>
    public class ContractSetupService : IContractSetupService
    {
        private readonly ApplicationDbContext _db;

        public ContractSetupService(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// أنواع أوامر عمل الإنشاءات المعتادة في العقد الموحد.
        /// بذرة تُعدَّل وتُحذف بحرّية، لا قائمة مغلقة.
        /// </summary>
        private static readonly string[] ConstructionTypeSeed =
        {
            "إيصال", "حلال", "ربط", "تعزيز"
        };

        // ─────────────────── أنواع أوامر العمل ───────────────────

        public async Task<List<WorkOrderTypeDto>> GetWorkOrderTypesAsync(
            int contractId, bool includeInactive, string? category = null)
        {
            // القيمة العامة (بلا عقد) تظهر في كل عقد: هي مشتركة فعلاً، وإخفاؤها
            // يدفع المستخدم لإضافتها ثانيةً داخل العقد فتتكرّر.
            var query = _db.ContractWorkOrderTypes.AsNoTracking()
                .Where(t => t.ContractId == contractId || t.ContractId == null);

            // بلا تصنيف تُعاد القوائم كلها — يحتاجها من يبني شاشةً واحدة لها.
            if (ContractListCategories.IsValid(category))
                query = query.Where(t => t.Category == category);

            if (!includeInactive) query = query.Where(t => t.IsActive);

            return await query
                .OrderBy(t => t.SortOrder).ThenBy(t => t.Id)
                .Select(t => new WorkOrderTypeDto
                {
                    Id = t.Id,
                    ContractId = t.ContractId,
                    DepartmentId = t.DepartmentId,
                    DepartmentName = t.Department == null ? null : t.Department.Name,
                    Category = t.Category,
                    Name = t.Name,
                    Code = t.Code,
                    Description = t.Description,
                    SortOrder = t.SortOrder,
                    IsActive = t.IsActive
                })
                .ToListAsync();
        }

        /// <summary>
        /// قراءة قائمة لأغراض الإدخال: القيم المفعّلة فقط، مرتّبة.
        ///
        /// هي المصدر الذي تقرأ منه شاشات إنشاء أوامر العمل. كانت تقرأ جداول
        /// عامة منفصلة، فما يُضاف في إعدادات العقد لا يظهر في النموذج. صار
        /// الاثنان مصدراً واحداً.
        ///
        /// النطاق يتّسع لا يضيق: القيم العامة، ثم قيم العقد، ثم قيم الإدارة —
        /// فمن يفتح نموذجاً داخل إدارة يرى ما يخصّها وما يعمّها معاً.
        /// </summary>
        public async Task<List<WorkOrderTypeDto>> GetListValuesAsync(
            string category, int? contractId, int? departmentId)
        {
            if (!ContractListCategories.IsValid(category))
                return new List<WorkOrderTypeDto>();

            var query = _db.ContractWorkOrderTypes.AsNoTracking()
                .Where(t => t.IsActive && t.Category == category)
                .Where(t => t.ContractId == null || t.ContractId == contractId);

            if (departmentId is int department)
                query = query.Where(t => t.DepartmentId == null || t.DepartmentId == department);

            return await query
                .OrderBy(t => t.SortOrder).ThenBy(t => t.Name)
                .Select(t => new WorkOrderTypeDto
                {
                    Id = t.Id,
                    ContractId = t.ContractId,
                    DepartmentId = t.DepartmentId,
                    DepartmentName = t.Department == null ? null : t.Department.Name,
                    Category = t.Category,
                    Name = t.Name,
                    Code = t.Code,
                    Description = t.Description,
                    SortOrder = t.SortOrder,
                    IsActive = t.IsActive
                })
                .ToListAsync();
        }

        public async Task<(WorkOrderTypeDto?, string?)> AddWorkOrderTypeAsync(
            int contractId, WorkOrderTypeUpsertDto dto, string userId, string? userName)
        {
            if (!await _db.Contracts.AnyAsync(c => c.Id == contractId))
                return (null, "العقد غير موجود.");

            if (dto.DepartmentId is int departmentId &&
                !await _db.WorkflowDepartments.AnyAsync(d => d.Id == departmentId && d.ContractId == contractId))
            {
                return (null, "القسم لا يتبع هذا العقد.");
            }

            var name = dto.Name.Trim();
            var category = ContractListCategories.IsValid(dto.Category)
                ? dto.Category!
                : ContractListCategories.WorkOrderType;

            // التفرّد داخل القائمة الواحدة فقط: «الرياض» حيٌّ ومقاولٌ في آنٍ
            // معاً أمر وارد، ومنعه يُجبر المستخدم على تحريف أحد الاسمين.
            if (await _db.ContractWorkOrderTypes.AnyAsync(t =>
                    (t.ContractId == contractId || t.ContractId == null) && t.Category == category &&
                    t.DepartmentId == dto.DepartmentId && t.Name == name))
            {
                return (null, $"«{name}» موجود في هذه القائمة بالفعل.");
            }

            // الترتيب يُعدّ داخل القائمة نفسها، وإلا بدأت قائمةٌ جديدة من رقم
            // كبير ورثته عن قائمة أخرى.
            var maxOrder = await _db.ContractWorkOrderTypes
                .Where(t => (t.ContractId == contractId || t.ContractId == null) && t.Category == category)
                .Select(t => (int?)t.SortOrder).MaxAsync() ?? 0;

            var entity = new ContractWorkOrderType
            {
                ContractId = contractId,
                DepartmentId = dto.DepartmentId,
                Category = category,
                Name = name,
                Code = string.IsNullOrWhiteSpace(dto.Code) ? null : dto.Code.Trim(),
                Description = dto.Description,
                IsActive = dto.IsActive,
                SortOrder = maxOrder + 1
            };

            _db.ContractWorkOrderTypes.Add(entity);
            Audit(contractId, dto.DepartmentId, "AddWorkOrderType", null, name, userId, userName);
            await _db.SaveChangesAsync();

            return ((await GetWorkOrderTypesAsync(contractId, true)).First(t => t.Id == entity.Id), null);
        }

        public async Task<(WorkOrderTypeDto?, string?)> UpdateWorkOrderTypeAsync(
            int typeId, WorkOrderTypeUpsertDto dto, string userId, string? userName)
        {
            var entity = await _db.ContractWorkOrderTypes.FirstOrDefaultAsync(t => t.Id == typeId);
            if (entity is null) return (null, "النوع غير موجود.");

            var before = $"{entity.Name} — {(entity.IsActive ? "مفعّل" : "معطّل")}";
            var previousName = entity.Name;

            entity.Name = dto.Name.Trim();
            entity.Code = string.IsNullOrWhiteSpace(dto.Code) ? null : dto.Code.Trim();
            entity.Description = dto.Description;
            entity.DepartmentId = dto.DepartmentId;
            entity.IsActive = dto.IsActive;

            Audit(entity.ContractId, entity.DepartmentId, "UpdateWorkOrderType",
                before, $"{entity.Name} — {(entity.IsActive ? "مفعّل" : "معطّل")}", userId, userName);

            await _db.SaveChangesAsync();

            // إعادة التسمية تسري على أوامر العمل المرتبطة.
            //
            // بدونها يبقى الاسم القديم مكتوباً في كل أمر عمل وكل تقرير وكل
            // تصدير — وهو ما كان يجعل تعديل القائمة بلا أثر خارجها.
            if (!string.Equals(previousName, entity.Name, StringComparison.Ordinal))
                await PropagateRenameAsync(entity.Id, entity.Category, entity.Name);

            // القيمة العامة تُقرأ ضمن أي عقد، فيكفي عقدها هي أو صفر.
            return ((await GetWorkOrderTypesAsync(entity.ContractId ?? 0, true)).First(t => t.Id == typeId), null);
        }

        /// <summary>
        /// نشر الاسم الجديد على أوامر العمل المرتبطة بهذه القيمة.
        ///
        /// العمود النصّي في أمر العمل هو ما تقرأه كل الشاشات والتقارير
        /// والتصديرات. تحديثه هنا يجعل التسمية الجديدة تظهر فيها جميعاً دون
        /// تعديل استعلام واحد منها.
        ///
        /// المطابقة بالمعرّف لا بالاسم القديم: فرق مسافة أو همزة لا يُفلت صفاً.
        /// </summary>
        private async Task PropagateRenameAsync(int valueId, string category, string newName)
        {
            // العمود النصّي يختلف باختلاف القائمة، والجداول أربعة.
            var column = category switch
            {
                ContractListCategories.District => "District",
                ContractListCategories.Contractor => "Contractor",
                ContractListCategories.WorkOrderType => "WorkOrderType",
                _ => null
            };

            // رموز أوامر العمل لا عمود نصّياً لها في أوامر العمل، فلا نشر لها.
            if (column is null) return;

            var reference = column + "RefId";

            foreach (var table in new[] { "Constructions", "Emergencys", "Maintenances", "NewProjects" })
            {
                // أسماء الجداول والأعمدة من ثوابت الكود لا من مدخلات المستخدم،
                // والقيمتان المتغيّرتان تمرّان وسيطين.
                await _db.Database.ExecuteSqlRawAsync(
                    $"UPDATE {table} SET {column} = {{0}} WHERE {reference} = {{1}}",
                    newName, valueId);
            }
        }

        /// <summary>
        /// إعادة ترتيب القيم. الترتيب يُعاد بناؤه من القائمة المرسلة كاملةً لا
        /// بتبديل عنصرين، فلا تبقى فجوات ولا أرقام متساوية تجعل العرض عشوائياً.
        /// </summary>
        public async Task<(List<WorkOrderTypeDto>?, string?)> ReorderWorkOrderTypesAsync(
            int contractId, List<int> ids, string? category, string userId, string? userName)
        {
            var scope = ContractListCategories.IsValid(category)
                ? category!
                : ContractListCategories.WorkOrderType;

            var types = await _db.ContractWorkOrderTypes
                .Where(t => (t.ContractId == contractId || t.ContractId == null) && t.Category == scope)
                .ToListAsync();

            if (types.Count == 0) return (new List<WorkOrderTypeDto>(), null);

            var order = 0;

            // المرسَل أولاً بترتيبه، ثم ما لم يُذكر خلفه بترتيبه القديم — فلا
            // يختفي عنصر من الشاشة لأن الطلب لم يحمل معرّفه.
            foreach (var id in ids)
            {
                var match = types.FirstOrDefault(t => t.Id == id);
                if (match is not null) match.SortOrder = ++order;
            }

            foreach (var rest in types.Where(t => !ids.Contains(t.Id)).OrderBy(t => t.SortOrder))
                rest.SortOrder = ++order;

            Audit(contractId, null, "ReorderWorkOrderTypes", null, $"{scope}: {ids.Count} قيمة", userId, userName);
            await _db.SaveChangesAsync();

            return (await GetWorkOrderTypesAsync(contractId, true, scope), null);
        }

        public async Task<(bool, string?)> DeleteWorkOrderTypeAsync(int typeId, string userId, string? userName)
        {
            var entity = await _db.ContractWorkOrderTypes.FirstOrDefaultAsync(t => t.Id == typeId);
            if (entity is null) return (false, "النوع غير موجود.");

            // النوع مرجع لصلاحيات الفريق. حذفه وهو مستعمل يترك صلاحيات معلّقة.
            var used = await _db.ContractTeamPermissions.CountAsync(x => x.WorkOrderTypeId == typeId);
            if (used > 0)
                return (false, $"لا يمكن حذف النوع لارتباطه بـ {used} صلاحية. عطّله بدل حذفه.");

            Audit(entity.ContractId, entity.DepartmentId, "DeleteWorkOrderType", entity.Name, null, userId, userName);
            _db.ContractWorkOrderTypes.Remove(entity);
            await _db.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(List<WorkOrderTypeDto>?, string?)> SeedDefaultTypesAsync(
            int contractId, int departmentId, string userId, string? userName)
        {
            var department = await _db.WorkflowDepartments.AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == departmentId && d.ContractId == contractId);

            if (department is null) return (null, "القسم لا يتبع هذا العقد.");

            var existing = await _db.ContractWorkOrderTypes
                .Where(t => t.ContractId == contractId && t.DepartmentId == departmentId
                            && t.Category == ContractListCategories.WorkOrderType)
                .Select(t => t.Name)
                .ToListAsync();

            var toAdd = ConstructionTypeSeed.Where(n => !existing.Contains(n)).ToList();
            if (toAdd.Count == 0) return (null, "الأنواع المعتادة مضافة بالفعل.");

            var maxOrder = await _db.ContractWorkOrderTypes
                .Where(t => t.ContractId == contractId
                            && t.Category == ContractListCategories.WorkOrderType)
                .Select(t => (int?)t.SortOrder).MaxAsync() ?? 0;

            foreach (var name in toAdd)
            {
                maxOrder++;
                _db.ContractWorkOrderTypes.Add(new ContractWorkOrderType
                {
                    ContractId = contractId,
                    DepartmentId = departmentId,
                    Category = ContractListCategories.WorkOrderType,
                    Name = name,
                    SortOrder = maxOrder,
                    IsActive = true
                });
            }

            Audit(contractId, departmentId, "SeedWorkOrderTypes", null,
                string.Join("، ", toAdd), userId, userName);

            await _db.SaveChangesAsync();
            return (await GetWorkOrderTypesAsync(contractId, true, ContractListCategories.WorkOrderType), null);
        }

        // ─────────────────── فريق العمل ───────────────────

        public async Task<List<TeamPermissionDto>> GetTeamAsync(int contractId)
        {
            return await _db.ContractTeamPermissions.AsNoTracking()
                .Where(x => x.ContractId == contractId)
                .OrderBy(x => x.UserName)
                .Select(x => new TeamPermissionDto
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    UserName = x.UserName,
                    ContractId = x.ContractId,
                    DepartmentId = x.DepartmentId,
                    DepartmentName = x.Department == null ? null : x.Department.Name,
                    WorkOrderTypeId = x.WorkOrderTypeId,
                    WorkOrderTypeName = x.WorkOrderType == null ? null : x.WorkOrderType.Name,
                    CanView = x.CanView,
                    CanCreate = x.CanCreate,
                    CanEdit = x.CanEdit,
                    CanDelete = x.CanDelete
                })
                .ToListAsync();
        }

        public async Task<(TeamPermissionDto?, string?)> UpsertTeamPermissionAsync(
            int contractId, TeamPermissionUpsertDto dto, string adminUserId)
        {
            if (string.IsNullOrWhiteSpace(dto.UserId))
                return (null, "الموظف غير محدّد.");

            if (!await _db.Contracts.AnyAsync(c => c.Id == contractId))
                return (null, "العقد غير موجود.");

            if (dto.DepartmentId is int departmentId &&
                !await _db.WorkflowDepartments.AnyAsync(d => d.Id == departmentId && d.ContractId == contractId))
            {
                return (null, "القسم لا يتبع هذا العقد.");
            }

            if (dto.WorkOrderTypeId is int typeId &&
                !await _db.ContractWorkOrderTypes.AnyAsync(t => t.Id == typeId && t.ContractId == contractId
                    && t.Category == ContractListCategories.WorkOrderType))
            {
                return (null, "نوع أمر العمل لا يتبع هذا العقد.");
            }

            // صف واحد لكل (موظف، عقد، قسم، نوع): إعادة الإسناد تعديل لا تكرار.
            var entity = await _db.ContractTeamPermissions.FirstOrDefaultAsync(x =>
                x.UserId == dto.UserId && x.ContractId == contractId &&
                x.DepartmentId == dto.DepartmentId && x.WorkOrderTypeId == dto.WorkOrderTypeId);

            if (entity is null)
            {
                entity = new ContractTeamPermission
                {
                    UserId = dto.UserId,
                    ContractId = contractId,
                    DepartmentId = dto.DepartmentId,
                    WorkOrderTypeId = dto.WorkOrderTypeId,
                    GrantedByUserId = adminUserId
                };
                _db.ContractTeamPermissions.Add(entity);
            }

            entity.UserName = dto.UserName;
            entity.CanView = dto.CanView || dto.CanCreate || dto.CanEdit || dto.CanDelete;
            entity.CanCreate = dto.CanCreate;
            entity.CanEdit = dto.CanEdit;
            entity.CanDelete = dto.CanDelete;

            await _db.SaveChangesAsync();
            return ((await GetTeamAsync(contractId)).First(x => x.Id == entity.Id), null);
        }

        public async Task<bool> RemoveTeamPermissionAsync(int id)
        {
            var entity = await _db.ContractTeamPermissions.FirstOrDefaultAsync(x => x.Id == id);
            if (entity is null) return false;

            _db.ContractTeamPermissions.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<TeamPermissionDto> GetEffectiveAsync(string userId, int contractId, int? workOrderTypeId)
        {
            var rows = await _db.ContractTeamPermissions.AsNoTracking()
                .Where(x => x.UserId == userId && x.ContractId == contractId)
                .ToListAsync();

            // بلا أي صف على هذا العقد = بلا تخصيص، فيبقى الأمر لصلاحيات النظام
            // العامة ولا نمنعه هنا.
            if (rows.Count == 0)
            {
                return new TeamPermissionDto
                {
                    UserId = userId,
                    ContractId = contractId,
                    CanView = true,
                    CanCreate = true,
                    CanEdit = true,
                    CanDelete = true
                };
            }

            // الصف العام للعقد (بلا نوع) يُجمع مع الصف الخاص بالنوع المطلوب.
            var relevant = rows.Where(x =>
                x.WorkOrderTypeId is null ||
                (workOrderTypeId is not null && x.WorkOrderTypeId == workOrderTypeId)).ToList();

            return new TeamPermissionDto
            {
                UserId = userId,
                ContractId = contractId,
                WorkOrderTypeId = workOrderTypeId,
                CanView = relevant.Any(x => x.CanView),
                CanCreate = relevant.Any(x => x.CanCreate),
                CanEdit = relevant.Any(x => x.CanEdit),
                CanDelete = relevant.Any(x => x.CanDelete)
            };
        }

        // ─────────────────── مساعد ───────────────────

        private void Audit(int? contractId, int? departmentId, string changeType,
            string? oldValue, string? newValue, string userId, string? userName)
        {
            _db.WorkflowAuditLogs.Add(new WorkflowAuditLog
            {
                ContractId = contractId,
                DepartmentId = departmentId,
                ChangeType = changeType,
                OldValue = oldValue,
                NewValue = newValue,
                ChangedByUserId = userId,
                ChangedByUserName = userName
            });
        }
    }
}
