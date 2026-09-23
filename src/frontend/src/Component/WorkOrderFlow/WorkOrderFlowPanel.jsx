import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import * as api from "../../services/WorkOrderFlowApi";
import "./WorkOrderFlow.css";

/**
 * موقع أمر العمل في مسار السلال، ومهام سلته الحالية، وأزرار النقل.
 *
 * يُعرض داخل صفحة أمر العمل. لا يظهر إطلاقاً إن كان النوع غير مربوط بمسار أو
 * لم يدخل أمر العمل المسار بعد، فلا يزحم الصفحة بشيء بلا معنى.
 */
export function WorkOrderFlowPanel({ routeType, workOrderId }) {
  const typeCode = api.toProjectTypeCode(routeType);

  const [placement, setPlacement] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fail = (err, fallback) =>
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: api.errorMessage(err, fallback) });

  const load = useCallback(async () => {
    if (!typeCode || !workOrderId) {
      setLoading(false);
      return;
    }
    try {
      setPlacement(await api.fetchPlacement(typeCode, workOrderId));
    } catch (err) {
      fail(err, "تعذّر قراءة موقع أمر العمل.");
    } finally {
      setLoading(false);
    }
  }, [typeCode, workOrderId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, fallback) => {
    setBusy(true);
    try {
      const updated = await action();
      setPlacement(updated);
      if (showHistory) setHistory(await api.fetchHistory(typeCode, workOrderId));
    } catch (err) {
      fail(err, fallback);
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = (task) =>
    run(
      () => api.setTaskState(typeCode, workOrderId, task.taskStableKey, !task.isDone),
      "تعذّر تحديث المهمة."
    );

  const move = async (option) => {
    const { value: note, isConfirmed } = await Swal.fire({
      title: `نقل إلى «${option.basketName}»`,
      input: "text",
      inputLabel: "ملاحظة (اختياري)",
      showCancelButton: true,
      confirmButtonText: "نقل",
      cancelButtonText: "إلغاء",
    });
    if (!isConfirmed) return;

    await run(
      () => api.moveWorkOrder(typeCode, workOrderId, option.basketStableKey, note || null),
      "تعذّر نقل أمر العمل."
    );
  };

  const openHistory = async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && history.length === 0) {
      try {
        setHistory(await api.fetchHistory(typeCode, workOrderId));
      } catch (err) {
        fail(err, "تعذّر قراءة سجل الحركة.");
      }
    }
  };

  // لا نوع مربوط، أو لم يدخل المسار: لا شيء يُعرض.
  if (!typeCode || loading || !placement) return null;

  return (
    <section className="wf-panel" dir="rtl">
      <header className="wf-panel__head">
        <div>
          <span className="wf-panel__label">موقع أمر العمل</span>
          <h4 className="wf-panel__basket" title={placement.currentBasketPurpose || undefined}>
            {placement.currentBasketName || "سلة محذوفة من المسار"}
          </h4>
          <span className="wf-panel__meta">
            {placement.departmentName} · السلة {placement.currentBasketOrder} · منذ{" "}
            {placement.daysInBasket} يوم
          </span>
        </div>

        <button type="button" className="wf-link" onClick={openHistory}>
          {showHistory ? "إخفاء سجل الحركة" : "سجل الحركة"}
        </button>
      </header>

      {placement.tasks.length > 0 && (
        <ul className="wf-tasks">
          {placement.tasks.map((task) => (
            <li key={task.taskStableKey} className={task.isDone ? "wf-task wf-task--done" : "wf-task"}>
              <label>
                <input
                  type="checkbox"
                  checked={task.isDone}
                  onChange={() => toggleTask(task)}
                  disabled={busy}
                />
                <span className="wf-task__name">{task.name}</span>
              </label>

              {task.isMandatory && <span className="wf-tag wf-tag--req">إلزامية</span>}
              {task.durationDays ? <span className="wf-tag">{task.durationDays} يوم</span> : null}
              {task.defaultAssigneeRole && <span className="wf-tag">{task.defaultAssigneeRole}</span>}
              {task.isDone && task.doneByUserName && (
                <span className="wf-task__by">أنجزها {task.doneByUserName}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {placement.blockers.length > 0 && (
        <ul className="wf-blockers">
          {placement.blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      )}

      <div className="wf-moves">
        {placement.transitions
          .filter((option) => option.direction !== "Current")
          .map((option) => (
            <button
              key={option.basketStableKey}
              type="button"
              className={
                "wf-move" + (option.direction === "Backward" ? " wf-move--back" : " wf-move--fwd")
              }
              onClick={() => move(option)}
              disabled={busy || !option.isAllowed}
              title={option.blockedReason || undefined}
            >
              {option.direction === "Backward" ? "إرجاع إلى " : "نقل إلى "}
              {option.basketName}
            </button>
          ))}
      </div>

      {showHistory && (
        <ol className="wf-history">
          {history.length === 0 && <li className="wf-history__empty">لا حركات.</li>}
          {history.map((entry) => (
            <li key={entry.id}>
              <b>{entry.fromBasketName || "دخول المسار"}</b> ← <b>{entry.toBasketName}</b>
              <span className="wf-history__meta">
                {entry.movedByUserName || entry.movedByUserId} ·{" "}
                {new Date(entry.movedAt).toLocaleString("ar-SA", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
              {entry.note && <span className="wf-history__note">{entry.note}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default WorkOrderFlowPanel;
