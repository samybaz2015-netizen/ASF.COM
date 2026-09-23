import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
  WORK_ORDER_TYPES,
  UNSUPPORTED_TYPES,
} from "../../../services/DailyExecutionApi";
import { formatCurrency, formatNumber } from "../utils/calculations";

/**
 * البحث عن أمر العمل — البند 3.
 * البحث يمر عبر الخلفية، فلا تظهر إلا الأوامر التي يملك المستخدم صلاحية عليها.
 */
export function WorkOrderSearch({
  onSearch,
  searching,
  results,
  onSelect,
  selected,
  typeKey,
}) {
  const [orderNumber, setOrderNumber] = useState("");
  const [type, setType] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;
    onSearch({ orderNumber: trimmed, type: type || null });
  };

  return (
    <section className="de-card">
      <h2 className="de-card__title">
        <FontAwesomeIcon icon={faMagnifyingGlass} />
        بحث برقم أمر العمل
      </h2>

      <form onSubmit={submit} className="de-search">
        <div className="de-field">
          <label htmlFor="de-order-number">
            رقم أمر العمل / الطلب / البلاغ
          </label>
          <input
            id="de-order-number"
            type="text"
            inputMode="numeric"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="أدخل الرقم"
            autoComplete="off"
          />
        </div>

        <div className="de-field">
          <label htmlFor="de-type">نوع أمر العمل</label>
          <select
            id="de-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">كل الأنواع المتاحة</option>
            {Object.values(WORK_ORDER_TYPES).map((config) => (
              <option key={config.key} value={config.key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="de-btn de-btn--primary"
          disabled={searching || !orderNumber.trim()}
        >
          {searching ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          )}
          بحث
        </button>
      </form>

      <p className="de-hint">
        الأنواع غير المدعومة بعد في التحديث اليومي:{" "}
        {UNSUPPORTED_TYPES.map((t) => t.label).join(" · ")} — لا تملك الخلفية
        نقاط تحديث كميات لها.
      </p>

      {results.length > 1 && (
        <div className="de-results">
          <p className="de-results__label">
            وُجد الرقم في أكثر من نوع — اختر المطلوب:
          </p>
          <div className="de-results__list">
            {results.map((hit) => (
              <button
                key={hit.type}
                type="button"
                className={`de-chip ${typeKey === hit.type ? "de-chip--active" : ""}`}
                onClick={() => onSelect(hit)}
              >
                {WORK_ORDER_TYPES[hit.type]?.label || hit.type}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && <WorkOrderCard workOrder={selected} typeKey={typeKey} />}
    </section>
  );
}

/** بطاقة أمر العمل المختصرة — البند 3. */
function WorkOrderCard({ workOrder, typeKey }) {
  const typeLabel = WORK_ORDER_TYPES[typeKey]?.label || typeKey;

  const fields = [
    [
      "رقم أمر العمل",
      workOrder.orderId ?? workOrder.orderNumber ?? workOrder.id,
    ],
    ["نوع أمر العمل", typeLabel],
    ["الإدارة / المكتب", workOrder.officeName ?? workOrder.office?.name ?? "—"],
    ["الفرع", workOrder.branchName ?? workOrder.branch?.name ?? "—"],
    ["الموقع", workOrder.location ?? workOrder.neighborhoodName ?? "—"],
    ["الجهد", workOrder.voltage ?? workOrder.voltageType ?? "—"],
    [
      "تاريخ الإسناد",
      formatDate(workOrder.assignmentDate ?? workOrder.startDate),
    ],
    [
      "التسليم المتوقع",
      formatDate(workOrder.expectedDeliveryDate ?? workOrder.endDate),
    ],
    ["الحالة الحالية", workOrder.status ?? workOrder.currentStatus ?? "—"],
    ["المرحلة", workOrder.stage ?? workOrder.basketName ?? "—"],
  ];

  return (
    <div className="de-wo">
      <div className="de-wo__grid">
        {fields.map(([label, value]) => (
          <div key={label} className="de-wo__field">
            <span className="de-wo__label">{label}</span>
            <span className="de-wo__value">{value || "—"}</span>
          </div>
        ))}
      </div>

      <div className="de-wo__totals">
        <Metric
          label="نسبة الإنجاز الحالية"
          value={`${formatNumber(workOrder.executionPercentage, 1)}%`}
        />
        <Metric
          label="إجمالي قيمة أمر العمل"
          value={formatCurrency(workOrder.totalPrice ?? workOrder.totalValue)}
        />
        <Metric
          label="المنفذ حتى الآن"
          value={formatCurrency(workOrder.executedWorksValue)}
        />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="de-metric">
      <span className="de-metric__label">{label}</span>
      <span className="de-metric__value">{value}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ar-EG");
}
