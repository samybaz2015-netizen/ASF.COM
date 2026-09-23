/**
 * تحويل كتالوج الصلاحيات المسطّح القادم من الخلفية إلى شجرة معروضة.
 *
 * الخلفية تعيد { Module: ["Module.Action", ...] } بلا أسماء عربية ولا ترتيب
 * ولا وصف. الأسماء هنا خريطة عرض فقط؛ المصدر الرسمي يبقى الكود القادم من
 * الخلفية، وأي صلاحية جديدة تظهر تلقائياً في الشجرة ولو لم تُترجم بعد
 * (البند 49: لا تعديل يدوي للصفحة عند إضافة قسم جديد).
 */

const MODULE_LABELS = {
  Construction: "الإنشاءات",
  Emergency: "الطوارئ",
  Maintenance: "الصيانة",
  NewProject: "المشاريع الجديدة",
  PrivateProject: "المشاريع الخاصة",
  RehabilitationWorks: "أعمال التأهيل",
  Attendance: "الحضور",
  LeaveRequest: "الإجازات",
  Custody: "العهد",
  Employees: "العاملون",
  Branch: "الفروع",
  Office: "المكاتب",
  Neighborhood: "الأحياء",
  Consultant: "الاستشاريون",
  Contractor: "المقاولون",
  ProjectOwner: "ملاك المشاريع",
  ProjectParty: "جهات المشاريع",
  PricingItems: "بنود التسعير",
  WorkOrderType: "أنواع أوامر العمل",
  Notifications: "الإشعارات",
  Users: "المستخدمون",
  Permissions: "الصلاحيات",
  Reports: "التقارير",
  Dashboard: "لوحة المؤشرات",
  DailyExecution: "تحديث التنفيذ اليومي",
  Search: "البحث",
};

const ACTION_LABELS = {
  View: "عرض",
  Create: "إنشاء",
  Update: "تعديل",
  Edit: "تعديل",
  Delete: "حذف",
  Approve: "اعتماد",
  Return: "إعادة",
  Reject: "رفض",
  Archive: "أرشفة",
  Print: "طباعة",
  Export: "تصدير",
  Upload: "رفع ملفات",
  Download: "تحميل",
  Assign: "إسناد",
  Manage: "إدارة",
  CheckIn: "تسجيل حضور",
  CheckOut: "تسجيل انصراف",
  AddNote: "إضافة ملاحظة",
  AddInvoice: "إضافة فاتورة",
  Close: "إغلاق",
  ManagePermissions: "إدارة الصلاحيات",
  ViewAll: "عرض الجميع",
  Submit: "إرسال",
  Review: "مراجعة",
};

/** الإجراءات التي تُعدّ حساسة وتستحق تمييزاً بصرياً (البندان 20 و36). */
const SENSITIVE_ACTIONS = new Set([
  "Delete",
  "Approve",
  "Reject",
  "Manage",
  "ManagePermissions",
  "Archive",
  "ViewAll",
]);

export function splitCode(code) {
  const index = String(code).indexOf(".");
  if (index === -1) return { module: code, action: "" };
  return { module: code.slice(0, index), action: code.slice(index + 1) };
}

export function moduleLabel(moduleKey) {
  return MODULE_LABELS[moduleKey] || moduleKey;
}

export function actionLabel(actionKey) {
  return ACTION_LABELS[actionKey] || actionKey;
}

export function isSensitive(code) {
  return SENSITIVE_ACTIONS.has(splitCode(code).action);
}

/**
 * يبني الشجرة من كتالوج الخلفية.
 * @returns {{key, label, permissions: [{code, action, label, sensitive}]}[]}
 */
export function buildPermissionTree(catalog) {
  return Object.entries(catalog || {})
    .map(([moduleKey, codes]) => ({
      key: moduleKey,
      label: moduleLabel(moduleKey),
      permissions: (codes || []).map((code) => {
        const { action } = splitCode(code);
        return {
          code,
          action,
          label: actionLabel(action),
          sensitive: SENSITIVE_ACTIONS.has(action),
        };
      }),
    }))
    .filter((group) => group.permissions.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "ar"));
}

/** يصفّي الشجرة بنص البحث — يطابق اسم القسم أو الإجراء أو الكود (البند 10). */
export function filterTree(tree, term) {
  const needle = term.trim().toLowerCase();
  if (!needle) return tree;

  return tree
    .map((group) => {
      const groupMatches =
        group.label.toLowerCase().includes(needle) || group.key.toLowerCase().includes(needle);

      const permissions = groupMatches
        ? group.permissions
        : group.permissions.filter(
            (permission) =>
              permission.label.toLowerCase().includes(needle) ||
              permission.code.toLowerCase().includes(needle)
          );

      return { ...group, permissions };
    })
    .filter((group) => group.permissions.length > 0);
}

/** حالة مربع القسم: none | some | all — لدعم Indeterminate (البند 9). */
export function groupState(group, selected) {
  const total = group.permissions.length;
  const checked = group.permissions.filter((p) => selected.has(p.code)).length;
  if (checked === 0) return "none";
  if (checked === total) return "all";
  return "some";
}

/** فروق ما قبل الحفظ (البند 32). */
export function diffPermissions(original, next) {
  const added = [...next].filter((code) => !original.has(code));
  const removed = [...original].filter((code) => !next.has(code));
  return { added, removed, hasChanges: added.length > 0 || removed.length > 0 };
}

export function describeCode(code) {
  const { module, action } = splitCode(code);
  return `${moduleLabel(module)} — ${actionLabel(action)}`;
}
