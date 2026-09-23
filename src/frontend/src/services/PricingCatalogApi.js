import axiosInstance from "../api/apiClient";

/** طبقة الاتصال بكتالوج بنود التسعير — تُستخدم في استيراد ملحق الأسعار. */

const PAGE_SIZE = 500;

/** جلب كل بنود التسعير لإدارة/فرع معيّن مع المرور على كل الصفحات. */
export async function fetchBranchPricingItems(branchId, onProgress) {
  const collected = [];
  let pageIndex = 1;
  let totalPages = 1;

  do {
    const { data } = await axiosInstance.get("PricingItems", {
      params: { branchId, pageIndex, pageSize: PAGE_SIZE, isActive: "" },
    });

    const items = data?.items ?? data?.data?.items ?? [];
    collected.push(...items);

    totalPages = data?.totalPages ?? data?.data?.totalPages ?? 1;
    if (onProgress) onProgress(collected.length, data?.totalCount ?? collected.length);
    pageIndex += 1;
  } while (pageIndex <= totalPages);

  return collected;
}

export async function createPricingItem(item) {
  const { data } = await axiosInstance.post("PricingItems", {
    itemNumber: item.itemNumber,
    shortDescription: item.shortDescription,
    longDescription: item.longDescription,
    uom: item.uom,
    unitPrice: item.unitPrice,
    currency: item.currency,
    branchId: item.branchId,
  });
  return data;
}

export async function updatePricingItem(id, item) {
  const { data } = await axiosInstance.put(`PricingItems/${id}`, {
    shortDescription: item.shortDescription,
    longDescription: item.longDescription,
    uom: item.uom,
    unitPrice: item.unitPrice,
    isActive: true,
  });
  return data;
}

export async function fetchBranches() {
  const { data } = await axiosInstance.get("Branch");
  return data?.data ?? data ?? [];
}

/**
 * يقارن بنود الملف بالموجود في الإدارة ويصنّفها.
 * المطابقة برقم البند لأنه المعرّف المستقر في ملحق الأسعار.
 */
export function diffAgainstCatalog(fileItems, existingItems) {
  const byNumber = new Map(
    existingItems.map((item) => [String(item.itemNumber ?? "").trim(), item])
  );

  const toCreate = [];
  const toUpdate = [];
  const unchanged = [];

  for (const item of fileItems) {
    const existing = byNumber.get(item.itemNumber);

    if (!existing) {
      toCreate.push(item);
      continue;
    }

    const priceChanged = Number(existing.unitPrice) !== Number(item.unitPrice);
    const uomChanged = (existing.uom || "") !== (item.uom || "");
    const descChanged = (existing.shortDescription || "") !== (item.shortDescription || "");

    if (priceChanged || uomChanged || descChanged) {
      toUpdate.push({
        ...item,
        id: existing.id,
        previousPrice: Number(existing.unitPrice),
        priceChanged,
        uomChanged,
        descChanged,
      });
    } else {
      unchanged.push(item);
    }
  }

  return { toCreate, toUpdate, unchanged };
}

/**
 * ينفّذ الاستيراد على دفعات صغيرة حتى لا يُغرق الخادم، ويبلّغ عن التقدم.
 * لا يتوقف عند أول خطأ — يجمع الأخطاء ويكمل، ليعرف المستخدم ما نجح وما فشل.
 */
export async function applyImport({ toCreate, toUpdate, branchId, onProgress, batchSize = 5 }) {
  const total = toCreate.length + toUpdate.length;
  const errors = [];
  let done = 0;
  let created = 0;
  let updated = 0;

  const report = () => onProgress?.({ done, total, created, updated, errors: errors.length });

  const runBatches = async (entries, handler) => {
    for (let index = 0; index < entries.length; index += batchSize) {
      const batch = entries.slice(index, index + batchSize);
      const results = await Promise.allSettled(batch.map(handler));

      results.forEach((result, offset) => {
        done += 1;
        if (result.status === "rejected") {
          const entry = batch[offset];
          const reason =
            result.reason?.response?.data?.message ||
            result.reason?.response?.data ||
            result.reason?.message ||
            "خطأ غير معروف";
          errors.push({
            itemNumber: entry.itemNumber,
            excelRow: entry.excelRow,
            message: typeof reason === "string" ? reason.slice(0, 220) : "خطأ غير معروف",
          });
        }
      });

      report();
    }
  };

  await runBatches(toCreate, async (item) => {
    await createPricingItem({ ...item, branchId });
    created += 1;
  });

  await runBatches(toUpdate, async (item) => {
    await updatePricingItem(item.id, item);
    updated += 1;
  });

  report();
  return { created, updated, errors, total };
}
