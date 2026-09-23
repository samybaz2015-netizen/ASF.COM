import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

import axiosInstance from "../../api/apiClient";
import { useDropdown } from "./useDropdown";

const POLL_INTERVAL_MS = 120000;

function unwrap(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && "data" in payload) {
    return payload.data;
  }
  return payload;
}

/** جرس التنبيهات مع عدد غير المقروء وقائمة بآخرها. */
export function NotificationMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open, toggle, close, containerRef } = useDropdown();

  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("Notification/count");
      const value = unwrap(data);
      setCount(typeof value === "number" ? value : value?.count ?? 0);
    } catch {
      // الجرس لا يجب أن يكسر الهيدر إن فشل الطلب
    }
  }, []);

  useEffect(() => {
    loadCount();
    const timer = setInterval(loadCount, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadCount]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    axiosInstance
      .get("Notification/all")
      .then(({ data }) => {
        if (cancelled) return;
        const list = unwrap(data);
        setItems(Array.isArray(list) ? list.slice(0, 6) : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const openAll = () => {
    close();
    navigate("/notification");
  };

  return (
    <div className="ah-notif" ref={containerRef}>
      <button
        type="button"
        className="ah-icon-btn"
        onClick={toggle}
        aria-expanded={open}
        aria-label={t("header.notifications")}
        title={t("header.notifications")}
      >
        <FontAwesomeIcon icon={faBell} />
        {count > 0 && <span className="ah-badge">{count > 99 ? "99+" : count}</span>}
      </button>

      {open && (
        <div className="ah-menu ah-menu--notif" role="menu">
          <div className="ah-menu__head">
            <strong>{t("header.notifications")}</strong>
          </div>

          {loading && <p className="ah-menu__empty">{t("common.loading")}</p>}

          {!loading && items.length === 0 && (
            <p className="ah-menu__empty">{t("header.noNotifications")}</p>
          )}

          {!loading &&
            items.map((item, index) => (
              <button
                key={item.id ?? index}
                type="button"
                className="ah-menu__item ah-menu__item--stack"
                role="menuitem"
                onClick={openAll}
              >
                <span className="ah-notif__title">
                  {item.title || item.message || item.body || "—"}
                </span>
                {item.createdAt && (
                  <span className="ah-notif__time">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                )}
              </button>
            ))}

          <div className="ah-menu__sep" />
          <button type="button" className="ah-menu__item ah-menu__item--center" onClick={openAll}>
            {t("header.viewAllNotifications")}
          </button>
        </div>
      )}
    </div>
  );
}
