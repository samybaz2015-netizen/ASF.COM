using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Entities.Identity
{
    public class AppUser :IdentityUser
    {

        public int BranchId { get; set; }  
        public string UserType { get; set; }
        public string? DisplayName { get; set; }

        public string? UserImage {  get; set; }
        public bool CanCreateProjectOutsideCity { get; set; } = false;
        public int? OfficeId {  get; set; }
        public Office Office {  get; set; }
        public int AnnualLeaveBalance { get; set; } = 21;

        public string? Specialization { get; set; }
        public string? ExperienceYears { get; set; }
        public string? Certifications { get; set; }
        public string? Files1 { get; set; }
        public string? Bio { get; set; }
        public DateTime? ResidenceExpiryDate { get; set; }
        public DateTime? HireDate { get; set; }
        public string? JobTitle { get; set; }
        public DateTime? DateOfBirth { get; set; }

        // ───── حقول ملف الموظف ─────
        // كانت في جدول Employees الموازي غير المرتبط بالحسابات ولا بالإجازات،
        // فتُنقل إلى سجل الموظف نفسه: الإجازات والحضور والصلاحيات كلها تشير
        // إلى AppUser، فبقاء بياناته موزّعة على جدولين مصدرُ تضارب.

        /// <summary>رقم الهوية أو الإقامة.</summary>
        public string? NationalId { get; set; }

        /// <summary>المدينة.</summary>
        public string? City { get; set; }

        /// <summary>المهنة كما في رخصة العمل.</summary>
        public string? Profession { get; set; }

        /// <summary>الراتب الأساسي.</summary>
        public decimal? Salary { get; set; }

        /// <summary>تاريخ التخرّج.</summary>
        public DateTime? GraduationDate { get; set; }

        /// <summary>رقم الموظف الوظيفي لدى الجهة.</summary>
        public string? EmployeeNumber { get; set; }

        /// <summary>موظف على رأس العمل. المنفصل يبقى سجله للتاريخ.</summary>
        public bool IsActiveEmployee { get; set; } = true;

        /// <summary>تاريخ انتهاء الخدمة، إن انتهت.</summary>
        public DateTime? EndOfServiceDate { get; set; }

        /// <summary>
        /// نسخة صلاحيات المستخدم. تُزاد عند أي تغيير في صلاحياته أو أدواره أو
        /// صلاحيات دور ينتمي إليه.
        ///
        /// تُضمَّن في رمز الدخول، ويقارنها الخادم بالمخزَّن عند كل تحقق صلاحية.
        /// فإن اختلفت رُفض الطلب وطُلب تسجيل دخول جديد — وبذلك لا يستمر مستخدم
        /// في استعمال صلاحية سُحبت منه لمجرد أن رمزه القديم ما زال صالحاً.
        /// </summary>
        public int PermissionVersion { get; set; } = 1;

        // ───── Refresh Token ─────
        /// <summary>رمز التحديث المُشفّر — يُستخدم لتجديد Access Token بدون إعادة تسجيل الدخول.</summary>
        public string? RefreshToken { get; set; }

        /// <summary>تاريخ انتهاء صلاحية Refresh Token.</summary>
        public DateTime? RefreshTokenExpiryTime { get; set; }

    }

}
