using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ASF.Service
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;
        private readonly AppIdentityDbContext _db;

        public TokenService(IConfiguration configuration, AppIdentityDbContext db)
        {
            _configuration = configuration;
            _db = db;
        }

        public async Task<string> CreateTokenAsync(AppUser user, UserManager<AppUser> userManager)
        {
            // ─── Claims الأساسية ───
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.GivenName, user.UserName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.Id),

                // نسخة الصلاحيات وقت إصدار الرمز — يقارنها الخادم بالمخزَّن
                new Claim("permission_version", user.PermissionVersion.ToString())
            };

            // ─── Roles ───
            var userRoles = await userManager.GetRolesAsync(user);
            foreach (var role in userRoles)
                authClaims.Add(new Claim(ClaimTypes.Role, role));

            // ─── Permissions من Database ───
            // لو Admin → متضيفش permissions (عنده كل شيء تلقائياً في الـ Attribute)
            var isAdmin = userRoles.Any(r => r.ToLower() == "admin");
            if (!isAdmin)
            {
                // الصلاحيات الفعّالة: ما يرثه من أدواره + سماحه الصريح − منعه الصريح.
                var roleNames = userRoles.ToList();

                var effective = new HashSet<string>(StringComparer.Ordinal);

                if (roleNames.Count > 0)
                {
                    var inherited = await _db.RolePermissions
                        .Where(rp => roleNames.Contains(rp.RoleName))
                        .Select(rp => rp.PermissionName)
                        .ToListAsync();

                    foreach (var permission in inherited)
                        effective.Add(permission);
                }

                var overrides = await _db.UserPermissions
                    .Where(p => p.UserId == user.Id)
                    .Select(p => new { p.PermissionName, p.IsGranted })
                    .ToListAsync();

                foreach (var entry in overrides)
                {
                    if (entry.IsGranted) effective.Add(entry.PermissionName);
                    else effective.Remove(entry.PermissionName);
                }

                foreach (var permission in effective)
                    authClaims.Add(new Claim("permission", permission));
            }

            // ─── توليد الـ Access Token ───
            var authKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["JWT:Secret"]));

            // المدة بالساعات بدلاً من الأيام — جلسة عمل واحدة بدل شهر كامل
            var lifetimeHours = double.Parse(
                _configuration["JWT:AccessTokenLifeTimeInHours"] ?? "8");

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                expires: DateTime.UtcNow.AddHours(lifetimeHours),
                claims: authClaims,
                signingCredentials: new SigningCredentials(
                    authKey, SecurityAlgorithms.HmacSha256Signature)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <inheritdoc />
        public string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes);
        }
    }
}
