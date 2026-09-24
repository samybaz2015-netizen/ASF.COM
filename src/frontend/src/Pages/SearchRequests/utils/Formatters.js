import { SITUATION_MAP, ARABIC_FIELD_NAMES } from "./Ordersconfig";

export const parseNumber = (value) =>
  value === "" || value === null || value === undefined || isNaN(value) ? 0 : Number(value);

export const formatDateShort = (date) => {
  if (!date) return "لا يوجد";
  const iso = String(date).split("T")[0];
  return iso || "لا يوجد";
};

export const formatDateLong = (date) => {
  if (!date) return "لا يوجد";

  try {
    return new Date(date).toLocaleDateString("ar-SA", {
      calendar: "gregory",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "لا يوجد";
  }
};

export const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "لا يوجد";
  if (typeof value === "number") return value.toLocaleString("ar-SA");
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  return value;
};

export const formatCurrency = (value) => {
  const n = parseNumber(value);
  return n.toLocaleString("ar-SA", { maximumFractionDigits: 2 });
};

export const getSituationInfo = (situation) =>
  SITUATION_MAP[situation] || { label: situation || "غير محدد", tone: "neutral" };

export const getArabicFieldName = (field) => ARABIC_FIELD_NAMES[field] || field;

export const formatFieldValue = (key, value) => {
  if (key.toLowerCase().includes("date")) return formatDateLong(value);
  return formatValue(value);
};

// أعمدة الجدول بناءً على شكل البيانات الفعلي القادم من الـ API
export const TABLE_COLUMNS = [
  { key: "id", label: "رقم الطلب" },
  { key: "type", label: "نوع المشروع" },
  { key: "faultNumber", label: "رقم أمر العمل" },
  { key: "contractNumber", label:  "رقم العقد" },
  { key: "workOrderType", label: "نوع أمر العمل" },
  { key: "workDescription", label: "وصف العمل" },
  { key: "situation", label: "الحالة" },
  { key: "district", label: "المنطقة" },
  { key: "office", label: "المكتب" },
  { key: "contractor", label: "المقاول" },
  { key: "consultant", label: "المهندس الاستشاري" },
  { key: "orderDate", label: "تاريخ الإسناد" },
  { key: "receiveDateTime", label: "تاريخ الاستلام" },
  { key: "durationOfImplementation", label: "مدة التنفيذ" },
  { key: "estimatedValue", label: "القيمة التقديرية" },
  { key: "actualValue", label: "القيمة الفعلية" },
  { key: "extractNumber", label: "رقم المستخلص" },
  { key: "safetyViolationsExist", label: "مخالفات السلامة" },
  { key: "note", label: "ملاحظات" },
];

// الأعمدة الظاهرة افتراضيًا عند فتح الصفحة (تقدر تقلل العدد حسب اللي محتاجه)
export const DEFAULT_VISIBLE_COLUMNS = [
  "id",
  "type",
  "faultNumber",
  "contractNumber",
  "workOrderType",
  "situation",
  "district",
  "office",
  "contractor",
  "orderDate",
];