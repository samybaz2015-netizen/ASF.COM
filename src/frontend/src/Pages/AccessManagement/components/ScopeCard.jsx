import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faSpinner, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import { fetchBranchList, setOutsideBranchAccess, setUserBranch } from "../../../services/AccessApi";

/**
 * مكان الصلاحية — على أي بيانات يعمل المستخدم.
 *
 * ما تدعمه الخلفية اليوم مستويان:
 *   1. الإدارة المرتبطة بالحساب — تُغيَّر من هنا عبر Account/update-account
 *   2. مفتاح السماح بالعمل خارج الإدارة
 *
 * التحديث جزئي ولا يمسح بقية حقول الحساب (مُختبَر محلياً: الاسم والهاتف
 * والنوع بقيت بعد تغيير الإدارة).
 *
 * النطاق المتعدد — عدة إدارات بعينها، أو نوع أمر عمل، أو منطقة — يحتاج جدول
 * UserDataScopes في الخلفية. راجع docs/access-management.md القسم 3.3
 */
export function ScopeCard({ user, onUserChanged }) {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(user.branchId ?? "");
  const [outside, setOutside] = useState(Boolean(user.userCanCreateProjectOutsideCityType));
  const [savingBranch, setSavingBranch] = useState(false);
  const [savingOutside, setSavingOutside] = useState(false);

  useEffect(() => {
    setBranchId(user.branchId ?? "");
    setOutside(Boolean(user.userCanCreateProjectOutsideCityType));
  }, [user]);

  useEffect(() => {
    fetchBranchList()
      .then((list) => setBranches(list))
      .catch(() => setBranches([]));
  }, []);

  const currentBranchName =
    branches.find((b) => String(b.id) === String(user.branchId))?.name || user.branchName || "—";

  const changeBranch = async (nextId) => {
    if (!nextId || String(nextId) === String(user.branchId)) return;

    if (!user.email) {
      Swal.fire({
        icon: "error",
        title: "تعذّر تغيير الإدارة",
        text: "لا يوجد بريد إلكتروني لهذا الحساب، والخلفية تعرّف المستخدم بالبريد.",
      });
      return;
    }

    const nextName = branches.find((b) => String(b.id) === String(nextId))?.name || nextId;

    const confirm = await Swal.fire({
      icon: "warning",
      title: "نقل المستخدم إلى إدارة أخرى",
      html:
        `<div style="text-align:right">` +
        `<p><b>${user.displayName || user.userName}</b></p>` +
        `<p>من: <b>${currentBranchName}</b></p>` +
        `<p>إلى: <b>${nextName}</b></p>` +
        `<p style="color:#92400e;margin-top:.6rem">يغيّر هذا نطاق بياناته في كل شاشات البرنامج.</p>` +
        `</div>`,
      showCancelButton: true,
      confirmButtonText: "نقل",
      cancelButtonText: "إلغاء",
    });

    if (!confirm.isConfirmed) {
      setBranchId(user.branchId ?? "");
      return;
    }

    setSavingBranch(true);
    try {
      await setUserBranch(user.email, Number(nextId));
      onUserChanged?.({ ...user, branchId: Number(nextId), branchName: nextName });

      Swal.fire({
        icon: "success",
        title: "نُقل المستخدم",
        text: `صار نطاقه: ${nextName}`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      setBranchId(user.branchId ?? "");
      Swal.fire({
        icon: "error",
        title: "تعذّر نقل المستخدم",
        text: error?.response?.data?.message || error.message,
      });
    } finally {
      setSavingBranch(false);
    }
  };

  const toggleOutside = async (next) => {
    setSavingOutside(true);
    const previous = outside;
    setOutside(next);

    try {
      await setOutsideBranchAccess(user.id, next);
      onUserChanged?.({ ...user, userCanCreateProjectOutsideCityType: next });

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: next ? "سُمح بالعمل خارج الإدارة" : "قُصر العمل على إدارته",
        showConfirmButton: false,
        timer: 1800,
      });
    } catch (error) {
      setOutside(previous);
      Swal.fire({
        icon: "error",
        title: "تعذّر تغيير النطاق",
        text: error?.response?.data?.message || error.message,
      });
    } finally {
      setSavingOutside(false);
    }
  };

  return (
    <div className="am-scope">
      <h3 className="am-scope__title">
        <FontAwesomeIcon icon={faLocationDot} />
        مكان الصلاحية — على أي بيانات يعمل
      </h3>

      <div className="am-scope__grid">
        <div className="am-scope__field">
          <span className="am-scope__label">
            الإدارة {savingBranch && <FontAwesomeIcon icon={faSpinner} spin />}
          </span>
          <select
            className="am-scope__select"
            value={branchId}
            disabled={savingBranch}
            onChange={(e) => {
              setBranchId(e.target.value);
              changeBranch(e.target.value);
            }}
          >
            <option value="">— غير محددة —</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="am-scope__field">
          <span className="am-scope__label">المكتب</span>
          <span className="am-scope__value">{user.officeName || "—"}</span>
          <small className="am-scope__hint">يُحدَّد من صفحة الحسابات</small>
        </div>

        <label className="am-scope__toggle">
          <input
            type="checkbox"
            className="am-check"
            checked={outside}
            disabled={savingOutside}
            onChange={(e) => toggleOutside(e.target.checked)}
          />
          <span>
            السماح بالعمل خارج إدارته
            <small>يوسّع نطاقه ليشمل إدارات أخرى في إنشاء المشاريع</small>
          </span>
        </label>
      </div>

      <p className="am-note am-note--tight">
        <FontAwesomeIcon icon={faTriangleExclamation} />
        النطاق هنا إدارة واحدة، ومفتاح يسمح بتجاوزها. تحديد <b>عدة إدارات بعينها</b> أو
        نوع أمر عمل أو منطقة يحتاج جدول نطاقات في الخلفية.
      </p>
    </div>
  );
}
