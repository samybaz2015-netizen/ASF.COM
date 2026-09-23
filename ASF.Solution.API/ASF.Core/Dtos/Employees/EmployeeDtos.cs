using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace ASF.Core.DTOs.Employees
{
    /// <summary>
    /// صف الموظف في القائمة.
    ///
    /// الموظف هو الحساب نفسه — لا سجلّ موازٍ. الإجازات والحضور والصلاحيات كلها
    /// تشير إلى الحساب، فبقاء بياناته في جدول ثانٍ مصدرُ تضارب.
    /// </summary>
    public class EmployeeListItemDto
    {
        public string Id { get; set; }
        public string? EmployeeNumber { get; set; }
        public string? DisplayName { get; set; }
        public string UserName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? JobTitle { get; set; }
        public string? Specialization { get; set; }
        public string? UserType { get; set; }
        public string? Role { get; set; }

        public int BranchId { get; set; }
        public string? BranchName { get; set; }
        public int? OfficeId { get; set; }
        public string? OfficeName { get; set; }

        public DateTime? HireDate { get; set; }
        public bool IsActiveEmployee { get; set; }

        public string? NationalId { get; set; }
        public string? City { get; set; }

        /// <summary>رصيد الإجازة السنوية وما استُهلك منه.</summary>
        public int AnnualLeaveBalance { get; set; }
        public int LeaveDaysTaken { get; set; }
        public int LeaveDaysRemaining { get; set; }

        public int DocumentsCount { get; set; }

        /// <summary>انتهاء الإقامة — للتنبيه قبل انقضائها.</summary>
        public DateTime? ResidenceExpiryDate { get; set; }
        public int? DaysToResidenceExpiry { get; set; }

        public string? UserImage { get; set; }
    }

    /// <summary>ملف الموظف الكامل.</summary>
    public class EmployeeProfileDto : EmployeeListItemDto
    {
        public DateTime? DateOfBirth { get; set; }
        public DateTime? GraduationDate { get; set; }
        public DateTime? EndOfServiceDate { get; set; }
        public string? Profession { get; set; }
        public decimal? Salary { get; set; }
        public string? ExperienceYears { get; set; }
        public string? Certifications { get; set; }
        public string? Bio { get; set; }
        public bool CanCreateProjectOutsideCity { get; set; }

        public List<EmployeeDocumentDto> Documents { get; set; } = new();
        public List<EmployeeLeaveDto> Leaves { get; set; } = new();
    }

    /// <summary>
    /// تعديل بيانات الموظف. لا يشمل كلمة المرور ولا الدور: لكلٍّ مساره الخاص.
    /// </summary>
    public class EmployeeUpsertDto
    {
        [MaxLength(256)]
        public string? DisplayName { get; set; }

        [MaxLength(64)]
        public string? EmployeeNumber { get; set; }

        [MaxLength(64)]
        public string? NationalId { get; set; }

        [MaxLength(128)]
        public string? JobTitle { get; set; }

        [MaxLength(128)]
        public string? Specialization { get; set; }

        [MaxLength(128)]
        public string? Profession { get; set; }

        [MaxLength(128)]
        public string? City { get; set; }

        [MaxLength(32)]
        public string? PhoneNumber { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        public int? BranchId { get; set; }
        public int? OfficeId { get; set; }

        public DateTime? HireDate { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? GraduationDate { get; set; }
        public DateTime? ResidenceExpiryDate { get; set; }
        public DateTime? EndOfServiceDate { get; set; }

        public decimal? Salary { get; set; }
        public int? AnnualLeaveBalance { get; set; }

        [MaxLength(64)]
        public string? ExperienceYears { get; set; }

        [MaxLength(1000)]
        public string? Certifications { get; set; }

        [MaxLength(2000)]
        public string? Bio { get; set; }

        public bool? IsActiveEmployee { get; set; }
    }

    /// <summary>
    /// طلب رفع مستند.
    ///
    /// الحقول مجموعة في نوع واحد لا مفردة: خلط IFormFile مع وسائط [FromForm]
    /// مفردة لا يستطيع مولّد التوثيق وصفه، فتسقط صفحة Swagger كلها.
    /// </summary>
    public class EmployeeDocumentUploadDto
    {
        public IFormFile File { get; set; }

        [MaxLength(128)]
        public string? Kind { get; set; }

        public DateTime? ExpiresAt { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }
    }

    public class EmployeeDocumentDto
    {
        public int Id { get; set; }
        public string Kind { get; set; }
        public string FileName { get; set; }
        public string? ContentType { get; set; }
        public long SizeBytes { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string? Note { get; set; }
        public DateTime UploadedAt { get; set; }
        public string? UploadedByUserName { get; set; }

        /// <summary>رابط التنزيل النسبي.</summary>
        public string Url { get; set; }

        /// <summary>أيام متبقية على انتهاء المستند، فارغة إن بلا انتهاء.</summary>
        public int? DaysToExpiry { get; set; }
    }

    public class EmployeeLeaveDto
    {
        public int Id { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeId { get; set; }
        public int NumberOfDays { get; set; }
        public string? Reason { get; set; }
        public string? Status { get; set; }
        /// <summary>تاريخا الإجازة قد يكونان فارغين في طلب لم يكتمل.</summary>
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }

        public DateTime RequestDate { get; set; }
        public string? File { get; set; }
    }

    /// <summary>
    /// يوم في تقويم الفريق: من هو على إجازة فيه.
    ///
    /// يُبنى من طلبات الإجازة المعتمدة، فلا تقويم ثانٍ يُحدَّث يدوياً ويتأخّر
    /// عن الواقع.
    /// </summary>
    public class TeamCalendarDayDto
    {
        public DateTime Date { get; set; }
        public List<TeamCalendarEntryDto> Entries { get; set; } = new();
    }

    public class TeamCalendarEntryDto
    {
        public string EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? JobTitle { get; set; }
        public string? Status { get; set; }
        public string? Reason { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }

        /// <summary>أول يوم في الإجازة، لرسم الشريط دون تكراره.</summary>
        public bool IsStart { get; set; }
    }

    // ───────────── الاستيراد ─────────────

    public class EmployeeImportRowDto
    {
        public int RowNumber { get; set; }
        public string? EmployeeNumber { get; set; }
        public string? DisplayName { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? NationalId { get; set; }
        public string? JobTitle { get; set; }
        public string? Specialization { get; set; }
        public string? City { get; set; }
        public string? HireDate { get; set; }
        public string? Salary { get; set; }
    }

    public class EmployeeImportRequestDto
    {
        public List<EmployeeImportRowDto> Rows { get; set; } = new();

        /// <summary>true = تحقّق بلا كتابة. هو الافتراضي.</summary>
        public bool DryRun { get; set; } = true;

        /// <summary>يحدّث الموظف القائم بدل رفضه كمكرّر.</summary>
        public bool UpdateExisting { get; set; } = true;
    }

    public class EmployeeImportRowResultDto
    {
        public int RowNumber { get; set; }
        public string? UserName { get; set; }

        /// <summary>Valid | Update | Error | Created | Updated</summary>
        public string Status { get; set; }

        public List<string> Errors { get; set; } = new();
    }

    public class EmployeeImportResultDto
    {
        public bool DryRun { get; set; }
        public int TotalRows { get; set; }
        public int NewRows { get; set; }
        public int UpdateRows { get; set; }
        public int ErrorRows { get; set; }
        public int Written { get; set; }
        public List<EmployeeImportRowResultDto> Rows { get; set; } = new();
    }
}
