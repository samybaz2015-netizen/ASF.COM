import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

import { InfoTip } from "./InfoTip";

/**
 * السلال المقترحة للقسم.
 *
 * تظهر عند فتح أي قسم، وتُطبَّق بضغطة على مسودة فارغة ثم تُعدَّل أو تُحذف بحرّية.
 * ليست قيداً: المسار الفعلي هو ما يُعتمد في إعدادات العقد.
 */
export function TemplatePanel({ template, busy, onApply }) {
  const [open, setOpen] = useState(true);

  if (!template) return null;

  const fromSpec = template.source === "Spec";

  return (
    <section className={"cw-template" + (template.canApply ? "" : " cw-template--dim")}>
      <div className="cw-template__head">
        <h4>
          <FontAwesomeIcon icon={faWandMagicSparkles} /> السلال المقترحة لقسم {template.departmentName}
          <InfoTip
            text={
              fromSpec
                ? "هذه السلال منصوص عليها في مواصفة المشروع. تُطبَّق بضغطة ثم تُعدَّل أو تُحذف بحرّية."
                : "اقتراح مبني على سير العمل المعتاد — المواصفة لم تنصّ على سلال هذا القسم. عدّله كما يناسب العقد."
            }
          />
          <span className={"cw-badge " + (fromSpec ? "cw-badge--live" : "cw-badge--draft")}>
            {fromSpec ? "من المواصفة" : "اقتراح"}
          </span>
        </h4>

        <div className="cw-template__actions">
          <button type="button" className="cw-link" onClick={() => setOpen((v) => !v)}>
            {open ? "إخفاء" : "عرض"}
          </button>

          {template.canApply ? (
            <button
              type="button"
              className="cw-btn cw-btn--primary cw-btn--tiny"
              onClick={onApply}
              disabled={busy}
            >
              تطبيق على المسودة
            </button>
          ) : (
            <span className="cw-hint">{template.blockedReason}</span>
          )}
        </div>
      </div>

      {open && (
        <ol className="cw-path cw-path--template">
          {template.baskets.map((basket, index) => (
            <li key={basket.order} className="cw-path__step">
              <span className="cw-path__box" title={basket.purpose || undefined}>
                <b>{basket.name}</b>
                <small>
                  {basket.tasks.length} مهمة
                  {basket.mandatoryTasksCount > 0 && ` · ${basket.mandatoryTasksCount} إلزامية`}
                </small>
              </span>
              {index < template.baskets.length - 1 && (
                <FontAwesomeIcon icon={faArrowLeftLong} className="cw-path__arrow" />
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
