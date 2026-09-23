import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faUmbrellaBeach } from "@fortawesome/free-solid-svg-icons";

import * as api from "../../../services/EmployeeHubApi";

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const iso = (d) => d.toISOString().slice(0, 10);

/**
 * تقويم الفريق.
 *
 * يُبنى من طلبات الإجازة نفسها لا من جدول ثانٍ يُحدَّث يدوياً — فلا يتأخّر عن
 * الواقع ولا يحتاج أحدٌ أن يتذكّر تحديثه بعد اعتماد إجازة.
 */
export function CalendarTab({ branches }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [branchId, setBranchId] = useState("");
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  const start = useMemo(() => new Date(year, month, 1), [year, month]);
  const end = useMemo(() => new Date(year, month + 1, 0), [year, month]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .fetchCalendar({ from: iso(start), to: iso(end), branchId: branchId || undefined })
      .then((data) => !cancelled && setDays(data))
      .catch(
        (err) =>
          !cancelled &&
          Swal.fire({
            icon: "error",
            title: "تعذّر التحميل",
            text: api.errorMessage(err, "تعذّر تحميل التقويم."),
          })
      )
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [start, end, branchId]);

  const byDate = useMemo(() => {
    const map = new Map();
    days.forEach((d) => map.set(String(d.date).slice(0, 10), d.entries || []));
    return map;
  }, [days]);

  // خانات فارغة قبل أول الشهر ليقع كل يوم تحت اسم يومه.
  const cells = useMemo(() => {
    const list = [];
    for (let i = 0; i < start.getDay(); i += 1) list.push(null);
    for (let d = 1; d <= end.getDate(); d += 1) list.push(new Date(year, month, d));
    return list;
  }, [start, end, year, month]);

  const shift = (step) => {
    const next = new Date(year, month + step, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const onLeave = new Set(
    days.flatMap((d) => (d.entries || []).map((e) => e.employeeId))
  );

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>تقويم الفريق</h3>
          <p>من هو على إجازة في كل يوم — مبنيّ من الإجازات نفسها.</p>
        </div>
        <span className="asf-chip">{onLeave.size} موظفاً على إجازة هذا الشهر</span>
      </header>

      <div className="asf-panel__body">
        <div className="asf-toolbar">
          <div className="asf-toolbar__actions">
            <button type="button" className="asf-btn asf-btn--sm" onClick={() => shift(-1)}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <strong style={{ minWidth: 130, textAlign: "center" }}>
              {MONTHS[month]} {year}
            </strong>
            <button type="button" className="asf-btn asf-btn--sm" onClick={() => shift(1)}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          </div>

          <label className="asf-field" style={{ minWidth: 180 }}>
            <span>الفرع</span>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">كل الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="asf-empty"><strong>جارٍ التحميل…</strong></div>
        ) : (
          <>
            <div className="asf-cal">
              {WEEKDAYS.map((w) => (
                <div key={w} className="asf-cal__head">{w}</div>
              ))}

              {cells.map((date, index) => {
                if (!date) return <div key={`p${index}`} className="asf-cal__pad" />;

                const key = iso(date);
                const entries = byDate.get(key) || [];
                const isToday = key === iso(today);

                return (
                  <div
                    key={key}
                    className={
                      "asf-cal__day" +
                      (isToday ? " asf-cal__day--today" : "") +
                      (entries.length ? " asf-cal__day--busy" : "")
                    }
                  >
                    <span className="asf-cal__num">{date.getDate()}</span>

                    {entries.map((e, i) => (
                      <span
                        key={`${e.employeeId}-${i}`}
                        className="asf-cal__chip"
                        title={`${e.employeeName || ""}${e.reason ? ` — ${e.reason}` : ""}`}
                      >
                        {e.employeeName || "—"}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>

            {onLeave.size === 0 && (
              <div className="asf-empty" style={{ marginTop: 12 }}>
                <FontAwesomeIcon icon={faUmbrellaBeach} />
                <strong>لا إجازات في {MONTHS[month]}</strong>
                <span>الفريق كامل هذا الشهر.</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default CalendarTab;
