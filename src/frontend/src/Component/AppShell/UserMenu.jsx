import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faGear,
  faIdCard,
  faKey,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

import { clearUserSession, getUserSession } from "../../function/AuthStorage";
import { getDriveImageUrl } from "../../util/Driveimage";
import avatarFallback from "../../Image/team-01.png";
import { useDropdown } from "./useDropdown";

/** بطاقة المستخدم في الهيدر مع قائمته المنسدلة. */
export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open, toggle, close, containerRef } = useDropdown();

  const user = useMemo(() => getUserSession() || {}, []);
  const avatar = useMemo(
    () => getDriveImageUrl(user.userImage) || avatarFallback,
    [user.userImage]
  );

  const go = (path) => {
    close();
    navigate(path);
  };

  const logout = async () => {
    close();
    const confirm = await Swal.fire({
      icon: "question",
      title: t("userMenu.logoutConfirmTitle"),
      text: t("userMenu.logoutConfirmText"),
      showCancelButton: true,
      confirmButtonText: t("userMenu.logout"),
      cancelButtonText: t("common.cancel"),
    });
    if (!confirm.isConfirmed) return;

    clearUserSession();
    localStorage.clear();
    navigate("/");
  };

  const items = [
    { key: "profile", icon: faIdCard, label: t("userMenu.profile"), onClick: () => go("/profile") },
    { key: "password", icon: faKey, label: t("userMenu.changePassword"), onClick: () => go("/reset-password") },
    { key: "settings", icon: faGear, label: t("userMenu.settings"), onClick: () => go("/settings") },
  ];

  return (
    <div className="ah-user" ref={containerRef}>
      <button
        type="button"
        className="ah-user__trigger"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="ah-user__avatar">
          <img src={avatar} alt="" />
          <span className="ah-user__dot" />
        </span>

        <span className="ah-user__text">
          <span className="ah-user__welcome">{t("header.welcome")}</span>
          <span className="ah-user__name">{user.displayName || user.userName || "—"}</span>
        </span>

        <FontAwesomeIcon icon={faChevronDown} className={`ah-caret ${open ? "ah-caret--open" : ""}`} />
      </button>

      {open && (
        <div className="ah-menu ah-menu--user" role="menu">
          <div className="ah-menu__head">
            <strong>{user.displayName || user.userName}</strong>
            {user.email && <span>{user.email}</span>}
          </div>

          {items.map((item) => (
            <button key={item.key} type="button" className="ah-menu__item" role="menuitem" onClick={item.onClick}>
              <FontAwesomeIcon icon={item.icon} />
              {item.label}
            </button>
          ))}

          <div className="ah-menu__sep" />

          <button type="button" className="ah-menu__item ah-menu__item--danger" role="menuitem" onClick={logout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            {t("userMenu.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
