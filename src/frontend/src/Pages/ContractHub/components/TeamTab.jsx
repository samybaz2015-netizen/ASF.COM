import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

import * as api from "../../../services/ContractSetupApi";

const ACTIONS = [
  { key: "canView", label: "اطلاع" },
  { key: "canCreate", label: "إنشاء" },
  { key: "canEdit", label: "تعديل" },
  { key: "canDelete", label: "حذف" },
];

/**
 * فريق عمل العقد وصلاحياته.
 *
 * صف واحد يقول: فلان — على هذا القسم وهذا النوع — يستطيع الاطلاع والإنشاء
 * والتعديل والحذف. لا شجرة صلاحيات ولا استثناءات متشابكة.
 *
 * تعديل مربّع يُحفظ فوراً، فلا يضيع عمل الأدمن إن نسي زر الحفظ.
 */
export function TeamTab({ contractId, departments, types, users, team, busy, onChanged }) {
  const [adding, setAdding] = useState(false);

  const fail = (err) =>
    Swal.fire({ icon: "error", title: "تعذّر التنفيذ", text: api.errorMessage(err, "خطأ غير متوقع.") });

  const grouped = useMemo(() => {
    const map = new Map();
    team.forEach((row) => {
      if (!map.has(row.userId)) map.set(row.userId, []);
      map.get(row.userId).push(row);
    });
    return [...map.entries()];
  }, [team]);

  const toggle = async (row, action) => {
    try {
      await api.upsertTeamPermission(contractId, {
        userId: row.userId,
        userName: row.userName,
        departmentId: row.departmentId,
        workOrderTypeId: row.workOrderTypeId,
        canView: row.canView,
        canCreate: row.canCreate,
        canEdit: row.canEdit,
        canDelete: row.canDelete,
        [action]: !row[action],
      });
      await onChanged();
    } catch (err) {
      fail(err);
    }
  };

  const remove = async (row) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: `إزالة صلاحية ${row.userName || row.userId}؟`,
      showCancelButton: true,
      confirmButtonText: "إزالة",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#a33636",
    });
    if (!confirmed.isConfirmed) return;

    try {
      await api.removeTeamPermission(row.id);
      await onChanged();
    } catch (err) {
      fail(err);
    }
  };

  const add = async (values) => {
    try {
      await api.upsertTeamPermission(contractId, values);
      setAdding(false);
      await onChanged();
    } catch (err) {
      fail(err);
    }
  };

  return (
    <section className="asf-panel">
      <header className="asf-panel__head">
        <div>
          <h3>فريق العمل والصلاحيات</h3>
          <p>
            اختر الموظف، ثم القسم والنوع، ثم ما يستطيع فعله. القسم أو النوع فارغاً يعني
            «الكل».
          </p>
        </div>
        <button
          type="button"
          className="asf-btn asf-btn--primary asf-btn--sm"
          onClick={() => setAdding(true)}
          disabled={busy}
        >
          <FontAwesomeIcon icon={faPlus} /> إسناد صلاحية
        </button>
      </header>

      <div className="asf-panel__body">
        {adding && (
          <TeamForm
            departments={departments}
            types={types}
            users={users}
            onCancel={() => setAdding(false)}
            onSubmit={add}
          />
        )}

        {grouped.length === 0 && !adding ? (
          <div className="asf-empty">
            <strong>لا أحد مسند لهذا العقد</strong>
            <span>الموظف بلا إسناد يتبع صلاحيات النظام العامة.</span>
          </div>
        ) : (
          <div className="asf-table__scroll">
            <table className="asf-table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>القسم</th>
                  <th>النوع</th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} style={{ textAlign: "center", width: 64 }}>{a.label}</th>
                  ))}
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {grouped.map(([userId, rows]) =>
                  rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        {index === 0 ? <b>{row.userName || userId}</b> : <span className="asf-hint">↳</span>}
                      </td>
                      <td>{row.departmentName || <span className="asf-hint">كل الأقسام</span>}</td>
                      <td>{row.workOrderTypeName || <span className="asf-hint">كل الأنواع</span>}</td>

                      {ACTIONS.map((a) => (
                        <td key={a.key} style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={!!row[a.key]}
                            onChange={() => toggle(row, a.key)}
                            disabled={busy}
                            aria-label={`${a.label} لـ ${row.userName || userId}`}
                            style={{ accentColor: "#2a385b", cursor: "pointer" }}
                          />
                        </td>
                      ))}

                      <td>
                        <button
                          type="button"
                          className="asf-icon-btn asf-icon-btn--danger"
                          title="إزالة"
                          onClick={() => remove(row)}
                          disabled={busy}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function TeamForm({ departments, types, users, onCancel, onSubmit }) {
  const [values, setValues] = useState({
    userId: "",
    departmentId: "",
    workOrderTypeId: "",
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!values.userId) return;
    setSaving(true);
    try {
      const user = users.find((u) => String(u.id) === String(values.userId));
      await onSubmit({
        userId: values.userId,
        userName: user?.userName || user?.fullName || user?.email || null,
        departmentId: values.departmentId === "" ? null : Number(values.departmentId),
        workOrderTypeId: values.workOrderTypeId === "" ? null : Number(values.workOrderTypeId),
        canView: values.canView,
        canCreate: values.canCreate,
        canEdit: values.canEdit,
        canDelete: values.canDelete,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="asf-toolbar" onSubmit={submit}>
      <label className="asf-field">
        <span>الموظف</span>
        <select
          value={values.userId}
          onChange={(e) => setValues((v) => ({ ...v, userId: e.target.value }))}
          required
        >
          <option value="">اختر موظفاً…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.userName || u.fullName || u.email}
            </option>
          ))}
        </select>
      </label>

      <label className="asf-field">
        <span>القسم</span>
        <select
          value={values.departmentId}
          onChange={(e) => setValues((v) => ({ ...v, departmentId: e.target.value }))}
        >
          <option value="">كل الأقسام</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </label>

      <label className="asf-field">
        <span>نوع أمر العمل</span>
        <select
          value={values.workOrderTypeId}
          onChange={(e) => setValues((v) => ({ ...v, workOrderTypeId: e.target.value }))}
        >
          <option value="">كل الأنواع</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>

      <div className="asf-field">
        <span>الصلاحيات</span>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 6 }}>
          {ACTIONS.map((a) => (
            <label key={a.key} className="asf-check">
              <input
                type="checkbox"
                checked={values[a.key]}
                onChange={(e) => setValues((v) => ({ ...v, [a.key]: e.target.checked }))}
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      <div className="asf-toolbar__actions">
        <button type="submit" className="asf-btn asf-btn--primary asf-btn--sm" disabled={saving}>
          {saving ? "…" : "إسناد"}
        </button>
        <button type="button" className="asf-btn asf-btn--sm" onClick={onCancel} disabled={saving}>
          إلغاء
        </button>
      </div>
    </form>
  );
}
