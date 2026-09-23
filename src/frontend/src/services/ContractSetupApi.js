import axiosInstance from "../api/apiClient";

/**
 * إعدادات العقد: أنواع أوامر العمل، وفريق العمل وصلاحياته.
 */

const BASE = "ContractSetup";

/** تصنيف العقد. */
export const CONTRACT_KINDS = [
  { code: "Unified", label: "العقد الموحد" },
  { code: "Private", label: "عقد خاص" },
  { code: "Other", label: "أعمال أخرى" },
];

export function kindLabel(code) {
  return CONTRACT_KINDS.find((k) => k.code === code)?.label || code;
}

// ───────────── أنواع أوامر العمل ─────────────

export async function fetchTypes(contractId, includeInactive = true, category = null) {
  const { data } = await axiosInstance.get(`${BASE}/contracts/${contractId}/types`, {
    params: { includeInactive, ...(category ? { category } : {}) },
  });
  return data || [];
}

export async function addType(contractId, payload) {
  const { data } = await axiosInstance.post(`${BASE}/contracts/${contractId}/types`, payload);
  return data;
}

export async function updateType(typeId, payload) {
  const { data } = await axiosInstance.put(`${BASE}/types/${typeId}`, payload);
  return data;
}

/** يعيد ترتيب القيم؛ تُرسل القائمة كاملةً بالترتيب الجديد. */
export async function reorderTypes(contractId, ids, category = null) {
  const { data } = await axiosInstance.post(`${BASE}/contracts/${contractId}/types/reorder`, {
    ids,
    category,
  });
  return data || [];
}

export async function deleteType(typeId) {
  await axiosInstance.delete(`${BASE}/types/${typeId}`);
}

/** يضيف أنواع الإنشاءات المعتادة: إيصال · حلال · ربط · تعزيز. */
export async function seedTypes(contractId, departmentId) {
  const { data } = await axiosInstance.post(
    `${BASE}/contracts/${contractId}/departments/${departmentId}/seed-types`
  );
  return data || [];
}

// ───────────── فريق العمل ─────────────

export async function fetchTeam(contractId) {
  const { data } = await axiosInstance.get(`${BASE}/contracts/${contractId}/team`);
  return data || [];
}

export async function upsertTeamPermission(contractId, payload) {
  const { data } = await axiosInstance.post(`${BASE}/contracts/${contractId}/team`, payload);
  return data;
}

export async function removeTeamPermission(id) {
  await axiosInstance.delete(`${BASE}/team/${id}`);
}

export function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}
