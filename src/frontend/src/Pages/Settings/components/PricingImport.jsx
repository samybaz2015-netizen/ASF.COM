import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExcel,
  faSpinner,
  faTriangleExclamation,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

import { parsePricingWorkbook } from "../utils/parsePricingWorkbook";
import {
  applyImport,
  diffAgainstCatalog,
  fetchBranches,
  fetchBranchPricingItems,
} from "../../../services/PricingCatalogApi";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/**
 * استيراد ملحق الأسعار من Excel وتطبيقه على إدارة محددة.
 * البنود المستوردة هي نفسها بنود المقايسة المستخدمة في أوامر العمل — لا نسخة موازية.
 */
export function PricingImport() {
  const fileInputRef = useRef(null);

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [diff, setDiff] = useState(null);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);

  const inFlight = useRef(false);

  useEffect(() => {
    fetchBranches()
      .then((list) => setBranches(Array.isArray(list) ? list : []))
      .catch(() => setBranches([]));
  }, []);

  const resetDownstream = () => {
    setDiff(null);
    setResult(null);
    setProgress(null);
  };

  const handleFile = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFileName(file.name);
    setParsing(true);
    setParsed(null);
    resetDownstream();

    try {
      const buffer = await file.arrayBuffer();
      const outcome = parsePricingWorkbook(buffer);

      if (outcome.items.length === 0) {
        throw new Error("لم يُعثر على أي بند مسعّر في الملف.");
      }

      setParsed(outcome);
    } catch (error) {
      Swal.fire({ icon: "error", title: "تعذّرت قراءة الملف", text: error.message });
      setFileName("");
    } finally {
      setParsing(false);
    }
  }, []);

  const handleCompare = useCallback(async () => {
    if (!parsed || !branchId) return;

    setComparing(true);
    resetDownstream();

    try {
      const existing = await fetchBranchPricingItems(branchId);
      setDiff(diffAgainstCatalog(parsed.items, existing));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "تعذّرت مقارنة البنود",
        text: error?.response?.data?.message || error.message,
      });
    } finally {
      setComparing(false);
    }
  }, [parsed, branchId]);

  const handleApply = useCallback(async () => {
    if (!diff || inFlight.current) return;

    const branchName = branches.find((b) => String(b.id) === String(branchId))?.name || branchId;

    const confirm = await Swal.fire({
      icon: "warning",
      title: "تأكيد تطبيق الأسعار",
      html:
        `<div style="text-align:right">` +
        `الإدارة: <b>${branchName}</b><br/>` +
        `بنود جديدة تُضاف: <b>${diff.toCreate.length}</b><br/>` +
        `بنود تُحدَّث أسعارها: <b>${diff.toUpdate.length}</b><br/>` +
        `بلا تغيير: <b>${diff.unchanged.length}</b>` +
        `</div>`,
      showCancelButton: true,
      confirmButtonText: "تطبيق",
      cancelButtonText: "إلغاء",
    });
    if (!confirm.isConfirmed) return;

    inFlight.current = true;
    setApplying(true);
    setProgress({ done: 0, total: diff.toCreate.length + diff.toUpdate.length });

    try {
      const outcome = await applyImport({
        toCreate: diff.toCreate,
        toUpdate: diff.toUpdate,
        branchId: Number(branchId),
        onProgress: setProgress,
      });

      setResult(outcome);

      Swal.fire({
        icon: outcome.errors.length ? "warning" : "success",
        title: outcome.errors.length ? "اكتمل مع أخطاء" : "تم تطبيق الأسعار",
        html:
          `<div style="text-align:right">` +
          `أُضيف: <b>${outcome.created}</b><br/>` +
          `حُدِّث: <b>${outcome.updated}</b><br/>` +
          `فشل: <b>${outcome.errors.length}</b>` +
          `</div>`,
      });

      await handleCompare();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "فشل التطبيق",
        text: error?.response?.data?.message || error.message,
      });
    } finally {
      inFlight.current = false;
      setApplying(false);
    }
  }, [diff, branchId, branches, handleCompare]);

  const canCompare = Boolean(parsed && branchId) && !comparing && !applying;
  const canApply =
    Boolean(diff) && !applying && diff.toCreate.length + diff.toUpdate.length > 0;

  const previewRows = useMemo(() => parsed?.items.slice(0, 8) ?? [], [parsed]);

  return (
    <section className="st-card">
      <h2 className="st-card__title">
        <FontAwesomeIcon icon={faFileExcel} />
        استيراد ملحق الأسعار
      </h2>

      <p className="st-hint">
        يقرأ ملف ملحق الأسعار المعتمد، ويستورد البنود المسعّرة فقط (صفوف <code>Breakdown</code>)،
        ويتجاهل صفوف العناوين الهرمية (<code>Description</code>). البنود المستوردة هي نفسها بنود
        المقايسة المستخدمة في أوامر العمل.
      </p>

      {/* 1) الملف */}
      <div className="st-step">
        <span className="st-step__num">1</span>
        <div className="st-step__body">
          <label className="st-label">ملف الأسعار</label>
          <div className="st-row">
            <button
              type="button"
              className="st-btn st-btn--ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing || applying}
            >
              {parsing ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUpload} />}
              اختيار ملف Excel
            </button>
            {fileName && <span className="st-file">{fileName}</span>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.xlsm"
            hidden
            onChange={handleFile}
          />
        </div>
      </div>

      {parsed && (
        <>
          <div className="st-stats">
            <Stat label="بنود مسعّرة" value={parsed.stats.imported} highlight />
            <Stat label="صفوف عناوين متجاهَلة" value={parsed.stats.descriptionRows} />
            <Stat label="الوحدات" value={parsed.stats.uoms.length} />
            <Stat label="أدنى سعر" value={formatMoney(parsed.stats.minPrice)} />
            <Stat label="أعلى سعر" value={formatMoney(parsed.stats.maxPrice)} />
            <Stat label="العملة" value={parsed.stats.currencies.join(" · ") || "—"} />
          </div>

          {parsed.warnings.length > 0 && (
            <details className="st-warnings">
              <summary>
                <FontAwesomeIcon icon={faTriangleExclamation} />
                {` ${parsed.warnings.length} ملاحظة على الملف`}
              </summary>
              <ul>
                {parsed.warnings.slice(0, 40).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>رقم البند</th>
                  <th>الوصف المختصر</th>
                  <th>الوحدة</th>
                  <th>سعر الوحدة</th>
                  <th>العملة</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((item) => (
                  <tr key={item.itemNumber}>
                    <td className="st-mono">{item.itemNumber}</td>
                    <td className="st-desc">{item.shortDescription}</td>
                    <td>{item.uom}</td>
                    <td>{formatMoney(item.unitPrice)}</td>
                    <td>{item.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.items.length > previewRows.length && (
              <p className="st-more">…و{parsed.items.length - previewRows.length} بنداً آخر</p>
            )}
          </div>
        </>
      )}

      {/* 2) الإدارة */}
      <div className="st-step">
        <span className="st-step__num">2</span>
        <div className="st-step__body">
          <label className="st-label" htmlFor="st-branch">
            الإدارة التي تُطبَّق عليها الأسعار
          </label>
          <select
            id="st-branch"
            className="st-select"
            value={branchId}
            disabled={applying}
            onChange={(e) => {
              setBranchId(e.target.value);
              resetDownstream();
            }}
          >
            <option value="">اختر الإدارة</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3) المقارنة */}
      <div className="st-step">
        <span className="st-step__num">3</span>
        <div className="st-step__body">
          <label className="st-label">المقارنة بالبنود الحالية</label>
          <button type="button" className="st-btn st-btn--ghost" onClick={handleCompare} disabled={!canCompare}>
            {comparing ? <FontAwesomeIcon icon={faSpinner} spin /> : null}
            مقارنة
          </button>

          {diff && (
            <div className="st-stats st-stats--diff">
              <Stat label="بنود جديدة" value={diff.toCreate.length} highlight />
              <Stat label="أسعار تتغيّر" value={diff.toUpdate.length} highlight />
              <Stat label="بلا تغيير" value={diff.unchanged.length} />
            </div>
          )}

          {diff && diff.toUpdate.length > 0 && (
            <details className="st-warnings">
              <summary>{`عرض ${diff.toUpdate.length} بنداً سيتغيّر`}</summary>
              <div className="st-table-wrap">
                <table className="st-table">
                  <thead>
                    <tr>
                      <th>رقم البند</th>
                      <th>السعر الحالي</th>
                      <th>السعر الجديد</th>
                      <th>الفرق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.toUpdate.slice(0, 60).map((item) => {
                      const delta = item.unitPrice - item.previousPrice;
                      return (
                        <tr key={item.itemNumber}>
                          <td className="st-mono">{item.itemNumber}</td>
                          <td>{formatMoney(item.previousPrice)}</td>
                          <td>{formatMoney(item.unitPrice)}</td>
                          <td className={delta >= 0 ? "st-up" : "st-down"}>
                            {delta >= 0 ? "+" : ""}
                            {formatMoney(delta)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* 4) التطبيق */}
      <div className="st-step">
        <span className="st-step__num">4</span>
        <div className="st-step__body">
          <label className="st-label">التطبيق</label>
          <button type="button" className="st-btn st-btn--primary" onClick={handleApply} disabled={!canApply}>
            {applying ? <FontAwesomeIcon icon={faSpinner} spin /> : null}
            تطبيق الأسعار على الإدارة
          </button>

          {progress && progress.total > 0 && (
            <div className="st-progress">
              <div
                className="st-progress__fill"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
              <span className="st-progress__text">
                {progress.done} / {progress.total}
              </span>
            </div>
          )}

          {result && (
            <div className="st-result">
              <Stat label="أُضيف" value={result.created} />
              <Stat label="حُدِّث" value={result.updated} />
              <Stat label="فشل" value={result.errors.length} />
            </div>
          )}

          {result?.errors?.length > 0 && (
            <details className="st-warnings st-warnings--error" open>
              <summary>
                <FontAwesomeIcon icon={faTriangleExclamation} />
                {` ${result.errors.length} بنداً لم يُحفظ`}
              </summary>
              <ul>
                {result.errors.slice(0, 30).map((error) => (
                  <li key={`${error.itemNumber}-${error.excelRow}`}>
                    <span className="st-mono">{error.itemNumber}</span> (صف {error.excelRow}): {error.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`st-stat ${highlight ? "st-stat--highlight" : ""}`}>
      <span className="st-stat__label">{label}</span>
      <span className="st-stat__value">{value}</span>
    </div>
  );
}
