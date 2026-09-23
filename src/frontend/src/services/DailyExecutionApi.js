import axiosInstance from "../api/apiClient";

/**
 * طبقة الاتصال لصفحة "تحديث التنفيذ اليومي".
 *
 * ملاحظة مهمة على العقد الحالي للخلفية:
 * الحقل executedQuantity في نقاط التحديث هو *كمية اليوم* (زيادة) وليس الإجمالي،
 * والخادم يجمعها على المخزَّن ويعيد totalExecutedQuantity ويكتب سطراً في سجل التحديثات.
 * هذا مستنتج من ExecutedQuantityCell.jsx القائم — راجع docs/daily-execution-update.md
 */

/** أنواع أوامر العمل كما تعرفها الخلفية، ومسار كل نوع. */
export const WORK_ORDER_TYPES = {
  construction: {
    key: "construction",
    label: "إنشاءات",
    entity: "Construction",
    getUrl: (id) => `Construction/get-construction/${id}`,
    bulkUpdateUrl: (id) => `Construction/${id}/pricing-items/executed-quantities`,
    singleUpdateUrl: (id) => `Construction/${id}/pricing-items/executed-quantity`,
    logsUrl: (id) => `Construction/${id}/pricing-items/executed-quantity-logs`,
    permissionPrefix: "Construction",
  },
  maintenance: {
    key: "maintenance",
    label: "صيانة",
    entity: "Maintenance",
    getUrl: (id) => `Maintenance/get-maintenance/${id}`,
    bulkUpdateUrl: (id) => `Maintenance/${id}/update-executed-quantities`,
    singleUpdateUrl: (id) => `Maintenance/${id}/update-executed-quantity`,
    logsUrl: (id) => `Maintenance/${id}/executed-quantity-logs`,
    permissionPrefix: "Maintenance",
  },
  emergency: {
    key: "emergency",
    label: "طوارئ",
    entity: "Emergency",
    getUrl: (id) => `Emergency/get-emergency/${id}`,
    bulkUpdateUrl: (id) => `Emergency/${id}/update-executed-quantities`,
    singleUpdateUrl: (id) => `Emergency/${id}/update-executed-quantity`,
    logsUrl: (id) => `Emergency/${id}/executed-quantity-logs`,
    permissionPrefix: "Emergency",
  },
  rehabilitationworks: {
    key: "rehabilitationworks",
    label: "أعمال تأهيل",
    entity: "RehabilitationWorks",
    // نقطة Search/search-by-orderidWithType ترفض هذه القيمة بـ 400،
    // فتُستثنى من البحث في كل الأنواع ويُختار النوع يدوياً.
    searchable: false,
    getUrl: (id) => `RehabilitationWorks/${id}`,
    bulkUpdateUrl: (id) => `RehabilitationWorks/${id}/update-executed-quantities`,
    singleUpdateUrl: (id) => `RehabilitationWorks/${id}/update-executed-quantity`,
    logsUrl: (id) => `RehabilitationWorks/${id}/executed-quantity-logs`,
    permissionPrefix: "Construction",
  },
};

/** الأنواع التي لا تملك الخلفية لها نقاط تحديث كميات بعد. */
export const UNSUPPORTED_TYPES = [
  { key: "newproject", label: "مشاريع جديدة" },
  { key: "private", label: "مشاريع خاصة" },
];

export function getTypeConfig(typeKey) {
  return WORK_ORDER_TYPES[String(typeKey || "").toLowerCase()] || null;
}

/** يفكّ غلاف الرد الموحّد { statusCode, message, data }. */
function unwrap(payload) {
  if (payload && typeof payload === "object" && "data" in payload && !Array.isArray(payload)) {
    return payload.data;
  }
  return payload;
}

/** البحث عن أمر عمل برقمه ضمن نوع محدد. */
export async function searchWorkOrder({ orderId, type }) {
  const { data } = await axiosInstance.get("Search/search-by-orderidWithType", {
    params: { orderId, type },
  });
  return unwrap(data);
}

/** البحث في كل الأنواع المدعومة وإرجاع أول نتيجة مطابقة. */
export async function searchWorkOrderAcrossTypes(orderId) {
  const searchable = Object.values(WORK_ORDER_TYPES).filter((c) => c.searchable !== false);

  const attempts = await Promise.allSettled(
    searchable.map(async (config) => {
      const result = await searchWorkOrder({ orderId, type: config.key });
      if (!result || (Array.isArray(result) && result.length === 0)) return null;
      return { type: config.key, workOrder: Array.isArray(result) ? result[0] : result };
    })
  );

  const hits = attempts
    .filter((a) => a.status === "fulfilled" && a.value)
    .map((a) => a.value);

  return hits;
}

/** جلب أمر العمل كاملاً ببنوده. */
export async function fetchWorkOrder({ type, id }) {
  const config = getTypeConfig(type);
  if (!config) throw new Error(`نوع أمر عمل غير مدعوم: ${type}`);
  const { data } = await axiosInstance.get(config.getUrl(id));
  return unwrap(data);
}

/**
 * إرسال كميات اليوم لعدة بنود في طلب واحد.
 * items: [{ pricingItemId, dailyQuantity, note }]
 */
export async function submitDailyQuantities({ type, id, items, note }) {
  const config = getTypeConfig(type);
  if (!config) throw new Error(`نوع أمر عمل غير مدعوم: ${type}`);

  const payload = {
    note: note || "",
    items: items.map((item) => ({
      pricingItemId: item.pricingItemId,
      executedQuantity: item.dailyQuantity,
      note: item.note || "",
    })),
  };

  const { data } = await axiosInstance.put(config.bulkUpdateUrl(id), payload);
  return unwrap(data);
}

/** سجل تحديثات الكميات لأمر العمل. */
export async function fetchExecutionLogs({ type, id }) {
  const config = getTypeConfig(type);
  if (!config) throw new Error(`نوع أمر عمل غير مدعوم: ${type}`);
  const { data } = await axiosInstance.get(config.logsUrl(id));
  return unwrap(data);
}
