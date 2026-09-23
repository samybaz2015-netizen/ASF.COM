import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical, faPen, faPlus } from "@fortawesome/free-solid-svg-icons";

import { InfoTip } from "./InfoTip";
import { dragProps, keyboardMove } from "../utils/dragList";

/** أنواع المشاريع التي يمكن ربط القسم بأحدها. */
const PROJECT_TYPES = [
  { code: "", label: "بلا ربط" },
  { code: "Construction", label: "الإنشاءات" },
  { code: "Maintenance", label: "الصيانة" },
  { code: "Emergency", label: "الطوارئ" },
  { code: "NewProject", label: "المشاريع الجديدة" },
  { code: "PrivateProject", label: "المشاريع الخاصة" },
];

/** قائمة أقسام العقد، بترتيب قابل للسحب واختيار قسم للتحرير. */
export function DepartmentPanel({
  departments,
  selectedId,
  busy,
  canManage,
  onSelect,
  onReorder,
  onCreate,
  onUpdate,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | departmentId

  return (
    <aside className="cw-depts">
      <div className="cw-depts__head">
        <h3>
          الأقسام
          <InfoTip text="أقسام هذا العقد. لكل قسم مسار سلال مستقل." />
        </h3>
        {canManage && (
          <button
            type="button"
            className="cw-btn cw-btn--tiny"
            onClick={() => setEditing("new")}
            disabled={busy}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        )}
      </div>

      {editing === "new" && (
        <DepartmentForm
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            await onCreate(values);
            setEditing(null);
          }}
        />
      )}

      {departments.length === 0 && editing !== "new" && (
        <p className="cw-empty cw-empty--sm">لا أقسام في هذا العقد.</p>
      )}

      <ul className="cw-deptlist">
        {departments.map((dept, index) => (
          <li
            key={dept.id}
            className={
              "cw-dept" +
              (dept.id === selectedId ? " cw-dept--active" : "") +
              (dept.isActive ? "" : " cw-dept--off")
            }
            {...dragProps({
              index,
              dragIndex,
              setDragIndex,
              items: departments,
              disabled: !canManage || busy,
              onDrop: (next) => onReorder(next.map((d) => d.id)),
            })}
          >
            {canManage && (
              <span
                className="cw-grip cw-grip--sm"
                role="button"
                tabIndex={0}
                aria-label={`نقل ${dept.name}`}
                onKeyDown={(event) =>
                  keyboardMove(event, {
                    index,
                    items: departments,
                    onDrop: (next) => onReorder(next.map((d) => d.id)),
                  })
                }
              >
                <FontAwesomeIcon icon={faGripVertical} />
              </span>
            )}

            <button type="button" className="cw-dept__btn" onClick={() => onSelect(dept.id)}>
              <span className="cw-dept__name">{dept.name}</span>
              <span className="cw-dept__meta">
                {dept.hasPublishedWorkflow ? `${dept.basketsCount} سلة معتمدة` : "بلا مسار معتمد"}
                {dept.hasDraftWorkflow && <em className="cw-badge cw-badge--draft">مسودة</em>}
              </span>
            </button>

            {canManage && (
              <button
                type="button"
                className="cw-icon"
                title="تعديل القسم"
                onClick={() => setEditing(dept.id)}
                disabled={busy}
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
            )}

            {editing === dept.id && (
              <DepartmentForm
                initial={dept}
                onCancel={() => setEditing(null)}
                onSubmit={async (values) => {
                  await onUpdate(dept.id, values);
                  setEditing(null);
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function DepartmentForm({ initial, onCancel, onSubmit }) {
  const [values, setValues] = useState(() => ({
    name: initial?.name || "",
    projectTypeCode: initial?.projectTypeCode || "",
    isActive: initial ? initial.isActive : true,
  }));
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!values.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ ...values, name: values.name.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="cw-form cw-form--dept" onSubmit={submit}>
      <label className="cw-field">
        <span>اسم القسم</span>
        <input
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          maxLength={128}
          required
          autoFocus
        />
      </label>

      <label className="cw-field">
        <span>
          نوع المشروع
          <InfoTip text="يربط القسم بأحد أنواع المشاريع القائمة في النظام، ليعرف النظام أي أوامر عمل تتبع مساره." />
        </span>
        <select
          value={values.projectTypeCode}
          onChange={(e) => setValues((v) => ({ ...v, projectTypeCode: e.target.value }))}
        >
          {PROJECT_TYPES.map((type) => (
            <option key={type.code} value={type.code}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="cw-check">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))}
        />
        مفعّل
      </label>

      <div className="cw-form__actions">
        <button type="submit" className="cw-btn cw-btn--primary cw-btn--tiny" disabled={saving}>
          {saving ? "…" : "حفظ"}
        </button>
        <button
          type="button"
          className="cw-btn cw-btn--ghost cw-btn--tiny"
          onClick={onCancel}
          disabled={saving}
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
