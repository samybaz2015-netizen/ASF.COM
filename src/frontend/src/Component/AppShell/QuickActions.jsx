import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faFileCirclePlus,
  faGaugeHigh,
  faGear,
  faMagnifyingGlass,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

import { getUserSession } from "../../function/AuthStorage";
import { useDropdown } from "./useDropdown";

const PROJECT_UPDATE_PERMS = [
  "Construction.Update",
  "Emergency.Update",
  "Maintenance.Update",
  "NewProject.Update",
  "PrivateProject.Update",
];

const PROJECT_VIEW_PERMS = [
  "Construction.View",
  "Emergency.View",
  "Maintenance.View",
  "NewProject.View",
  "PrivateProject.View",
];

/** الإجراءات السريعة — القائمة تُبنى حسب صلاحيات المستخدم (البند 16). */
export function QuickActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open, toggle, close, containerRef } = useDropdown();

  const user = useMemo(() => getUserSession() || {}, []);
  const permissions = user.permissions || [];
  const isAdmin = user.userType === "admin";

  const allowed = (required) => isAdmin || required.some((p) => permissions.includes(p));

  const actions = useMemo(() => {
    const list = [];

    // إنشاء أمر عمل أوّلاً: هو أكثر ما يُفتح، وقالبه كان بلا مدخل في الواجهة
    // فلا يصله أحد إلا بكتابة المسار.
    if (allowed(["Construction.Create"])) {
      list.push({
        key: "new-construction",
        icon: faFileCirclePlus,
        label: t("quickActions.newConstruction"),
        path: "/work-orders/new/construction",
      });
    }

    if (allowed(["ContractWorkflow.View"])) {
      list.push({
        key: "monitoring",
        icon: faGaugeHigh,
        label: t("quickActions.monitoring"),
        path: "/monitoring",
      });
    }

    if (allowed(PROJECT_UPDATE_PERMS)) {
      list.push({
        key: "daily-execution",
        icon: faPlus,
        label: t("quickActions.dailyExecution"),
        path: "/daily-execution",
      });
    }
    if (allowed(PROJECT_VIEW_PERMS)) {
      list.push({
        key: "search",
        icon: faMagnifyingGlass,
        label: t("quickActions.searchWorkOrder"),
        path: "/search-requests",
      });
    }
    if (allowed(["PricingItems.Manage", "Branch.Update"])) {
      list.push({ key: "settings", icon: faGear, label: t("quickActions.settings"), path: "/settings" });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, permissions, isAdmin]);

  if (actions.length === 0) return null;

  return (
    <div className="ah-quick" ref={containerRef}>
      <button
        type="button"
        className="ah-quick__trigger"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <FontAwesomeIcon icon={faPlus} />
        <span className="ah-quick__label">{t("header.newAction")}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`ah-caret ${open ? "ah-caret--open" : ""}`} />
      </button>

      {open && (
        <div className="ah-menu ah-menu--quick" role="menu">
          <div className="ah-menu__head">
            <strong>{t("quickActions.title")}</strong>
          </div>
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              className="ah-menu__item"
              role="menuitem"
              onClick={() => {
                close();
                navigate(action.path);
              }}
            >
              <FontAwesomeIcon icon={action.icon} />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
