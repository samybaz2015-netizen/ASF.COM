import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";

import * as api from "../../../services/ExecutionTrackingApi";

/** مفتاح المسار في الواجهة لكل نوع مشروع. */
const ROUTE_BY_TYPE = {
  Construction: "construction",
  Maintenance: "maintenance",
  Emergency: "emergency",
  NewProject: "rehabilitationWorks",
  PrivateProject: "privateproject",
};

const money = (value) => {
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) && number !== 0 ? number.toLocaleString("ar-EG") : "—";
};

const date = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  // التواريخ غير المضبوطة تصل كسنة 1، فتُعرض شرطة بدل تاريخ بلا معنى.
  return Number.isNaN(d.getTime()) || d.getFullYear() < 1900
    ? "—"
    : d.toLocaleDateString("ar-SA", { dateStyle: "short" });
};

const percent = (value) => {
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : null;
};

/**
 * سلال القسم صفّاً واحداً، وأوامر العمل جدولاً أسفلها.
 *
 * اختيار السلة نطاقُ صفحة لا فلتر: تظهر كل أوامرها المسموحة للمستخدم بلا
 * أي إجراء إضافي.
 */
export function BasketRows({ departmentId, baskets }) {
  const [selected, setSelected] = useState(() => {
    const first = baskets.find((b) => b.workOrdersCount > 0) || baskets[0];
    return first?.basketStableKey ?? null;
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selected == null) return undefined;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .fetchBasketWorkOrders(departmentId, selected)
      .then((data) => !cancelled && setRows(data))
      .catch((err) => !cancelled && setError(api.errorMessage(err, "تعذّر تحميل أوامر العمل.")))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [departmentId, selected]);

  const current = baskets.find((b) => b.basketStableKey === selected);

  return (
    <>
      <div className="et-chips" role="tablist">
        {baskets.map((basket) => (
          <button
            key={basket.basketStableKey}
            type="button"
            role="tab"
            aria-selected={basket.basketStableKey === selected}
            className={
              "et-chip" + (basket.basketStableKey === selected ? " et-chip--active" : "")
            }
            onClick={() => setSelected(basket.basketStableKey)}
          >
            <span className="et-chip__order">{basket.order}</span>
            <span className="et-chip__name">{basket.basketName}</span>
            <span className="et-chip__count">{basket.workOrdersCount}</span>
          </button>
        ))}
      </div>

      {selected == null ? null : loading ? (
        <div className="asf-empty"><strong>جارٍ التحميل…</strong></div>
      ) : error ? (
        <p className="asf-error">{error}</p>
      ) : rows.length === 0 ? (
        <div className="asf-empty">
          <FontAwesomeIcon icon={faLayerGroup} />
          <strong>لا أوامر عمل في «{current?.basketName}»</strong>
        </div>
      ) : (
        <div className="asf-table__scroll">
          <table className="asf-table et-rows">
            <thead>
              <tr>
                <th>رقم أمر العمل</th>
                <th>الإدارة</th>
                <th>الحي</th>
                <th>المقاول</th>
                <th>تاريخ الإسناد</th>
                <th>مدة التنفيذ</th>
                <th>القيمة التقديرية</th>
                <th>القيمة الفعلية</th>
                <th>نسبة الإنجاز</th>
                <th>المكوث</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const route = ROUTE_BY_TYPE[row.projectTypeCode];
                const pct = percent(row.completionPercent);

                return (
                  <tr key={`${row.projectTypeCode}-${row.workOrderId}`}>
                    <td>
                      {route ? (
                        <Link to={`/project/${route}/${row.workOrderId}`} style={{ fontWeight: 800 }}>
                          {row.orderNumber || `#${row.workOrderId}`}
                        </Link>
                      ) : (
                        <b>{row.orderNumber || `#${row.workOrderId}`}</b>
                      )}
                      {row.title && <div className="asf-hint">{row.title}</div>}
                    </td>
                    <td>{row.office || "—"}</td>
                    <td>{row.district || "—"}</td>
                    <td>{row.contractor || "—"}</td>
                    <td className="et-nowrap">{date(row.orderDate || row.receivedAt)}</td>
                    <td className="et-nowrap">{row.duration ? `${row.duration} يوم` : "—"}</td>
                    <td className="et-num">{money(row.estimatedValue)}</td>
                    <td className="et-num">{money(row.actualValue)}</td>
                    <td>
                      {pct === null ? (
                        "—"
                      ) : (
                        <span className="et-progress" title={`${pct}%`}>
                          <i style={{ width: `${pct}%` }} />
                          <b>{pct}%</b>
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={"asf-chip" + (row.daysInBasket > 14 ? " asf-chip--danger" : "")}>
                        {row.daysInBasket} يوم
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
