import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import { money, num } from "../utils/format";

/**
 * مراحل الطلب.
 *
 * كل مرحلة بعددها وقيمتيها — التقديرية والمنفّذة. والشريط تحتها نسبة التنفيذ
 * من التقديري، فيُرى تعثّر مرحلة دون قراءة الأرقام.
 */
export function StageBoard({ stages }) {
  if (!stages || stages.length === 0) {
    return (
      <section className="asf-panel">
        <header className="asf-panel__head">
          <div>
            <h3>مراحل الطلب</h3>
            <p>عدد أوامر العمل وقيمها في كل مرحلة.</p>
          </div>
        </header>
        <div className="asf-panel__body">
          <div className="asf-empty">
            <FontAwesomeIcon icon={faLayerGroup} />
            <strong>لا مراحل ضمن النطاق الحالي</strong>
            <span>اعتمد مسار القسم أو وسّع الفلاتر.</span>
          </div>
        </div>
      </section>
    );
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>مراحل الطلب</h3>
          <p>عدد أوامر العمل والقيمة التقديرية والمنفّذة في كل مرحلة.</p>
        </div>
        <span className="asf-chip">{stages.length} مرحلة</span>
      </header>

      <div className="asf-panel__body">
        <div className="mon-stages">
          {stages.map((stage) => {
            const percent =
              stage.estimatedValue > 0
                ? Math.min(100, (stage.actualValue / stage.estimatedValue) * 100)
                : 0;

            return (
              <article key={`${stage.departmentId}-${stage.basketStableKey}`} className="mon-stage">
                <header>
                  <div>
                    <strong title={stage.basketName}>{stage.basketName}</strong>
                    <small>{stage.departmentName || "—"}</small>
                  </div>
                  <b className="mon-stage__count">{num(stage.count)}</b>
                </header>

                {/* عرض الشريط نسبة إلى أكبر مرحلة: يُقارَن الحجم بالنظر. */}
                <div className="mon-stage__bar" title={`${num(stage.count)} أمر عمل`}>
                  <span style={{ width: `${(stage.count / maxCount) * 100}%` }} />
                </div>

                <dl className="mon-stage__values">
                  <div>
                    <dt>تقديرية</dt>
                    <dd>{money(stage.estimatedValue)}</dd>
                  </div>
                  <div>
                    <dt>منفّذة</dt>
                    <dd className="mon-ok">{money(stage.actualValue)}</dd>
                  </div>
                  <div>
                    <dt>متوسط المكوث</dt>
                    <dd>{num(stage.averageDaysInStage)} يوم</dd>
                  </div>
                </dl>

                <div className="mon-stage__progress" title={`${percent.toFixed(0)}% من التقديري`}>
                  <span style={{ width: `${percent}%` }} />
                </div>

                {/* القيم الناقصة تُذكر: مجموعٌ يُخفي أن نصف صفوفه فارغ يُقرأ
                    كأنه كامل. */}
                {stage.missingEstimated > 0 && (
                  <p className="mon-stage__note">
                    <FontAwesomeIcon icon={faTriangleExclamation} />{" "}
                    {num(stage.missingEstimated)} بلا قيمة تقديرية
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default StageBoard;
