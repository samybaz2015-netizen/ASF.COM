import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

/** تبويب المستخدمين — البند 24: بحث وفلترة وجدول وإجراء إدارة الصلاحيات. */
export function UsersTab({ users, loading, onManage, selectedUserId }) {
  const [term, setTerm] = useState("");
  const [role, setRole] = useState("");
  const [branch, setBranch] = useState("");

  const roles = useMemo(
    () => [...new Set(users.map((u) => u.userType || u.role).filter(Boolean))].sort(),
    [users]
  );
  const branches = useMemo(
    () => [...new Set(users.map((u) => u.branchName).filter(Boolean))].sort(),
    [users]
  );

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();

    return users.filter((user) => {
      if (role && (user.userType || user.role) !== role) return false;
      if (branch && user.branchName !== branch) return false;
      if (!needle) return true;

      return [user.userName, user.displayName, user.email, user.phone]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });
  }, [users, term, role, branch]);

  return (
    <div className="am-users">
      <div className="am-filters">
        <div className="am-search am-search--wide">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="بحث عن مستخدم بالاسم أو البريد…"
            aria-label="بحث عن مستخدم"
          />
        </div>

        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="الدور">
          <option value="">كل الأدوار</option>
          {roles.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="الإدارة">
          <option value="">كل الإدارات</option>
          {branches.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <span className="am-counter">{filtered.length}</span>
      </div>

      {loading && <p className="am-empty">جارٍ التحميل…</p>}
      {!loading && filtered.length === 0 && <p className="am-empty">لا يوجد مستخدم مطابق.</p>}

      {!loading && filtered.length > 0 && (
        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>اسم المستخدم</th>
                <th>الاسم</th>
                <th>الدور</th>
                <th>الإدارة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className={selectedUserId === user.id ? "am-row--active" : ""}>
                  <td className="am-mono">{user.userName || "—"}</td>
                  <td>{user.displayName || "—"}</td>
                  <td>{user.userType || user.role || "—"}</td>
                  <td>{user.branchName || "—"}</td>
                  <td>
                    <span
                      className={`am-tag ${
                        user.isActive === false ? "am-tag--off" : "am-tag--on"
                      }`}
                    >
                      {user.isActive === false ? "معطّل" : "فعّال"}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="am-btn am-btn--ghost" onClick={() => onManage(user)}>
                      <FontAwesomeIcon icon={faShieldHalved} />
                      إدارة الصلاحيات
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
