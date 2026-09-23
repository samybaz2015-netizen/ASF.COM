using System.ComponentModel.DataAnnotations;

namespace ASF.Core.Entities.Identity
{
    /// <summary>
    /// أنواع مستندات الموظف المعتادة. نصّ حرّ مقبول أيضاً، فالقائمة إرشاد لا قيد.
    /// </summary>
    public static class EmployeeDocumentKinds
    {
        public const string NationalId = "الهوية / الإقامة";
        public const string Passport = "جواز السفر";
        public const string Contract = "عقد العمل";
        public const string Cv = "السيرة الذاتية";
        public const string Certificate = "الشهادات";
        public const string License = "رخصة العمل";
        public const string Medical = "التأمين الطبي";
        public const string Other = "مستندات أخرى";

        public static readonly string[] All =
        {
            NationalId, Passport, Contract, Cv, Certificate, License, Medical, Other
        };
    }

    /// <summary>
    /// مستند مرفق بملف موظف.
    ///
    /// كانت المستندات أعمدة مفردة على جدول الموظفين — صورة السيرة، صورة
    /// الإقامة، صورة الرخصة — فلا يمكن رفع أكثر من ملف للنوع الواحد ولا إضافة
    /// نوع جديد بلا تعديل في القاعدة. صارت صفوفاً: أي عدد، وأي نوع.
    /// </summary>
    public class EmployeeDocument
    {
        public int Id { get; set; }

        /// <summary>صاحب المستند — معرّف الحساب، وهو سجل الموظف نفسه.</summary>
        [Required, MaxLength(450)]
        public string UserId { get; set; }

        /// <summary>نوع المستند، من القائمة المعتادة أو نصّ حرّ.</summary>
        [Required, MaxLength(128)]
        public string Kind { get; set; }

        /// <summary>اسم الملف كما رفعه المستخدم، للعرض والتنزيل.</summary>
        [Required, MaxLength(256)]
        public string FileName { get; set; }

        /// <summary>المسار المخزَّن على الخادم.</summary>
        [Required, MaxLength(512)]
        public string StoredPath { get; set; }

        [MaxLength(128)]
        public string? ContentType { get; set; }

        public long SizeBytes { get; set; }

        /// <summary>تاريخ انتهاء المستند — للتنبيه قبل انقضائه.</summary>
        public DateTime? ExpiresAt { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(450)]
        public string? UploadedByUserId { get; set; }

        [MaxLength(256)]
        public string? UploadedByUserName { get; set; }
    }
}
