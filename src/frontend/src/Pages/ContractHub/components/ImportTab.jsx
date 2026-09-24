import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faDownload,
  faFileExcel,
  faTriangleExclamation,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

import { parseWorkOrderWorkbook, downloadTemplate } from "../utils/parseWorkOrderWorkbook";
import { importWorkOrders, errorMessage } from "../../../services/WorkOrderImportApi";

const STATUS_CHIP = {
  Valid: "asf-chip--ok",
  Created: "asf-chip--ok",
  Duplicate: "asf-chip--warn",
  Error: "asf-chip--danger",
};

const STATUS_LABEL = {
  Valid: "صالح",
  Created: "أُنشئ",
  Duplicate: "مكرّر",
  Error: "خطأ",
};

/**
 * استيراد أوامر العمل من إكسل.
 *
 * ثلاث خطوات لا تُختصر: اختيار القسم، ثم قراءة الملف وفحصه، ثم الاستيراد.
 * الفحص يسبق الكتابة دائماً، فلا يُكتب صف قبل أن يرى المستخدم ما سيحدث.
 */
export function ImportTab({ contractId, departments, busy, onImported }) {
  const fileRef = useRef(null);

  const [departmentId, setDepartmentId] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [check, setCheck] = useState(null);
  const [working, setWorking] = useState(false);

  const importable = departments.filter((d) =>
    ["Construction", "Maintenance", "Emergency"].includes(d.projectTypeCode)
  );

  const fail = (err) =>
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: errorMessage(err, "خطأ غير متوقع.") });

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
      const buffer = await file.arrayBuffer();
      const data = parseWorkOrderWorkbook(buffer);
      setParsed(data);

      // الحجب عند غياب رقم أمر العمل وحده. غياب عمود آخر يُذكر ولا يمنع،
      // فالملفات الواردة نادراً ما تحمل كل الأعمدة.
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
    if (!departmentId) {
      Swal.fire({ icon: "warning", title: "اختر القسم أولاً" });
      return;
    }

    setWorking(true);
    try {
      const result = await importWorkOrders({
        contractId,
        departmentId: Number(departmentId),
        rows: parsed.rows,
        dryRun,
        skipDuplicates,
      });
      setCheck(result);

      if (!dryRun) {
        Swal.fire({
          icon: "success",
          title: `أُنشئ ${result.createdRows} أمر عمل`,
          timer: 2000,
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
        `سيُنشأ <b>${check.validRows}</b> أمر عمل` +
        (check.entryBasketName ? ` ويدخل سلة «${check.entryBasketName}»` : "") +
        (check.duplicateRows ? `<br><span style="color:#9a6817">${check.duplicateRows} صف مكرّر سيُتخطّى.</span>` : "") +
        (check.errorRows ? `<br><span style="color:#a33636">${check.errorRows} صف به أخطاء لن يُستورد.</span>` : ""),
      showCancelButton: true,
      confirmButtonText: "استيراد",
      cancelButtonText: "إلغاء",
    });
    if (confirmed.isConfirmed) await run(false);
  };

  const done = check && !check.dryRun;

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>استيراد أوامر العمل من إكسل</h3>
          <p>اختر القسم، ارفع الملف، افحصه، ثم استورد. الفحص لا يكتب شيئاً.</p>
        </div>
        <button type="button" className="asf-btn asf-btn--sm" onClick={downloadTemplate}>
          <FontAwesomeIcon icon={faDownload} /> تنزيل القالب
        </button>
      </header>

      <div className="asf-panel__body">
        <div className="asf-toolbar">
          <label className="asf-field">
            <span>القسم</span>
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setCheck(null);
              }}
              disabled={busy || working}
            >
              <option value="">اختر القسم…</option>
              {importable.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>

          <label className="asf-field">
            <span>الملف</span>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={onFile}
              disabled={busy || working}
            />
          </label>

          <label className="asf-check" style={{ alignSelf: "center" }}>
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
            />
            تخطّي المكرّر
          </label>

          <div className="asf-toolbar__actions">
            <button
              type="button"
              className="asf-btn"
              onClick={() => run(true)}
              disabled={!parsed || !departmentId || working}
            >
              <FontAwesomeIcon icon={faFileExcel} /> فحص
            </button>
            {check?.dryRun && check.validRows > 0 && (
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

        {/* السببان مختلفان والعلاج مختلف: عقدٌ بلا أقسام يُعالَج بإضافة قسم،
            وعقدٌ أقسامه من نوع آخر لا يُعالَج بشيء هنا. جمعهما في رسالة واحدة
            كان يترك المستخدم بلا خطوة تالية. */}
        {importable.length === 0 && (
          <div className="asf-empty">
            {departments.length === 0 ? (
              <>
                <strong>هذا العقد بلا أقسام بعد</strong>
                <span>
                  افتح «الأقسام والسلال» من تبويب «مراحل خط سير العقد الموحد» وأضف
                  قسم إنشاءات أو صيانة أو طوارئ، ثم عُد إلى هنا.
                </span>
              </>
            ) : (
              <>
                <strong>لا أقسام قابلة للاستيراد في هذا العقد</strong>
                <span>
                  أقسامه الحالية ({departments.map((d) => d.name).join("، ")}) من أنواع لا
                  تقبل الاستيراد. الاستيراد متاح للإنشاءات والصيانة والطوارئ.
                </span>
              </>
            )}
          </div>
        )}

        {parsed && !check && (
          <>
            <p className="asf-hint">
              <FontAwesomeIcon icon={faCircleCheck} /> {fileName} — قُرئ{" "}
              <b>{parsed.rows.length}</b> صفاً، وتُعرِّف على الأعمدة: {parsed.columns.join("، ")}
            </p>

            {/* الأعمدة الغائبة تُذكر صراحةً: أهون من أن يكتشفها المستخدم
                فارغةً بعد الاستيراد. */}
            {parsed.missingOptional?.length > 0 && (
              <p className="asf-hint" style={{ marginTop: 4 }}>
                أعمدة غير موجودة في الملف وستُترك فارغة: {parsed.missingOptional.join("، ")}
              </p>
            )}
          </>
        )}

        {check?.blocker && (
          <p className="asf-error" style={{ marginTop: 10 }}>
            <FontAwesomeIcon icon={faTriangleExclamation} /> {check.blocker}
          </p>
        )}

        {check && (
          <>
            <div className="asf-grid" style={{ marginTop: 12 }}>
              <Stat label="إجمالي الصفوف" value={check.totalRows} />
              <Stat label={done ? "أُنشئ" : "صالح للاستيراد"} value={done ? check.createdRows : check.validRows} tone="ok" />
              <Stat label="مكرّر" value={check.duplicateRows} tone="warn" />
              <Stat label="به أخطاء" value={check.errorRows} tone="danger" />
            </div>

            {check.entryBasketName && (
              <p className="asf-hint" style={{ marginTop: 8 }}>
                ستدخل أوامر العمل سلة «<b>{check.entryBasketName}</b>» في قسم {check.departmentName}.
              </p>
            )}

            <div className="asf-table__scroll" style={{ marginTop: 12 }}>
              <table className="asf-table">
                <thead>
                  <tr>
                    <th style={{ width: 54 }}>الصف</th>
                    <th>رقم أمر العمل</th>
                    <th style={{ width: 80 }}>الحالة</th>
                    <th>الملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {check.rows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="asf-hint">{row.rowNumber}</td>
                      <td><b>{row.orderNumber || "—"}</b></td>
                      <td>
                        <span className={"asf-chip " + (STATUS_CHIP[row.status] || "")}>
                          {STATUS_LABEL[row.status] || row.status}
                        </span>
                      </td>
                      <td className="asf-hint">
                        {[
                          ...(row.errors || []),
                          ...(row.notes || []),
                          row.basketName ? `دخل سلة ${row.basketName}` : null,
                        ]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, tone }) {
  const color =
    tone === "ok" ? "var(--asf-ok)" : tone === "warn" ? "var(--asf-warn)" : tone === "danger" ? "var(--asf-danger)" : "var(--asf-navy)";

  return (
    <div
      style={{
        border: "1px solid var(--asf-line)",
        borderRadius: "var(--asf-radius-sm)",
        padding: "10px 14px",
        background: "var(--asf-tint)",
      }}
    >
      <b style={{ display: "block", fontSize: 20, color }}>{value}</b>
      <span className="asf-hint">{label}</span>
    </div>
  );
}
