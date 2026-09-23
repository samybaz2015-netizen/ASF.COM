import axiosInstance from "../api/apiClient";

/**
 * قالب إنشاء أمر عمل الإنشاءات.
 *
 * القوائم تُقرأ من مصادرها القائمة في النظام — لا نسخ موازية: الإدارات من
 * الفروع، والمكاتب والأحياء والمقاولون من جداولهم، وبنود الأعمال من ملحق
 * الأسعار نفسه المستعمل في المقايسة.
 */

const unwrap = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
  }
  return [];
};

const list = async (url, params) => {
  const { data } = await axiosInstance.get(url, params ? { params } : undefined);
  return unwrap(data);
};

export const fetchBranches = () => list("Branch");
export const fetchOffices = () => list("Office");
/**
 * الأحياء والمقاولون وأنواع أوامر العمل تُقرأ من مصدر واحد هو قوائم العقد.
 *
 * كانت تُقرأ من جداول عامة منفصلة، فما يضيفه المستخدم في إعدادات العقد لا
 * يظهر في نموذج الإدخال — وهو ما جعل القسمين يبدوان غير مرتبطين. الآن ما
 * يُضاف هناك يُرى هنا فوراً.
 *
 * بلا `contractId` تُعاد القيم العامة وحدها، وهو الصحيح قبل اختيار العقد.
 */
const listValues = (category, contractId, departmentId) =>
  list("ContractSetup/lists", {
    category,
    ...(contractId ? { contractId } : {}),
    ...(departmentId ? { departmentId } : {}),
  });

export const fetchNeighborhoods = (contractId, departmentId) =>
  listValues("District", contractId, departmentId);

export const fetchContractors = (contractId, departmentId) =>
  listValues("Contractor", contractId, departmentId);

export const fetchWorkOrderCodes = (contractId, departmentId) =>
  listValues("WorkOrderCode", contractId, departmentId);

export const fetchOfficeValues = (contractId, departmentId) =>
  listValues("Office", contractId, departmentId);

export const fetchConsultantValues = (contractId, departmentId) =>
  listValues("Consultant", contractId, departmentId);

export const fetchProjectOwners = (contractId, departmentId) =>
  listValues("ProjectOwner", contractId, departmentId);

export const fetchProjectParties = (contractId, departmentId) =>
  listValues("ProjectParty", contractId, departmentId);

/** الاستشاريون ليس لهم نقطة قائمة مستقلة، فيُقرأون من الحسابات. */
export async function fetchConsultants() {
  try {
    const { data } = await axiosInstance.get("Account/accounts", {
      params: { page: 1, pageSize: 500 },
    });
    return unwrap(data);
  } catch {
    return [];
  }
}

/** عقود الاستشاري، لاختيار رقم العقد. */
export const fetchContracts = () =>
  list("ContractWorkflow/contracts", { includeInactive: false });

/** أنواع أوامر العمل المعرَّفة في العقد. */
export const fetchWorkOrderTypes = (contractId, departmentId) =>
  listValues("WorkOrderType", contractId, departmentId);

/**
 * بنود ملحق الأسعار لإدارة محدَّدة.
 *
 * الإدارة شرط: لكل إدارة ملحق أسعارها، وعرض البنود قبل اختيارها يعطي سعراً
 * لا يخصّ العقد.
 */
export async function searchPricingItems({ branchId, search, pageSize = 50 }) {
  if (!branchId) return [];
  const { data } = await axiosInstance.get("PricingItems", {
    params: { branchId, search: search || undefined, isActive: true, pageIndex: 1, pageSize },
  });
  return unwrap(data);
}

/** ينشئ أمر عمل إنشاءات. القالب يرسل multipart لأن المرفقات جزء منه. */
export async function createConstruction(values) {
  const form = new FormData();

  const put = (key, value) => {
    if (value === null || value === undefined || value === "") return;
    form.append(key, value);
  };

  put("FaultNumber", values.faultNumber);
  put("TaskNumber", values.taskNumber);
  put("WorkOrderCode", values.workOrderCode);
  put("WorkOrderType", values.workOrderType);
  put("OrderType", values.orderType);
  put("WorkDescription", values.workDescription);
  put("Priority", values.priority);
  put("VoltageLevel", values.voltageLevel);

  put("BranchId", values.branchId);
  put("Office", values.office);
  put("District", values.district);
  put("ProjectPlace", values.projectPlace);
  put("PlotNumber", values.plotNumber);
  put("PlanNumber", values.planNumber);
  put("SubscriberName", values.subscriberName);
  put("StationNumber", values.stationNumber);

  put("Consultant", values.consultant);
  put("Contractor", values.contractor);
  put("ContractNumber", values.contractNumber);

  put("OrderDate", values.orderDate);
  put("ReceiveDateTime", values.orderDate);
  put("DurationOfImplementation", values.duration);
  put("ApprovalDate", values.approvalDate);

  put("Note", values.note);
  put("Situation", "جديد");
  put("isArchive", "false");
  put("IsDraft", values.isDraft ? "true" : "false");

  // بنود الأعمال تُرسل مفهرسة كما ينتظرها ربط النموذج في ASP.NET
  (values.items || []).forEach((item, index) => {
    form.append(`PricingItems[${index}].PricingItemId`, item.pricingItemId);
    form.append(`PricingItems[${index}].EstimatedQuantity`, item.quantity || 0);
    form.append(`PricingItems[${index}].TotalPrice`, item.total || 0);
  });

  (values.attachments || []).forEach((file) => form.append("TestModels", file));

  const { data } = await axiosInstance.post("Construction/create-construction", form);
  return data;
}

export function errorMessage(err, fallback) {
  const payload = err?.response?.data;
  if (payload?.errors && typeof payload.errors === "object") {
    return Object.values(payload.errors).flat().join(" · ");
  }
  return payload?.message || err?.message || fallback;
}
