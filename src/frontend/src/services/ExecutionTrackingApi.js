import axiosInstance from "../api/apiClient";

/**
 * متابعة التنفيذ — قراءة توزيع أوامر العمل على السلال.
 *
 * الأقسام الثلاثة (إنشاءات، صيانة، طوارئ) ليست ثابتة في الكود: تُقرأ من أقسام
 * العقد وتُطابق بـ ProjectTypeCode. فإن أضاف العقد قسماً رابعاً ظهر تلقائياً.
 */

/** الأقسام المعروضة في الشاشة، بالترتيب المطلوب. */
export const TRACKED_TYPES = [
  { code: "Construction", label: "الإنشاءات" },
  { code: "Maintenance", label: "الصيانة" },
  { code: "Emergency", label: "الطوارئ" },
];

/** أقسام المتابعة التي يراها المستخدم، بسلالها وأعدادها، مقيَّدة بنطاقه. */
export async function fetchTracking(projectTypeCode) {
  const { data } = await axiosInstance.get("WorkOrderFlow/tracking", {
    params: { projectTypeCode: projectTypeCode || undefined },
  });
  return data || [];
}

export async function fetchBasketLoad(departmentId) {
  const { data } = await axiosInstance.get(`WorkOrderFlow/departments/${departmentId}/load`);
  return data || [];
}

/** بحث أوامر العمل بفلتر عام عبر كل السلال. */
export async function searchWorkOrders(filter) {
  const { data } = await axiosInstance.post("WorkOrderFlow/search", filter);
  return data || [];
}

export async function fetchBasketWorkOrders(departmentId, basketStableKey) {
  const { data } = await axiosInstance.get(
    `WorkOrderFlow/departments/${departmentId}/baskets/${basketStableKey}/work-orders`
  );
  return data || [];
}

/** يعتمد مسار قسم مباشرةً من شاشة المتابعة. */
export async function publishDepartmentWorkflow(workflowId, note) {
  const { data } = await axiosInstance.post(`ContractWorkflow/workflows/${workflowId}/publish`, { note });
  return data;
}

/** يضع أوامر العمل التي لم تدخل أي سلة في أول سلة من المسار المعتمد. */
export async function placeUnplaced(departmentId, includeUnassigned = false) {
  const { data } = await axiosInstance.post(
    `WorkOrderFlow/departments/${departmentId}/place-unplaced`,
    null,
    { params: { includeUnassigned } }
  );
  return data?.placed ?? 0;
}

export function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}
