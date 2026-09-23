namespace ASF.Core.Dtos
{
    // ===== Request DTOs =====

    public class AssignPermissionsDto
    {
        /// <summary>
        /// ID اليوزر اللي هتضيفله صلاحيات
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        /// قائمة الصلاحيات اللي هتضيفها
        /// مثال: ["Construction.View", "Construction.Create", "Attendance.CheckIn"]
        /// </summary>
        public List<string> Permissions { get; set; } = new();
    }

    public class RevokePermissionsDto
    {
        public string UserId { get; set; }
        public List<string> Permissions { get; set; } = new();
    }

    public class ReplacePermissionsDto
    {
        /// <summary>
        /// بيمسح كل الصلاحيات القديمة ويحط الجديدة دي بدلها
        /// </summary>
        public string UserId { get; set; }
        public List<string> Permissions { get; set; } = new();
    }

    // ===== Response DTOs =====

    public class UserPermissionsResponseDto
    {
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string? DisplayName { get; set; }
        public List<string> Permissions { get; set; } = new();
    }

    public class AllPermissionsDto
    {
        /// <summary>
        /// كل الصلاحيات الموجودة في النظام مقسمة بالـ Module
        /// </summary>
        public Dictionary<string, List<string>> Modules { get; set; } = new();
    }

    // ===== الأدوار وصلاحياتها =====

    public class RolePermissionsDto
    {
        public string RoleId { get; set; }
        public string RoleName { get; set; }
        public List<string> Permissions { get; set; } = new();
        public int UsersCount { get; set; }
    }

    public class SetRolePermissionsDto
    {
        /// <summary>اسم الدور كما هو في AspNetRoles.</summary>
        public string RoleName { get; set; }

        /// <summary>الصلاحيات التي يملكها الدور بعد الحفظ — تُستبدل بالكامل.</summary>
        public List<string> Permissions { get; set; } = new();
    }

    // ===== المنع الصريح =====

    public class SetPermissionOverrideDto
    {
        public string UserId { get; set; }
        public string PermissionName { get; set; }

        /// <summary>true = سماح صريح، false = منع صريح يتقدّم على صلاحية الدور.</summary>
        public bool IsGranted { get; set; }

        /// <summary>سبب التعديل — مطلوب للصلاحيات الحساسة.</summary>
        public string? Reason { get; set; }
    }

    // ===== الصلاحيات الفعلية =====

    /// <summary>صلاحية واحدة مع مصدرها، ليعرف المسؤول لماذا يملكها المستخدم.</summary>
    public class EffectivePermissionDto
    {
        public string PermissionName { get; set; }

        /// <summary>Role | UserAllow | UserDeny</summary>
        public string Source { get; set; }

        /// <summary>اسم الدور الذي ورّثها، إن كان المصدر دوراً.</summary>
        public string? RoleName { get; set; }

        /// <summary>هل هي فعّالة بعد دمج كل المصادر.</summary>
        public bool IsEffective { get; set; }
    }

    public class EffectivePermissionsDto
    {
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string? DisplayName { get; set; }

        public List<string> Roles { get; set; } = new();

        /// <summary>الصلاحيات الفعّالة بعد: أدوار + سماح صريح − منع صريح.</summary>
        public List<string> Effective { get; set; } = new();

        /// <summary>تفصيل كل صلاحية ومصدرها، شاملاً الممنوعة صراحةً.</summary>
        public List<EffectivePermissionDto> Breakdown { get; set; } = new();
    }
}
