import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { MODULE_AR, PERM_AR } from "./AccountsConstants";

export default function PermissionModule({
  module, perms, current, isOpen, onToggleOpen, onTogglePerm, onToggleAll,
}) {
  const allOn = perms.every((p) => current.has(p));
  const someOn = !allOn && perms.some((p) => current.has(p));
  const activeCount = perms.filter((p) => current.has(p)).length;

  return (
    <div className="mb-3 border border-[rgba(42,56,91,0.08)] rounded-[10px] overflow-hidden">
      {/* header — يفتح/يقفل الـ accordion */}
      <div
        onClick={onToggleOpen}
        className="flex justify-between items-center px-4 py-2.5 bg-[#F4F6FA] cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-[rgba(42,56,91,0.35)] text-xs transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
          <span className="font-bold text-mainColor text-sm">
            {MODULE_AR[module] || module}
          </span>
          <span className="text-[11px] font-semibold text-[rgba(42,56,91,0.3)]">
            {activeCount}/{perms.length}
          </span>
        </div>

        {/* تحديد/إلغاء كل صلاحيات الموديول — منفصل عن فتح/قفل الـ accordion */}
        <div
          onClick={(e) => { e.stopPropagation(); onToggleAll(perms); }}
          title={allOn ? "إلغاء تحديد الكل" : "تحديد الكل"}
          className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all border-2
            ${allOn
              ? "border-mainColor bg-mainColor"
              : someOn
                ? "border-mainColor bg-transparent"
                : "border-[rgba(42,56,91,0.3)] bg-transparent"}`}
        >
          {allOn && <FontAwesomeIcon icon={faCheck} className="text-white text-[0.65rem]" />}
          {someOn && <span className="w-2 h-0.5 rounded-full bg-mainColor" />}
        </div>
      </div>

      {/* body — يظهر بس لما الموديول مفتوح */}
      {isOpen && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5">
          {perms.map((perm) => {
            const label = PERM_AR[perm.split(".")[1]] || perm.split(".")[1];
            const on = current.has(perm);
            return (
              <button
                key={perm}
                onClick={() => onTogglePerm(perm)}
                className={`px-3 py-1 rounded-full border-none cursor-pointer font-cairo text-xs font-semibold transition-all
                  ${on ? "bg-mainColor text-white" : "bg-[rgba(42,56,91,0.08)] text-mainColor"}`}
              >
                {on && <FontAwesomeIcon icon={faCheck} className="ml-1 text-[0.62rem]" />}
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}