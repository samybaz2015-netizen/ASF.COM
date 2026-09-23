import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartColumn } from "@fortawesome/free-solid-svg-icons";

import { fmtDate, num } from "../utils/format";

/**
 * حركة العمل عبر الأيام.
 *
 * عمودان لكل يوم: نقلٌ بين المراحل، ومهامّ منجزة. يُرسم بـ SVG لا بمكتبة
 * رسوم — الشكل بسيط، وإضافة مكتبة لأجله تُثقل الحزمة بلا مقابل.
 */
export function ActivityChart({ activity }) {
  const points = activity || [];

  const max = useMemo(
    () => Math.max(...points.map((p) => p.moves + p.tasksDone), 1),
    [points]
  );

  if (points.length === 0) {
    return (
      <section className="asf-panel">
        <header className="asf-panel__head">
          <div>
            <h3>حركة العمل</h3>
            <p>النقل بين المراحل والمهام المنجزة يوماً بيوم.</p>
          </div>
        </header>
        <div className="asf-panel__body">
          <div className="asf-empty">
            <FontAwesomeIcon icon={faChartColumn} />
            <strong>لا حركة مسجّلة</strong>
            <span>لم تتحرّك أوامر العمل بين المراحل في هذه الفترة.</span>
          </div>
        </div>
      </section>
    );
  }

  const totalMoves = points.reduce((s, p) => s + p.moves, 0);
  const totalTasks = points.reduce((s, p) => s + p.tasksDone, 0);

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>حركة العمل</h3>
          <p>{num(totalMoves)} نقلة · {num(totalTasks)} مهمة منجزة</p>
        </div>
        <div className="mon-legend">
          <span><i className="mon-legend__moves" /> نقل</span>
          <span><i className="mon-legend__tasks" /> مهام</span>
        </div>
      </header>

      <div className="asf-panel__body">
        <div className="mon-chart">
          {points.map((p) => {
            const total = p.moves + p.tasksDone;
            const height = (total / max) * 100;
            const taskShare = total > 0 ? (p.tasksDone / total) * 100 : 0;

            return (
              <div
                key={p.date}
                className="mon-chart__col"
                title={`${fmtDate(p.date)} — ${num(p.moves)} نقل · ${num(p.tasksDone)} مهمة`}
              >
                <div className="mon-chart__bar" style={{ height: `${Math.max(height, 2)}%` }}>
                  <span className="mon-chart__tasks" style={{ height: `${taskShare}%` }} />
                </div>
                <small>{String(new Date(p.date).getDate())}</small>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ActivityChart;
