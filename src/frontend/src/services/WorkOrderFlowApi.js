import axiosInstance from "../api/apiClient";

/**
 * حركة أمر العمل داخل مسار السلال.
 *
 * أمر العمل يُشار إليه بـ (نوع المشروع + معرّفه) لأن النظام لا يملك جدول أوامر
 * عمل موحّداً، بل خمسة أنواع في خمسة جداول متوازية.
 */

const BASE = "WorkOrderFlow";

/**
 * تحويل مفتاح المسار في الواجهة إلى رمز النوع في الخلفية.
 *
 * «أعمال التأهيل» (rehabilitationworks) هو كيان NewProject نفسه: نقطة إنشائه
 * create-rehabilitationWorks تكتب في NewProjects، وبحثه يقرأ من الجدول نفسه.
 */
const ROUTE_TO_CODE = {
  construction: "Construction",
  maintenance: "Maintenance",
  emergency: "Emergency",
  rehabilitationworks: "NewProject",
  newproject: "NewProject",
  privateproject: "PrivateProject",
  private: "PrivateProject",
};

export function toProjectTypeCode(routeType) {
  return ROUTE_TO_CODE[String(routeType || "").toLowerCase()] || null;
}

/** موقع أمر العمل، أو null إن لم يدخل المسار بعد. */
export async function fetchPlacement(typeCode, workOrderId) {
  try {
    const { data } = await axiosInstance.get(`${BASE}/${typeCode}/${workOrderId}`);
    return data;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

export async function fetchHistory(typeCode, workOrderId) {
  const { data } = await axiosInstance.get(`${BASE}/${typeCode}/${workOrderId}/history`);
  return data || [];
}

export async function enterWorkflow(typeCode, workOrderId, departmentId, note) {
  const { data } = await axiosInstance.post(`${BASE}/enter`, {
    projectTypeCode: typeCode,
    workOrderId,
    departmentId,
    note,
  });
  return data;
}

export async function moveWorkOrder(typeCode, workOrderId, toBasketStableKey, note) {
  const { data } = await axiosInstance.post(`${BASE}/${typeCode}/${workOrderId}/move`, {
    toBasketStableKey,
    note,
  });
  return data;
}

export async function setTaskState(typeCode, workOrderId, taskStableKey, isDone, note) {
  const { data } = await axiosInstance.put(`${BASE}/${typeCode}/${workOrderId}/tasks`, {
    taskStableKey,
    isDone,
    note,
  });
  return data;
}

/** توزيع أوامر العمل على سلال قسم. */
export async function fetchBasketLoad(departmentId) {
  const { data } = await axiosInstance.get(`${BASE}/departments/${departmentId}/load`);
  return data || [];
}

/**
 * ترحيل أوامر العمل القائمة من الحالة النصّية إلى السلال.
 * dryRun يبقى true افتراضياً — لا كتابة قبل مراجعة النتيجة.
 */
export async function backfill({ departmentId, dryRun = true, fallbackBasketStableKey = null }) {
  const { data } = await axiosInstance.post(`${BASE}/backfill`, {
    departmentId,
    dryRun,
    fallbackBasketStableKey,
  });
  return data;
}

export function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}
