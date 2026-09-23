using ASF.Core.Entities.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ASF.Core.Entities
{
    /// <summary>
    /// جدول صلاحيات كل يوزر بشكل منفصل
    /// </summary>
    public class UserPermission
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public AppUser User { get; set; }

        /// <summary>
        /// اسم الصلاحية مثل "Construction.View" أو "LeaveRequest.Approve"
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string PermissionName { get; set; }

        /// <summary>
        /// true = مسموح، false = ممنوع (بيفيد لو عايز تلغي صلاحية معينة)
        /// </summary>
        public bool IsGranted { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// مين اللي أضاف الصلاحية دي (Admin ID)
        /// </summary>
        public string? GrantedByAdminId { get; set; }
    }
}