import * as XLSX from "xlsx";

import axiosInstance from "../api/apiClient";

/**
 * تصدير أوامر العمل بكل تفاصيلها إلى إكسل.
 *
 * الصفوف تُجلب من الخادم بنفس الصلاحية ونطاق الصفحة والفلاتر التي تبني
 * الجدول، لا من الحالة المحلية للصفحة. فلا يحمل الملف صفاً لا يحقّ للمستخدم
 * رؤيته حتى لو كانت الصفحة تحتفظ به في ذاكرتها.
 */

const NOT_SET = "غير محدد";

const text = (value) =>
  value === null || value === undefined || value === "" || value === "null" ? NOT_SET : value;

const yesNo = (value) => (value === null || value === undefined ? NOT_SET : value ? "نعم" : "لا");

/** التواريخ غير المضبوطة تصل كسنة 1، فتُكتب «غير محدد» بدل تاريخ بلا معنى. */
const date = (value) => {
  if (!value) return NOT_SET;
  const d = new Date(value);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 1900) return NOT_SET;
  return d.toLocaleDateString("ar-EG");
};

/**
 * ترتيب الأعمدة كما يقرأها المدقّق: التصنيف، ثم موقع أمر العمل في المسار،
 * ثم تعريفه، ثم أطرافه، ثم تواريخه، ثم قيمه، ثم تنفيذه.
 */
const COLUMNS = [
  ["القسم", (r) => text(r.projectTypeLabel)],
  ["رقم العقد", (r) => text(r.contractNumber)],
  ["الإدارة/القسم", (r) => text(r.departmentName)],
  ["السلة الحالية", (r) => text(r.basketName)],
  ["تاريخ دخول السلة", (r) => date(r.enteredBasketAt)],
  ["المكوث (يوم)", (r) => r.daysInBasket ?? 0],
  ["المهام الإلزامية", (r) => `${r.mandatoryTasksDone ?? 0}/${r.mandatoryTasksTotal ?? 0}`],

  ["رقم أمر العمل", (r) => text(r.orderNumber)],
  ["رقم الطلب/المهمة", (r) => text(r.taskNumber)],
  ["رمز أمر العمل", (r) => text(r.workOrderCode)],
  ["الأولوية", (r) => text(r.priority)],
  ["الجهد", (r) => text(r.voltageLevel)],
  ["رقم القطعة", (r) => text(r.plotNumber)],
  ["رقم المخطط", (r) => text(r.planNumber)],
  ["اسم المشترك", (r) => text(r.subscriberName)],
  ["تاريخ الاعتماد", (r) => date(r.approvalDate)],
  ["مسودة", (r) => yesNo(r.isDraft)],
  ["نوع أمر العمل", (r) => text(r.workOrderType)],
  ["تصنيف الأمر", (r) => text(r.orderType)],
  ["وصف العمل", (r) => text(r.workDescription)],
  ["رقم المحطة", (r) => text(r.stationNumber)],
  ["رقم البلاغ", (r) => text(r.notificationNumber)],

  ["الحي", (r) => text(r.district)],
  ["الموقع", (r) => text(r.projectPlace)],
  ["المكتب", (r) => text(r.office)],
  ["الفرع", (r) => text(r.branchName)],
  ["الإحداثيات", (r) => text(r.coordinates)],

  ["المقاول", (r) => text(r.contractor)],
  ["الاستشاري", (r) => text(r.consultant)],
  ["مالك المشروع", (r) => text(r.projectOwner)],
  ["جهة المشروع", (r) => text(r.projectParty)],

  ["تاريخ الإسناد", (r) => date(r.orderDate)],
  ["تاريخ الاستلام", (r) => date(r.receiveDateTime)],
  ["تاريخ الإنشاء", (r) => date(r.createAt)],
  ["مدة التنفيذ", (r) => text(r.durationOfImplementation)],
  ["تاريخ الإنجاز", (r) => text(r.completionDate)],
  ["أيام التأخير", (r) => text(r.numberOfDaysDelayed)],
  ["الأيام المتبقية", (r) => text(r.numberOfDaysRemaining)],

  ["القيمة التقديرية", (r) => text(r.estimatedValue)],
  ["القيمة الفعلية", (r) => text(r.actualValue)],
  ["قيمة المشروع", (r) => text(r.projectValue)],
  ["رقم المستخلص", (r) => text(r.extractNumber)],

  ["الحالة", (r) => text(r.situation)],
  ["مرحلة التنفيذ", (r) => text(r.implementationPhase)],
  ["نسبة الحفر", (r) => text(r.completionStatusReport)],
  ["نسبة الكابل", (r) => text(r.cableCompletion)],

  ["مخالفات سلامة", (r) => yesNo(r.safetyViolationsExist)],
  ["وصف المخالفة", (r) => text(r.descriptionViolation)],
  ["نوع الاختبار", (r) => text(r.typeOfStomachTest)],
  ["عدد المعدات", (r) => r.numberOfEquipment ?? 0],

  ["معتمد", (r) => yesNo(r.isApprove)],
  ["سبب الرفض", (r) => text(r.rejectionReason)],
  ["مؤرشف", (r) => yesNo(r.isArchived)],
  ["أنشأه", (r) => text(r.userName)],
  ["ملاحظات", (r) => text(r.note)],
];

/** يجلب صفوف التصدير من الخادم بالفلتر الحالي. */
export async function fetchExportRows(filter) {
  const { data } = await axiosInstance.post("WorkOrderFlow/export", filter || {});
  return data || [];
}

/** يبني المصنّف وينزّله. يعيد عدد الصفوف المصدَّرة. */
export function writeWorkbook(rows, fileName) {
  const table = rows.map((row) => {
    const out = {};
    COLUMNS.forEach(([header, read]) => {
      out[header] = read(row);
    });
    return out;
  });

  const sheet = XLSX.utils.json_to_sheet(table);

  // عرض ثابت معقول لكل عمود: الافتراضي يقصّ العناوين العربية.
  sheet["!cols"] = COLUMNS.map(([header]) => ({ wch: Math.max(12, Math.min(28, header.length + 6)) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "أوامر العمل");
  XLSX.writeFile(workbook, fileName);

  return table.length;
}

/**
 * يجلب ثم ينزّل. الاسم يحمل التاريخ ليُميَّز التصديران في اليوم نفسه.
 */
export async function exportWorkOrders(filter, label = "أوامر-العمل") {
  const rows = await fetchExportRows(filter);
  if (rows.length === 0) return 0;

  const stamp = new Date().toISOString().slice(0, 10);
  return writeWorkbook(rows, `${label}-${stamp}.xlsx`);
}

export function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}
