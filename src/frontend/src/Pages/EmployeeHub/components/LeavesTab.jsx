import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarXmark, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";

import * as api from "../../../services/EmployeeHubApi";
import { fmtDate } from "./EmployeesTab";
import { StatusChip } from "./EmployeeFile";

/**
 * إجازات كل الموظفين.
 *
 * بلا فلتر تُعرض إجازات من يحقّ للمستخدم رؤيتهم كاملةً — لا صفحة فارغة تنتظر
 * أن يملأ أحدٌ حقلاً ليرى شيئاً.
 */
export function LeavesTab({ employees }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .fetchLeaves({ userId: userId || undefined, from: from || undefined, to: to || undefined })
      .then((data) => !cancelled && setRows(data))
      .catch(
        (err) =>
          !cancelled &&
          Swal.fire({
            icon: "error",
            title: "تعذّر التحميل",
            text: api.errorMessage(err, "تعذّر تحميل الإجازات."),
          })
      )
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [userId, from, to]);

  // الحالة تُصفّى محلياً: القيم معدودة والخادم لا يحتاج رحلة لأجلها.
  const visible = useMemo(
    () => (status ? rows.filter((r) => r.status === status) : rows),
    [rows, status]
  );

  const exportRows = () => {
    const header = ["الموظف", "من", "إلى", "الأيام", "السبب", "الحالة", "تاريخ الطلب"];
    const body = visible.map((r) => [
      r.employeeName || "",
      fmtDate(r.from),
      fmtDate(r.to),
      r.numberOfDays,
      r.reason || "",
      r.status || "",
      fmtDate(r.requestDate),
    ]);

    const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
    sheet["!cols"] = header.map(() => ({ wch: 16 }));

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "الإجازات");
    XLSX.writeFile(book, "الإجازات.xlsx");
  };

  const clear = () => {
    setFrom("");
    setTo("");
    setUserId("");
    setStatus("");
  };

  const filtered = from || to || userId || status;

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>الإجازات</h3>
          <p>كل الإجازات ضمن نطاق صلاحيتك، وتنعكس في تقويم الفريق.</p>
        </div>
        <button
          type="button"
          className="asf-btn asf-btn--sm"
          onClick={exportRows}
          disabled={visible.length === 0}
        >
          <FontAwesomeIcon icon={faFileExcel} /> تصدير إكسل
        </button>
      </header>

      <div className="asf-panel__body">
        <div className="asf-toolbar">
          <label className="asf-field" style={{ minWidth: 200 }}>
            <span>الموظف</span>
            <select value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">كل الموظفين</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.displayName || e.userName}</option>
              ))}
            </select>
          </label>

          <label className="asf-field">
            <span>من</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>

          <label className="asf-field">
            <span>إلى</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>

          <label className="asf-field" style={{ minWidth: 150 }}>
            <span>الحالة</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">الكل</option>
              <option value="Pending">معلّقة</option>
              <option value="Approved">معتمدة</option>
              <option value="Rejected">مرفوضة</option>
            </select>
          </label>

          {filtered && (
            <div className="asf-toolbar__actions">
              <button type="button" className="asf-btn asf-btn--sm" onClick={clear}>
                مسح الفلاتر
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="asf-empty"><strong>جارٍ التحميل…</strong></div>
        ) : visible.length === 0 ? (
          <div className="asf-empty">
            <FontAwesomeIcon icon={faCalendarXmark} />
            <strong>{filtered ? "لا إجازات تطابق الفلتر" : "لا إجازات مسجّلة"}</strong>
            {filtered && <span>امسح الفلاتر لعرض كل ما يحقّ لك رؤيته.</span>}
          </div>
        ) : (
          <div className="asf-table__scroll">
            <table className="asf-table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th style={{ width: 110 }}>من</th>
                  <th style={{ width: 110 }}>إلى</th>
                  <th style={{ width: 70 }}>الأيام</th>
                  <th>السبب</th>
                  <th style={{ width: 90 }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.employeeName || "—"}</b></td>
                    <td className="asf-num">{fmtDate(r.from)}</td>
                    <td className="asf-num">{fmtDate(r.to)}</td>
                    <td className="asf-num">{r.numberOfDays}</td>
                    <td>{r.reason || "—"}</td>
                    <td><StatusChip status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default LeavesTab;
