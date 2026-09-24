import { getUserToken } from "../../function/AuthStorage";


// ─── User type definitions ────────────────────────────────────────────────
export const USER_TYPES = [
  { key: "eng",           label: "المهندسين",    ar: "مهندس"     },
  { key: "supervisor",    label: "المشرفين",      ar: "مشرف"      },
  { key: "officemanager", label: "مديرو المكاتب", ar: "مدير مكتب" },
  { key: "admin",         label: "المسؤولين",     ar: "ادمن"      },
  { key: "contractor",    label: "المقاولين",     ar: "مقاول"     },
];

// ── Badge classNames بدل الألوان الخام ──────────────────────────────────
export const TYPE_BADGE = {
  admin:         "bg-[rgba(42,56,91,0.08)] text-mainColor",
  officemanager: "bg-[rgba(188,145,92,0.1)] text-secondaryColor",
  contractor:    "bg-[rgba(34,197,94,0.1)] text-green-500",
  eng:           "bg-[rgba(42,56,91,0.08)] text-mainColor",
  supervisor:    "bg-[rgba(42,56,91,0.08)] text-mainColor",
};

// ─── Permissions translation maps ───────────────────────────────────────
export const MODULE_AR = {
  Construction:   "البناء",
  Emergency:      "الطوارئ",
  Maintenance:    "الصيانة",
  NewProject:     "مشروع جديد",
  PrivateProject: "مشروع خاص",
  Attendance:     "الحضور",
  LeaveRequest:   "طلبات الإجازة",
  Custody:        "العهدة",
  Employees:      "الموظفون",
  Branch:         "الفروع",
  Office:         "المكاتب",
  Neighborhood:   "الأحياء",
  Consultant:     "الاستشاريون",
  Contractor:     "المقاولون",
  WorkOrderType:  "أنواع أوامر العمل",
  JobDescription: "الوصف الوظيفي",
  Notifications:  "الإشعارات",
  Users:          "المستخدمون",
  ProjectOwner:   "ملاك المشاريع",
  ProjectParty:   "جهات المشاريع",
  PricingItems:   "بنود الاعمال",
};

export const PERM_AR = {
  View:              "عرض",
  Create:            "إنشاء",
  Update:            "تعديل",
  Delete:            "حذف",
  Approve:           "اعتماد",
  Archive:           "أرشفة",
  CheckIn:           "تسجيل دخول",
  CheckOut:          "تسجيل خروج",
  AddNote:           "إضافة ملاحظة",
  AddInvoice:        "إضافة فاتورة",
  Close:             "إغلاق",
  ManagePermissions: "إدارة الصلاحيات",
};

// ─── Branches ────────────────────────────────────────────────────────────
// ملاحظة: الفروع دلوقتي اتنين بس وثابتة حسب البيانات اللي عندك.
// لو زاد عدد الفروع مستقبلًا، الأفضل تجيبهم من endpoint بدل الهاردكود هنا.
export const BRANCH_MAP = {
  1: "جدة",
  2: "منطقة الرياض",
};

/**
 * يرجّع الفرع "التاني" غير فرع الحساب الأساسي (لعرضه كـ Tab في مودال الصلاحيات).
 * @param {number|string} branchId - فرع الحساب الأساسي (acc.branchId)
 * @returns {{id:number, name:string}|null}
 */
export const getOtherBranch = (branchId) => {
  const entry = Object.entries(BRANCH_MAP).find(
    ([id]) => Number(id) !== Number(branchId),
  );
  return entry ? { id: Number(entry[0]), name: entry[1] } : null;
};

// ─── Auth helpers ────────────────────────────────────────────────────────
export const getToken = () => {
 return getUserToken();
};

export const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

// ─── Misc helpers ────────────────────────────────────────────────────────
export const arType = (t) =>
  USER_TYPES.find((u) => u.key === t?.toLowerCase())?.ar || t;

export const myType = () => localStorage.getItem("userType");

// ── Reusable button classNames بدل btnStyle ───────────────────────────
export const btnClass = (variant = "light") => {
  const base = "px-5 py-2 rounded-lg border-none font-bold text-sm cursor-pointer font-cairo";
  const variants = {
    light: "bg-[rgba(42,56,91,0.08)] text-mainColor",
    dark:  "bg-mainColor text-white",
    red:   "bg-red-500 text-white",
  };
  return `${base} ${variants[variant]}`;
};