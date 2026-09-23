import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faGripVertical,
  faPen,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { InfoTip } from "./InfoTip";
import { BasketForm } from "./BasketForm";
import { TaskForm } from "./TaskForm";
import { dragProps, keyboardMove } from "../utils/dragList";

/**
 * لوحة سلال المسودة.
 *
 * الترتيب بالسحب أو بـ Alt + الأسهم. كل سلة تُفتح لتُظهر مهامها، والمهام
 * تُرتَّب بنفس الطريقة داخل سلتها.
 */
export function BasketBoard({
  baskets,
  readOnly,
  busy,
  onReorder,
  onAddBasket,
  onUpdateBasket,
  onDeleteBasket,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [editing, setEditing] = useState(null); // null | "new" | basketId
  const [taskEditing, setTaskEditing] = useState(null); // { basketId, task|null }

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="cw-board">
      <div className="cw-board__head">
        <h3 className="cw-board__title">
          السلال الرئيسية
          <InfoTip text="المراحل التي يمرّ بها أمر العمل بالترتيب. الترتيب هنا هو مسار العمل الفعلي بعد الاعتماد." />
        </h3>

        {!readOnly && (
          <button
            type="button"
            className="cw-btn cw-btn--ghost"
            onClick={() => setEditing("new")}
            disabled={busy}
          >
            <FontAwesomeIcon icon={faPlus} /> إضافة سلة
          </button>
        )}
      </div>

      {editing === "new" && (
        <BasketForm
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            await onAddBasket(values);
            setEditing(null);
          }}
        />
      )}

      {baskets.length === 0 && editing !== "new" && (
        <p className="cw-empty">لا توجد سلال في هذا المسار بعد.</p>
      )}

      <ol className="cw-baskets">
        {baskets.map((basket, index) => {
          const open = expanded.has(basket.id);
          const locked = basket.workOrdersCount > 0;

          return (
            <li
              key={basket.id}
              className={
                "cw-basket" +
                (basket.isActive ? "" : " cw-basket--off") +
                (dragIndex === index ? " cw-basket--dragging" : "")
              }
              {...dragProps({
                index,
                dragIndex,
                setDragIndex,
                items: baskets,
                disabled: readOnly || busy,
                onDrop: (next) => onReorder(next.map((b) => b.id)),
              })}
            >
              <div className="cw-basket__bar">
                {!readOnly && (
                  <span
                    className="cw-grip"
                    role="button"
                    tabIndex={0}
                    aria-label={`نقل ${basket.name}`}
                    title="اسحب للترتيب، أو Alt مع الأسهم"
                    onKeyDown={(event) =>
                      keyboardMove(event, {
                        index,
                        items: baskets,
                        onDrop: (next) => onReorder(next.map((b) => b.id)),
                      })
                    }
                  >
                    <FontAwesomeIcon icon={faGripVertical} />
                  </span>
                )}

                <span className="cw-basket__order">{index + 1}</span>

                <button type="button" className="cw-basket__name" onClick={() => toggle(basket.id)}>
                  <FontAwesomeIcon icon={open ? faChevronDown : faChevronLeft} className="cw-chev" />
                  {basket.name}
                </button>

                <InfoTip text={basket.purpose} label={`الغرض من ${basket.name}`} />

                {!basket.isActive && <span className="cw-badge cw-badge--off">معطّلة</span>}

                <span className="cw-basket__count">
                  {basket.tasks.length} مهمة
                  {basket.tasks.some((t) => t.isMandatory) && (
                    <span className="cw-badge cw-badge--req">
                      {basket.tasks.filter((t) => t.isMandatory).length} إلزامية
                    </span>
                  )}
                </span>

                {locked && (
                  <span className="cw-badge cw-badge--lock" title="لا يمكن حذفها لوجود أوامر عمل بداخلها">
                    {basket.workOrdersCount} أمر عمل
                  </span>
                )}

                {!readOnly && (
                  <span className="cw-basket__actions">
                    <button
                      type="button"
                      className="cw-icon"
                      title="تعديل"
                      onClick={() => setEditing(basket.id)}
                      disabled={busy}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      type="button"
                      className="cw-icon cw-icon--danger"
                      title={locked ? "لا يمكن الحذف لوجود أوامر عمل" : "حذف"}
                      onClick={() => onDeleteBasket(basket)}
                      disabled={busy || locked}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </span>
                )}
              </div>

              {editing === basket.id && (
                <BasketForm
                  initial={basket}
                  onCancel={() => setEditing(null)}
                  onSubmit={async (values) => {
                    await onUpdateBasket(basket.id, values);
                    setEditing(null);
                  }}
                />
              )}

              {open && (
                <div className="cw-basket__body">
                  {basket.description && <p className="cw-basket__desc">{basket.description}</p>}

                  <dl className="cw-rules">
                    <div>
                      <dt>شرط الانتقال</dt>
                      <dd>{basket.transitionRequirements || "لا يوجد شرط نصّي"}</dd>
                    </div>
                    <div>
                      <dt>الانتقال يتطلّب</dt>
                      <dd>
                        {[
                          basket.requireMandatoryTasks ? "إنجاز المهام الإلزامية" : null,
                          basket.requireAttachments ? "استكمال المرفقات" : null,
                        ]
                          .filter(Boolean)
                          .join(" + ") || "لا قيود"}
                      </dd>
                    </div>
                  </dl>

                  <TaskList
                    basket={basket}
                    readOnly={readOnly}
                    busy={busy}
                    editing={taskEditing}
                    setEditing={setTaskEditing}
                    onAddTask={onAddTask}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onReorderTasks={onReorderTasks}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** مهام سلة واحدة، بترتيب قابل للسحب. */
function TaskList({
  basket,
  readOnly,
  busy,
  editing,
  setEditing,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const tasks = basket.tasks;

  const isNew = editing?.basketId === basket.id && editing.task === null;

  return (
    <div className="cw-tasks">
      <div className="cw-tasks__head">
        <h4>
          مهام السلة
          <InfoTip text="أعمال تُنفَّذ أثناء وجود أمر العمل في هذه السلة. المهمة ليست سلة فرعية." />
        </h4>
        {!readOnly && (
          <button
            type="button"
            className="cw-btn cw-btn--tiny"
            onClick={() => setEditing({ basketId: basket.id, task: null })}
            disabled={busy}
          >
            <FontAwesomeIcon icon={faPlus} /> مهمة
          </button>
        )}
      </div>

      {isNew && (
        <TaskForm
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            await onAddTask(basket.id, values);
            setEditing(null);
          }}
        />
      )}

      {tasks.length === 0 && !isNew && <p className="cw-empty cw-empty--sm">لا مهام.</p>}

      <ol className="cw-tasklist">
        {tasks.map((task, index) => (
          <li
            key={task.id}
            className={"cw-task" + (task.isActive ? "" : " cw-task--off")}
            {...dragProps({
              index,
              dragIndex,
              setDragIndex,
              items: tasks,
              disabled: readOnly || busy,
              onDrop: (next) => onReorderTasks(basket.id, next.map((t) => t.id)),
            })}
          >
            {!readOnly && (
              <span className="cw-grip cw-grip--sm">
                <FontAwesomeIcon icon={faGripVertical} />
              </span>
            )}

            <span className="cw-task__name">{task.name}</span>

            {task.isMandatory && <span className="cw-badge cw-badge--req">إلزامية</span>}
            {task.durationDays ? <span className="cw-task__meta">{task.durationDays} يوم</span> : null}
            {task.defaultAssigneeRole && (
              <span className="cw-task__meta">{task.defaultAssigneeRole}</span>
            )}

            {!readOnly && (
              <span className="cw-task__actions">
                <button
                  type="button"
                  className="cw-icon"
                  title="تعديل"
                  onClick={() => setEditing({ basketId: basket.id, task })}
                  disabled={busy}
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button
                  type="button"
                  className="cw-icon cw-icon--danger"
                  title="حذف"
                  onClick={() => onDeleteTask(task)}
                  disabled={busy}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </span>
            )}

            {editing?.task?.id === task.id && (
              <TaskForm
                initial={task}
                onCancel={() => setEditing(null)}
                onSubmit={async (values) => {
                  await onUpdateTask(task.id, values);
                  setEditing(null);
                }}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
