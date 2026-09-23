import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faDownload,
  faFileExcel,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

import * as api from "../../../services/EmployeeHubApi";
import { parseEmployeeWorkbook, downloadImportTemplate } from "../utils/employeeExcel";

const CHIP = {
  Valid: "asf-chip--ok",
  Created: "asf-chip--ok",
  Updated: "asf-chip--ok",
  Duplicate: "asf-chip--warn",
  Skipped: "asf-chip--warn",
  Error: "asf-chip--danger",
};

const LABEL = {
  Valid: "صالح",
  Created: "أُنشئ",
  Updated: "حُدِّث",
  Duplicate: "مكرّر",
  Skipped: "تُخطّي",
  Error: "خطأ",
};

/**
 * استيراد الموظفين من إكسل.
 *
 * الفحص يسبق الكتابة دائماً: يرى المستخدم ما سيحدث لكل صف قبل أن يُكتب صفٌ
 * واحد. والمطلوب اسم المستخدم وحده — بقية الأعمدة تُقرأ إن وُجدت.
 */
export function EmployeeImportTab({ onImported }) {
  const fileRef = useRef(null);

  const [updateExisting, setUpdateExisting] = useState(true);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [check, setCheck] = useState(null);
  const [working, setWorking] = useState(false);

  const fail = (err) =>
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: api.errorMessage(err) });

  const reset = () => {
    setParsed(null);
    setCheck(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setCheck(null);
    setWorking(true);

    try {
      const data = parseEmployeeWorkbook(await file.arrayBuffer());
      setParsed(data);

      if (data.missingRequired.length > 0) {
        Swal.fire({
          icon: "error",
          title: "عمود مطلوب مفقود",
          text: `${data.missingRequired.join("، ")} — بدونه لا يمكن تمييز الصفوف.`,
        });
      }
    } catch (err) {
      setParsed(null);
      Swal.fire({ icon: "error", title: "تعذّرت قراءة الملف", text: err.message });
    } finally {
      setWorking(false);
    }
  };

  const run = async (dryRun) => {
    setWorking(true);
    try {
      const result = await api.importEmployees({
        rows: parsed.rows,
        dryRun,
        updateExisting,
      });
      setCheck(result);

      if (!dryRun) {
        Swal.fire({
          icon: "success",
          title: `اكتمل الاستيراد`,
          timer: 1800,
          showConfirmButton: false,
        });
        await onImported?.();
      }
    } catch (err) {
      fail(err);
    } finally {
      setWorking(false);
    }
  };

  const commit = async () => {
    const confirmed = await Swal.fire({
      icon: "question",
      title: "تنفيذ الاستيراد؟",
      html:
        `سيُعالَج <b>${check.validRows ?? 0}</b> صفاً` +
        (check.errorRows ? `<br><span style="color:#a33636">${check.errorRows} صف به أخطاء لن يُستورد.</span>` : ""),
      showCancelButton: true,
      confirmButtonText: "استيراد",
      cancelButtonText: "إلغاء",
    });

    if (confirmed.isConfirmed) await run(false);
  };

  const done = check && !check.dryRun;
  const blocked = !parsed || parsed.missingRequired.length > 0;

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>استيراد الموظفين من إكسل</h3>
          <p>ارفع الملف، افحصه، ثم استورد. الفحص لا يكتب شيئاً.</p>
        </div>
        <button type="button" className="asf-btn asf-btn--sm" onClick={downloadImportTemplate}>
          <FontAwesomeIcon icon={faDownload} /> تنزيل القالب
        </button>
      </header>

      <div className="asf-panel__body">
        <div className="asf-toolbar">
          <label className="asf-field" style={{ flex: "1 1 280px" }}>
            <span>الملف</span>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={onFile}
              disabled={working}
            />
          </label>

          <label className="asf-check">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
            />
            <span>تحديث الموظف القائم بدل تخطّيه</span>
          </label>

          <div className="asf-toolbar__actions">
            <button
              type="button"
              className="asf-btn"
              onClick={() => run(true)}
              disabled={blocked || working}
            >
              <FontAwesomeIcon icon={faFileExcel} /> فحص
            </button>

            {check?.dryRun && (check.validRows ?? 0) > 0 && (
              <button
                type="button"
                className="asf-btn asf-btn--primary"
                onClick={commit}
                disabled={working}
              >
                <FontAwesomeIcon icon={faUpload} /> استيراد
              </button>
            )}

            {(parsed || check) && (
              <button type="button" className="asf-btn asf-btn--sm" onClick={reset} disabled={working}>
                مسح
              </button>
            )}
          </div>
        </div>

        {parsed && !check && (
          <>
            <p className="asf-hint">
              <FontAwesomeIcon icon={faCircleCheck} /> {fileName} — قُرئ{" "}
              <b>{parsed.rows.length}</b> صفاً، وتُعرِّف على الأعمدة: {parsed.columns.join("، ")}
            </p>

            {parsed.missingOptional.length > 0 && (
              <p className="asf-hint" style={{ marginTop: 4 }}>
                أعمدة غير موجودة في الملف وستُترك فارغة: {parsed.missingOptional.join("، ")}
              </p>
            )}
          </>
        )}

        {check && (
          <>
            <div className="asf-grid" style={{ marginTop: 12 }}>
              <Stat label="إجمالي الصفوف" value={check.totalRows ?? check.rows?.length ?? 0} />
              <Stat label={done ? "نُفِّذ" : "صالح"} value={check.validRows ?? 0} tone="ok" />
              <Stat label="به أخطاء" value={check.errorRows ?? 0} tone="danger" />
            </div>

            {check.rows?.length > 0 && (
              <div className="asf-table__scroll" style={{ marginTop: 12 }}>
                <table className="asf-table">
                  <thead>
                    <tr>
                      <th style={{ width: 54 }}>الصف</th>
                      <th>اسم المستخدم</th>
                      <th style={{ width: 80 }}>الحالة</th>
                      <th>الملاحظة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {check.rows.map((row, i) => (
                      <tr key={row.rowNumber ?? i}>
                        <td className="asf-hint">{row.rowNumber}</td>
                        <td><b>{row.userName || "—"}</b></td>
                        <td>
                          <span className={"asf-chip " + (CHIP[row.status] || "")}>
                            {LABEL[row.status] || row.status}
                          </span>
                        </td>
                        <td className="asf-hint">
                          {[...(row.errors || []), ...(row.notes || [])].join(" ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, tone }) {
  const color =
    tone === "ok" ? "var(--asf-ok)" : tone === "danger" ? "var(--asf-danger)" : "var(--asf-navy)";

  return (
    <div
      style={{
        border: "1px solid var(--asf-line)",
        borderRadius: "var(--asf-radius-sm)",
        padding: "10px 14px",
        background: "var(--asf-paper)",
      }}
    >
      <b style={{ color, fontSize: 20, display: "block" }}>{value}</b>
      <span className="asf-hint">{label}</span>
    </div>
  );
}

export default EmployeeImportTab;
