using ASF.Api.Attributes;
using ASF.Core.DTOs.Employees;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    /// <summary>
    /// قسم الموظفين: السجلّ والملف والمستندات والإجازات وتقويم الفريق.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeeHubController : ControllerBase
    {
        private readonly IEmployeeHubService _service;
        private readonly IWebHostEnvironment _environment;

        /// <summary>مجلّد مستندات الموظفين تحت wwwroot.</summary>
        private const string DocumentsFolder = "EmployeeDocuments";

        /// <summary>
        /// حدّ حجم المرفق. بلا حدّ يمكن ملء قرص الخادم بملف واحد.
        /// </summary>
        private const long MaxFileBytes = 20 * 1024 * 1024;

        /// <summary>
        /// الامتدادات المقبولة. رفع ملف تنفيذي إلى مجلّد يُخدَم عبر الويب
        /// ثغرة، فتُقصر على المستندات والصور.
        /// </summary>
        private static readonly string[] AllowedExtensions =
        {
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".webp"
        };

        public EmployeeHubController(IEmployeeHubService service, IWebHostEnvironment environment)
        {
            _service = service;
            _environment = environment;
        }

        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        private string? UserName =>
            User.FindFirstValue(ClaimTypes.GivenName)
            ?? User.Identity?.Name
            ?? User.FindFirstValue(ClaimTypes.Email);

        // ─────────── السجلّ والملف ───────────

        [HttpGet]
        [HasPermission(Permissions.Employees.View)]
        public async Task<IActionResult> GetEmployees(
            [FromQuery] string? search,
            [FromQuery] int? branchId,
            [FromQuery] bool includeInactive = false)
            => Ok(await _service.GetEmployeesAsync(search, branchId, includeInactive));

        [HttpGet("{userId}")]
        [HasPermission(Permissions.Employees.View)]
        public async Task<IActionResult> GetProfile(string userId)
        {
            var profile = await _service.GetProfileAsync(userId);
            return profile is null ? NotFound(new { message = "الموظف غير موجود." }) : Ok(profile);
        }

        [HttpPut("{userId}")]
        [HasPermission(Permissions.Employees.Update)]
        public async Task<IActionResult> UpdateProfile(string userId, [FromBody] EmployeeUpsertDto dto)
        {
            var (profile, error) = await _service.UpdateProfileAsync(userId, dto);
            return error is null ? Ok(profile) : BadRequest(new { message = error });
        }

        // ─────────── المستندات ───────────

        [HttpGet("{userId}/documents")]
        [HasPermission(Permissions.Employees.View)]
        public async Task<IActionResult> GetDocuments(string userId)
            => Ok(await _service.GetDocumentsAsync(userId));

        [HttpPost("{userId}/documents")]
        [HasPermission(Permissions.Employees.Update)]
        [RequestSizeLimit(MaxFileBytes + 1024)]
        public async Task<IActionResult> UploadDocument(
            string userId,
            [FromForm] EmployeeDocumentUploadDto request)
        {
            var file = request?.File;
            var kind = request?.Kind;
            var expiresAt = request?.ExpiresAt;
            var note = request?.Note;

            if (file is null || file.Length == 0)
                return BadRequest(new { message = "لم يُرفَع ملف." });

            if (file.Length > MaxFileBytes)
                return BadRequest(new { message = "حجم الملف يتجاوز ٢٠ ميغابايت." });

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                return BadRequest(new { message = $"الامتداد {extension} غير مسموح." });

            var root = _environment.WebRootPath
                ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            var folder = Path.Combine(root, DocumentsFolder, userId);
            Directory.CreateDirectory(folder);

            // اسم مخزَّن عشوائي: اسم الملف الأصلي قد يحمل مساراً أو يصطدم بغيره.
            var storedName = $"{Guid.NewGuid():N}{extension}";
            var fullPath = Path.Combine(folder, storedName);

            await using (var stream = System.IO.File.Create(fullPath))
            {
                await file.CopyToAsync(stream);
            }

            var relative = $"/{DocumentsFolder}/{userId}/{storedName}";

            var (document, error) = await _service.AddDocumentAsync(
                userId, kind ?? EmployeeDocumentKinds.Other, file.FileName, relative,
                file.ContentType, file.Length, expiresAt, note, UserId, UserName);

            if (error is not null)
            {
                // فشل تسجيل المستند يترك ملفاً يتيماً على القرص، فيُحذف.
                System.IO.File.Delete(fullPath);
                return BadRequest(new { message = error });
            }

            return Ok(document);
        }

        [HttpDelete("documents/{documentId:int}")]
        [HasPermission(Permissions.Employees.Update)]
        public async Task<IActionResult> DeleteDocument(int documentId)
        {
            var (ok, storedPath) = await _service.DeleteDocumentAsync(documentId);
            if (!ok) return NotFound(new { message = "المستند غير موجود." });

            if (!string.IsNullOrWhiteSpace(storedPath))
            {
                var root = _environment.WebRootPath
                    ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

                var fullPath = Path.Combine(root, storedPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
            }

            return NoContent();
        }

        // ─────────── الإجازات وتقويم الفريق ───────────

        [HttpGet("leaves")]
        [HasPermission(Permissions.LeaveRequest.View)]
        public async Task<IActionResult> GetLeaves(
            [FromQuery] string? userId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
            => Ok(await _service.GetLeavesAsync(userId, from, to));

        /// <summary>تقويم الفريق — يُبنى من الإجازات، فلا تقويم ثانٍ يتأخّر عن الواقع.</summary>
        [HttpGet("calendar")]
        [HasPermission(Permissions.LeaveRequest.View)]
        public async Task<IActionResult> GetCalendar(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int? branchId)
        {
            var start = from ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var end = to ?? start.AddMonths(1).AddDays(-1);
            return Ok(await _service.GetTeamCalendarAsync(start, end, branchId));
        }

        // ─────────── الاستيراد ───────────

        /// <summary>
        /// استيراد بيانات الموظفين. يتحقّق بلا كتابة ما لم يُرسَل dryRun = false.
        /// </summary>
        [HttpPost("import")]
        [HasPermission(Permissions.Employees.Update)]
        public async Task<IActionResult> Import([FromBody] EmployeeImportRequestDto request)
            => Ok(await _service.ImportAsync(request ?? new EmployeeImportRequestDto(), UserId));
    }
}
