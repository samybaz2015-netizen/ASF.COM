using ASF.Core.DTOs.Workflow;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities.Maintenance;
using ASF.Core.Entities.Workflow;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace ASF.Service
{
    /// <summary>
    /// استيراد أوامر العمل من ملف إكسل.
    ///
    /// الواجهة تقرأ الملف وترسل صفوفه نصوصاً، وهنا يجري التحقّق ثم الكتابة.
    /// التحقّق يسبق الكتابة دائماً: يرى المستخدم ما سيُنشأ وما سيُرفض ولماذا،
    /// قبل أن يُكتب أي صف.
    /// </summary>
    public class WorkOrderImportService : IWorkOrderImportService
    {
        private readonly ApplicationDbContext _db;
        private readonly IWorkOrderFlowService _flow;

        public WorkOrderImportService(ApplicationDbContext db, IWorkOrderFlowService flow)
        {
            _db = db;
            _flow = flow;
        }

        public async Task<(WorkOrderImportResultDto? result, string? error)> ImportAsync(
            WorkOrderImportRequestDto request, string userId, string? userName)
        {
            var department = await _db.WorkflowDepartments.AsNoTracking()
                .Include(d => d.Contract)
                .FirstOrDefaultAsync(d => d.Id == request.DepartmentId && d.ContractId == request.ContractId);

            if (department is null) return (null, "القسم لا يتبع هذا العقد.");

            if (!ProjectTypeCodes.IsValid(department.ProjectTypeCode))
                return (null, "القسم غير مرتبط بنوع مشروع، فلا يُعرف أين تُكتب أوامر العمل.");

            var typeCode = department.ProjectTypeCode!;

            if (typeCode is not (ProjectTypeCodes.Construction
                or ProjectTypeCodes.Maintenance
                or ProjectTypeCodes.Emergency))
            {
                return (null, "الاستيراد متاح حالياً للإنشاءات والصيانة والطوارئ فقط.");
            }

            var result = new WorkOrderImportResultDto
            {
                DryRun = request.DryRun,
                ProjectTypeCode = typeCode,
                DepartmentName = department.Name,
                ContractName = department.Contract.Name,
                TotalRows = request.Rows.Count
            };

            // السلة التي ستستقبل أوامر العمل — تُعرض قبل الاستيراد لا بعده.
            var entryBasket = await _db.Workflows.AsNoTracking()
                .Where(w => w.DepartmentId == department.Id && w.Status == WorkflowStatus.Published)
                .SelectMany(w => w.Baskets)
                .Where(b => b.IsActive)
                .OrderBy(b => b.SortOrder)
                .Select(b => b.Name)
                .FirstOrDefaultAsync();

            result.EntryBasketName = entryBasket;

            if (entryBasket is null)
            {
                result.Blocker = "لا يوجد مسار معتمد لهذا القسم. ستُنشأ أوامر العمل بلا سلة حتى تعتمد المسار.";
            }

            // أرقام أوامر العمل القائمة، لكشف التكرار باستعلام واحد.
            var existingNumbers = await ReadExistingOrderNumbersAsync(typeCode);

            // تكرار داخل الملف نفسه يُكشف أيضاً، وإلا أُنشئ الصف مرتين.
            var seenInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var pending = new List<(WorkOrderImportRowDto Row, WorkOrderImportRowResultDto Result,
                DateTime Received, DateTime? Completion)>();

            foreach (var row in request.Rows)
            {
                var rowResult = new WorkOrderImportRowResultDto
                {
                    RowNumber = row.RowNumber,
                    OrderNumber = row.OrderNumber?.Trim(),
                    Status = "Valid"
                };

                var number = row.OrderNumber?.Trim();

                // المطلوب هو رقم أمر العمل وحده: بدونه لا هويّة للصف ولا كشف
                // تكرار. باقي الحقول تُستورد إن وُجدت وتُترك فارغة إن غابت، فلا
                // يُرفض ملفٌ كامل لأن عموداً واحداً ناقص — تُستكمل من الشاشة لاحقاً.
                if (string.IsNullOrWhiteSpace(number))
                    rowResult.Errors.Add("رقم أمر العمل مطلوب.");

                if (string.IsNullOrWhiteSpace(row.Description))
                    rowResult.Notes.Add("وصف العمل غير متوفّر.");

                if (string.IsNullOrWhiteSpace(row.District))
                    rowResult.Notes.Add("الحي غير متوفّر.");

                if (string.IsNullOrWhiteSpace(row.Contractor))
                    rowResult.Notes.Add("المقاول غير متوفّر.");

                // قيمة موجودة لكنها غير مقروءة تبقى خطأً: الصمت عليها يعني
                // كتابة تاريخ لم يقصده أحد. أما الخانة الفارغة فتأخذ تاريخ اليوم.
                var received = ParseDate(row.ReceivedAt);

                if (received is null && !string.IsNullOrWhiteSpace(row.ReceivedAt))
                {
                    rowResult.Errors.Add($"تاريخ الاستلام «{row.ReceivedAt.Trim()}» غير مقروء.");
                }
                else if (received is null)
                {
                    received = DateTime.Now.Date;
                    rowResult.Notes.Add("تاريخ الاستلام غير متوفّر — سُجّل تاريخ اليوم.");
                }

                var completion = ParseDate(row.CompletionDate);

                if (rowResult.Errors.Count > 0)
                {
                    rowResult.Status = "Error";
                    result.ErrorRows++;
                    result.Rows.Add(rowResult);
                    continue;
                }

                var duplicateInDb = existingNumbers.Contains(number!);
                var duplicateInFile = !seenInFile.Add(number!);

                if (duplicateInDb || duplicateInFile)
                {
                    rowResult.Status = "Duplicate";
                    rowResult.Errors.Add(duplicateInFile
                        ? "الرقم مكرّر داخل الملف."
                        : "يوجد أمر عمل بهذا الرقم في النظام.");

                    result.DuplicateRows++;

                    if (!request.SkipDuplicates)
                    {
                        rowResult.Status = "Error";
                        result.DuplicateRows--;
                        result.ErrorRows++;
                    }

                    result.Rows.Add(rowResult);
                    continue;
                }

                result.ValidRows++;
                result.Rows.Add(rowResult);
                pending.Add((row, rowResult, received!.Value, completion));
            }

            if (request.DryRun || pending.Count == 0)
                return (result, null);

            // الكتابة: تُنشأ الصفوف الصالحة ثم يُدخَل كلٌّ منها المسار.
            foreach (var item in pending)
            {
                var id = await CreateWorkOrderAsync(typeCode, item.Row, item.Received, item.Completion,
                    department, userId, userName);

                item.Result.Status = "Created";
                item.Result.WorkOrderId = id;

                if (entryBasket is not null)
                {
                    await _flow.AutoEnterAsync(typeCode, id, department.Contract.ContractNumber, userId, userName);
                    item.Result.BasketName = entryBasket;
                }

                result.CreatedRows++;
            }

            return (result, null);
        }

        // ─────────────────── الإنشاء ───────────────────

        private async Task<int> CreateWorkOrderAsync(string typeCode, WorkOrderImportRowDto row,
            DateTime received, DateTime? completion, WorkflowDepartment department,
            string userId, string? userName)
        {
            var orderType = string.IsNullOrWhiteSpace(row.WorkOrderType)
                ? department.Name
                : row.WorkOrderType!.Trim();

            var duration = string.IsNullOrWhiteSpace(row.Duration) ? "0" : row.Duration!.Trim();

            // أعمدة إلزامية في القاعدة قد لا يوفّرها الملف. الشرطة تُميّز الحقل
            // الناقص عن الفارغ فعلاً، فيعرف من يفتح أمر العمل ما ينقصه.
            var description = string.IsNullOrWhiteSpace(row.Description) ? "-" : row.Description!.Trim();
            var district = string.IsNullOrWhiteSpace(row.District) ? "-" : row.District!.Trim();
            var contractor = string.IsNullOrWhiteSpace(row.Contractor) ? "-" : row.Contractor!.Trim();
            var contractNumber = string.IsNullOrWhiteSpace(row.ContractNumber)
                ? department.Contract.ContractNumber
                : row.ContractNumber!.Trim();

            switch (typeCode)
            {
                case ProjectTypeCodes.Construction:
                {
                    var entity = new Construction
                    {
                        FaultNumber = row.OrderNumber!.Trim(),
                        WorkOrderType = orderType,
                        WorkDescription = description,
                        District = district,
                        Contractor = contractor,
                        DurationOfImplementation = duration,
                        ReceiveDateTime = received,
                        // هذه أعمدة إلزامية في القاعدة ولا يوفّرها الملف،
                        // فتأخذ قيماً محايدة تُصحَّح من شاشة أمر العمل.
                        CompletionDate = completion?.ToString("yyyy-MM-dd") ?? "-",
                        NumberOfDaysDelayed = "0",
                        NumberOfDaysRemaining = duration,
                        Situation = "جديد",
                        ContractNumber = contractNumber,
                        StationNumber = row.StationNumber,
                        Consultant = row.Consultant,
                        // القيمة التقديرية كانت تُقرأ من الملف وتُهمل هنا، فيُستورد
                        // أمر العمل بلا قيمة ولا يظهر في أي مجموع.
                        EstimatedValue = row.EstimatedValue,
                        Note = row.Note,
                        AppUserId = userId,
                        UserName = userName ?? "import",
                        SafetyViolationsExist = false,
                        IsArchived = false,
                        CreateAt = DateTime.Now
                    };
                    _db.Constructions.Add(entity);
                    await _db.SaveChangesAsync();
                    return entity.Id;
                }

                case ProjectTypeCodes.Maintenance:
                {
                    var entity = new Maintenance
                    {
                        FaultNumber = row.OrderNumber!.Trim(),
                        WorkOrderType = orderType,
                        WorkDescription = description,
                        District = district,
                        Contractor = contractor,
                        DurationOfImplementation = duration,
                        ReceiveDateTime = received,
                        Situation = "جديد",
                        ContractNumber = contractNumber,
                        StationNumber = row.StationNumber,
                        Consultant = row.Consultant,
                        // القيمة التقديرية كانت تُقرأ من الملف وتُهمل هنا، فيُستورد
                        // أمر العمل بلا قيمة ولا يظهر في أي مجموع.
                        EstimatedValue = row.EstimatedValue,
                        Note = row.Note,
                        AppUserId = userId,
                        UserName = userName ?? "import",
                        SafetyViolationsExist = false,
                        IsArchived = false,
                        CreateAt = DateTime.Now
                    };
                    _db.Maintenances.Add(entity);
                    await _db.SaveChangesAsync();
                    return entity.Id;
                }

                default:
                {
                    var entity = new Emergency
                    {
                        FaultNumber = row.OrderNumber!.Trim(),
                        WorkOrderType = orderType,
                        WorkDescription = description,
                        District = district,
                        Contractor = contractor,
                        DurationOfImplementation = duration,
                        ReceiveDateTime = received,
                        Situation = "جديد",
                        ContractNumber = contractNumber,
                        StationNumber = row.StationNumber,
                        Consultant = row.Consultant,
                        // القيمة التقديرية كانت تُقرأ من الملف وتُهمل هنا، فيُستورد
                        // أمر العمل بلا قيمة ولا يظهر في أي مجموع.
                        EstimatedValue = row.EstimatedValue,
                        Note = row.Note,
                        AppUserId = userId,
                        UserName = userName ?? "import",
                        SafetyViolationsExist = false,
                        IsArchived = false,
                        CreateAt = DateTime.Now
                    };
                    _db.Emergencys.Add(entity);
                    await _db.SaveChangesAsync();
                    return entity.Id;
                }
            }
        }

        private async Task<HashSet<string>> ReadExistingOrderNumbersAsync(string typeCode)
        {
            var numbers = typeCode switch
            {
                ProjectTypeCodes.Construction =>
                    await _db.Constructions.AsNoTracking().Select(x => x.FaultNumber).ToListAsync(),
                ProjectTypeCodes.Maintenance =>
                    await _db.Maintenances.AsNoTracking().Select(x => x.FaultNumber).ToListAsync(),
                ProjectTypeCodes.Emergency =>
                    await _db.Emergencys.AsNoTracking().Select(x => x.FaultNumber).ToListAsync(),
                _ => new List<string>()
            };

            return numbers.Where(n => !string.IsNullOrWhiteSpace(n))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// يقرأ تاريخاً بالصيغ الشائعة في ملفات المستخدمين.
        ///
        /// الإكسل قد يعطي التاريخ رقماً تسلسلياً، وقد يُكتب بخط اليد بصيغة
        /// يوم/شهر/سنة. الصيغتان مقبولتان هنا، والمجهول يُرفض بدل أن يُخمَّن.
        /// </summary>
        private static DateTime? ParseDate(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;

            var text = value.Trim();

            var formats = new[]
            {
                "yyyy-MM-dd", "yyyy/MM/dd", "dd-MM-yyyy", "dd/MM/yyyy",
                "d/M/yyyy", "M/d/yyyy", "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-dd HH:mm:ss"
            };

            if (DateTime.TryParseExact(text, formats, CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var exact))
                return exact;

            if (DateTime.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.None, out var loose))
                return loose;

            // رقم تسلسلي من الإكسل: الأيام منذ 1899-12-30.
            if (double.TryParse(text, NumberStyles.Any, CultureInfo.InvariantCulture, out var serial)
                && serial > 0 && serial < 80000)
            {
                return new DateTime(1899, 12, 30).AddDays(serial);
            }

            return null;
        }
    }
}
