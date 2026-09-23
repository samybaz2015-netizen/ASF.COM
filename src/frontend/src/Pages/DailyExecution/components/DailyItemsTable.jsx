import {
  computeRow,
  formatCurrency,
  formatNumber,
} from "../utils/calculations";

/**
 * جدول بنود الأعمال.
 *
 * فصل مالي إلزامي: أعمدة "قيمة الأعمال" محسوبة بسعر وحدة المقايسة، وهي قيمة
 * الأعمال المنفذة ميدانياً - وليست مستحق الاستشاري. مستحق الاستشاري يُحسب
 * بسعر وحدة الإشراف، ولا مصدر له في النظام حتى الآن فتظهر أعمدته فارغة.
 * المستخدم يدخل "كمية تنفيذ اليوم" فقط، وكل ما عداها محسوب لحظياً.
 */
export function DailyItemsTable({
  items,
  dailyQuantities,
  onChange,
  canExceedPlanned,
  disabled,
}) {
  if (!items.length) {
    return <p className="de-empty">لا توجد بنود أعمال على أمر العمل هذا.</p>;
  }

  return (
    <div className="de-table-wrap">
      <table className="de-table">
        <thead>
          <tr>
            <th>م</th>
            <th>كود البند</th>
            <th className="de-table__desc">وصف البند</th>
            <th>الوحدة</th>
            <th>الكمية المعتمدة</th>
            <th>المنفذ سابقاً</th>
            <th className="de-table__input">تنفيذ اليوم</th>
            <th>إجمالي المنفذ</th>
            <th>المتبقي</th>
            <th>سعر وحدة المقايسة</th>
            <th>قيمة أعمال اليوم</th>
            <th>إجمالي قيمة الأعمال</th>
            <th>نسبة إنجاز البند</th>
            <th>سعر وحدة الإشراف</th>
            <th>قيمة الإشراف</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const rawValue = dailyQuantities[item.pricingItemId] ?? "";
            const row = computeRow(item, rawValue);
            const isNegative = row.daily < 0;
            const blocked = row.exceedsPlanned && !canExceedPlanned;
            const touched = row.daily !== 0;

            return (
              <tr
                key={item.pricingItemId}
                className={touched ? "de-row--touched" : ""}
              >
                <td>{item.rowNumber}</td>
                <td className="de-mono">{item.itemNumber || "—"}</td>
                <td className="de-table__desc" title={item.description}>
                  {item.description || "—"}
                </td>
                <td>{item.uom || "—"}</td>
                <td>{formatNumber(item.estimatedQuantity)}</td>
                <td>{formatNumber(item.executedQuantity)}</td>

                <td className="de-table__input">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={rawValue}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(item.pricingItemId, e.target.value)
                    }
                    className={isNegative || blocked ? "de-input--error" : ""}
                    aria-label={`كمية تنفيذ اليوم للبند ${item.itemNumber}`}
                  />
                  {isNegative && (
                    <span className="de-cell-error">لا يسمح بقيمة سالبة</span>
                  )}
                  {blocked && (
                    <span className="de-cell-error">
                      يتجاوز الكمية المعتمدة
                    </span>
                  )}
                </td>

                <td className={row.exceedsPlanned ? "de-over" : ""}>
                  {formatNumber(row.executedAfter)}
                </td>
                <td className={row.remaining < 0 ? "de-over" : ""}>
                  {formatNumber(row.remaining)}
                </td>
                <td>{formatNumber(item.unitPrice)}</td>
                <td>{row.dailyValue ? formatCurrency(row.dailyValue) : "—"}</td>
                <td>{formatCurrency(row.totalValue)}</td>
                <td>
                  <ProgressBar value={row.percentage} />
                </td>

                {/* الإشراف: لا مصدر لسعر وحدة الإشراف في النظام بعد - راجع
                    docs/daily-execution-module.md القسم "مستحقات الاستشاري" */}
                <td className="de-pending" title="غير متاح: لا يوجد مصدر لسعر وحدة الإشراف">
                  —
                </td>
                <td className="de-pending" title="غير متاح: لا يوجد مصدر لسعر وحدة الإشراف">
                  —
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProgressBar({ value }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="de-progress" title={`${formatNumber(value, 1)}%`}>
      <div
        className="de-progress__fill"
        style={{
          width: `${clamped}%`,
          background: value > 100 ? "#dc2626" : undefined,
        }}
      />
      <span className="de-progress__text">{formatNumber(value, 1)}%</span>
    </div>
  );
}
