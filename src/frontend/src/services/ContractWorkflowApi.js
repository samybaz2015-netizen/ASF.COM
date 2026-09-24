import axiosInstance from "../api/apiClient";

/**
 * طبقة الاتصال بإعدادات العقد: الأقسام والسلال والمهام.
 *
 * التحرير كله يجري على مسودة المسار. لا شيء يسري على أوامر العمل حتى يُستدعى
 * publishWorkflow. والسلال يُشار إليها بالمعرّف لا بالاسم، فإعادة التسمية أو
 * الترتيب لا تكسر أي ارتباط قائم.
 */

const BASE = "ContractWorkflow";

// ───────────── العقود ─────────────

export async function fetchContracts(includeInactive = false) {
  const { data } = await axiosInstance.get(`${BASE}/contracts`, {
    params: { includeInactive },
  });
  return data || [];
}

export async function createContract(payload) {
  const { data } = await axiosInstance.post(`${BASE}/contracts`, payload);
  return data;
}

export async function updateContract(contractId, payload) {
  const { data } = await axiosInstance.put(`${BASE}/contracts/${contractId}`, payload);
  return data;
}

// ───────────── الأقسام ─────────────

export async function fetchDepartments(contractId, includeInactive = false) {
  const { data } = await axiosInstance.get(`${BASE}/contracts/${contractId}/departments`, {
    params: { includeInactive },
  });
  return data || [];
}

export async function createDepartment(contractId, payload) {
  const { data } = await axiosInstance.post(`${BASE}/contracts/${contractId}/departments`, payload);
  return data;
}

export async function updateDepartment(departmentId, payload) {
  const { data } = await axiosInstance.put(`${BASE}/departments/${departmentId}`, payload);
  return data;
}

export async function reorderDepartments(contractId, orderedIds) {
  await axiosInstance.put(`${BASE}/contracts/${contractId}/departments/order`, { orderedIds });
}

// ───────────── المسار ─────────────

/** المسودة القابلة للتحرير — تُنشأ من النسخة المنشورة عند أول فتح. */
export async function fetchDraft(departmentId) {
  const { data } = await axiosInstance.get(`${BASE}/departments/${departmentId}/draft`);
  return data;
}

/** المسار المعتمد الذي يعمل عليه النظام؛ يعيد null إن لم يُعتمد شيء بعد. */
export async function fetchPublished(departmentId) {
  try {
    const { data } = await axiosInstance.get(`${BASE}/departments/${departmentId}/published`);
    return data;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

export async function fetchPreview(workflowId) {
  const { data } = await axiosInstance.get(`${BASE}/workflows/${workflowId}/preview`);
  return data;
}

export async function publishWorkflow(workflowId, note) {
  const { data } = await axiosInstance.post(`${BASE}/workflows/${workflowId}/publish`, { note });
  return data;
}

// ───────────── السلال المقترحة ─────────────

/** قالب السلال المقترحة للقسم، أو null إن لم يكن لنوعه قالب. */
export async function fetchTemplate(departmentId) {
  try {
    const { data } = await axiosInstance.get(`${BASE}/departments/${departmentId}/template`);
    return data;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

/** يطبّق القالب على المسودة الفارغة ويعيد المسار بعد التطبيق. */
export async function applyTemplate(departmentId) {
  const { data } = await axiosInstance.post(`${BASE}/departments/${departmentId}/apply-template`);
  return data;
}

// ───────────── السلال ─────────────

export async function addBasket(workflowId, payload) {
  const { data } = await axiosInstance.post(`${BASE}/workflows/${workflowId}/baskets`, payload);
  return data;
}

export async function updateBasket(basketId, payload) {
  const { data } = await axiosInstance.put(`${BASE}/baskets/${basketId}`, payload);
  return data;
}

export async function reorderBaskets(workflowId, orderedIds) {
  await axiosInstance.put(`${BASE}/workflows/${workflowId}/baskets/order`, { orderedIds });
}

export async function deleteBasket(basketId) {
  await axiosInstance.delete(`${BASE}/baskets/${basketId}`);
}

// ───────────── مهام السلة ─────────────

export async function addTask(basketId, payload) {
  const { data } = await axiosInstance.post(`${BASE}/baskets/${basketId}/tasks`, payload);
  return data;
}

export async function updateTask(taskId, payload) {
  const { data } = await axiosInstance.put(`${BASE}/tasks/${taskId}`, payload);
  return data;
}

export async function reorderTasks(basketId, orderedIds) {
  await axiosInstance.put(`${BASE}/baskets/${basketId}/tasks/order`, { orderedIds });
}

export async function deleteTask(taskId) {
  await axiosInstance.delete(`${BASE}/tasks/${taskId}`);
}

// ───────────── سجل التغييرات ─────────────

export async function fetchAuditLog(contractId, departmentId, take = 100) {
  const { data } = await axiosInstance.get(`${BASE}/contracts/${contractId}/audit`, {
    params: { departmentId: departmentId || undefined, take },
  });
  return data || [];
}

/** رسالة الخطأ التي تعيدها الخلفية، أو نص بديل. */
export function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}
