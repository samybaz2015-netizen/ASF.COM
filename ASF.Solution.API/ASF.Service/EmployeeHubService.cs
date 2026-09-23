using ASF.Core.DTOs.Employees;
using ASF.Core.Entities.Identity;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ASF.Service
{
    /// <summary>
    /// قسم الموظفين.
    ///
    /// مصدر الموظف واحد: جدول الحسابات. الإجازات تشير إليه أصلاً
    /// (LeaveRequest.Employee هو AppUser)، والصلاحيات والحضور كذلك — فجمع
    /// بياناته هنا يزيل التضارب بدل أن يضيف مخزناً رابعاً.
    /// </summary>
    public class EmployeeHubService : IEmployeeHubService
    {
        private readonly AppIdentityDbContext _identity;
        private readonly ApplicationDbContext _db;
        private readonly UserManager<AppUser> _users;

        public EmployeeHubService(
            AppIdentityDbContext identity,
            ApplicationDbContext db,
            UserManager<AppUser> users)
        {
            _identity = identity;
            _db = db;
            _users = users;
        }

        // ─────────────────── القائمة والملف ───────────────────

        public async Task<List<EmployeeListItemDto>> GetEmployeesAsync(
            string? search, int? branchId, bool includeInactive)
        {
            var query = _identity.Users.AsNoTracking().AsQueryable();

            if (!includeInactive) query = query.Where(u => u.IsActiveEmployee);
            if (branchId is int b) query = query.Where(u => u.BranchId == b);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var needle = search.Trim();
                query = query.Where(u =>
                    (u.DisplayName != null && u.DisplayName.Contains(needle)) ||
                    u.UserName.Contains(needle) ||
                    (u.Email != null && u.Email.Contains(needle)) ||
                    (u.NationalId != null && u.NationalId.Contains(needle)) ||
                    (u.EmployeeNumber != null && u.EmployeeNumber.Contains(needle)));
            }

            var users = await query
                .OrderBy(u => u.DisplayName ?? u.UserName)
                .ToListAsync();

            return await BuildListAsync(users);
        }

        public async Task<EmployeeProfileDto?> GetProfileAsync(string userId)
        {
            var user = await _identity.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null) return null;

            var basics = (await BuildListAsync(new List<AppUser> { user })).First();

            var profile = new EmployeeProfileDto
            {
                Id = basics.Id,
                EmployeeNumber = basics.EmployeeNumber,
                DisplayName = basics.DisplayName,
                UserName = basics.UserName,
                Email = basics.Email,
                PhoneNumber = basics.PhoneNumber,
                JobTitle = basics.JobTitle,
                Specialization = basics.Specialization,
                UserType = basics.UserType,
                Role = basics.Role,
                BranchId = basics.BranchId,
                BranchName = basics.BranchName,
                OfficeId = basics.OfficeId,
                OfficeName = basics.OfficeName,
                HireDate = basics.HireDate,
                IsActiveEmployee = basics.IsActiveEmployee,
                NationalId = basics.NationalId,
                City = basics.City,
                AnnualLeaveBalance = basics.AnnualLeaveBalance,
                LeaveDaysTaken = basics.LeaveDaysTaken,
                LeaveDaysRemaining = basics.LeaveDaysRemaining,
                DocumentsCount = basics.DocumentsCount,
                ResidenceExpiryDate = basics.ResidenceExpiryDate,
                DaysToResidenceExpiry = basics.DaysToResidenceExpiry,
                UserImage = basics.UserImage,

                DateOfBirth = user.DateOfBirth,
                GraduationDate = user.GraduationDate,
                EndOfServiceDate = user.EndOfServiceDate,
                Profession = user.Profession,
                Salary = user.Salary,
                ExperienceYears = user.ExperienceYears,
                Certifications = user.Certifications,
                Bio = user.Bio,
                CanCreateProjectOutsideCity = user.CanCreateProjectOutsideCity,

                Documents = await GetDocumentsAsync(userId),
                Leaves = await GetLeavesAsync(userId, null, null),
            };

            return profile;
        }

        public async Task<(EmployeeProfileDto?, string?)> UpdateProfileAsync(
            string userId, EmployeeUpsertDto dto)
        {
            var user = await _identity.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null) return (null, "الموظف غير موجود.");

            // رقم الهوية ورقم الموظف يميّزان الموظف، فلا يتكرّران.
            if (!string.IsNullOrWhiteSpace(dto.NationalId) &&
                await _identity.Users.AnyAsync(u => u.Id != userId && u.NationalId == dto.NationalId))
            {
                return (null, "رقم الهوية مسجَّل لموظف آخر.");
            }

            if (!string.IsNullOrWhiteSpace(dto.EmployeeNumber) &&
                await _identity.Users.AnyAsync(u => u.Id != userId && u.EmployeeNumber == dto.EmployeeNumber))
            {
                return (null, "رقم الموظف مسجَّل لموظف آخر.");
            }

            if (dto.DisplayName is not null) user.DisplayName = dto.DisplayName;
            if (dto.EmployeeNumber is not null) user.EmployeeNumber = dto.EmployeeNumber;
            if (dto.NationalId is not null) user.NationalId = dto.NationalId;
            if (dto.JobTitle is not null) user.JobTitle = dto.JobTitle;
            if (dto.Specialization is not null) user.Specialization = dto.Specialization;
            if (dto.Profession is not null) user.Profession = dto.Profession;
            if (dto.City is not null) user.City = dto.City;
            if (dto.PhoneNumber is not null) user.PhoneNumber = dto.PhoneNumber;
            if (dto.Email is not null) user.Email = dto.Email;
            if (dto.BranchId is int branch) user.BranchId = branch;
            if (dto.OfficeId is int office) user.OfficeId = office;

            if (dto.HireDate is not null) user.HireDate = dto.HireDate;
            if (dto.DateOfBirth is not null) user.DateOfBirth = dto.DateOfBirth;
            if (dto.GraduationDate is not null) user.GraduationDate = dto.GraduationDate;
            if (dto.ResidenceExpiryDate is not null) user.ResidenceExpiryDate = dto.ResidenceExpiryDate;
            if (dto.EndOfServiceDate is not null) user.EndOfServiceDate = dto.EndOfServiceDate;

            if (dto.Salary is not null) user.Salary = dto.Salary;
            if (dto.AnnualLeaveBalance is int balance) user.AnnualLeaveBalance = balance;
            if (dto.ExperienceYears is not null) user.ExperienceYears = dto.ExperienceYears;
            if (dto.Certifications is not null) user.Certifications = dto.Certifications;
            if (dto.Bio is not null) user.Bio = dto.Bio;
            if (dto.IsActiveEmployee is bool active) user.IsActiveEmployee = active;

            await _identity.SaveChangesAsync();
            return (await GetProfileAsync(userId), null);
        }

        // ─────────────────── المستندات ───────────────────

        public async Task<List<EmployeeDocumentDto>> GetDocumentsAsync(string userId)
        {
            var docs = await _identity.EmployeeDocuments.AsNoTracking()
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.UploadedAt)
                .ToListAsync();

            var today = DateTime.UtcNow.Date;

            return docs.Select(d => new EmployeeDocumentDto
            {
                Id = d.Id,
                Kind = d.Kind,
                FileName = d.FileName,
                ContentType = d.ContentType,
                SizeBytes = d.SizeBytes,
                ExpiresAt = d.ExpiresAt,
                Note = d.Note,
                UploadedAt = d.UploadedAt,
                UploadedByUserName = d.UploadedByUserName,
                Url = d.StoredPath,
                DaysToExpiry = d.ExpiresAt is DateTime e ? (int)(e.Date - today).TotalDays : null,
            }).ToList();
        }

        public async Task<(EmployeeDocumentDto?, string?)> AddDocumentAsync(
            string userId, string kind, string fileName, string storedPath,
            string? contentType, long sizeBytes, DateTime? expiresAt, string? note,
            string uploadedByUserId, string? uploadedByUserName)
        {
            if (!await _identity.Users.AnyAsync(u => u.Id == userId))
                return (null, "الموظف غير موجود.");

            var entity = new EmployeeDocument
            {
                UserId = userId,
                Kind = string.IsNullOrWhiteSpace(kind) ? EmployeeDocumentKinds.Other : kind.Trim(),
                FileName = fileName,
                StoredPath = storedPath,
                ContentType = contentType,
                SizeBytes = sizeBytes,
                ExpiresAt = expiresAt,
                Note = note,
                UploadedByUserId = uploadedByUserId,
                UploadedByUserName = uploadedByUserName,
            };

            _identity.EmployeeDocuments.Add(entity);
            await _identity.SaveChangesAsync();

            return ((await GetDocumentsAsync(userId)).First(d => d.Id == entity.Id), null);
        }

        public async Task<(bool, string?)> DeleteDocumentAsync(int documentId)
        {
            var entity = await _identity.EmployeeDocuments.FirstOrDefaultAsync(d => d.Id == documentId);
            if (entity is null) return (false, null);

            var path = entity.StoredPath;
            _identity.EmployeeDocuments.Remove(entity);
            await _identity.SaveChangesAsync();

            // المسار يعود للمتحكّم ليحذف الملف من القرص بعد نجاح حذف السجل.
            return (true, path);
        }

        // ─────────────────── الإجازات وتقويم الفريق ───────────────────

        public async Task<List<EmployeeLeaveDto>> GetLeavesAsync(
            string? userId, DateTime? from, DateTime? to)
        {
            var query = _db.LeaveRequests.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(userId))
                query = query.Where(l => l.EmployeeId == userId);

            // تقاطع مع المدى لا احتواء: إجازة بدأت قبل المدى وتمتدّ إليه تخصّه.
            if (from is DateTime f) query = query.Where(l => l.To >= f);
            if (to is DateTime t) query = query.Where(l => l.From <= t);

            return await query
                .OrderByDescending(l => l.From)
                .Select(l => new EmployeeLeaveDto
                {
                    Id = l.Id,
                    EmployeeId = l.EmployeeId,
                    EmployeeName = l.EmployeeName,
                    NumberOfDays = l.NumberOfDays,
                    Reason = l.Reason,
                    Status = l.Status,
                    From = l.From,
                    To = l.To,
                    RequestDate = l.RequestDate,
                    File = l.File,
                })
                .ToListAsync();
        }

        public async Task<List<TeamCalendarDayDto>> GetTeamCalendarAsync(
            DateTime from, DateTime to, int? branchId)
        {
            if (to < from) (from, to) = (to, from);

            // حدّ معقول: تقويم أطول من سنة يُبنى في الذاكرة بلا داعٍ.
            if ((to - from).TotalDays > 366) to = from.AddDays(366);

            var leaves = await GetLeavesAsync(null, from, to);
            if (leaves.Count == 0) return BuildEmptyDays(from, to);

            var ids = leaves.Select(l => l.EmployeeId).Where(x => x != null).Distinct().ToList();

            var staff = await _identity.Users.AsNoTracking()
                .Where(u => ids.Contains(u.Id))
                .Select(u => new { u.Id, u.DisplayName, u.UserName, u.JobTitle, u.BranchId })
                .ToListAsync();

            var byId = staff.ToDictionary(u => u.Id);

            var days = new List<TeamCalendarDayDto>();

            for (var day = from.Date; day <= to.Date; day = day.AddDays(1))
            {
                var entry = new TeamCalendarDayDto { Date = day };

                foreach (var leave in leaves)
                {
                    // طلب بلا تاريخين لا موضع له في التقويم.
                    if (leave.From is not DateTime start || leave.To is not DateTime end) continue;
                    if (start.Date > day || end.Date < day) continue;

                    byId.TryGetValue(leave.EmployeeId ?? "", out var person);
                    if (branchId is int b && person is not null && person.BranchId != b) continue;

                    entry.Entries.Add(new TeamCalendarEntryDto
                    {
                        EmployeeId = leave.EmployeeId ?? "",
                        EmployeeName = person?.DisplayName ?? person?.UserName ?? leave.EmployeeName,
                        JobTitle = person?.JobTitle,
                        Status = leave.Status,
                        Reason = leave.Reason,
                        From = leave.From,
                        To = leave.To,
                        IsStart = start.Date == day,
                    });
                }

                days.Add(entry);
            }

            return days;
        }

        // ─────────────────── الاستيراد ───────────────────

        public async Task<EmployeeImportResultDto> ImportAsync(
            EmployeeImportRequestDto request, string adminUserId)
        {
            var result = new EmployeeImportResultDto
            {
                DryRun = request.DryRun,
                TotalRows = request.Rows.Count,
            };

            var existing = await _identity.Users
                .Select(u => new { u.Id, u.UserName, u.NationalId })
                .ToListAsync();

            var byUserName = existing
                .Where(u => u.UserName != null)
                .ToDictionary(u => u.UserName!, u => u.Id, StringComparer.OrdinalIgnoreCase);

            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var pending = new List<(EmployeeImportRowDto Row, EmployeeImportRowResultDto Result, string? ExistingId)>();

            foreach (var row in request.Rows)
            {
                var rowResult = new EmployeeImportRowResultDto
                {
                    RowNumber = row.RowNumber,
                    UserName = row.UserName?.Trim(),
                    Status = "Valid",
                };

                var userName = row.UserName?.Trim();

                if (string.IsNullOrWhiteSpace(userName))
                    rowResult.Errors.Add("اسم المستخدم مطلوب.");

                if (string.IsNullOrWhiteSpace(row.DisplayName))
                    rowResult.Errors.Add("اسم الموظف مطلوب.");

                if (!string.IsNullOrWhiteSpace(userName) && !seen.Add(userName))
                    rowResult.Errors.Add("اسم المستخدم مكرّر داخل الملف.");

                if (rowResult.Errors.Count > 0)
                {
                    rowResult.Status = "Error";
                    result.ErrorRows++;
                    result.Rows.Add(rowResult);
                    continue;
                }

                byUserName.TryGetValue(userName!, out var existingId);

                if (existingId is not null && !request.UpdateExisting)
                {
                    rowResult.Status = "Error";
                    rowResult.Errors.Add("الموظف موجود، ولم يُطلب تحديث القائم.");
                    result.ErrorRows++;
                    result.Rows.Add(rowResult);
                    continue;
                }

                rowResult.Status = existingId is null ? "Valid" : "Update";
                if (existingId is null) result.NewRows++; else result.UpdateRows++;

                result.Rows.Add(rowResult);
                pending.Add((row, rowResult, existingId));
            }

            if (request.DryRun || pending.Count == 0) return result;

            foreach (var item in pending)
            {
                // الاستيراد يحدّث القائم فقط. إنشاء حساب جديد يحتاج كلمة مرور
                // ودوراً، وهما لا يُدخَلان في ملف، فيُنشأ الحساب من شاشة
                // الحسابات ثم تُستورد بياناته.
                if (item.ExistingId is null)
                {
                    item.Result.Status = "Error";
                    item.Result.Errors.Add("لا حساب بهذا الاسم — أنشئ الحساب أولاً ثم استورد بياناته.");
                    result.ErrorRows++;
                    result.NewRows--;
                    continue;
                }

                var user = await _identity.Users.FirstAsync(u => u.Id == item.ExistingId);

                if (!string.IsNullOrWhiteSpace(item.Row.DisplayName)) user.DisplayName = item.Row.DisplayName!.Trim();
                if (!string.IsNullOrWhiteSpace(item.Row.Email)) user.Email = item.Row.Email!.Trim();
                if (!string.IsNullOrWhiteSpace(item.Row.PhoneNumber)) user.PhoneNumber = item.Row.PhoneNumber!.Trim();
                if (!string.IsNullOrWhiteSpace(item.Row.NationalId)) user.NationalId = item.Row.NationalId!.Trim();
                if (!string.IsNullOrWhiteSpace(item.Row.JobTitle)) user.JobTitle = item.Row.JobTitle!.Trim();
                if (!string.IsNullOrWhiteSpace(item.Row.Specialization)) user.Specialization = item.Row.Specialization!.Trim();
                if (!string.IsNullOrWhiteSpace(item.Row.City)) user.City = item.Row.City!.Trim();
                if (!string.IsNullOrWhiteSpace(item.Row.EmployeeNumber)) user.EmployeeNumber = item.Row.EmployeeNumber!.Trim();

                if (DateTime.TryParse(item.Row.HireDate, out var hire)) user.HireDate = hire;
                if (decimal.TryParse(item.Row.Salary, out var salary)) user.Salary = salary;

                item.Result.Status = "Updated";
                result.Written++;
            }

            if (result.Written > 0) await _identity.SaveChangesAsync();
            return result;
        }

        // ─────────────────── مساعدات ───────────────────

        private static List<TeamCalendarDayDto> BuildEmptyDays(DateTime from, DateTime to)
        {
            var days = new List<TeamCalendarDayDto>();
            for (var day = from.Date; day <= to.Date; day = day.AddDays(1))
                days.Add(new TeamCalendarDayDto { Date = day });
            return days;
        }

        /// <summary>
        /// يبني صفوف القائمة: الفروع والمكاتب والإجازات والمستندات تُقرأ دفعةً
        /// واحدة، لا استعلاماً لكل موظف.
        /// </summary>
        private async Task<List<EmployeeListItemDto>> BuildListAsync(List<AppUser> users)
        {
            if (users.Count == 0) return new List<EmployeeListItemDto>();

            var ids = users.Select(u => u.Id).ToList();

            var branches = await _db.Branchs.AsNoTracking()
                .Select(b => new { b.Id, b.Name }).ToListAsync();
            var offices = await _db.Offices.AsNoTracking()
                .Select(o => new { o.Id, o.Name }).ToListAsync();

            var branchById = branches.ToDictionary(b => b.Id, b => b.Name);
            var officeById = offices.ToDictionary(o => o.Id, o => o.Name);

            var docCounts = (await _identity.EmployeeDocuments.AsNoTracking()
                    .Where(d => ids.Contains(d.UserId))
                    .GroupBy(d => d.UserId)
                    .Select(g => new { g.Key, Count = g.Count() })
                    .ToListAsync())
                .ToDictionary(x => x.Key, x => x.Count);

            // الإجازات المعتمدة هذه السنة: المستهلك من الرصيد.
            var yearStart = new DateTime(DateTime.UtcNow.Year, 1, 1);

            var taken = (await _db.LeaveRequests.AsNoTracking()
                    .Where(l => ids.Contains(l.EmployeeId) && l.From >= yearStart)
                    .Select(l => new { l.EmployeeId, l.NumberOfDays, l.Status })
                    .ToListAsync())
                .Where(l => l.Status != null && l.Status.Contains("مرفوض") == false)
                .GroupBy(l => l.EmployeeId)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.NumberOfDays));

            var today = DateTime.UtcNow.Date;
            var result = new List<EmployeeListItemDto>();

            foreach (var user in users)
            {
                var roles = await _users.GetRolesAsync(user);
                var used = taken.TryGetValue(user.Id, out var t) ? t : 0;

                result.Add(new EmployeeListItemDto
                {
                    Id = user.Id,
                    EmployeeNumber = user.EmployeeNumber,
                    DisplayName = user.DisplayName,
                    UserName = user.UserName ?? "",
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    JobTitle = user.JobTitle,
                    Specialization = user.Specialization,
                    UserType = user.UserType,
                    Role = roles.FirstOrDefault(),
                    BranchId = user.BranchId,
                    BranchName = branchById.TryGetValue(user.BranchId, out var bn) ? bn : null,
                    OfficeId = user.OfficeId,
                    OfficeName = user.OfficeId is int oid && officeById.TryGetValue(oid, out var on) ? on : null,
                    HireDate = user.HireDate,
                    IsActiveEmployee = user.IsActiveEmployee,
                    NationalId = user.NationalId,
                    City = user.City,
                    AnnualLeaveBalance = user.AnnualLeaveBalance,
                    LeaveDaysTaken = used,
                    LeaveDaysRemaining = Math.Max(0, user.AnnualLeaveBalance - used),
                    DocumentsCount = docCounts.TryGetValue(user.Id, out var dc) ? dc : 0,
                    ResidenceExpiryDate = user.ResidenceExpiryDate,
                    DaysToResidenceExpiry = user.ResidenceExpiryDate is DateTime r
                        ? (int)(r.Date - today).TotalDays
                        : null,
                    UserImage = user.UserImage,
                });
            }

            return result;
        }
    }
}
