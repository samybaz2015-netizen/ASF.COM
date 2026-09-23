import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faCoins,
  faMoneyBillTransfer,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

import { money, num } from "../utils/format";

/**
 * المسند والمصروف والمتبقي.
 *
 * المسند = مجموع القيم التقديرية. المصروف = مجموع المنفّذ. والمتبقي فرقهما.
 * تُعرض معاً لا متفرّقة: قراءة المصروف وحده لا تقول شيئاً عن الالتزام.
 */
export function FinancialBoard({ financial }) {
  if (!financial) return null;

  const { assigned, spent, remaining, spentPercent } = financial;
  const overspent = remaining < 0;

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>المسند والمصروف والمتبقي</h3>
          <p>على {num(financial.ordersCount)} أمر عمل ضمن النطاق الحالي.</p>
        </div>
      </header>

      <div className="asf-panel__body">
        <div className="mon-money">
          <Card
            icon={faCoins}
            label="المسند"
            value={money(assigned)}
            hint="مجموع القيم التقديرية"
          />
          <Card
            icon={faMoneyBillTransfer}
            label="المصروف"
            value={money(spent)}
            hint={`${num(spentPercent)}% من المسند`}
            tone="ok"
          />
          <Card
            icon={faWallet}
            label={overspent ? "تجاوز" : "المتبقي"}
            value={money(Math.abs(remaining))}
            hint={overspent ? "المصروف تجاوز المسند" : "المسند ناقص المصروف"}
            tone={overspent ? "danger" : "warn"}
          />
        </div>

        <div className="mon-money__bar" title={`${num(spentPercent)}%`}>
          <span
            className={overspent ? "mon-money__fill mon-money__fill--over" : "mon-money__fill"}
            style={{ width: `${Math.min(100, Math.max(0, spentPercent))}%` }}
          />
        </div>

        {/* الصفوف بلا قيمة تُذكر صراحةً: بدونها تبدو الأرقام أشمل مما هي. */}
        {(financial.ordersWithoutEstimate > 0 || financial.ordersWithoutActual > 0) && (
          <p className="asf-hint" style={{ marginTop: 10 }}>
            <FontAwesomeIcon icon={faCircleInfo} />{" "}
            {financial.ordersWithoutEstimate > 0 &&
              `${num(financial.ordersWithoutEstimate)} أمر عمل بلا قيمة تقديرية مقروءة`}
            {financial.ordersWithoutEstimate > 0 && financial.ordersWithoutActual > 0 && " · "}
            {financial.ordersWithoutActual > 0 &&
              `${num(financial.ordersWithoutActual)} بلا قيمة منفّذة`}
            {" — غير محسوبة في المجاميع."}
          </p>
        )}

        {financial.byDepartment?.length > 0 && (
          <div className="asf-table__scroll" style={{ marginTop: 14 }}>
            <table className="asf-table">
              <thead>
                <tr>
                  <th>القسم</th>
                  <th style={{ width: 80 }}>أوامر</th>
                  <th style={{ width: 130 }}>المسند</th>
                  <th style={{ width: 130 }}>المصروف</th>
                  <th style={{ width: 130 }}>المتبقي</th>
                  <th style={{ width: 120 }}>النسبة</th>
                </tr>
              </thead>
              <tbody>
                {financial.byDepartment.map((row) => {
                  const percent = row.assigned > 0 ? (row.spent / row.assigned) * 100 : 0;

                  return (
                    <tr key={row.id}>
                      <td><b>{row.name}</b></td>
                      <td className="asf-num">{num(row.count)}</td>
                      <td className="asf-num">{money(row.assigned)}</td>
                      <td className="asf-num mon-ok">{money(row.spent)}</td>
                      <td className={"asf-num" + (row.remaining < 0 ? " mon-danger" : "")}>
                        {money(row.remaining)}
                      </td>
                      <td>
                        <div className="mon-mini" title={`${percent.toFixed(0)}%`}>
                          <span style={{ width: `${Math.min(100, percent)}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Card({ icon, label, value, hint, tone }) {
  return (
    <article className={"mon-money__card" + (tone ? ` mon-money__card--${tone}` : "")}>
      <FontAwesomeIcon icon={icon} />
      <div>
        <span>{label}</span>
        <b>{value}</b>
        <small>{hint}</small>
      </div>
    </article>
  );
}

export default FinancialBoard;
