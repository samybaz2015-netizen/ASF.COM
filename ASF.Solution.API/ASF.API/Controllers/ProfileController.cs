using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Helpers;
using ASF.Core.Entities.Identity;
using ASF.Repository.Identity;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    /// <summary>
    /// الملف الشخصي للمهندس: تحديث وعرض بيانات الموظف.
    /// يستخدم نفس الـ Route القديم (api/Account) للتوافق مع الفرونت إند.
    /// </summary>
    [Route("api/Account")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly AppIdentityDbContext _appContext;

        public ProfileController(
            UserManager<AppUser> userManager,
            AppIdentityDbContext appContext)
        {
            _userManager = userManager;
            _appContext = appContext;
        }

        [HttpPut("update-engineer-profile")]
        public async Task<IActionResult> UpdateEngineerProfile([FromForm] EngineerProfileDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<string>(400, "البيانات المدخلة غير صالحة."));
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized(new ApiResponse<string>(401, "المستخدم غير مصرح له."));
            }

            var user = await _userManager.Users.FirstOrDefaultAsync(d => d.Id == userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<string>(404, "المستخدم غير موجود."));
            }

            // الكتابة على الحساب مباشرةً.
            //
            // كانت تُكتب في EngineerProfiles بينما القراءة (get-engineer-profile)
            // تقرأ من الحساب — فالتعديل يُحفظ في جدول لا يقرأه أحد ولا يظهر أثره.
            var engineerProfile = user;

            // تحديث اسم المستخدم إذا لم يكن فارغًا
            if (!string.IsNullOrWhiteSpace(model.FullName))
            {
                user.UserName = model.FullName;
            }

            var userUpdateResult = await _userManager.UpdateAsync(user);
            if (!userUpdateResult.Succeeded)
            {
                return BadRequest(new ApiResponse<string>(400, "فشل تحديث اسم المستخدم."));
            }

            // تحديث بيانات المهندس فقط إذا لم تكن فارغة
            engineerProfile.DisplayName = string.IsNullOrWhiteSpace(model.FullName) ? engineerProfile.DisplayName : model.FullName;
            engineerProfile.HireDate = model.HireDate ?? engineerProfile.HireDate;  // `null` تترك القيمة القديمة
            engineerProfile.JobTitle = string.IsNullOrWhiteSpace(model.JobTitle) ? engineerProfile.JobTitle : model.JobTitle;
            engineerProfile.DateOfBirth = model.DateOfBirth ?? engineerProfile.DateOfBirth;
            engineerProfile.Specialization = string.IsNullOrWhiteSpace(model.Specialization) ? engineerProfile.Specialization : model.Specialization;
            engineerProfile.ExperienceYears = string.IsNullOrWhiteSpace(model.ExperienceYears) ? engineerProfile.ExperienceYears : model.ExperienceYears;
            engineerProfile.Bio = string.IsNullOrWhiteSpace(model.Bio) ? engineerProfile.Bio : model.Bio;
            engineerProfile.ResidenceExpiryDate = model.ResidenceExpiryDate ?? engineerProfile.ResidenceExpiryDate;


            string baseUrl = $"{Request.Scheme}://{Request.Host}/uploads/engineers/{userId}/";
            List<string> fileUrls = new List<string>();

            if (model.Files1 != null && model.Files1.Length > 0)
            {
                var uploadsFolder = Path.Combine("wwwroot", "uploads", "engineers", userId);
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var fileExtension = Path.GetExtension(model.Files1.FileName); // استخراج الامتداد الأصلي
                var fileName = "file1" + fileExtension; // تحديد اسم الملف
                var filePath = Path.Combine(uploadsFolder, fileName);

                // حذف أي ملف سابق بنفس الاسم قبل الحفظ
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                // حفظ الملف الجديد
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await model.Files1.CopyToAsync(stream);
                }

                // تحديث المسار في قاعدة البيانات
                engineerProfile.Files1 = $"{baseUrl}{fileName}"; // حفظ المسار فقط
            }
            if (model.Certifications != null && model.Certifications.Length > 0)
            {
                var uploadsFolder = Path.Combine("wwwroot", "uploads", "engineers", userId);
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var fileExtension = Path.GetExtension(model.Certifications.FileName); // استخراج الامتداد الأصلي
                var fileName = "Certifications" + fileExtension; // تحديد اسم الملف
                var filePath = Path.Combine(uploadsFolder, fileName);

                // حذف أي ملف سابق بنفس الاسم قبل الحفظ
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                // حفظ الملف الجديد
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await model.Certifications.CopyToAsync(stream);
                }

                // تحديث المسار في قاعدة البيانات
                engineerProfile.Certifications = $"{baseUrl}{fileName}"; // حفظ المسار فقط
            }


            await _userManager.UpdateAsync(engineerProfile);

            return Ok(new ApiResponse<string>(200, "تم تحديث البيانات بنجاح."));
        }

        [HttpGet("get-engineer-profile")]
        public async Task<IActionResult> GetEngineerProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("المستخدم غير مصرح له.");
            }

            var engineerProfile = await _appContext.Users
                .Where(e => e.Id == userId)
                .FirstOrDefaultAsync();

            if (engineerProfile == null)
            {
                return NotFound("ملف المهندس غير موجود.");
            }

            return Ok(new { statusCode = 200, message = "data", data = engineerProfile }); // إرجاع الكائن مباشرة بدون `ApiResponse<T>`
        }
    }
}
