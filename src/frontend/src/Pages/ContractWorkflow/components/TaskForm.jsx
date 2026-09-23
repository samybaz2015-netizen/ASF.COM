import { useState } from "react";

import { InfoTip } from "./InfoTip";

/** نموذج إضافة أو تعديل مهمة داخل سلة. */
export function TaskForm({ initial, onCancel, onSubmit }) {
  const [values, setValues] = useState(() => ({
    name: initial?.name || "",
    description: initial?.description || "",
    isMandatory: initial ? initial.isMandatory : false,
    isActive: initial ? initial.isActive : true,
    defaultAssigneeRole: initial?.defaultAssigneeRole || "",
    durationDays: initial?.durationDays ?? "",
    requiredAttachments: initial?.requiredAttachments || "",
    requiredForms: initial?.requiredForms || "",
  }));
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) =>
    setValues((prev) => ({
      ...prev,
      [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();
    if (!values.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        // حقل فارغ يعني "غير محدّد"، لا صفر يوم.
        durationDays: values.durationDays === "" ? null : Number(values.durationDays),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="cw-form cw-form--task" onSubmit={submit}>
      <div className="cw-form__grid">
        <label className="cw-field">
          <span>اسم المهمة</span>
          <input value={values.name} onChange={set("name")} maxLength={256} required autoFocus />
        </label>

        <label className="cw-field">
          <span>الجهة المسؤولة</span>
          <input
            value={values.defaultAssigneeRole}
            onChange={set("defaultAssigneeRole")}
            maxLength={128}
            placeholder="الدور الافتراضي"
          />
        </label>

        <label className="cw-field">
          <span>المدة (أيام)</span>
          <input type="number" min="0" value={values.durationDays} onChange={set("durationDays")} />
        </label>

        <label className="cw-field">
          <span>
            المرفقات المطلوبة
            <InfoTip text="افصل بين المرفقات بفاصلة." />
          </span>
          <input
            value={values.requiredAttachments}
            onChange={set("requiredAttachments")}
            maxLength={1000}
          />
        </label>

        <label className="cw-field">
          <span>النماذج المطلوبة</span>
          <input value={values.requiredForms} onChange={set("requiredForms")} maxLength={1000} />
        </label>

        <label className="cw-field cw-field--wide">
          <span>الوصف</span>
          <textarea value={values.description} onChange={set("description")} rows={2} maxLength={1000} />
        </label>
      </div>

      <div className="cw-form__checks">
        <label>
          <input type="checkbox" checked={values.isMandatory} onChange={set("isMandatory")} />
          مهمة إلزامية
        </label>
        <label>
          <input type="checkbox" checked={values.isActive} onChange={set("isActive")} />
          مفعّلة
        </label>
      </div>

      <div className="cw-form__actions">
        <button type="submit" className="cw-btn cw-btn--primary cw-btn--tiny" disabled={saving}>
          {saving ? "جارٍ الحفظ…" : "حفظ"}
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
