import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faShieldAlt, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Url } from "../../function/FunctionApi";
import axios from "axios";
import Swal from "sweetalert2";
import { authHeaders, btnClass, getOtherBranch } from "./AccountsConstants";
import PermissionModule from "./PermissionModule";
import BranchTabs from "./BranchTabs";
import ToggleSwitch from "./ToggleSwitch";

export default function PermissionsModal({ acc, onClose }) {
  const otherBranch = getOtherBranch(acc.branchId);

  const [activeTab, setActiveTab] = useState("own");

  // ── صلاحيات الفرع الأساسي (شجرة الموديولز) ─────────────────────────
  const [available, setAvailable] = useState({});
  const [current, setCurrent] = useState(
    new Set(Array.isArray(acc.permissions) ? acc.permissions : []),
  );
  const [openModules, setOpenModules] = useState(new Set());
  const [loadingPerms, setLoadingPerms] = useState(true);

  // ── إمكانية العمل في الفرع الآخر (toggle واحد) ──────────────────────
  const [canCreateOutside, setCanCreateOutside] = useState(
    !!acc.userCanCreateProjectOutsideCityType,
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [avRes, curRes] = await Promise.all([
          axios.get(`${Url}Permissions/available`, { headers: authHeaders() }),
          axios.get(`${Url}Permissions/user/${acc.id}`, { headers: authHeaders() }),
        ]);
        setAvailable(avRes.data.modules || avRes.data || {});
        const permsArray = Array.isArray(curRes.data) ? curRes.data : curRes.data?.permissions ?? [];
        setCurrent(new Set(permsArray));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPerms(false);
      }
    })();
  }, [acc.id]);

  const toggleModuleOpen = (module) =>
    setOpenModules((prev) => {
      const n = new Set(prev);
      n.has(module) ? n.delete(module) : n.add(module);
      return n;
    });

  const togglePerm = (perm) =>
    setCurrent((prev) => {
      const n = new Set(prev);
      n.has(perm) ? n.delete(perm) : n.add(perm);
      return n;
    });

  const toggleAllInModule = (perms) => {
    const allOn = perms.every((p) => current.has(p));
    setCurrent((prev) => {
      const n = new Set(prev);
      perms.forEach((p) => (allOn ? n.delete(p) : n.add(p)));
      return n;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {

      await axios.put(
        `${Url}Permissions/replace`,
        { userId: acc.id, permissions: [...current] },
        { headers: authHeaders() },
      );


      if (otherBranch) {
        await axios.put(
          `${Url}Account/users/update-permission`,
          { engineerId: acc.id, canCreateOutsideCity: canCreateOutside },
          { headers: authHeaders() },
        );
      }

      Swal.fire({
        icon: "success", title: "تم الحفظ", text: "تم تحديث الصلاحيات بنجاح",
        confirmButtonColor: "#2A385B", timer: 1800, showConfirmButton: false,
      });
      onClose();
    } catch {
      Swal.fire({ icon: "error", title: "خطأ", text: "تعذّر حفظ الصلاحيات", confirmButtonColor: "#2A385B" });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "own", label: acc.branchName || "الفرع الأساسي" },
    ...(otherBranch ? [{ key: "other", label: otherBranch.name }] : []),
  ];

  const totalActive = [...current].length;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4"
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-[680px] max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2)] font-cairo">

        {/* header */}
        <div className="flex justify-between items-start mb-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[rgba(42,56,91,0.08)] flex items-center justify-center">
              <FontAwesomeIcon icon={faShieldAlt} className="text-mainColor" />
            </div>
            <div>
              <h3 className="m-0 text-mainColor text-lg font-extrabold">صلاحيات الحساب</h3>
              <p className="m-0 text-[rgba(42,56,91,0.3)] text-sm">
                {acc.displayName || acc.userName}
                {!loadingPerms && (
                  <span className="text-[rgba(42,56,91,0.25)]"> · {totalActive} صلاحية مفعّلة</span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-[rgba(42,56,91,0.3)] text-lg">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* tabs */}
        <BranchTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {/* body */}
        <div className="overflow-y-auto flex-1 pl-1">
          {activeTab === "own" ? (
            loadingPerms ? (
              <div className="text-center py-12 text-[rgba(42,56,91,0.3)]">
                <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />
              </div>
            ) : (
              Object.entries(available).map(([module, perms]) => (
                <PermissionModule
                  key={module}
                  module={module}
                  perms={perms}
                  current={current}
                  isOpen={openModules.has(module)}
                  onToggleOpen={() => toggleModuleOpen(module)}
                  onTogglePerm={togglePerm}
                  onToggleAll={toggleAllInModule}
                />
              ))
            )
          ) : (
            <div className="flex items-center justify-between gap-4 bg-[#F4F6FA] rounded-xl p-5">
              <div className="min-w-0">
                <h4 className="m-0 mb-1.5 text-mainColor text-sm font-bold">
                  السماح بإنشاء مشاريع في {otherBranch.name}
                </h4>
                <p className="m-0 text-xs text-[rgba(42,56,91,0.4)] leading-relaxed">
                  عند التفعيل، {acc.displayName || acc.userName} هيقدر ينشئ مشاريع في {otherBranch.name}،
                  مش بس في {acc.branchName}.
                </p>
              </div>
              <ToggleSwitch checked={canCreateOutside} onChange={setCanCreateOutside} />
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[rgba(42,56,91,0.08)] shrink-0">
          <button onClick={onClose} className={btnClass("light")}>إلغاء</button>
          <button onClick={handleSave} disabled={saving} className={btnClass("dark")}>
            {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : "حفظ الصلاحيات"}
          </button>
        </div>
      </div>
    </div>
  );
}