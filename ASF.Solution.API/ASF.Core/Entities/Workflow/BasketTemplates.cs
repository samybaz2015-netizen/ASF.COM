namespace ASF.Core.Entities.Workflow
{
    /// <summary>
    /// سلة مقترحة داخل قالب قسم.
    /// </summary>
    public class BasketTemplateItem
    {
        public string Name { get; set; } = string.Empty;
        public string? Purpose { get; set; }
        public bool RequireMandatoryTasks { get; set; } = true;
        public bool RequireAttachments { get; set; }
        public List<BasketTemplateTask> Tasks { get; set; } = new();
    }

    public class BasketTemplateTask
    {
        public string Name { get; set; } = string.Empty;
        public bool IsMandatory { get; set; }
        public string? RequiredAttachments { get; set; }
    }

    public class BasketTemplate
    {
        public string ProjectTypeCode { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;

        /// <summary>
        /// مصدر القالب: Spec = منصوص عليه في المواصفة، Suggested = اقتراح مبني
        /// على سير العمل المعتاد ويُعدَّل بحرّية.
        /// </summary>
        public string Source { get; set; } = "Suggested";

        public List<BasketTemplateItem> Baskets { get; set; } = new();
    }

    /// <summary>
    /// السلال المقترحة لكل قسم.
    ///
    /// قوالب لا قيود: تُطبَّق على المسودة بضغطة ثم تُعدَّل أو تُحذف بحرّية. لا
    /// يعتمد عليها منطق التشغيل إطلاقاً — المسار الفعلي هو ما يُعتمد في
    /// إعدادات العقد، تماماً كما تشترط المواصفة.
    ///
    /// قالب الإنشاءات منصوص عليه حرفياً في المواصفة. قالبا الصيانة والطوارئ
    /// اقتراحان مبنيان على سير العمل المعتاد، لأن المواصفة لم تنصّ عليهما.
    /// </summary>
    public static class BasketTemplates
    {
        private static BasketTemplateItem B(string name, string purpose,
            params (string task, bool mandatory)[] tasks) => new()
            {
                Name = name,
                Purpose = purpose,
                RequireMandatoryTasks = true,
                Tasks = tasks.Select(t => new BasketTemplateTask
                {
                    Name = t.task,
                    IsMandatory = t.mandatory
                }).ToList()
            };

        public static readonly BasketTemplate Construction = new()
        {
            ProjectTypeCode = ProjectTypeCodes.Construction,
            DepartmentName = "الإنشاءات",
            Source = "Spec",
            Baskets = new List<BasketTemplateItem>
            {
                B("استلام أمر العمل", "قيد أمر العمل والتحقّق من اكتمال بياناته قبل بدء أي عمل ميداني.",
                    ("التحقّق من بيانات أمر العمل", true),
                    ("تحديد المقاول والحي", true)),

                B("التنسيق والمعاينة", "معاينة الموقع والتنسيق مع الجهات قبل التجهيز.",
                    ("معاينة الموقع", true),
                    ("التنسيق مع الجهات ذات العلاقة", true),
                    ("رفع تقرير المعاينة", false)),

                B("التصاريح والتجهيز", "استخراج التصاريح وتجهيز المواد والمعدات.",
                    ("استخراج تصريح الحفر", true),
                    ("تجهيز المواد والمعدات", true)),

                B("التنفيذ", "تنفيذ الأعمال الميدانية وتوثيقها.",
                    ("الحفر", true),
                    ("تمديد الكابل", true),
                    ("التركيبات", true),
                    ("الاختبارات", true),
                    ("إعادة الوضع", true),
                    ("رفع صور التنفيذ", false)),

                B("الفحص والملاحظات", "فحص الأعمال المنفَّذة ورصد الملاحظات ومعالجتها.",
                    ("الفحص الميداني", true),
                    ("رصد الملاحظات", false),
                    ("إغلاق الملاحظات", true)),

                B("الموازنة والتوثيق", "حصر الكميات المنفَّذة وتوثيقها.",
                    ("حصر الكميات المنفَّذة", true),
                    ("توثيق المستندات", true)),

                B("شهادة الإنجاز", "إصدار شهادة إنجاز الأعمال واعتمادها.",
                    ("إعداد شهادة الإنجاز", true),
                    ("اعتماد الشهادة", true)),

                B("المستخلص", "إعداد المستخلص واعتماده.",
                    ("إعداد المستخلص", true),
                    ("اعتماد المستخلص", true)),

                B("الإغلاق", "إغلاق أمر العمل بعد اكتمال كل متطلباته.",
                    ("التحقّق من اكتمال المتطلبات", true)),
            }
        };

        public static readonly BasketTemplate Maintenance = new()
        {
            ProjectTypeCode = ProjectTypeCodes.Maintenance,
            DepartmentName = "الصيانة",
            Baskets = new List<BasketTemplateItem>
            {
                B("استلام البلاغ", "قيد بلاغ الصيانة والتحقّق من بياناته.",
                    ("التحقّق من بيانات البلاغ", true)),

                B("المعاينة والتشخيص", "معاينة موقع العطل وتحديد سببه ونطاق الإصلاح.",
                    ("معاينة الموقع", true),
                    ("تشخيص العطل", true)),

                B("التسعير والاعتماد", "تسعير أعمال الإصلاح واعتمادها قبل التنفيذ.",
                    ("حصر البنود", true),
                    ("اعتماد التسعير", true)),

                B("التنفيذ", "تنفيذ أعمال الإصلاح وتوثيقها.",
                    ("تنفيذ الإصلاح", true),
                    ("رفع صور التنفيذ", false)),

                B("الفحص والاستلام", "فحص الإصلاح والتأكّد من معالجة العطل.",
                    ("الفحص الميداني", true),
                    ("تأكيد معالجة العطل", true)),

                B("التوثيق والإغلاق", "توثيق الأعمال وإغلاق البلاغ.",
                    ("توثيق المستندات", true)),
            }
        };

        public static readonly BasketTemplate Emergency = new()
        {
            ProjectTypeCode = ProjectTypeCodes.Emergency,
            DepartmentName = "الطوارئ",
            Baskets = new List<BasketTemplateItem>
            {
                B("استلام البلاغ", "قيد بلاغ الطوارئ فور وروده.",
                    ("تسجيل وقت البلاغ", true)),

                B("الاستجابة الفورية", "الوصول إلى الموقع خلال زمن الاستجابة المحدّد.",
                    ("تسجيل وقت الوصول", true),
                    ("تقييم الخطورة", true)),

                B("تأمين الموقع", "تأمين الموقع ومنع الخطر قبل مباشرة الإصلاح.",
                    ("عزل مصدر الخطر", true),
                    ("تأمين محيط الموقع", true)),

                B("التنفيذ العاجل", "تنفيذ الإصلاح العاجل وتوثيقه.",
                    ("تنفيذ الإصلاح", true),
                    ("رفع صور التنفيذ", false)),

                B("الفحص والاستلام", "التأكّد من زوال الخطر وسلامة الإصلاح.",
                    ("الفحص الميداني", true),
                    ("تأكيد زوال الخطر", true)),

                B("التقرير والإغلاق", "إعداد تقرير الحادثة وإغلاق البلاغ.",
                    ("إعداد تقرير الحادثة", true)),
            }
        };

        public static readonly List<BasketTemplate> All = new()
        {
            Construction, Maintenance, Emergency
        };

        /// <summary>قالب نوع المشروع، أو null إن لم يكن له قالب مقترح.</summary>
        public static BasketTemplate? For(string? projectTypeCode) =>
            All.FirstOrDefault(t => string.Equals(t.ProjectTypeCode, projectTypeCode, StringComparison.Ordinal));
    }
}
