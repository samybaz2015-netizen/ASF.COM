import axios from "axios";
import { Url } from "../function/FunctionApi";

/**
 * خريطة بناء الـ URL لكل مشروع — لأن كل مشروع شكل الـ endpoint بتاعه مختلف
 */
const EXECUTED_QUANTITY_URL_BUILDERS = {
  RehabilitationWorks: (projectId) =>
    `${Url}RehabilitationWorks/${projectId}/update-executed-quantity`,
  Maintenance: (projectId) =>
    `${Url}Maintenance/${projectId}/update-executed-quantity`,
  Emergency: (projectId) =>
    `${Url}Emergency/${projectId}/update-executed-quantity`,
  // ✅ Construction له شكل مختلف تمامًا
  Construction: (constructionId) =>
    `${Url}Construction/${constructionId}/pricing-items/executed-quantity`,
};

/**
 * ✅ الأربع مشاريع بقت بتستخدم نفس شكل الـ endpoint لسجل التغييرات:
 * GET /api/{EntityType}/{projectId}/changes
 */
const ENTITY_TYPES_WITH_CHANGES_LOG = [
  "RehabilitationWorks",
  "Maintenance",
  "Emergency",
  "Construction",
];

/**
 * تحديث الكمية (حاليًا: الكمية التقديرية) لبند واحد
 */
export async function updateExecutedQuantity({
  entityType,
  projectId,
  pricingItemId,
  executedQuantity, // اسم الحقل مطابق لعقد الـ API المُعطى من الباك
  note = "",
  token,
}) {
  const buildUrl = EXECUTED_QUANTITY_URL_BUILDERS[entityType];
  if (!buildUrl) {
    throw new Error(`لا يوجد endpoint معرّف لنوع المشروع: ${entityType}`);
  }
  const url = buildUrl(projectId);
  const { data } = await axios.put(
    url,
    { pricingItemId, executedQuantity, note },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
}

/**
 * جلب سجل التغييرات (changes log) لأي نوع مشروع
 * الريسبونس: [{ id, operationId, userName, changeDate, userProfileImage, changeDescription }]
 */
export async function getExecutedQuantityLogs({ entityType, projectId, token }) {
  if (!ENTITY_TYPES_WITH_CHANGES_LOG.includes(entityType)) {
    throw new Error(`لا يوجد endpoint سجلات معرّف لنوع المشروع: ${entityType}`);
  }
  const url = `${Url}${entityType}/${projectId}/changes`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}