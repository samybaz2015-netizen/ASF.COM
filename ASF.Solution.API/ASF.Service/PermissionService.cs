using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Entities.Identity;
using ASF.Core.Services;
using ASF.Repository.AppDbContext;
using ASF.Repository.Identity;

namespace ASF.Service
{
    public class PermissionService : IPermissionService
    {
        private readonly ApplicationDbContext _db;
        private readonly AppIdentityDbContext _identityDb;
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public PermissionService(
            ApplicationDbContext db,
            AppIdentityDbContext identityDb,
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _db = db;
            _identityDb = identityDb;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        // ─────────────────────────────────────────
        // جلب صلاحيات يوزر
        // ─────────────────────────────────────────
        public async Task<UserPermissionsResponseDto> GetUserPermissionsAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new KeyNotFoundException("المستخدم غير موجود.");

            // الفعّالة لا المباشرة فقط، حتى ترى الواجهة ما يملكه المستخدم حقاً
            // بما فيه ما ورثه من أدواره.
            var permissions = (await GetEffectivePermissionsAsync(userId))
                .OrderBy(p => p, StringComparer.Ordinal)
                .ToList();

            return new UserPermissionsResponseDto
            {
                UserId = userId,
                UserName = user.UserName,
                DisplayName = user.DisplayName,
                Permissions = permissions
            };
        }

