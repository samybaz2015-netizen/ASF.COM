import axiosInstance from "../api/apiClient";

const BASE = "Monitoring";

export function errorMessage(err, fallback = "تعذّر التنفيذ.") {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.title ||
    err?.message ||
    fallback
  );
}

/**
 * اللوحة كاملة.
 *
 * الفلاتر تُرسل في الجسم لا في الرابط: بعضها تواريخ ومعرّفات كثيرة، وسلسلة
 * الاستعلام تطول وتُقصّ.
 */
export async function fetchBoard(filter = {}) {
  const { data } = await axiosInstance.post(`${BASE}/board`, clean(filter));
  return data;
}

export async function fetchOptions() {
  const { data } = await axiosInstance.get(`${BASE}/options`);
  return data || {};
}

/** الحقول الفارغة تُحذف: الخادم يفرّق بين «بلا فلتر» و«فلتر فارغ». */
function clean(filter) {
  const out = {};

  Object.entries(filter).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;
    out[key] = value;
  });

  return out;
}
