// إعدادات الفلاتر وثوابت صفحة البحث عن الطلبات
// أي إضافة/تعديل على الفلاتر يتم من هنا فقط، باقي المكونات بتقرأ من هنا

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const FILTER_CONFIG = [
  { key: "BranchName", label: "الفرع", type: "select", options: ["الرياض", "جدة", "منطقه الرياض"] },
  { key: "OfficeName", label: "المكتب", type: "dynamic-select", dataKey: "office" },
  { key: "Situation", label: "الوضع", type: "dynamic-select", dataKey: "situation" },
  { key: "Contractor", label: "المقاول", type: "dynamic-select", dataKey: "contractor" },
  { key: "Consultant", label: "المستشار", type: "dynamic-select", dataKey: "consultant" },
  { key: "District", label: "الحي", type: "dynamic-select", dataKey: "district" },
  { key: "WorkOrderType", label: "نوع أمر العمل", type: "dynamic-select", dataKey: "workOrderType" },
  { key: "OrderType", label: "أمر العمل", type: "dynamic-select", dataKey: "orderType" },
  { key: "FaultNumber", label: "رقم العطل", type: "text" },
  { key: "ContractNumber", label: "رقم العقد", type: "text" },
  { key: "StationNumber", label: "رقم المحطة", type: "text" },
  { key: "SafetyViolationsExist", label: "مخالفات السلامة", type: "boolean" },
  { key: "IsArchived", label: "حالة الأرشفة", type: "boolean" },
  { key: "OrderDateFrom", label: "تاريخ الطلب من", type: "date" },
  { key: "OrderDateTo", label: "تاريخ الطلب إلى", type: "date" },
  { key: "ProjectType", label: "نوع المشروع", type: "dynamic-select", dataKey: "type" },
  { key: "CableLength", label: "طول الكابل", type: "number" },
  { key: "CableCompletionPercentage", label: "نسبة إنجاز الكابل", type: "number" },
];

// كل الأعمدة اللي ممكن تتعرض في الجدول (اتزودت أعمدة جديدة كانت مخفية قبل كده)
export const TABLE_COLUMNS = [
  { key: "requestNumber", label: "رقم الطلب" },
  { key: "projectType", label: "نوع المشروع" },
  { key: "type", label: "نوع العملية" },
  { key: "contractor", label: "المقاول" },
  { key: "consultant", label: "الاستشاري" },
  { key: "stationNumber", label: "رقم المحطة" },
  { key: "district", label: "الحي" },
  { key: "branchName", label: "الفرع" },
  { key: "office", label: "المكتب" },
  { key: "situation", label: "حالة الطلب" },
  { key: "workOrderType", label: "نوع أمر العمل" },
  { key: "orderType", label: "أمر العمل" },
  { key: "faultNumber", label: "رقم العطل" },
  { key: "estimatedValue", label: "القيمة التقديرية" },
  { key: "actualValue", label: "القيمة الفعلية" },
  { key: "extractNumber", label: "رقم المستخلص" },
  { key: "cableLength", label: "طول الكابل" },
  { key: "cableCompletion", label: "نسبة إنجاز الكابل" },
  { key: "durationOfImplementation", label: "مدة التنفيذ" },
  { key: "orderDate", label: "تاريخ الطلب" },
  { key: "receiveDateTime", label: "تاريخ الاستلام" },
  { key: "safetyViolationsExist", label: "مخالفات السلامة" },
  { key: "isArchived", label: "مؤرشف" },
];

// الأعمدة الظاهرة افتراضيًا (باقي الأعمدة تتفتح من زر "أعمدة")
export const DEFAULT_VISIBLE_COLUMNS = [
  "requestNumber",
  "projectType",
  "contractor",
  "consultant",
  "stationNumber",
  "district",
  "situation",
  "orderType",
  "faultNumber",
  "office",
  "actualValue",
  "estimatedValue",
  "orderDate",
];

export const SITUATION_MAP = {
  finish: { label: "تم التنفيذ", tone: "success" },
  notFinished: { label: "تحت التنفيذ", tone: "warning" },
  pending: { label: "جاري", tone: "info" },
};

export const ARABIC_FIELD_NAMES = {
  requestNumber: "رقم الطلب",
  projectType: "نوع المشروع",
  situation: "حالة الطلب",
  branchName: "الفرع",
  office: "المكتب",
  contractor: "المقاول",
  consultant: "الاستشاري",
  stationNumber: "رقم المحطة",
  district: "الحي",
  orderType: "أمر العمل",
  faultNumber: "رقم العطل",
  actualValue: "القيمة الفعلية",
  extractNumber: "رقم المستخلص",
  estimatedValue: "القيمة التقديرية",
  orderDate: "تاريخ الطلب",
  receiveDateTime: "تاريخ الاستلام",
  workDescription: "وصف العمل",
  jobDescription: "وصف العمل",
  type: "نوع العملية",
  workOrderType: "نوع أمر العمل",
  durationOfImplementation: "مدة التنفيذ (يوم)",
  userName: "أنشئ بواسطة",
  cableLength: "طول الكابل",
  cableCompletion: "نسبة إنجاز الكابل",
  safetyViolationsExist: "مخالفات السلامة",
  isArchived: "مؤرشف",
  qualificationClassification: "تصنيف التأهيل",
  note: "ملاحظات",
  projectOwner: "مالك المشروع",
  projectParty: "الجهة",
};