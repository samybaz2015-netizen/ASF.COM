import { useState } from "react";

import { InfoTip } from "./InfoTip";

/** نموذج إضافة أو تعديل سلة، يُعرض داخل اللوحة لا في نافذة منفصلة. */
export function BasketForm({ initial, onCancel, onSubmit }) {
  const [values, setValues] = useState(() => ({
    name: initial?.name || "",
    purpose: initial?.purpose || "",
    description: initial?.description || "",
    transitionRequirements: initial?.transitionRequirements || "",
    requireMandatoryTasks: initial ? initial.requireMandatoryTasks : true,
    requireAttachments: initial ? initial.requireAttachments : false,
    isActive: initial ? initial.isActive : true,
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
      await onSubmit({ ...values, name: values.name.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="cw-form" onSubmit={submit}>
      <div className="cw-form__grid">
        <label className="cw-field">
          <span>اسم السلة</span>
          <input value={values.name} onChange={set("name")} maxLength={160} required autoFocus />
        </label>

        <label className="cw-field">
          <span>
            الغرض
            <InfoTip text="يظهر في علامة المعلومات بجانب اسم السلة، ليعرف المستخدم لماذا وُجدت." />
          </span>
          <input value={values.purpose} onChange={set("purpose")} maxLength={1000} />
        </label>

        <label className="cw-field cw-field--wide">
          <span>الوصف</span>
          <textarea value={values.description} onChange={set("description")} rows={2} maxLength={1000} />
        </label>

        <label className="cw-field cw-field--wide">
          <span>
            شرط الانتقال
            <InfoTip text="شرط مكتوب يراه المستخدم قبل نقل أمر العمل إلى السلة التالية." />
          </span>
          <input
            value={values.transitionRequirements}
            onChange={set("transitionRequirements")}
            maxLength={1000}
          />
        </label>
      </div>

      <div className="cw-form__checks">
        <label>
          <input
            type="checkbox"
            checked={values.requireMandatoryTasks}
            onChange={set("requireMandatoryTasks")}
          />
          يمنع الانتقال قبل إنجاز المهام الإلزامية
        </label>
        <label>
          <input
            type="checkbox"
            checked={values.requireAttachments}
            onChange={set("requireAttachments")}
          />
          يمنع الانتقال قبل استكمال المرفقات
        </label>
        <label>
          <input type="checkbox" checked={values.isActive} onChange={set("isActive")} />
          مفعّلة
        </label>
      </div>

      <div className="cw-form__actions">
        <button type="submit" className="cw-btn cw-btn--primary" disabled={saving}>
          {saving ? "جارٍ الحفظ…" : "حفظ في المسودة"}
        </button>
        <button type="button" className="cw-btn cw-btn--ghost" onClick={onCancel} disabled={saving}>
          إلغاء
        </button>
      </div>
    </form>
  );
}
