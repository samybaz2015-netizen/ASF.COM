using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Dtos.Identity;
using ASF.Core.Entities.Identity;
using ASF.Core.Helpers;
using ASF.Core.Services;
using ASF.Repository.Identity;
using ASF.Service;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace ASF.Api.Controllers
{
    /// <summary>
    /// إدارة المستخدمين: تسجيل، تعديل، حذف، أدوار، صلاحيات.
    /// تم نقل عمليات المصادقة إلى AuthController،
    /// والملف الشخصي إلى ProfileController،
    /// والإحصائيات إلى AccountStatisticsController.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ITokenService _tokenService;
        private readonly IBranchService _branchService;
        private readonly AppIdentityDbContext _appContext;
        private readonly ASF.Core.Services.IEmailSender _emailSender;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPermissionService _permissionService;
        private readonly GoogleDriveOAuthService _googleDrive;

        public AccountController(
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ITokenService tokenService,
            IBranchService branchService,
            AppIdentityDbContext appContext,
            ASF.Core.Services.IEmailSender emailSender,
            IHttpContextAccessor httpContextAccessor,
            IPermissionService permissionService,
            GoogleDriveOAuthService googleDrive)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _tokenService = tokenService;
            _branchService = branchService;
            _appContext = appContext;
            _emailSender = emailSender;
            _httpContextAccessor = httpContextAccessor;
            _permissionService = permissionService;
            _googleDrive = googleDrive;
        }

        [HttpGet("all-user")]
        public async Task<IActionResult> AllUsers()
        {
            var users = await _appContext.Users.ToListAsync();
            return Ok(users);
        }

        [HttpGet("all-user-without-admin")]
        public async Task<IActionResult> AllUsersWithoutAdmin()
        {
            var users = await _appContext.Users.AsNoTracking().Where(d => d.UserType != "admin").Select(d => new
            {
                id = d.Id,
                name = d.UserName,
                role = d.UserType,
            }).ToListAsync();
            return Ok(new { statusCode = 200, message = "all data", data = users });
        }

        [HttpPost("toggle-account-status/{userId}")]
        public async Task<IActionResult> ToggleAccountStatus(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { statusCode = 404, message = "المستخدم غير موجود" });

            user.EmailConfirmed = !user.EmailConfirmed;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(new { statusCode = 400, message = $"فشل في تحديث حالة الحساب: {errors}" });
            }

            var status = user.EmailConfirmed ? "مفعل" : "مجمد";
            return Ok(new { statusCode = 200, message = $"تم تغيير حالة الحساب إلى: {status}" });
        }

        [HttpGet("permissions")]
        public async Task<IActionResult> GetUserPermissions()
        {
            // الحصول على معرف المستخدم من التوكن
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "التوكن غير صالح أو المستخدم غير مسجل دخول." });
            }

            // البحث عن المستخدم في قاعدة البيانات
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "المستخدم غير موجود." });
            }

            return Ok(new
            {
                statusCode = 200,
                userId = user.Id,
                UserCanCreateProjectOutsideCityType = user.CanCreateProjectOutsideCity
            });
        }


        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register([FromForm] RegisterDto model)
        {
            if (string.IsNullOrWhiteSpace(model.UserType))
            {
                return BadRequest(new ApiResponse<string>(400, "يجب تحديد الدور."));
            }

            var roleExists = await _roleManager.RoleExistsAsync(model.UserType);
            if (!roleExists)
            {
                return BadRequest(new ApiResponse<string>(400, $"الدور '{model.UserType}' غير موجود."));
            }

            var existingUserByEmail = await _userManager.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (existingUserByEmail != null)
            {
                return BadRequest(new ApiResponse<string>(400, "البريد الإلكتروني موجود بالفعل. يرجى استخدام بريد إلكتروني آخر."));
            }

            model.UserName = model.UserName?.Trim();
            if (string.IsNullOrWhiteSpace(model.UserName) || !Regex.IsMatch(model.UserName, @"^[a-zA-Z0-9]+$"))
            {
                return BadRequest(new ApiResponse<string>(400, "اسم المستخدم غير صالح. يجب أن يحتوي على أحرف أو أرقام فقط."));
            }

            var existingUserByUsername = await _userManager.Users.FirstOrDefaultAsync(u => u.UserName == model.UserName);
            if (existingUserByUsername != null)
            {
                return BadRequest(new ApiResponse<string>(400, "اسم المستخدم موجود بالفعل. يرجى اختيار اسم مستخدم آخر."));
            }

            if (string.IsNullOrWhiteSpace(model.PhoneNumber))
            {
                return BadRequest(new ApiResponse<string>(400, "يجب إدخال رقم الهاتف للمستخدم."));
            }

            if (string.IsNullOrWhiteSpace(model.DisplayName))
            {
                return BadRequest(new ApiResponse<string>(400, "يجب إدخال Display Name."));
            }




            string savedImagePath = null;
            if (model.UserImage != null && model.UserImage.Length > 0)
            {
                try
                {
                    savedImagePath = await _googleDrive.UploadFileAsync(model.UserImage, "UserImages");
                }
                catch (Exception)
                {
                    return StatusCode(500, "حدث خطأ أثناء حفظ الصورة.");
                }
            }
            // تحقق من الفرع للأدوار المحددة فقط
            if (model.UserType == "eng" || model.UserType == "supervisor")
            {
                if (model.BranchId == null)
                {
                    return BadRequest(new ApiResponse<string>(400, "يجب تحديد الفرع للمستخدمين من النوع 'eng' أو 'supervisor'."));
                }

                var branch = await _branchService.GetByIdAsync(model.BranchId);
                if (branch == null)
                {
                    return BadRequest(new ApiResponse<string>(400, "الفرع المحدد غير موجود."));
                }
            }

            // Create user
            var user = new AppUser()
            {
                Email = model.Email,
                UserName = model.UserName,
                DisplayName = model.DisplayName,
                PhoneNumber = model.PhoneNumber,
                UserType = model.UserType,
                BranchId = model.BranchId ?? 0,
                UserImage = savedImagePath,
                OfficeId = model.OfficeId,
                EmailConfirmed = true,
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(new ApiResponse<string>(400, $"فشل إنشاء المستخدم: {errors}"));
            }

            // Add user to role
            var roleAddResult = await _userManager.AddToRoleAsync(user, model.UserType);
            if (!roleAddResult.Succeeded)
            {
                return BadRequest(new ApiResponse<string>(400, "فشل في إضافة دور."));
            }
            var userid = user.Id;
            // كان التسجيل ينشئ سجلّ EngineerProfile بكل حقوله فارغة — نسخة
            // مكرّرة من حقول موجودة على الحساب نفسه. أُزيل السجلّ وصار الحساب
            // هو ملف الموظف الوحيد.

            // Generate user DTO
            var userDto = new UserDto()
            {
                UserType = user.UserType,
                DisplayName = model.DisplayName,
                BranchName = model.BranchId != null ? (await _branchService.GetByIdAsync(model.BranchId))?.Name : null,
                BranchId = user.BranchId,
                OfficeId = user.OfficeId,
                Role = user.UserType,
                UserName = user.UserName,
                Email = user.Email,
                Token = await _tokenService.CreateTokenAsync(user, _userManager),
                EmailConfirmed = user.EmailConfirmed
            };
            var emailBody = $@"
                                <html>
                                  <body style='font-family: Arial; direction: rtl; text-align: right;'>
                                    <h2 style='color: #4CAF50;'>🎉 تم تسجيل حسابك بنجاح!</h2>
                                    <p><strong>🧑 اسم المستخدم:</strong> {user.UserName}</p>
                                    <p><strong>🔐 كلمة المرور:</strong> {model.Password}</p>
                                    <p style='margin-top: 20px;'>📌 يرجى عدم مشاركة هذه المعلومات مع أي شخص.</p>
                                    <p>مع تحياتنا،<br/>فريق الدعم</p>
                                  </body>
                                </html>";
            await _emailSender.SendEmailAsync(user.Email, "بيانات تسجيل الحساب", emailBody);

            return userDto;
        }

        private async Task ConfirmAllEmailsAsync()
        {
            var users = await _userManager.Users.ToListAsync();

            foreach (var user in users)
            {
                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    await _userManager.UpdateAsync(user);
                }
            }
        }

        [HttpPost("confirm-all-emails")]
        public async Task<IActionResult> ConfirmAllEmails()
        {
            await ConfirmAllEmailsAsync();
            return Ok(new { statusCode = 200, message = "تم تأكيد جميع الإيميلات بنجاح." });
        }

        [HttpGet("engineers")]
        public async Task<IActionResult> GetAllEngineers()
        {
            var engineers = await _userManager.GetUsersInRoleAsync("eng");

            if (engineers == null || !engineers.Any())
            {
                return NotFound(new { message = "لا يوجد مهندسون متاحون" });
            }

            return Ok(new { data = engineers });
        }


        [HttpPut("engineers/update-permission")]
        [HttpPut("users/update-permission")]
        public async Task<IActionResult> UpdateEngineerPermission([FromBody] UpdateEngineerPermissionDto dto)
        {
            var engineer = await _userManager.FindByIdAsync(dto.EngineerId);

            if (engineer == null)
            {
                return NotFound(new { message = "المستخدم غير موجود" });
            }

            // تحديث الخاصية
            engineer.CanCreateProjectOutsideCity = dto.CanCreateOutsideCity;

            // حفظ التعديلات
            var result = await _userManager.UpdateAsync(engineer);

            if (!result.Succeeded)
            {
                return BadRequest(new { message = "فشل تحديث صلاحية المستخدم", errors = result.Errors });
            }

            return Ok(new { message = "تم تحديث صلاحية المستخدم بنجاح", engineer });
        }


        [HttpPost("assign-role")]
        public async Task<IActionResult> AssignRoleToUserByEmail(string email, string roleName)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new ApiResponse<string>(404, "المستخدم غير موجود"));
            }

            var roleExists = await _roleManager.RoleExistsAsync(roleName);
            if (!roleExists)
            {
                return BadRequest(new ApiResponse<string>(400, "دور الذي تقوم باضافته غير موجود"));
            }

            var result = await _userManager.AddToRoleAsync(user, roleName);
            if (!result.Succeeded)
            {
                return BadRequest(new ApiResponse<string>(400, "فشل في إضافة دور"));
            }

            return Ok(new ApiResponse<string>(200, "تم إضافة دور بنجاح"));
        }

        [HttpPost("create-role")]
        public async Task<IActionResult> CreateRole([FromBody] string roleName)
        {
            var roleExists = await _roleManager.RoleExistsAsync(roleName);
            if (roleExists)
            {
                return BadRequest(new ApiResponse<string>(400, $"Role '{roleName}' already exists"));
            }


            var result = await _roleManager.CreateAsync(new IdentityRole(roleName));
            if (!result.Succeeded)
            {
                return BadRequest(new ApiResponse<string>(400, "فشل في إضافة الدور"));
            }

            return Ok(new ApiResponse<string>(200, "تم إضافة الدور بنجاح"));
        }

        [HttpGet("roles")]
        public async Task<ActionResult<List<RoleDto>>> GetRoles()
        {
            var roles = await _roleManager.Roles
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name
                })
                .ToListAsync();

            if (roles == null || !roles.Any())
            {
                return NotFound(new ApiResponse<string>(404, "لا يوجد أدوار"));
            }

            return Ok(roles);
        }

        [HttpGet("accounts")]
        public async Task<ActionResult> GetAccounts(
      [FromQuery] int page = 1,
      [FromQuery] int pageSize = 10,
      [FromQuery] string? search = null,       // فلترة بالاسم أو username
      [FromQuery] string? userType = null)     // فلترة بنوع المستخدم
        {
            var currentUser = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
            if (currentUser == null) return Unauthorized();

            var userRoles = await _userManager.GetRolesAsync(currentUser);

            // ─── تحديد الـ Query حسب الـ Role ───
            IQueryable<AppUser> query;

            if (userRoles.Contains("admin"))
            {
                query = _userManager.Users.Include(d => d.Office);
            }
            else if (userRoles.Contains("officeManager"))
            {
                query = _userManager.Users.Include(d => d.Office)
                                    .Where(u => u.OfficeId == currentUser.OfficeId);
            }
            else if (userRoles.Contains("supervisor") || userRoles.Contains("Contractor"))
            {
                query = _userManager.Users.Include(d => d.Office)
                                    .Where(u => u.BranchId == currentUser.BranchId);
            }
            else
            {
                return Forbid();
            }

            // ─── فلترة بالاسم / username ───
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(u =>
                    (u.DisplayName != null && u.DisplayName.ToLower().Contains(s)) ||
                    u.UserName.ToLower().Contains(s));
            }

            // ─── فلترة بنوع المستخدم ───
            if (!string.IsNullOrWhiteSpace(userType))
            {
                query = query.Where(u => u.UserType == userType);
            }

            // ─── Pagination ───
            var totalCount = await query.CountAsync();
            var users = await query
                .OrderBy(u => u.DisplayName ?? u.UserName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var data = await MapUsersToDtos(users);

            return Ok(new
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                Data = data
            });
        }

        private async Task<List<UserDto>> MapUsersToDtos(List<AppUser> users)
        {
            var userDtos = new List<UserDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault();

                var branch = user.BranchId > 0
                             ? await _branchService.GetByIdAsync(user.BranchId)
                             : null;

                // ✅ جلب الصلاحيات
                List<string> permissions = new();
                var isAdmin = role?.ToLower() == "admin";
                if (!isAdmin)
                {
                    var permResult = await _permissionService.GetUserPermissionsAsync(user.Id);
                    permissions = permResult.Permissions;
                }

                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    DisplayName = user.DisplayName,
                    Phone = user.PhoneNumber,
                    Email = user.Email,
                    UserImage = user.UserImage!,
                    Token = "isPrivate",
                    UserType = user.UserType,
                    BranchName = branch?.Name ?? "No Branch",
                    BranchId = user.BranchId,
                    Role = role!,
                    OfficeId = user.OfficeId,
                    AnnualLeaveBalance = user.AnnualLeaveBalance,
                    UserCanCreateProjectOutsideCityType = user.CanCreateProjectOutsideCity,
                    EmailConfirmed = user.EmailConfirmed,
                    Permissions = permissions  // ✅
                });
            }
            return userDtos;
        }

        [HttpDelete("remove-account")]
        public async Task<IActionResult> RemoveAccount([FromQuery] string userName)
        {
            var user = await _userManager.FindByNameAsync(userName);
            if (user == null)
            {
                return NotFound(new ApiResponse<string>(404, "المستخدم غير موجود"));
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(new ApiResponse<string>(400, $"فشل في حذف المستخدم: {errors}"));
            }

            return Ok(new ApiResponse<string>(200, "تم حذف المستخدم بنجاح"));
        }

        [HttpPut("update-account")]
        public async Task<IActionResult> UpdateAccount([FromForm] string email, [FromForm] UpdateAccountDto model)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new ApiResponse<string>(404, "المستخدم غير موجود"));
            }

            user.Email = model.Email ?? user.Email;
            user.UserName = model.UserName ?? user.UserName;
            user.PhoneNumber = model.PhoneNumber ?? user.PhoneNumber;
            user.BranchId = model.BranchId ?? user.BranchId;
            user.UserType = model.UserType ?? user.UserType;
            user.DisplayName = model.DisplayName ?? user.DisplayName;

            // تغيير كلمة المرور يمرّ بـ UserManager ليُحدَّث الـ Hash.
            //
            // كانت تُكتب في عمود نصّي وحده والـ Hash يبقى على كلمةٍ أقدم —
            // فيفترقان، ويعتمد الدخول على أيّهما يقرأ.
            if (!string.IsNullOrWhiteSpace(model.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var passwordResult = await _userManager.ResetPasswordAsync(user, token, model.Password);

                if (!passwordResult.Succeeded)
                {
                    var passwordErrors = string.Join(", ", passwordResult.Errors.Select(e => e.Description));
                    return BadRequest(new ApiResponse<string>(400, $"تعذّر تغيير كلمة المرور: {passwordErrors}"));
                }
            }
            user.Specialization = model.Specialization ?? user.Specialization;
            user.ExperienceYears = model.ExperienceYears ?? user.ExperienceYears;
            user.Bio = model.Bio ?? user.Bio;
            user.JobTitle = model.JobTitle ?? user.JobTitle;
            user.DateOfBirth = model.DateOfBirth ?? user.DateOfBirth;
            user.HireDate = model.HireDate ?? user.HireDate;
            user.ResidenceExpiryDate = model.ResidenceExpiryDate ?? user.ResidenceExpiryDate;
            if (model.CanCreateOutsideCity.HasValue)
            {
                user.CanCreateProjectOutsideCity = model.CanCreateOutsideCity.Value;
            }

            if (model.UserImage != null && model.UserImage.Length > 0)
            {
                try
                {
                    user.UserImage = await _googleDrive.UploadFileAsync(model.UserImage, "UserImages");
                }
                catch (Exception)
                {
                    return StatusCode(500, "حدث خطأ أثناء حفظ صورة المستخدم.");
                }
            }

            if (model.Certifications != null && model.Certifications.Length > 0)
            {
                try
                {
                    user.Certifications = await _googleDrive.UploadFileAsync(model.Certifications, "Certifications");
                }
                catch (Exception)
                {
                    return StatusCode(500, "حدث خطأ أثناء حفظ الشهادات.");
                }
            }

            if (model.Files1 != null && model.Files1.Length > 0)
            {
                try
                {
                    user.Files1 = await _googleDrive.UploadFileAsync(model.Files1, "EngineerFiles");
                }
                catch (Exception)
                {
                    return StatusCode(500, "حدث خطأ أثناء حفظ الملف.");
                }
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(new ApiResponse<string>(400, $"فشل في تحديث المستخدم: {errors}"));
            }

            return Ok(new ApiResponse<string>(200, "تم تحديث المستخدم بنجاح"));
        }

        [HttpGet("get-engineers-by-branch/{branchId}")]
        public async Task<ActionResult<object>> GetEngineersByBranch(int branchId)
        {
            // التحقق من وجود الفرع
            var branch = await _branchService.GetByIdAsync(branchId);
            if (branch == null)
            {
                return NotFound(new ApiResponse<string>(404, "الفرع غير موجود."));
            }

            // الحصول على المستخدمين في الفرع
            var usersInBranch = await _userManager.Users
                .Where(u => u.BranchId == branchId)
                .ToListAsync();

            // تصفية المهندسين فقط
            var engineers = new List<object>();
            foreach (var user in usersInBranch)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains("eng"))
                {
                    engineers.Add(new
                    {
                        UserId = user.Id,
                        UserName = user.UserName,
                        DisplayName = user.DisplayName,
                        Email = user.Email,
                        PhoneNumber = user.PhoneNumber
                    });
                }
            }

            // إعادة النتيجة
            return Ok(new
            {
                BranchName = branch.Name,
                Engineers = engineers
            });
        }



        [HttpGet("get-account-Byid")]
        public async Task<ActionResult<UserDto>> GetAccountById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new ApiResponse<string>(404, "المستخدم غير موجود"));
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault();
            var branch = await _branchService.GetByIdAsync(user.BranchId);

            var userDto = new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Phone = user.PhoneNumber,
                Email = user.Email,
                UserImage = user.UserImage!,
                Token = "isPrivate",
                UserType = user.UserType,
                BranchId = user.BranchId,
                BranchName = branch.Name,
                EmailConfirmed = user.EmailConfirmed,
                AnnualLeaveBalance = user.AnnualLeaveBalance,
                Role = role
            };

            return Ok(userDto);
        }


        [HttpPost("admin-update-password")]
        public async Task<IActionResult> AdminUpdatePassword([FromBody] AdminUpdatePasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword != dto.ConfirmPassword)
            {
                return BadRequest(new ApiResponse<string>(400, "كلمة المرور الجديدة وتأكيدها غير متطابقين أو فارغة."));
            }

            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null)
            {
                return NotFound(new ApiResponse<string>(404, "المستخدم غير موجود."));
            }

            // إزالة الباسورد القديم (لو موجود)
            var removePasswordResult = await _userManager.RemovePasswordAsync(user);
            if (!removePasswordResult.Succeeded)
            {
                var removeErrors = string.Join(", ", removePasswordResult.Errors.Select(e => e.Description));
                return BadRequest(new ApiResponse<string>(400, $"فشل إزالة كلمة المرور القديمة: {removeErrors}"));
            }

            // تعيين كلمة المرور الجديدة
            var addPasswordResult = await _userManager.AddPasswordAsync(user, dto.NewPassword);
            if (!addPasswordResult.Succeeded)
            {
                var addErrors = string.Join(", ", addPasswordResult.Errors.Select(e => e.Description));
                return BadRequest(new ApiResponse<string>(400, $"فشل تعيين كلمة المرور الجديدة: {addErrors}"));
            }
            _appContext.SaveChanges();
            return Ok(new ApiResponse<string>(200, "تم تحديث كلمة المرور بنجاح."));
        }

        [HttpPut("reset-leave-balance")]
        public async Task<IActionResult> ResetLeaveBalance([FromQuery] int balance = 21)
        {
            var users = await _appContext.Users.ToListAsync();

            if (!users.Any())
                return Ok(new { statusCode = 200, message = "No users found.", updated = 0, setTo = balance });

            foreach (var u in users)
                u.AnnualLeaveBalance = balance;

            var affected = await _appContext.SaveChangesAsync();

            return Ok(new
            {
                statusCode = 200,
                message = $"Leave balance set to {balance} for all users.",
                usersCount = users.Count,
                affectedEntries = affected
            });
        }

        // ⚠️ تم حذف endpoint reset-all-passwords لأسباب أمنية:
        // كان يعيد تعيين كلمات مرور جميع المستخدمين لكلمة ثابتة بدون أي حماية.
        // إذا احتجت هذه الوظيفة مستقبلاً، استخدم endpoint محمي بصلاحية Admin
        // مع طلب كلمة المرور الجديدة من المدير بدلاً من تثبيتها في الكود.
    }
}
