import axiosInstance from "../api/apiClient";

/**
 * استيراد أوامر العمل من إكسل.
 *
 * الواجهة تقرأ الملف وترسل صفوفه نصوصاً؛ الخادم يتحقّق ثم يكتب. dryRun افتراضه
 * true فلا يُكتب شيء قبل مراجعة نتيجة الفحص.
 */
export async function importWorkOrders({
  contractId,
  departmentId,
  rows,
  dryRun = true,
  skipDuplicates = true,
}) {
  const { data } = await axiosInstance.post("WorkOrderImport", {
    contractId,
    departmentId,
    rows,
    dryRun,
    skipDuplicates,
  });
  return data;
}

export function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}
