import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency, formatNumber, toNumber } from "../utils/calculations";

/** سجل التحديث اليومي — البند 12، مبني على executed-quantity-logs القائم. */
export function DailyUpdateHistory({ logs, loading }) {
  return (
    <section className="de-card">
      <h2 className="de-card__title">
        <FontAwesomeIcon icon={faClockRotateLeft} />
        سجل التحديث اليومي
      </h2>

      {loading && <p className="de-empty">جارٍ التحميل…</p>}

      {!loading && (!logs || logs.length === 0) && (
        <p className="de-empty">لا توجد تحديثات مسجّلة على أمر العمل هذا.</p>
      )}

      {!loading && logs?.length > 0 && (
        <div className="de-table-wrap">
          <table className="de-table">
            <thead>
              <tr>
                <th>التاريخ والوقت</th>
                <th>المستخدم</th>
                <th>البند</th>
                <th>الكمية قبل</th>
                <th>الكمية بعد</th>
                <th>كمية التحديث</th>
                <th>القيمة المنفذة</th>
                <th>نسبة البند</th>
                <th>ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => {
                const before = toNumber(log.oldExecutedQuantity);
                const after = toNumber(log.newExecutedQuantity);
                return (
                  <tr key={log.id ?? index}>
                    <td>{formatDateTime(log.updatedAt ?? log.changeDate)}</td>
                    <td>{log.updatedByUserName ?? log.userName ?? "—"}</td>
                    <td>
                      <span className="de-mono">{log.itemNumber || "—"}</span>
                      {log.itemDescription && (
                        <span className="de-log-desc">
                          {" "}
                          — {log.itemDescription}
                        </span>
                      )}
                    </td>
                    <td>{formatNumber(before)}</td>
                    <td>{formatNumber(after)}</td>
                    <td className="de-log-delta">
                      {formatNumber(after - before)}
                    </td>
                    <td>{formatCurrency(log.newExecutedWorksValue)}</td>
                    <td>{formatNumber(log.newExecutionPercentage, 1)}%</td>
                    <td>{log.note || log.changeDescription || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("ar-EG")} ${date.toLocaleTimeString(
    "ar-EG",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  )}`;
}
