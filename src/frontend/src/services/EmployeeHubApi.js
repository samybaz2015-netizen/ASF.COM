import axiosInstance from "../api/apiClient";

const BASE = "EmployeeHub";

/** رسالة الخطأ كما أرسلها الخادم، لا «حدث خطأ ما». */
export function errorMessage(err, fallback = "تعذّر التنفيذ.") {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.title ||
    err?.message ||
    fallback
  );
}

// ─────────── السجلّ والملف ───────────

export async function fetchEmployees({ search, branchId, includeInactive } = {}) {
  const { data } = await axiosInstance.get(BASE, {
    params: {
      ...(search ? { search } : {}),
      ...(branchId ? { branchId } : {}),
      ...(includeInactive ? { includeInactive: true } : {}),
    },
  });
  return data || [];
}

export async function fetchProfile(userId) {
  const { data } = await axiosInstance.get(`${BASE}/${userId}`);
  return data;
}

export async function updateProfile(userId, payload) {
  const { data } = await axiosInstance.put(`${BASE}/${userId}`, payload);
  return data;
}

// ─────────── المستندات ───────────

export async function fetchDocuments(userId) {
  const { data } = await axiosInstance.get(`${BASE}/${userId}/documents`);
  return data || [];
}

export async function uploadDocument(userId, { file, kind, expiresAt, note }) {
  const form = new FormData();
  form.append("File", file);
  if (kind) form.append("Kind", kind);
  if (expiresAt) form.append("ExpiresAt", expiresAt);
  if (note) form.append("Note", note);

  const { data } = await axiosInstance.post(`${BASE}/${userId}/documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteDocument(documentId) {
  await axiosInstance.delete(`${BASE}/documents/${documentId}`);
}

// ─────────── الإجازات والتقويم ───────────

export async function fetchLeaves({ userId, from, to } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/leaves`, {
    params: {
      ...(userId ? { userId } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    },
  });
  return data || [];
}

export async function fetchCalendar({ from, to, branchId } = {}) {
  const { data } = await axiosInstance.get(`${BASE}/calendar`, {
    params: {
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(branchId ? { branchId } : {}),
    },
  });
  return data || [];
}

// ─────────── الاستيراد ───────────

export async function importEmployees({ rows, dryRun = true, updateExisting = true }) {
  const { data } = await axiosInstance.post(`${BASE}/import`, {
    rows,
    dryRun,
    updateExisting,
  });
  return data;
}
