using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ASF.Core.Services;
using ASF.Service;
using System.Security.Claims;

namespace ASF.Api.Attributes
{
    // ─────────────────────────────────────────────────────
    // 1) Attribute للاستخدام على Controllers
    //    مثال: [HasPermission("Construction.View")]
    // ─────────────────────────────────────────────────────
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public class HasPermissionAttribute : Attribute, IAsyncAuthorizationFilter
    {
        private readonly string _permission;

        public HasPermissionAttribute(string permission)
        {
            _permission = permission;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            // لو مش logged in
            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // الـ Admin عنده كل الصلاحيات تلقائياً
            if (user.IsInRole("admin") || user.IsInRole("Admin"))
                return;

            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var permissionService = context.HttpContext.RequestServices
                .GetRequiredService<IPermissionService>();

            // رمز قديم صادر قبل تعديل الصلاحيات لا يُقبل، وإلا استمر المستخدم في
            // استعمال صلاحية سُحبت منه حتى انتهاء مدة الرمز (ثلاثون يوماً).
            var tokenVersion = user.FindFirstValue("permission_version");
            if (!string.IsNullOrEmpty(tokenVersion))
            {
                var currentVersion = await permissionService.GetPermissionVersionAsync(userId);

                if (!int.TryParse(tokenVersion, out var claimVersion) || claimVersion != currentVersion)
                {
                    context.Result = new ObjectResult(new
                    {
                        StatusCode = 401,
                        Message = "تم تعديل صلاحياتك. سجّل الدخول مرة أخرى لتفعيلها.",
                        Code = "PERMISSION_VERSION_MISMATCH"
                    })
                    { StatusCode = 401 };
                    return;
                }
            }

            // التحقق من الـ Permission
            var hasPermission = await permissionService.HasPermissionAsync(userId, _permission);

            if (!hasPermission)
            {
                context.Result = new ObjectResult(new
                {
                    StatusCode = 403,
                    Message = $"ليس لديك صلاحية: {_permission}"
                })
                { StatusCode = 403 };
            }
        }
    }
}