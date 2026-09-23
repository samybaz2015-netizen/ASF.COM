using System.ComponentModel.DataAnnotations;

namespace ASF.Core.Entities
{
    /// <summary>
    /// ربط الدور الوظيفي بصلاحياته.
    ///
    /// قبل هذا الجدول كانت الأدوار أسماءً فقط بلا صلاحيات، وكل صلاحية تُمنح
    /// للمستخدم مباشرة. الآن يرث المستخدم صلاحيات أدواره، ويبقى بإمكان المسؤول
    /// منحه صلاحية إضافية أو منعه من صلاحية موروثة عبر UserPermission.
    ///
    /// ترتيب الأولوية عند الحساب:
    ///   منع صريح للمستخدم  >  سماح صريح للمستخدم  >  صلاحية الدور  >  المنع الافتراضي
    /// </summary>
    public class RolePermission
    {
        public int Id { get; set; }

        /// <summary>معرّف الدور في AspNetRoles.</summary>
        [Required]
        [MaxLength(450)]
        public string RoleId { get; set; }

        /// <summary>اسم الدور — مخزّن للقراءة والتقارير دون ضمّ.</summary>
        [Required]
        [MaxLength(256)]
        public string RoleName { get; set; }

        /// <summary>كود الصلاحية مثل "Construction.View".</summary>
        [Required]
        [MaxLength(100)]
        public string PermissionName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>المسؤول الذي منح الصلاحية للدور.</summary>
        [MaxLength(450)]
        public string? GrantedByAdminId { get; set; }
    }
}
