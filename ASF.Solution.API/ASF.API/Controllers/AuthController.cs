using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using ASF.Core.Dtos;
using ASF.Core.Dtos.Identity;
using ASF.Core.Entities.Identity;
using ASF.Core.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    /// <summary>
    /// عمليات المصادقة: تسجيل دخول، تجديد التوكن، تسجيل خروج، نسيان كلمة المرور.
    /// يستخدم نفس الـ Route القديم (api/Account) للتوافق مع الفرونت إند.
    /// </summary>
    [Route("api/Account")]
    [ApiController]
    [Authorize]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly IBranchService _branchService;
        private readonly IMemoryCache _cache;
        private readonly ASF.Core.Services.IEmailSender _emailSender;
        private readonly IPermissionService _permissionService;
        private readonly IConfiguration _configuration;

        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService,
            IBranchService branchService,
            IMemoryCache cache,
            ASF.Core.Services.IEmailSender emailSender,
            IPermissionService permissionService,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _branchService = branchService;
            _cache = cache;
            _emailSender = emailSender;
            _permissionService = permissionService;
            _configuration = configuration;
        }

        /// <summary>
        /// تسجيل الدخول.
        ///
        /// البيانات في جسم الطلب لا في الرابط: كلمة المرور في سلسلة الاستعلام
        /// تُسجَّل في سجلّات الخادم وسجلّ المتصفّح وأيّ وسيط بينهما.
        /// </summary>
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByNameAsync(model.UserName);
            if (user == null)
                return Unauthorized(new { Message = "اسم المستخدم أو كلمة المرور غير صحيحة" });

            // فحص قفل الحساب بعد محاولات فاشلة متكررة
            if (await _userManager.IsLockedOutAsync(user))
                return Unauthorized(new { Message = "تم قفل الحساب مؤقتاً بسبب محاولات دخول فاشلة. حاول بعد 15 دقيقة." });

            if (user.EmailConfirmed == false)
                return Unauthorized(new { Message = "تم تجميد الحساب" });

            // التحقّق من بصمة Identity لا من نسخة نصّية مخزَّنة.
            if (!await _userManager.CheckPasswordAsync(user, model.Password))
            {
                await _userManager.AccessFailedAsync(user); // تسجيل المحاولة الفاشلة
                return Unauthorized(new { Message = "اسم المستخدم أو كلمة المرور غير صحيحة" });
            }

            // كلمة المرور صحيحة — صفّر عدّاد المحاولات الفاشلة
            await _userManager.ResetAccessFailedCountAsync(user);

            var role = (await _userManager.GetRolesAsync(user)).FirstOrDefault();

            ASF.Core.Dtos.BranchsDTO branch = null;
            if (user.BranchId > 0)
            {
                branch = await _branchService.GetByIdAsync(user.BranchId);
                if (branch == null)
                    return NotFound(new { Message = $"الفرع بقيمة ID = {user.BranchId} غير موجود." });
            }

            // ✅ جلب صلاحيات اليوزر
            List<string> permissions = new();
            var isAdmin = role?.ToLower() == "admin";
            if (!isAdmin)
            {
                permissions = await _permissionService.GetUserPermissionsAsync(user.Id)
                                  .ContinueWith(t => t.Result.Permissions);
            }

            // ─── Refresh Token ───
            var refreshToken = _tokenService.GenerateRefreshToken();
            var refreshDays = double.Parse(
                _configuration["JWT:RefreshTokenLifeTimeInDays"] ?? "7");
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshDays);
            await _userManager.UpdateAsync(user);

            var userDto = new UserDto()
            {
                Id = user.Id,
                Phone = user.PhoneNumber,
                UserName = user.UserName,
                BranchId = user.BranchId,
                BranchName = branch?.Name,
                DisplayName = user.DisplayName,
                UserType = user.UserType,
                Email = user.Email,
                Token = await _tokenService.CreateTokenAsync(user, _userManager),
                RefreshToken = refreshToken,
                RefreshTokenExpiry = user.RefreshTokenExpiryTime,
                UserImage = user.UserImage!,
                Role = role,
                UserCanCreateProjectOutsideCityType = user.CanCreateProjectOutsideCity,
                OfficeId = user.OfficeId,
                EmailConfirmed = user.EmailConfirmed,
                Permissions = permissions   // ✅ الصلاحيات
            };

            return Ok(userDto);
        }

        /// <summary>
        /// تجديد Access Token باستخدام Refresh Token.
        /// لا يحتاج تسجيل دخول جديد — الـ Frontend يرسل التوكن المنتهي مع الـ Refresh Token.
        /// </summary>
        [AllowAnonymous]
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RefreshToken) || string.IsNullOrWhiteSpace(dto.UserId))
                return BadRequest(new { message = "بيانات التجديد ناقصة." });

            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null)
                return Unauthorized(new { message = "المستخدم غير موجود." });

            if (user.RefreshToken != dto.RefreshToken ||
                user.RefreshTokenExpiryTime == null ||
                user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return Unauthorized(new { message = "رمز التحديث غير صالح أو منتهي الصلاحية. سجّل دخولك مجدداً." });
            }

            if (user.EmailConfirmed == false)
                return Unauthorized(new { message = "تم تجميد الحساب." });

            // ─── توليد Access Token جديد + تدوير Refresh Token ───
            var newAccessToken = await _tokenService.CreateTokenAsync(user, _userManager);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            var refreshDays = double.Parse(
                _configuration["JWT:RefreshTokenLifeTimeInDays"] ?? "7");
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshDays);
            await _userManager.UpdateAsync(user);

            return Ok(new
            {
                token = newAccessToken,
                refreshToken = newRefreshToken,
                refreshTokenExpiry = user.RefreshTokenExpiryTime
            });
        }

        /// <summary>
        /// تسجيل الخروج — يُبطل Refresh Token فوراً.
        /// </summary>
        [HttpPost("revoke-token")]
        public async Task<IActionResult> RevokeToken()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound();

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _userManager.UpdateAsync(user);

            return Ok(new { message = "تم تسجيل الخروج بنجاح." });
        }

        [AllowAnonymous]
        [HttpPost("forgetPassword")]
        public async Task<IActionResult> ForgetPassword([FromForm][EmailAddress] string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest(new { statusCode = 400, message = "البريد الإلكتروني مطلوب." });

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return BadRequest(new { statusCode = 400, message = "البريد الإلكتروني غير موجود." });

            var otp = new Random().Next(100000, 999999).ToString();

            // خزّن الـ OTP في الكاش (مؤقت لمدة 10 دقائق)
            _cache.Set(email, otp, TimeSpan.FromMinutes(10));

            // إعداد الرسالة
            var subject = "رمز إعادة تعيين كلمة المرور";
            var body = $"رمز إعادة التعيين الخاص بك هو: {otp}";

            await _emailSender.SendEmailAsync(email, subject, body);

            return Ok(new { statusCode = 200, message = "تم إرسال رمز التحقق إلى بريدك الإلكتروني." });
        }

        [AllowAnonymous]
        [HttpPost("verifyOtp")]
        public IActionResult VerifyOtp([FromForm] string email, [FromForm] string otp)
        {
            if (!_cache.TryGetValue(email, out string cachedOtp) || cachedOtp != otp)
                return BadRequest(new { statusCode = 400, message = "رمز التحقق غير صحيح أو منتهي." });

            // خزّن علامة أنه تم التحقق بنجاح (تحفظ في الكاش لفترة قصيرة)
            _cache.Set($"verified_{email}", true, TimeSpan.FromMinutes(10));

            return Ok(new { statusCode = 200, message = "تم التحقق من الرمز بنجاح." });
        }

        [AllowAnonymous]
        [HttpPost("resetPassword")]
        public async Task<IActionResult> ResetPassword([FromForm] string email, [FromForm] string newPassword)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return BadRequest(new { statusCode = 400, message = "المستخدم غير موجود." });

            // تحقق من أنه تم التحقق من OTP
            if (!_cache.TryGetValue($"verified_{email}", out bool isVerified) || !isVerified)
                return BadRequest(new { statusCode = 400, message = "يجب التحقق من رمز OTP أولًا." });

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

            if (result.Succeeded)
                return Ok(new { statusCode = 200, message = "تم إعادة تعيين كلمة المرور بنجاح." });

            return BadRequest(new { statusCode = 500, message = "حدث خطأ أثناء إعادة تعيين كلمة المرور." });
        }
    }
}
