import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faChevronDown,
  faMagnifyingGlass,
  faShieldHalved,
  faTriangleExclamation,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

import { actionLabel, filterTree, groupState } from "../utils/permissionCatalog";

/** مربع اختيار يدعم الحالة الجزئية (البند 9). */
function TriCheckbox({ state, onChange, id, label }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);

  return (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className="am-check"
      checked={state === "all"}
      onChange={onChange}
      aria-label={label}
    />
  );
}

/**
 * شجرة الصلاحيات — البنود 7 و8 و9 و10 و12.
 *
 * كل إجراء صلاحية مستقلة: منح "عرض" لا يمنح "اعتماد" (البند 12).
 */
export function PermissionTree({ tree, selected, onToggle, onToggleGroup, onSelectAll, onSelectAction, sources, disabled }) {
  const [term, setTerm] = useState("");
  const [action, setAction] = useState("");
  const [collapsed, setCollapsed] = useState(() => new Set());

  // أنواع الإجراءات الموجودة فعلاً في كتالوج الخلفية
  const actionTypes = useMemo(() => {
    const seen = new Map();
    tree.forEach((group) =>
      group.permissions.forEach((permission) => {
        if (!seen.has(permission.action)) seen.set(permission.action, 0);
        seen.set(permission.action, seen.get(permission.action) + 1);
      })
    );
    return [...seen.entries()]
      .map(([key, count]) => ({ key, label: actionLabel(key), count }))
      .sort((a, b) => b.count - a.count);
  }, [tree]);

  const visible = useMemo(() => {
    const byTerm = filterTree(tree, term);
    if (!action) return byTerm;

    return byTerm
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) => permission.action === action),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [tree, term, action]);

  const totals = useMemo(() => {
    const all = tree.flatMap((group) => group.permissions.map((p) => p.code));
    return { all, selectedCount: all.filter((code) => selected.has(code)).length };
  }, [tree, selected]);

  const toggleCollapse = (key) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="am-tree">
      <div className="am-tree__toolbar">
        <div className="am-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="ابحث عن صلاحية…"
            aria-label="بحث في الصلاحيات"
          />
        </div>

        <div className="am-tree__bulk">
          <span className="am-counter">
            {totals.selectedCount} / {totals.all.length}
          </span>
          <button type="button" className="am-link" onClick={() => onSelectAll(true)} disabled={disabled}>
            تحديد الكل
          </button>
          <button type="button" className="am-link" onClick={() => onSelectAll(false)} disabled={disabled}>
            إلغاء الكل
          </button>
        </div>
      </div>

      <div className="am-actions-filter">
        <span className="am-actions-filter__label">نوع الإجراء</span>

        <button
          type="button"
          className={`am-pill ${!action ? "am-pill--active" : ""}`}
          onClick={() => setAction("")}
        >
          الكل
        </button>

        {actionTypes.map((entry) => (
          <button
            key={entry.key}
            type="button"
            className={`am-pill ${action === entry.key ? "am-pill--active" : ""}`}
            onClick={() => setAction(action === entry.key ? "" : entry.key)}
          >
            {entry.label}
            <span className="am-pill__count">{entry.count}</span>
          </button>
        ))}

        {action && (
          <span className="am-actions-filter__bulk">
            <button type="button" className="am-link" onClick={() => onSelectAction(action, true)} disabled={disabled}>
              منح «{actionLabel(action)}» في كل الأقسام
            </button>
            <button type="button" className="am-link" onClick={() => onSelectAction(action, false)} disabled={disabled}>
              سحبها
            </button>
          </span>
        )}
      </div>

      {visible.length === 0 && <p className="am-empty">لا توجد صلاحية مطابقة.</p>}

      <div className="am-tree__body">
        {visible.map((group) => {
          const state = groupState(group, selected);
          const isCollapsed = collapsed.has(group.key) && !term;

          return (
            <section key={group.key} className="am-group">
              <header className="am-group__head">
                <TriCheckbox
                  id={`grp-${group.key}`}
                  state={state}
                  onChange={() => onToggleGroup(group, state !== "all")}
                  label={group.label}
                />

                <button
                  type="button"
                  className="am-group__title"
                  onClick={() => toggleCollapse(group.key)}
                  aria-expanded={!isCollapsed}
                >
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`am-group__caret ${isCollapsed ? "am-group__caret--closed" : ""}`}
                  />
                  {group.label}
                  <span className="am-group__code">{group.key}</span>
                </button>

                <span className="am-group__count">
                  {group.permissions.filter((p) => selected.has(p.code)).length} /{" "}
                  {group.permissions.length}
                </span>
              </header>

              {!isCollapsed && (
                <div className="am-group__items">
                  {group.permissions.map((permission) => (
                    <label key={permission.code} className="am-item" htmlFor={permission.code}>
                      <input
                        id={permission.code}
                        type="checkbox"
                        className="am-check"
                        checked={selected.has(permission.code)}
                        onChange={() => onToggle(permission.code)}
                        disabled={disabled}
                      />
                      <span className="am-item__label">{permission.label}</span>

                      {sources?.[permission.code] && (
                        <SourceBadge info={sources[permission.code]} />
                      )}

                      {permission.sensitive && (
                        <span className="am-tag am-tag--sensitive" title="صلاحية حساسة">
                          <FontAwesomeIcon icon={faShieldHalved} />
                          حساسة
                        </span>
                      )}

                      <code className="am-item__code">{permission.code}</code>
                    </label>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p className="am-note">
        <FontAwesomeIcon icon={faTriangleExclamation} />
        صلاحية عرض الصفحة لا تمنح إجراءاتها: كل إجراء يُمنح على حدة.
      </p>
    </div>
  );
}

/** شارة تبيّن مصدر الصلاحية: موروثة من دور، أو سماح صريح، أو منع صريح. */
function SourceBadge({ info }) {
  if (info.source === "Role") {
    return (
      <span
        className="am-tag am-tag--role"
        title={info.roleName ? `موروثة من دور: ${info.roleName}` : "موروثة من دور"}
      >
        <FontAwesomeIcon icon={faUserShield} />
        موروثة
      </span>
    );
  }

  if (info.source === "UserDeny") {
    return (
      <span className="am-tag am-tag--deny" title="منع صريح يتقدّم على صلاحية الدور">
        <FontAwesomeIcon icon={faBan} />
        ممنوعة
      </span>
    );
  }

  return (
    <span className="am-tag am-tag--allow" title="ممنوحة للمستخدم مباشرة">
      خاصة
    </span>
  );
}
