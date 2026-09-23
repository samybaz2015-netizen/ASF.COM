import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExcel,
  faFolderOpen,
  faMagnifyingGlass,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";

import { exportRows } from "../utils/employeeExcel";

/**
 * سجلّ الموظفين.
 *
 * البحث والتصفية يجريان على ما حمّله الخادم أصلاً — وهو محكوم بصلاحية
 * المستخدم — فلا تُظهر الشاشة صفاً لا يحقّ له. الفلتر يُضيّق ولا يوسّع.
 */
export function EmployeesTab({ employees, loading, branches, onOpen, onRefresh }) {
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return employees.filter((e) => {
      if (!showInactive && !e.isActiveEmployee) return false;
      if (branchId && String(e.branchId) !== branchId) return false;
      if (!needle) return true;

      return [
        e.displayName,
        e.userName,
        e.employeeNumber,
        e.email,
        e.phoneNumber,
        e.jobTitle,
        e.nationalId,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [employees, search, branchId, showInactive]);

  const inactiveCount = employees.filter((e) => !e.isActiveEmployee).length;

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>الموظفون</h3>
          <p>ملف كل موظف ومستنداته وإجازاته في مكان واحد.</p>
        </div>
        <button
          type="button"
          className="asf-btn asf-btn--sm"
          onClick={() => exportRows(rows)}
          disabled={rows.length === 0}
        >
          <FontAwesomeIcon icon={faFileExcel} /> تصدير إكسل
        </button>
      </header>

      <div className="asf-panel__body">
        <div className="asf-toolbar">
          <label className="asf-field" style={{ flex: "1 1 260px" }}>
            <span>بحث</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="الاسم، الرقم الوظيفي، الجوال، الهوية…"
            />
          </label>

          <label className="asf-field" style={{ minWidth: 180 }}>
            <span>الفرع</span>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">كل الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <div className="asf-toolbar__actions">
            {inactiveCount > 0 && (
              <button
                type="button"
                className={"asf-btn asf-btn--sm" + (showInactive ? " asf-btn--primary" : "")}
                onClick={() => setShowInactive((v) => !v)}
              >
                <FontAwesomeIcon icon={faUserSlash} /> المنتهية خدمتهم ({inactiveCount})
              </button>
            )}
            <button type="button" className="asf-btn asf-btn--sm" onClick={onRefresh}>
              تحديث
            </button>
          </div>
        </div>

        {/* الفرق بين «لا موظفين» و«لا نتيجة للبحث» مهمّ: الأول يحتاج إضافة،
            والثاني يحتاج تعديل البحث. */}
        {loading ? (
          <div className="asf-empty"><strong>جارٍ التحميل…</strong></div>
        ) : rows.length === 0 ? (
          <div className="asf-empty">
            <FontAwesomeIcon icon={search || branchId ? faMagnifyingGlass : faFolderOpen} />
            <strong>
              {employees.length === 0 ? "لا موظفين مسجّلين" : "لا نتيجة تطابق البحث"}
            </strong>
            <span>
              {employees.length === 0
                ? "أضف الموظفين يدوياً أو استوردهم من إكسل."
                : "جرّب اسماً أو رقماً آخر، أو امسح الفلتر."}
            </span>
          </div>
        ) : (
          <div className="asf-table__scroll">
            <table className="asf-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>الرقم</th>
                  <th>الاسم</th>
                  <th>المسمّى</th>
                  <th>الفرع</th>
                  <th>الجوال</th>
                  <th style={{ width: 110 }}>التعيين</th>
                  <th style={{ width: 74 }}>الحالة</th>
                  <th style={{ width: 84 }}>الملف</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="asf-num">{e.employeeNumber || "—"}</td>
                    <td>
                      <b>{e.displayName || e.userName}</b>
                      {e.email && <div className="asf-hint">{e.email}</div>}
                    </td>
                    <td>{e.jobTitle || "—"}</td>
                    <td>{e.branchName || "—"}</td>
                    <td className="asf-num">{e.phoneNumber || "—"}</td>
                    <td className="asf-num">{fmtDate(e.hireDate)}</td>
                    <td>
                      <span className={"asf-chip " + (e.isActiveEmployee ? "asf-chip--ok" : "")}>
                        {e.isActiveEmployee ? "على رأس العمل" : "منتهية"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="asf-btn asf-btn--sm"
                        onClick={() => onOpen(e.id)}
                      >
                        <FontAwesomeIcon icon={faFolderOpen} /> فتح
                      </button>
                    </td>
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

export function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
}

export default EmployeesTab;
