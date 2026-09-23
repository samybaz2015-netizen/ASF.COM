import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faUserShield, faUsers } from "@fortawesome/free-solid-svg-icons";

import { fetchRolePermissions, setRolePermissions } from "../../../services/AccessApi";
import { PermissionTree } from "./PermissionTree";
import { describeCode, diffPermissions } from "../utils/permissionCatalog";

/**
 * تبويب الأدوار — منح الدور صلاحياته فيرثها كل مستخدميه.
 *
 * الترتيب المطبّق في الخلفية:
 *   منع صريح للمستخدم > سماح صريح > صلاحية الدور > منع افتراضي
 */
export function RolesTab({ tree }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [original, setOriginal] = useState(() => new Set());
  const [chosen, setChosen] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  const inFlight = useRef(false);
  const diff = useMemo(() => diffPermissions(original, chosen), [original, chosen]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchRolePermissions();
      setRoles(list);

      // حافظ على الدور المفتوح بعد إعادة التحميل
      setSelected((current) => {
        if (!current) return null;
        const fresh = list.find((r) => r.roleName === current.roleName);
        if (fresh) {
          const set = new Set(fresh.permissions);
          setOriginal(set);
          setChosen(new Set(set));
        }
        return fresh || null;
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "تعذّر تحميل الأدوار",
        text: error?.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openRole = (role) => {
    setSelected(role);
    const set = new Set(role.permissions);
    setOriginal(set);
    setChosen(new Set(set));
  };

  const toggle = useCallback((code) => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((group, turnOn) => {
    setChosen((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => (turnOn ? next.add(p.code) : next.delete(p.code)));
      return next;
    });
  }, []);

  const selectAll = useCallback(
    (turnOn) =>
      setChosen(turnOn ? new Set(tree.flatMap((g) => g.permissions.map((p) => p.code))) : new Set()),
    [tree]
  );

  const selectAction = useCallback(
    (action, turnOn) => {
      setChosen((prev) => {
        const next = new Set(prev);
        tree.forEach((group) =>
          group.permissions
            .filter((p) => p.action === action)
            .forEach((p) => (turnOn ? next.add(p.code) : next.delete(p.code)))
        );
        return next;
      });
    },
    [tree]
  );

  const save = useCallback(async () => {
    if (!selected || inFlight.current || !diff.hasChanges) return;

    const list = (codes) => codes.map((c) => `<li>${describeCode(c)}</li>`).join("");

    const confirm = await Swal.fire({
      icon: "warning",
      title: "تعديل صلاحيات دور",
      width: 620,
      html:
        `<div style="text-align:right">` +
        `<p>الدور: <b>${selected.roleName}</b></p>` +
        `<p style="color:#92400e">سيؤثر التعديل على <b>${selected.usersCount}</b> مستخدماً يرثون منه، ` +
        `وستُبطل رموز دخولهم فيحتاجون تسجيل دخول جديد.</p>` +
        (diff.added.length
          ? `<p style="color:#15803d;margin-top:.6rem"><b>إضافة (${diff.added.length})</b></p>` +
            `<ul style="padding-inline-start:1.2rem;max-height:140px;overflow:auto">${list(diff.added)}</ul>`
          : "") +
        (diff.removed.length
          ? `<p style="color:#b91c1c;margin-top:.6rem"><b>إزالة (${diff.removed.length})</b></p>` +
            `<ul style="padding-inline-start:1.2rem;max-height:140px;overflow:auto">${list(diff.removed)}</ul>`
          : "") +
        `</div>`,
      showCancelButton: true,
      confirmButtonText: "تأكيد وحفظ",
      cancelButtonText: "إلغاء",
    });
    if (!confirm.isConfirmed) return;

    inFlight.current = true;
    setSaving(true);
    try {
      await setRolePermissions(selected.roleName, chosen);
      await load();
      Swal.fire({
        icon: "success",
        title: "حُفظت صلاحيات الدور",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "فشل الحفظ",
        text: error?.response?.data?.message || error.message,
      });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, [selected, chosen, diff, load]);

  return (
    <>
      <section className="am-card">
        <h2 className="am-card__title">
          <FontAwesomeIcon icon={faUserShield} />
          الأدوار
        </h2>

        {loading && <p className="am-empty">جارٍ التحميل…</p>}
        {!loading && roles.length === 0 && <p className="am-empty">لا توجد أدوار معرّفة.</p>}

        {!loading && roles.length > 0 && (
          <div className="am-table-wrap">
            <table className="am-table">
              <thead>
                <tr>
                  <th>الدور</th>
                  <th>عدد الصلاحيات</th>
                  <th>المستخدمون</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr
                    key={role.roleId}
                    className={selected?.roleName === role.roleName ? "am-row--active" : ""}
                  >
                    <td>{role.roleName}</td>
                    <td>{role.permissions.length}</td>
                    <td>
                      <span className="am-tag am-tag--on">
                        <FontAwesomeIcon icon={faUsers} />
                        {role.usersCount}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="am-btn am-btn--ghost" onClick={() => openRole(role)}>
                        تعديل الصلاحيات
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <section className="am-card">
          <div className="am-target">
            <div className="am-target__identity">
              <h2 className="am-card__title">
                <FontAwesomeIcon icon={faUserShield} />
                صلاحيات دور: {selected.roleName}
              </h2>
              <div className="am-target__meta">
                <span>المستخدمون الوارثون: {selected.usersCount}</span>
                <span>الصلاحيات الحالية: {original.size}</span>
              </div>
            </div>

            <div className="am-target__actions">
              <button
                type="button"
                className="am-btn am-btn--ghost"
                onClick={() => setChosen(new Set(original))}
                disabled={!diff.hasChanges || saving}
              >
                تراجع
              </button>
              <button
                type="button"
                className="am-btn am-btn--primary"
                onClick={save}
                disabled={!diff.hasChanges || saving}
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                حفظ صلاحيات الدور
              </button>
            </div>
          </div>

          {diff.hasChanges && (
            <div className="am-diff">
              {diff.added.length > 0 && (
                <span className="am-diff__chip am-diff__chip--add">+ {diff.added.length} إضافة</span>
              )}
              {diff.removed.length > 0 && (
                <span className="am-diff__chip am-diff__chip--remove">− {diff.removed.length} إزالة</span>
              )}
              <span className="am-diff__hint">
                يرثها {selected.usersCount} مستخدماً — لم تُحفظ بعد
              </span>
            </div>
          )}

          <PermissionTree
            tree={tree}
            selected={chosen}
            onToggle={toggle}
            onToggleGroup={toggleGroup}
            onSelectAll={selectAll}
            onSelectAction={selectAction}
            disabled={saving}
          />
        </section>
      )}
    </>
  );
}
