import { useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";

import { InfoTip } from "./InfoTip";
import * as flowApi from "../../../services/WorkOrderFlowApi";

const KIND_LABELS = {
  ExactName: "مطابقة بالاسم",
  Fallback: "إلى السلة الاحتياطية",
  NoMatch: "بلا مطابقة",
};

/**
 * ترحيل أوامر العمل القائمة من حقل الحالة النصّي إلى السلال.
 *
 * يعاين أولاً دائماً. زرّ التنفيذ لا يظهر إلا بعد معاينة، ولا يكتب إلا بعد
 * تأكيد — فلا يُرحَّل شيء قبل أن يرى المستخدم إلى أين سيذهب كل أمر عمل.
 */
export function BackfillPanel({ departmentId, departmentName, baskets, onDone }) {
  const [fallback, setFallback] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const fail = (err) =>
    Swal.fire({
      icon: "error",
      title: "تعذّر الترحيل",
      text: flowApi.errorMessage(err, "خطأ غير متوقع."),
    });

  const request = async (dryRun) => {
    setBusy(true);
    try {
      const data = await flowApi.backfill({
        departmentId,
        dryRun,
        fallbackBasketStableKey: fallback === "" ? null : Number(fallback),
      });
      setResult(data);
      if (!dryRun) {
        Swal.fire({
          icon: "success",
          title: `رُحِّل ${data.written} أمر عمل`,
          timer: 1800,
          showConfirmButton: false,
        });
        onDone?.();
      }
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const execute = async () => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "تنفيذ الترحيل؟",
      html:
        `سيُسجَّل موقع <b>${result.matched + result.fellBackToDefault}</b> أمر عمل في السلال.` +
        (result.unmatched > 0
          ? `<br><span style="color:#9a6a20">${result.unmatched} أمر عمل بلا مطابقة سيُترك بلا موقع.</span>`
          : ""),
      showCancelButton: true,
      confirmButtonText: "تنفيذ",
      cancelButtonText: "إلغاء",
    });
    if (confirmed.isConfirmed) await request(false);
  };

  return (
    <section className="cw-backfill">
      <h3>
        ترحيل أوامر العمل القائمة
        <InfoTip text="أوامر العمل القديمة تحفظ مرحلتها كنص حر. هذا الترحيل يطابق ذلك النص على السلال ويسجّل موقع كل أمر عمل." />
      </h3>

      <p className="cw-hint">
        القسم: <b>{departmentName}</b> — المطابقة بالاسم، والباقي يذهب إلى السلة الاحتياطية إن
        اخترت واحدة.
      </p>

      <div className="cw-backfill__row">
        <label className="cw-field cw-field--inline">
          <span>السلة الاحتياطية</span>
          <select value={fallback} onChange={(event) => setFallback(event.target.value)}>
            <option value="">بلا — يُترك غير المطابق بلا موقع</option>
            {baskets.map((basket) => (
              <option key={basket.stableKey} value={basket.stableKey}>
                {basket.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="cw-btn cw-btn--ghost"
          onClick={() => request(true)}
          disabled={busy}
        >
          {busy ? "…" : "معاينة"}
        </button>

        {result?.dryRun && (
          <button type="button" className="cw-btn cw-btn--primary" onClick={execute} disabled={busy}>
            <FontAwesomeIcon icon={faRightToBracket} /> تنفيذ الترحيل
          </button>
        )}
      </div>

      {result && (
        <>
          <p className="cw-backfill__summary">
            {result.dryRun ? "معاينة — لم يُكتب شيء." : `نُفِّذ: كُتب ${result.written}.`} إجمالي{" "}
            {result.totalWorkOrders} · مسجّل مسبقاً {result.alreadyPlaced} · مطابق {result.matched} ·
            احتياطي {result.fellBackToDefault} · بلا مطابقة {result.unmatched}
          </p>

          <table className="cw-log">
            <thead>
              <tr>
                <th>الحالة النصّية</th>
                <th>العدد</th>
                <th>السلة</th>
                <th>نوع المطابقة</th>
              </tr>
            </thead>
            <tbody>
              {result.mappings.map((mapping) => (
                <tr key={`${mapping.situation}-${mapping.matchKind}`}>
                  <td>{mapping.situation || "(فارغة)"}</td>
                  <td>{mapping.count}</td>
                  <td>{mapping.basketName || "—"}</td>
                  <td>{KIND_LABELS[mapping.matchKind] || mapping.matchKind}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
