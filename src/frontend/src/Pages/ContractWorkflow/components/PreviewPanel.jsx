import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";

/**
 * معاينة المسار قبل الاعتماد: ترتيب السلال النهائي كما سيراه المستخدم، مع
 * التنبيهات التي قد تجعل المسار غير قابل للتشغيل.
 */
export function PreviewPanel({ preview, onClose, onPublish, publishing, canPublish }) {
  if (!preview) return null;

  return (
    <div className="cw-preview" role="dialog" aria-label="معاينة المسار">
      <div className="cw-preview__head">
        <h3>
          معاينة المسار — {preview.departmentName}{" "}
          <span className="cw-badge">نسخة {preview.version}</span>
        </h3>
        <button type="button" className="cw-icon" onClick={onClose} aria-label="إغلاق">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {preview.steps.length === 0 ? (
        <p className="cw-empty">لا توجد سلال مفعّلة لعرضها.</p>
      ) : (
        <ol className="cw-path">
          {preview.steps.map((step, index) => (
            <li key={step.basketId} className="cw-path__step">
              <span className="cw-path__box" title={step.purpose || undefined}>
                <b>{step.basketName}</b>
                <small>
                  {step.tasksCount} مهمة
                  {step.mandatoryTasksCount > 0 && ` · ${step.mandatoryTasksCount} إلزامية`}
                </small>
              </span>
              {index < preview.steps.length - 1 && (
                <FontAwesomeIcon icon={faArrowLeftLong} className="cw-path__arrow" />
              )}
            </li>
          ))}
        </ol>
      )}

      {preview.warnings.length > 0 && (
        <ul className="cw-warnings">
          {preview.warnings.map((warning) => (
            <li key={warning}>
              <FontAwesomeIcon icon={faTriangleExclamation} /> {warning}
            </li>
          ))}
        </ul>
      )}

      {preview.status === "Draft" && canPublish && (
        <div className="cw-preview__actions">
          <button
            type="button"
            className="cw-btn cw-btn--primary"
            onClick={onPublish}
            disabled={publishing || preview.steps.length === 0}
          >
            {publishing ? "جارٍ الاعتماد…" : "اعتماد هذا المسار"}
          </button>
          <span className="cw-hint">
            بعد الاعتماد يصير هذا المسار هو الفعلي. أوامر العمل القائمة تبقى في سلالها.
          </span>
        </div>
      )}
    </div>
  );
}
