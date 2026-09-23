/**
 * حسابات صفحة تحديث التنفيذ اليومي.
 *
 * هذه الحسابات للعرض اللحظي فقط. القيم المعتمدة هي ما تعيده الخلفية بعد الحفظ،
 * لأن الخادم يعيد قراءة الكمية المخزَّنة قبل الجمع (راجع البند 6 في المواصفة).
 */

export function toNumber(value) {
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** يوحّد شكل البند القادم من الخلفية مهما اختلفت تسمية الحقول بين الأنواع. */
export function normalizeItem(raw, index) {
  const pricingItem = raw.pricingItem || raw.item || {};

  return {
    rowNumber: index + 1,
    pricingItemId: raw.pricingItemId ?? raw.id ?? pricingItem.id,
    itemNumber: raw.itemNumber ?? pricingItem.itemNumber ?? "",
    description:
      raw.shortDescription ??
      raw.description ??
      pricingItem.shortDescription ??
      pricingItem.longDescription ??
      "",
    uom: raw.uom ?? pricingItem.uom ?? "",
    unitPrice: toNumber(raw.unitPrice ?? pricingItem.unitPrice),
    estimatedQuantity: toNumber(raw.estimatedQuantity),
    executedQuantity: toNumber(raw.executedQuantity),
    executedWorksValue: toNumber(raw.executedWorksValue),
    executionPercentage: toNumber(raw.executionPercentage),
    totalPrice: toNumber(raw.totalPrice),
  };
}

/** يحسب صف الجدول بعد إدخال كمية اليوم. */
export function computeRow(item, dailyQuantity) {
  const daily = toNumber(dailyQuantity);
  const executedAfter = item.executedQuantity + daily;
  const remaining = item.estimatedQuantity - executedAfter;
  const dailyValue = daily * item.unitPrice;
  const totalValue = executedAfter * item.unitPrice;
  const percentage =
    item.estimatedQuantity > 0
      ? (executedAfter / item.estimatedQuantity) * 100
      : 0;

  return {
    daily,
    executedAfter,
    remaining,
    dailyValue,
    totalValue,
    percentage,
    exceedsPlanned:
      item.estimatedQuantity > 0 && executedAfter > item.estimatedQuantity,
  };
}

/**
 * نسبة إنجاز أمر العمل: نسبة مالية موزونة كما يفضّلها البند 5،
 * لا متوسطاً حسابياً لنسب البنود.
 */
export function computeWorkOrderProgress(items, dailyQuantities) {
  let totalContractValue = 0;
  let totalExecutedValue = 0;
  let totalDailyValue = 0;

  for (const item of items) {
    const row = computeRow(item, dailyQuantities[item.pricingItemId]);
    const contractValue =
      item.totalPrice > 0
        ? item.totalPrice
        : item.estimatedQuantity * item.unitPrice;

    totalContractValue += contractValue;
    totalExecutedValue += row.totalValue;
    totalDailyValue += row.dailyValue;
  }

  return {
    totalContractValue,
    totalExecutedValue,
    totalDailyValue,
    progressPercentage:
      totalContractValue > 0
        ? (totalExecutedValue / totalContractValue) * 100
        : 0,
  };
}

/** نسبة الإنجاز قبل إدخال أي كمية اليوم. */
export function computeProgressBefore(items) {
  return computeWorkOrderProgress(items, {}).progressPercentage;
}

/**
 * تحقق كامل قبل الإرسال — البند 6.
 * canExceedPlanned: هل يملك المستخدم صلاحية تجاوز الكمية المعتمدة.
 */
export function validateDailyUpdate({
  items,
  dailyQuantities,
  canExceedPlanned,
  photoCount,
}) {
  const errors = [];
  const touched = [];

  for (const item of items) {
    const raw = dailyQuantities[item.pricingItemId];
    if (raw === undefined || raw === null || raw === "") continue;

    const daily = toNumber(raw);
    if (daily === 0) continue;

    if (daily < 0) {
      errors.push(`البند ${item.itemNumber}: لا يسمح بكمية سالبة.`);
      continue;
    }

    const row = computeRow(item, daily);
    if (row.exceedsPlanned && !canExceedPlanned) {
      errors.push(
        `البند ${item.itemNumber}: الإجمالي بعد التحديث ${row.executedAfter.toLocaleString("ar-EG")} ` +
          `يتجاوز الكمية المعتمدة ${item.estimatedQuantity.toLocaleString("ar-EG")} — يحتاج صلاحية تجاوز.`,
      );
      continue;
    }

    touched.push({ pricingItemId: item.pricingItemId, dailyQuantity: daily });
  }

  if (touched.length === 0 && errors.length === 0) {
    errors.push("لم تُدخل أي كمية تنفيذ لليوم.");
  }

  // البند 7: لا اعتماد بكمية أكبر من صفر بلا صور تنفيذ
  if (touched.length > 0 && photoCount === 0) {
    errors.push("صور التنفيذ إلزامية عند وجود كمية منفذة اليوم.");
  }

  return { valid: errors.length === 0, errors, touched };
}

export function formatNumber(value, fractionDigits = 2) {
  return toNumber(value).toLocaleString("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatCurrency(value) {
  return `${formatNumber(value)} ر.س`;
}