        // ─────────────────────────────────────────
        // إضافة صلاحيات (بدون مسح القديمة)
        // ─────────────────────────────────────────
        public async Task AssignPermissionsAsync(string adminId, AssignPermissionsDto dto)
        {
            ValidatePermissions(dto.Permissions);

            var existingPermissions = await _identityDb.UserPermissions
                .Where(p => p.UserId == dto.UserId)
                .ToListAsync();

            var toAdd = new List<UserPermission>();

            foreach (var perm in dto.Permissions.Distinct())
            {
                var existing = existingPermissions.FirstOrDefault(p => p.PermissionName == perm);

                if (existing == null)
                {
                    // صلاحية جديدة
                    toAdd.Add(new UserPermission
                    {
                        UserId = dto.UserId,
                        PermissionName = perm,
                        IsGranted = true,
                        GrantedByAdminId = adminId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                else if (!existing.IsGranted)
                {
                    // كانت مسلوبة، نرجعها
                    existing.IsGranted = true;
                    existing.GrantedByAdminId = adminId;
                    existing.CreatedAt = DateTime.UtcNow;
                    _identityDb.UserPermissions.Update(existing);
                }
                // لو موجودة ومفعّلة → تجاهل
            }

            if (toAdd.Any())
                await _identityDb.UserPermissions.AddRangeAsync(toAdd);

            await _identityDb.SaveChangesAsync();
        
            await BumpUserVersionAsync(dto.UserId);
        }

        // ─────────────────────────────────────────
        // حذف صلاحيات من يوزر
        // ─────────────────────────────────────────
        public async Task RevokePermissionsAsync(RevokePermissionsDto dto)
        {
            var permissions = await _identityDb.UserPermissions
                .Where(p => p.UserId == dto.UserId && dto.Permissions.Contains(p.PermissionName))
                .ToListAsync();

            foreach (var perm in permissions)
                perm.IsGranted = false;

            _identityDb.UserPermissions.UpdateRange(permissions);
            await _identityDb.SaveChangesAsync();
        
            await BumpUserVersionAsync(dto.UserId);
        }

        // ─────────────────────────────────────────
        // استبدال كل الصلاحيات
        // ─────────────────────────────────────────
        public async Task ReplacePermissionsAsync(string adminId, ReplacePermissionsDto dto)
        {
            ValidatePermissions(dto.Permissions);

            // مسح القديمة
            var old = await _identityDb.UserPermissions
                .Where(p => p.UserId == dto.UserId)
                .ToListAsync();

            _identityDb.UserPermissions.RemoveRange(old);

            // إضافة الجديدة
            var newPerms = dto.Permissions.Distinct().Select(perm => new UserPermission
            {
                UserId = dto.UserId,
                PermissionName = perm,
                IsGranted = true,
                GrantedByAdminId = adminId,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await _identityDb.UserPermissions.AddRangeAsync(newPerms);
            await _identityDb.SaveChangesAsync();
        
            await BumpUserVersionAsync(dto.UserId);
        }

        // ─────────────────────────────────────────
        // التحقق من صلاحية معينة
        // ─────────────────────────────────────────
        public async Task<bool> HasPermissionAsync(string userId, string permission)
        {
            var effective = await GetEffectivePermissionsAsync(userId);
            return effective.Contains(permission);
        }


        // ─────────────────────────────────────────
        // نسخة الصلاحيات: إبطال الرموز القديمة فور تعديل الصلاحيات
        // ─────────────────────────────────────────
        public async Task<int> GetPermissionVersionAsync(string userId)
        {
            var user = await _identityDb.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            return user?.PermissionVersion ?? 0;
        }

        /// <summary>يزيد نسخة مستخدم بعينه.</summary>
        private async Task BumpUserVersionAsync(string userId)
        {
            var user = await _identityDb.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null) return;

            user.PermissionVersion += 1;
            await _identityDb.SaveChangesAsync();
        }

        /// <summary>
        /// يزيد نسخة كل مستخدمي دور — يُستدعى عند تعديل صلاحيات الدور،
        /// فيُبطل رموز كل من يرث منه دفعة واحدة.
        /// </summary>
        private async Task BumpRoleUsersVersionAsync(string roleName)
        {
            var users = await _userManager.GetUsersInRoleAsync(roleName);
            if (users.Count == 0) return;

            var ids = users.Select(u => u.Id).ToList();

            var tracked = await _identityDb.Users
                .Where(u => ids.Contains(u.Id))
                .ToListAsync();

            foreach (var user in tracked)
                user.PermissionVersion += 1;

            await _identityDb.SaveChangesAsync();
        }

        // ─────────────────────────────────────────
        // الصلاحيات الفعّالة: أدوار + سماح صريح − منع صريح
        // ترتيب الأولوية: منع صريح > سماح صريح > صلاحية الدور > منع افتراضي
        // ─────────────────────────────────────────
        public async Task<HashSet<string>> GetEffectivePermissionsAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user is null) return new HashSet<string>();

            var roleNames = await _userManager.GetRolesAsync(user);

            var effective = new HashSet<string>(StringComparer.Ordinal);

            // 1) الموروث من الأدوار
            if (roleNames.Count > 0)
            {
                var inherited = await _identityDb.RolePermissions
                    .Where(rp => roleNames.Contains(rp.RoleName))
                    .Select(rp => rp.PermissionName)
                    .ToListAsync();

                foreach (var permission in inherited)
                    effective.Add(permission);
            }

            // 2) تجاوزات المستخدم
            var overrides = await _identityDb.UserPermissions
                .Where(up => up.UserId == userId)
                .Select(up => new { up.PermissionName, up.IsGranted })
                .ToListAsync();

            foreach (var entry in overrides)
            {
                if (entry.IsGranted) effective.Add(entry.PermissionName);
                else effective.Remove(entry.PermissionName);   // المنع الصريح يتقدّم
            }

            return effective;
        }

        public async Task<EffectivePermissionsDto> GetEffectivePermissionsDetailedAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new KeyNotFoundException("المستخدم غير موجود.");

            var roleNames = (await _userManager.GetRolesAsync(user)).ToList();

            var inherited = roleNames.Count == 0
                ? new List<RolePermission>()
                : await _identityDb.RolePermissions
                    .Where(rp => roleNames.Contains(rp.RoleName))
                    .ToListAsync();

            var overrides = await _identityDb.UserPermissions
                .Where(up => up.UserId == userId)
                .ToListAsync();

            var effective = await GetEffectivePermissionsAsync(userId);

            var breakdown = new List<EffectivePermissionDto>();

            foreach (var group in inherited.GroupBy(rp => rp.PermissionName))
            {
                var denied = overrides.Any(o => o.PermissionName == group.Key && !o.IsGranted);
                breakdown.Add(new EffectivePermissionDto
                {
                    PermissionName = group.Key,
                    Source = denied ? "UserDeny" : "Role",
                    RoleName = string.Join(" · ", group.Select(rp => rp.RoleName).Distinct()),
                    IsEffective = !denied
                });
            }

            foreach (var entry in overrides)
            {
                if (breakdown.Any(b => b.PermissionName == entry.PermissionName)) continue;

                breakdown.Add(new EffectivePermissionDto
                {
                    PermissionName = entry.PermissionName,
                    Source = entry.IsGranted ? "UserAllow" : "UserDeny",
                    IsEffective = entry.IsGranted
                });
            }

            return new EffectivePermissionsDto
            {
                UserId = userId,
                UserName = user.UserName,
                DisplayName = user.DisplayName,
                Roles = roleNames,
                Effective = effective.OrderBy(p => p, StringComparer.Ordinal).ToList(),
                Breakdown = breakdown.OrderBy(b => b.PermissionName, StringComparer.Ordinal).ToList()
            };
        }

        // ─────────────────────────────────────────
        // صلاحيات الأدوار
        // ─────────────────────────────────────────
        public async Task<RolePermissionsDto> GetRolePermissionsAsync(string roleName)
        {
            var role = await _roleManager.FindByNameAsync(roleName)
                ?? throw new KeyNotFoundException("الدور غير موجود.");

            var permissions = await _identityDb.RolePermissions
                .Where(rp => rp.RoleName == roleName)
                .Select(rp => rp.PermissionName)
                .ToListAsync();

            var users = await _userManager.GetUsersInRoleAsync(roleName);

            return new RolePermissionsDto
            {
                RoleId = role.Id,
                RoleName = role.Name,
                Permissions = permissions,
                UsersCount = users.Count
            };
        }

        public async Task<List<RolePermissionsDto>> GetAllRolePermissionsAsync()
        {
            var roles = await _roleManager.Roles.ToListAsync();
            var all = await _identityDb.RolePermissions.ToListAsync();

            var result = new List<RolePermissionsDto>();
            foreach (var role in roles)
            {
                var users = await _userManager.GetUsersInRoleAsync(role.Name);
                result.Add(new RolePermissionsDto
                {
                    RoleId = role.Id,
                    RoleName = role.Name,
                    Permissions = all.Where(rp => rp.RoleName == role.Name)
                                     .Select(rp => rp.PermissionName)
                                     .ToList(),
                    UsersCount = users.Count
                });
            }

            return result;
        }

        public async Task SetRolePermissionsAsync(string adminId, SetRolePermissionsDto dto)
        {
            ValidatePermissions(dto.Permissions);

            var role = await _roleManager.FindByNameAsync(dto.RoleName)
                ?? throw new KeyNotFoundException("الدور غير موجود.");

            var existing = await _identityDb.RolePermissions
                .Where(rp => rp.RoleName == dto.RoleName)
                .ToListAsync();

            var wanted = dto.Permissions.Distinct().ToList();

            var toRemove = existing.Where(rp => !wanted.Contains(rp.PermissionName)).ToList();
            if (toRemove.Count > 0)
                _identityDb.RolePermissions.RemoveRange(toRemove);

            var current = existing.Select(rp => rp.PermissionName).ToHashSet(StringComparer.Ordinal);
            var toAdd = wanted
                .Where(p => !current.Contains(p))
                .Select(p => new RolePermission
                {
                    RoleId = role.Id,
                    RoleName = role.Name,
                    PermissionName = p,
                    GrantedByAdminId = adminId,
                    CreatedAt = DateTime.UtcNow
                })
                .ToList();

            if (toAdd.Count > 0)
                await _identityDb.RolePermissions.AddRangeAsync(toAdd);

            await _identityDb.SaveChangesAsync();

            // كل من يرث من هذا الدور يجب أن يُبطل رمزه
            await BumpRoleUsersVersionAsync(dto.RoleName);
        }

        // ─────────────────────────────────────────
        // التجاوزات الصريحة
        // ─────────────────────────────────────────
        public async Task SetPermissionOverrideAsync(string adminId, SetPermissionOverrideDto dto)
        {
            ValidatePermissions(new List<string> { dto.PermissionName });

            var existing = await _identityDb.UserPermissions
                .FirstOrDefaultAsync(up => up.UserId == dto.UserId
                                        && up.PermissionName == dto.PermissionName);

            if (existing is null)
            {
                await _identityDb.UserPermissions.AddAsync(new UserPermission
                {
                    UserId = dto.UserId,
                    PermissionName = dto.PermissionName,
                    IsGranted = dto.IsGranted,
                    GrantedByAdminId = adminId,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.IsGranted = dto.IsGranted;
                existing.GrantedByAdminId = adminId;
                existing.CreatedAt = DateTime.UtcNow;
                _identityDb.UserPermissions.Update(existing);
            }

            await _identityDb.SaveChangesAsync();
            await BumpUserVersionAsync(dto.UserId);
        }

        public async Task ClearPermissionOverrideAsync(string userId, string permissionName)
        {
            var existing = await _identityDb.UserPermissions
                .FirstOrDefaultAsync(up => up.UserId == userId
                                        && up.PermissionName == permissionName);

            if (existing is null) return;

            _identityDb.UserPermissions.Remove(existing);
            await _identityDb.SaveChangesAsync();
            await BumpUserVersionAsync(userId);
        }

        // ─────────────────────────────────────────
        // جلب كل الصلاحيات مقسمة بالـ Module
        // ─────────────────────────────────────────
        public AllPermissionsDto GetAllAvailablePermissions()
        {
            var all = Permissions.GetAll();

            // تقسيم الصلاحيات بالـ Module (الجزء قبل النقطة)
            var modules = all
                .GroupBy(p => p.Split('.')[0])
                .ToDictionary(
                    g => g.Key,
                    g => g.ToList()
                );

            return new AllPermissionsDto { Modules = modules };
        }

        // ─────────────────────────────────────────
        // Helper: التحقق أن الصلاحيات موجودة فعلاً
        // ─────────────────────────────────────────
        private static void ValidatePermissions(List<string> permissions)
        {
            var allValid = Permissions.GetAll();
            var invalid = permissions.Where(p => !allValid.Contains(p)).ToList();

            if (invalid.Any())
                throw new ArgumentException($"صلاحيات غير معروفة: {string.Join(", ", invalid)}");
        }
    }
}