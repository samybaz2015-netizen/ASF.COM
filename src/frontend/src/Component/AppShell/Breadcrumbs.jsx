import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faHouse } from "@fortawesome/free-solid-svg-icons";

/**
 * مسار الصفحة.
 * @param {{label: string, to?: string}[]} items المستوى الأخير هو الصفحة الحالية ولا يكون رابطاً.
 */
export function Breadcrumbs({ items = [] }) {
  const { t, i18n } = useTranslation();
  const isRtl = (i18n.dir?.() || "rtl") === "rtl";

  const trail = [{ label: t("breadcrumbs.home"), to: "/home-page", icon: faHouse }, ...items];

  return (
    <nav className="pb" aria-label={t("breadcrumbs.home")}>
      <ol className="pb__list">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="pb__item">
              {isLast || !item.to ? (
                <span className="pb__current" aria-current={isLast ? "page" : undefined}>
                  {item.icon && <FontAwesomeIcon icon={item.icon} />}
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="pb__link">
                  {item.icon && <FontAwesomeIcon icon={item.icon} />}
                  {item.label}
                </Link>
              )}

              {!isLast && (
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  className="pb__sep"
                  style={isRtl ? undefined : { transform: "rotate(180deg)" }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
