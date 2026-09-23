using ASF.Core.Dtos;

namespace ASF.Core.Services
{
    public interface IPermissionService
    {
        /// <summary>جلب صلاحيات يوزر معين</summary>
        Task<UserPermissionsResponseDto> GetUserPermissionsAsync(string userId);

        /// <summary>إضافة صلاحيات ليوزر (بدون حذف القديمة)</summary>
        Task AssignPermissionsAsync(string adminId, AssignPermissionsDto dto);

        /// <summary>حذف صلاحيات من يوزر</summary>
        Task RevokePermissionsAsync(RevokePermissionsDto dto);

        /// <summary>استبدال كل صلاحيات اليوزر بصلاحيات جديدة</summary>
        Task ReplacePermissionsAsync(string adminId, ReplacePermissionsDto dto);

        /// <summary>التحقق أن اليوزر عنده صلاحية معينة</summary>
        Task<bool> HasPermissionAsync(string userId, string permission);

        /// <summary>جلب كل الصلاحيات المتاحة في النظام مقسمة بالـ Module</summary>
        AllPermissionsDto GetAllAvailablePermissions();
    
        /// <summary>
        /// الصلاحيات الفعّالة بعد دمج: صلاحيات الأدوار + السماح الصريح − المنع الصريح.
        /// هذه هي الدالة المرجعية لأي تحقق، ولا يُستعمل غيرها.
        /// </summary>
        Task<HashSet<string>> GetEffectivePermissionsAsync(string userId);

        /// <summary>الصلاحيات الفعّالة مع مصدر كل صلاحية، لشاشة الإدارة.</summary>
        Task<EffectivePermissionsDto> GetEffectivePermissionsDetailedAsync(string userId);

        /// <summary>صلاحيات دور بعينه.</summary>
        Task<RolePermissionsDto> GetRolePermissionsAsync(string roleName);

        /// <summary>كل الأدوار مع صلاحياتها وعدد مستخدميها.</summary>
        Task<List<RolePermissionsDto>> GetAllRolePermissionsAsync();

        /// <summary>استبدال صلاحيات دور بالكامل.</summary>
        Task SetRolePermissionsAsync(string adminId, SetRolePermissionsDto dto);

        /// <summary>سماح أو منع صريح لمستخدم، يتقدّم على صلاحية الدور.</summary>
        Task SetPermissionOverrideAsync(string adminId, SetPermissionOverrideDto dto);

        /// <summary>إزالة التجاوز الصريح فيعود المستخدم لما يرثه من أدواره.</summary>
        Task ClearPermissionOverrideAsync(string userId, string permissionName);

        /// <summary>نسخة صلاحيات المستخدم الحالية في القاعدة.</summary>
        Task<int> GetPermissionVersionAsync(string userId);
}
}