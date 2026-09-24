import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faEye,
  faFloppyDisk,
  faShieldHalved,
  faTriangleExclamation,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import { getUserSession } from "../../function/AuthStorage";
import {
  fetchAvailablePermissions,
  fetchEffectivePermissions,
  fetchUserPermissions,
  fetchUsers,
  replaceUserPermissions,
} from "../../services/AccessApi";

import { UsersTab } from "./components/UsersTab";
import { RolesTab } from "./components/RolesTab";
import { ScopeCard } from "./components/ScopeCard";
import { PermissionTree } from "./components/PermissionTree";
import { buildPermissionTree, describeCode, diffPermissions } from "./utils/permissionCatalog";
import "./AccessManagement.css";

const TABS = [
  { key: "users", label: "المستخدمون" },
  { key: "roles", label: "الأدوار" },
  { key: "log", label: "سجل التغييرات" },
];

function AccessManagementPage() {
  const admin = useMemo(() => getUserSession() || {}, []);

  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [sources, setSources] = useState({});
  const [userRoles, setUserRoles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [catalog, setCatalog] = useState({});
  const [target, setTarget] = useState(null);
  const [original, setOriginal] = useState(() => new Set());
  const [selected, setSelected] = useState(() => new Set());
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);

  const inFlight = useRef(false);

  const tree = useMemo(() => buildPermissionTree(catalog), [catalog]);
  const diff = useMemo(() => diffPermissions(original, selected), [original, selected]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchUsers(), fetchAvailablePermissions()])
      .then(([userList, permissionCatalog]) => {
        if (cancelled) return;
        setUsers(userList);
        setCatalog(permissionCatalog);
      })
      .catch((error) => {
        if (cancelled) return;
        Swal.fire({
          icon: "error",
          title: "تعذّر تحميل البيانات",
          text: error?.response?.data?.message || error.message,
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openUser = useCallback(async (user) => {
    setTarget(user);
    setLoadingPerms(true);
    try {
      // الفعّالة مع مصدر كل صلاحية: موروثة من دور، أو سماح صريح، أو منع صريح
      const detailed = await fetchEffectivePermissions(user.id);

      const set = new Set(detailed.effective || []);
      setOriginal(set);
      setSelected(new Set(set));

      const map = {};
      (detailed.breakdown || []).forEach((entry) => {
        map[entry.permissionName] = {
          source: entry.source,
          roleName: entry.roleName,
          isEffective: entry.isEffective,
        };
      });
      setSources(map);
      setUserRoles(detailed.roles || []);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "تعذّر جلب صلاحيات المستخدم",
        text: error?.response?.data?.message || error.message,
      });
      setOriginal(new Set());
      setSelected(new Set());
      setSources({});
      setUserRoles([]);
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  const togglePermission = useCallback((code) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((group, turnOn) => {
    setSelected((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((permission) => {
        if (turnOn) next.add(permission.code);
        else next.delete(permission.code);
      });
      return next;
    });
  }, []);

  const selectAll = useCallback(
    (turnOn) => {
      setSelected(() => {
        if (!turnOn) return new Set();
        return new Set(tree.flatMap((group) => group.permissions.map((p) => p.code)));
      });
    },
    [tree]
  );

  // منح أو سحب نوع إجراء بعينه عبر كل الأقسام — "اختر نوع الصلاحية"
  const selectAction = useCallback(
    (action, turnOn) => {
      setSelected((prev) => {
        const next = new Set(prev);
        tree.forEach((group) =>
          group.permissions
            .filter((permission) => permission.action === action)
            .forEach((permission) => {
              if (turnOn) next.add(permission.code);
              else next.delete(permission.code);
            })
        );
        return next;
      });
    },
    [tree]
  );

  const revert = useCallback(() => setSelected(new Set(original)), [original]);

  const save = useCallback(async () => {
    if (!target || inFlight.current || !diff.hasChanges) return;

    // ملخّص ما سيتغيّر قبل الحفظ — البند 32
    const list = (codes) =>
      codes.map((code) => `<li>${describeCode(code)} <code>${code}</code></li>`).join("");

    const confirm = await Swal.fire({
      icon: "question",
      title: "تأكيد تعديل الصلاحيات",
      width: 620,
      html:
        `<div style="text-align:right">` +
        `<p>سيتم تعديل صلاحيات: <b>${target.displayName || target.userName}</b></p>` +
        (diff.added.length
          ? `<p style="color:#15803d;margin-top:.6rem"><b>إضافة (${diff.added.length})</b></p>` +
            `<ul style="padding-inline-start:1.2rem;max-height:150px;overflow:auto">${list(diff.added)}</ul>`
          : "") +
        (diff.removed.length
          ? `<p style="color:#b91c1c;margin-top:.6rem"><b>إزالة (${diff.removed.length})</b></p>` +
            `<ul style="padding-inline-start:1.2rem;max-height:150px;overflow:auto">${list(diff.removed)}</ul>`
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
      await replaceUserPermissions(target.id, selected);
      setOriginal(new Set(selected));

      Swal.fire({
        icon: "success",
        title: "تم حفظ الصلاحيات",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "فشل حفظ الصلاحيات",
        text: error?.response?.data?.message || "لم يُحفظ أي تغيير.",
      });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, [target, diff, selected]);

  return (
    <>
      
      <main className="am-page">
        <nav className="am-tabs" role="tablist">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={tab === entry.key}
              className={`am-tab ${tab === entry.key ? "am-tab--active" : ""}`}
              onClick={() => setTab(entry.key)}
            >
              {entry.label}
            </button>
          ))}
        </nav>

        {tab === "users" && (
          <>
            <section className="am-card">
              <h2 className="am-card__title">
                <FontAwesomeIcon icon={faUsers} />
                المستخدمون
              </h2>
              <UsersTab
                users={users}
                loading={loadingUsers}
                onManage={openUser}
                selectedUserId={target?.id}
              />
            </section>

            {target && (
              <section className="am-card">
                <div className="am-target">
                  <div className="am-target__identity">
                    <h2 className="am-card__title">
                      <FontAwesomeIcon icon={faShieldHalved} />
                      صلاحيات: {target.displayName || target.userName}
                    </h2>
                    <div className="am-target__meta">
                      <span>النوع: {target.userType || target.role || "—"}</span>
                      <span>
                        الأدوار:{" "}
                        {userRoles.length > 0 ? userRoles.join(" · ") : "بلا أدوار"}
                      </span>
                      <span>الإدارة: {target.branchName || "—"}</span>
                      <span>المكتب: {target.officeName || "—"}</span>
                    </div>
                  </div>

                  <div className="am-target__actions">
                    <button
                      type="button"
                      className="am-btn am-btn--ghost"
                      onClick={() =>
                        Swal.fire({
                          icon: "info",
                          title: "الصلاحيات الفعلية",
                          width: 560,
                          html:
                            `<div style="text-align:right">` +
                            `<p>العدد: <b>${selected.size}</b></p>` +
                            `<ul style="padding-inline-start:1.2rem;max-height:320px;overflow:auto">` +
                            [...selected]
                              .sort()
                              .map((code) => `<li>${describeCode(code)}</li>`)
                              .join("") +
                            `</ul></div>`,
                        })
                      }
                    >
                      <FontAwesomeIcon icon={faEye} />
                      معاينة الصلاحيات الفعلية
                    </button>

                    <button
                      type="button"
                      className="am-btn am-btn--ghost"
                      onClick={revert}
                      disabled={!diff.hasChanges || saving}
                    >
                      <FontAwesomeIcon icon={faArrowRotateLeft} />
                      تراجع
                    </button>

                    <button
                      type="button"
                      className="am-btn am-btn--primary"
                      onClick={save}
                      disabled={!diff.hasChanges || saving}
                    >
                      <FontAwesomeIcon icon={faFloppyDisk} />
                      حفظ التغييرات
                    </button>
                  </div>
                </div>

                {diff.hasChanges && (
                  <div className="am-diff">
                    {diff.added.length > 0 && (
                      <span className="am-diff__chip am-diff__chip--add">
                        + {diff.added.length} إضافة
                      </span>
                    )}
                    {diff.removed.length > 0 && (
                      <span className="am-diff__chip am-diff__chip--remove">
                        − {diff.removed.length} إزالة
                      </span>
                    )}
                    <span className="am-diff__hint">لم تُحفظ بعد</span>
                  </div>
                )}

                <ScopeCard
                  user={target}
                  onUserChanged={(updated) => {
                    setTarget(updated);
                    setUsers((prev) =>
                      prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
                    );
                  }}
                />

                {loadingPerms ? (
                  <p className="am-empty">جارٍ تحميل الصلاحيات…</p>
                ) : (
                  <PermissionTree
                    tree={tree}
                    selected={selected}
                    onToggle={togglePermission}
                    onToggleGroup={toggleGroup}
                    onSelectAll={selectAll}
                    onSelectAction={selectAction}
                    sources={sources}
                    disabled={saving}
                  />
                )}
              </section>
            )}
          </>
        )}

        {tab === "roles" && <RolesTab tree={tree} />}

        {tab === "log" && (
          <section className="am-card">
            <h2 className="am-card__title">سجل التغييرات</h2>
            <p className="am-warning">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              لا يسجّل النظام حالياً تغييرات الصلاحيات. السجل يحتاج جدولاً في الخلفية يحفظ
              المسؤول والمستخدم المتأثر والقيمة قبل وبعد والوقت — راجع المواصفة.
            </p>
          </section>
        )}

        <p className="am-footnote">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          الصلاحيات الفعّالة تُحسب في الخلفية: ما يرثه المستخدم من أدواره، زائد سماحه
          الصريح، ناقص منعه الصريح. وأي تعديل يُبطل رمز دخوله فوراً فيحتاج تسجيل دخول
          جديد. المسؤول الحالي: {admin.displayName || admin.userName}.
        </p>
      </main>
    </>
  );
}

export default AccessManagementPage;
