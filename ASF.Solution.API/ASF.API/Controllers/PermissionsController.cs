using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ASF.Api.Attributes;
using ASF.Core.Dtos;
using ASF.Core.Entities;
using ASF.Core.Services;
using ASF.Service;
using System.Security.Claims;

namespace ASF.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // لازم يكون logged in
    public class PermissionsController : ControllerBase
    {
        private readonly IPermissionService _permissionService;

        public PermissionsController(IPermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        // ─────────────────────────────────────────
        // GET: api/Permissions/available
        // جلب كل الصلاحيات المتاحة في النظام
        // ─────────────────────────────────────────
        [HttpGet("available")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public IActionResult GetAllAvailable()
        {
            var result = _permissionService.GetAllAvailablePermissions();
            return Ok(result);
        }

        // ─────────────────────────────────────────
        // GET: api/Permissions/user/{userId}
        // جلب صلاحيات يوزر معين
        // ─────────────────────────────────────────
        [HttpGet("user/{userId}")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> GetUserPermissions(string userId)
        {
            try
            {
                var result = await _permissionService.GetUserPermissionsAsync(userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
        }

        // ─────────────────────────────────────────
        // POST: api/Permissions/assign
        // إضافة صلاحيات ليوزر (بدون مسح القديمة)
        // ─────────────────────────────────────────
        [HttpPost("assign")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> AssignPermissions([FromBody] AssignPermissionsDto dto)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _permissionService.AssignPermissionsAsync(adminId!, dto);
                return Ok(new { Message = "✅ تم إضافة الصلاحيات بنجاح" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
        }

        // ─────────────────────────────────────────
        // POST: api/Permissions/revoke
        // حذف صلاحيات من يوزر
        // ─────────────────────────────────────────
        [HttpPost("revoke")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> RevokePermissions([FromBody] RevokePermissionsDto dto)
        {
            await _permissionService.RevokePermissionsAsync(dto);
            return Ok(new { Message = "✅ تم سحب الصلاحيات بنجاح" });
        }

        // ─────────────────────────────────────────
        // PUT: api/Permissions/replace
        // استبدال كل صلاحيات يوزر بصلاحيات جديدة
        // ─────────────────────────────────────────
        [HttpPut("replace")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> ReplacePermissions([FromBody] ReplacePermissionsDto dto)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _permissionService.ReplacePermissionsAsync(adminId!, dto);
                return Ok(new { Message = "✅ تم تحديث الصلاحيات بنجاح" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }


        // ─────────────────────────────────────────
        // GET: api/Permissions/effective/{userId}
        // الصلاحيات الفعّالة بعد دمج الأدوار والتجاوزات، مع مصدر كل صلاحية
        // ─────────────────────────────────────────
        [HttpGet("effective/{userId}")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> GetEffective(string userId)
        {
            try
            {
                var result = await _permissionService.GetEffectivePermissionsDetailedAsync(userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
        }

        // ─────────────────────────────────────────
        // GET: api/Permissions/roles
        // كل الأدوار مع صلاحياتها وعدد مستخدميها
        // ─────────────────────────────────────────
        [HttpGet("roles")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> GetRoles()
        {
            var result = await _permissionService.GetAllRolePermissionsAsync();
            return Ok(result);
        }

        // ─────────────────────────────────────────
        // GET: api/Permissions/roles/{roleName}
        // ─────────────────────────────────────────
        [HttpGet("roles/{roleName}")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> GetRole(string roleName)
        {
            try
            {
                var result = await _permissionService.GetRolePermissionsAsync(roleName);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
        }

        // ─────────────────────────────────────────
        // PUT: api/Permissions/roles
        // استبدال صلاحيات دور بالكامل — يرثها كل مستخدمي الدور فوراً
        // ─────────────────────────────────────────
        [HttpPut("roles")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> SetRolePermissions([FromBody] SetRolePermissionsDto dto)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _permissionService.SetRolePermissionsAsync(adminId, dto);
                return Ok(new { Message = "تم تحديث صلاحيات الدور بنجاح" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        // ─────────────────────────────────────────
        // POST: api/Permissions/override
        // سماح أو منع صريح لمستخدم، يتقدّم على ما يرثه من دوره
        // ─────────────────────────────────────────
        [HttpPost("override")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> SetOverride([FromBody] SetPermissionOverrideDto dto)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _permissionService.SetPermissionOverrideAsync(adminId, dto);

                var action = dto.IsGranted ? "السماح" : "المنع";
                return Ok(new { Message = $"تم {action} بنجاح" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        // ─────────────────────────────────────────
        // DELETE: api/Permissions/override
        // إزالة التجاوز فيعود المستخدم لما يرثه من أدواره
        // ─────────────────────────────────────────
        [HttpDelete("override")]
        [HasPermission(Permissions.Users.ManagePermissions)]
        public async Task<IActionResult> ClearOverride(
            [FromQuery] string userId,
            [FromQuery] string permissionName)
        {
            await _permissionService.ClearPermissionOverrideAsync(userId, permissionName);
            return Ok(new { Message = "تمت إزالة التجاوز" });
        }

        // ─────────────────────────────────────────
        // GET: api/Permissions/my
        // اليوزر يشوف صلاحياته هو
        // ─────────────────────────────────────────
        [HttpGet("my")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _permissionService.GetUserPermissionsAsync(userId);
            return Ok(result);
        }
    }
}