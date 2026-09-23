/**
 * سجلّ رؤوس الصفحات.
 *
 * مصدر واحد لعنوان كل صفحة وأيقونتها، يقرأه الـLayout ويرسم منه الرأس. لا
 * تكتب أي صفحة رأسها بنفسها: لو فعلت لاختلف الشكل بين الأقسام، وهو ما يعالجه
 * هذا السجلّ.
 *
 * إضافة صفحة جديدة = سطر هنا. وما لم يُسجَّل يأخذ رأساً افتراضياً من مساره بدل
 * أن يظهر بلا رأس.
 */

/** المسارات التي لا رأس لها إطلاقاً: تملك تصميمها الكامل. */
const BARE_ROUTES = [/^\/login/, /^\/reset-password/, /^\/forgot-password/, /^\/$/];

/**
 * الترتيب مهمّ: يُطابَق أول تعبير ينطبق، فالمسارات الأخصّ تسبق الأعمّ.
 * icon = صنف Font Awesome، لأن القائمة الجانبية تستعمل الأصناف نفسها.
 */
const ROUTES = [
  { match: /^\/home-page/, title: "لوحة التحكم", icon: "fa-light fa-grid-2", section: "الرئيسية" },

  // الطلبات وأوامر العمل
  { match: /^\/work-orders\/new\/construction/, title: "إنشاء أمر عمل — الإنشاءات", icon: "fa-light fa-helmet-safety", section: "الطلبات" },
  { match: /^\/work-orders\/new/, title: "إنشاء أمر عمل", icon: "fa-light fa-file-circle-plus", section: "الطلبات" },
  { match: /^\/execution-tracking/, title: "متابعة التنفيذ", icon: "fa-light fa-list-check", section: "الطلبات" },
  { match: /^\/daily-execution/, title: "تحديث التنفيذ اليومي", icon: "fa-light fa-calendar-day", section: "الطلبات" },
  { match: /^\/orders/, title: "أوامر العمل", icon: "fa-light fa-briefcase", section: "الطلبات" },
  { match: /^\/search/, title: "البحث في الطلبات", icon: "fa-light fa-magnifying-glass", section: "الطلبات" },
  { match: /^\/accept-requests/, title: "قبول الطلبات", icon: "fa-solid fa-check-circle", section: "الطلبات" },
  { match: /^\/accept-delete/, title: "طلبات الحذف", icon: "fa-solid fa-trash", section: "الطلبات" },
  { match: /^\/deleted-projects/, title: "سلة المهملات", icon: "fa fa-trash", section: "الطلبات" },
  { match: /^\/archived/, title: "الطلبات المؤرشفة", icon: "fa-light fa-box-archive", section: "الطلبات" },
  { match: /^\/completed/, title: "الطلبات المنجزة", icon: "fa-light fa-circle-check", section: "الطلبات" },
  { match: /^\/project\//, title: "تفاصيل أمر العمل", icon: "fa-light fa-file-lines", section: "الطلبات" },

  // المشاريع
  { match: /^\/private-projects/, title: "المشاريع الخاصة", icon: "fa-light fa-diagram-project", section: "المشاريع" },
  { match: /^\/consultants/, title: "الاستشاريون", icon: "fa-light fa-user-tie", section: "المشاريع" },
  { match: /^\/project-owners/, title: "ملاك المشاريع", icon: "fa-light fa-user", section: "المشاريع" },
  { match: /^\/project-parties/, title: "جهات المشاريع", icon: "fa-light fa-building", section: "المشاريع" },

  // الموارد البشرية
  { match: /^\/monitoring/, title: "لوحة المتابعة", icon: "fa-light fa-gauge-high", section: "المتابعة" },
  { match: /^\/employees/, title: "الموظفون", icon: "fa-light fa-users", section: "الموارد البشرية" },
  { match: /^\/engineers/, title: "المهندسون", icon: "fa-light fa-user-gear", section: "الموارد البشرية" },
  { match: /^\/vacations/, title: "الإجازات", icon: "fa-light fa-calendar-check", section: "الموارد البشرية" },
  { match: /^\/check-attendance/, title: "تسجيل الحضور", icon: "fa-light fa-check-circle", section: "الموارد البشرية" },
  { match: /^\/custodies/, title: "العهد", icon: "fa-solid fa-box", section: "الموارد البشرية" },
  { match: /^\/profile/, title: "الملف الشخصي", icon: "fa-light fa-id-card", section: "الموارد البشرية" },

  // الإدارة والإعدادات
  { match: /^\/contract-settings/, title: "إعدادات العقد", icon: "fa-light fa-file-signature", section: "النظام" },
  { match: /^\/access-management/, title: "إدارة الصلاحيات", icon: "fa-light fa-shield-halved", section: "النظام" },
  { match: /^\/add-account/, title: "الحسابات", icon: "fa-light fa-user-plus", section: "النظام" },
  { match: /^\/accounts/, title: "الحسابات", icon: "fa-light fa-user-plus", section: "النظام" },
  { match: /^\/branches/, title: "الفروع", icon: "fa-light fa-code-branch", section: "النظام" },
  { match: /^\/offices/, title: "المكاتب", icon: "fa-light fa-building-columns", section: "النظام" },
  { match: /^\/districts/, title: "الأحياء", icon: "fa-light fa-map-location-dot", section: "النظام" },
  { match: /^\/tasktype/, title: "نوع أمر العمل", icon: "fa-light fa-briefcase", section: "النظام" },
  { match: /^\/notification/, title: "الإشعارات", icon: "fa-light fa-bell", section: "النظام" },
  { match: /^\/reports/, title: "التقارير والمؤشرات", icon: "fa-light fa-chart-line", section: "التقارير" },
  { match: /^\/about/, title: "عن البرنامج", icon: "fa-light fa-circle-info", section: "النظام" },
  { match: /^\/contactus/, title: "تواصل معنا", icon: "fa-light fa-envelope", section: "النظام" },
];

/** هل هذا المسار بلا رأس؟ */
export function isBareRoute(pathname) {
  return BARE_ROUTES.some((pattern) => pattern.test(pathname));
}

/**
 * رأس المسار. غير المسجَّل يأخذ عنواناً مشتقاً من مساره — رأس عام خير من
 * صفحة بلا رأس، ويُنبّه إلى أن السطر لم يُضَف بعد.
 */
export function resolvePageHeader(pathname) {
  const found = ROUTES.find((route) => route.match.test(pathname));
  if (found) return { title: found.title, icon: found.icon, section: found.section };

  const segment = pathname.split("/").filter(Boolean)[0] || "";
  const title = segment
    ? segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "عصف";

  return { title, icon: "fa-light fa-file", section: null };
}
