import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

import { Breadcrumbs } from "./Breadcrumbs";

/**
 * رأس الصفحة الموحّد — المستوى الثاني.
 *
 * @param {object}   props
 * @param {string}   props.title        عنوان الصفحة
 * @param {string}  [props.subtitle]    وصف مختصر — يُحذف في الصفحات التي لا تحتاجه
 * @param {Array}   [props.breadcrumbs] [{ label, to }] بلا "الرئيسية" فهي تُضاف تلقائياً
 * @param {Array}   [props.context]     [{ label, value, to, tone }] معلومات السياق
 * @param {ReactNode} [props.actions]   أزرار الصفحة
 * @param {object|boolean} [props.backAction] true للرجوع للصفحة السابقة، أو { to, label }
 * @param {ReactNode} [props.icon]      أيقونة بجوار العنوان
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  context = [],
  actions = null,
  backAction = false,
  icon = null,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // الرجوع إلى الصفحة السابقة المنطقية، لا إلى الرئيسية دائماً (البند 6).
  const goBack = () => {
    if (backAction && typeof backAction === "object" && backAction.to) {
      navigate(backAction.to);
      return;
    }
    if (window.history.length > 1) navigate(-1);
    else navigate("/home-page");
  };

  const backLabel =
    (typeof backAction === "object" && backAction.label) || t("common.back");

  return (
    <div className="ph">
      <div className="ph__top">
        <Breadcrumbs items={breadcrumbs} />

        {backAction && (
          <button type="button" className="ph__back" onClick={goBack}>
            <FontAwesomeIcon icon={faArrowRight} />
            {backLabel}
          </button>
        )}
      </div>

      <div className="ph__main">
        <div className="ph__identity">
          {icon && <span className="ph__icon">{icon}</span>}

          <div className="ph__titles">
            <h1 className="ph__title">{title}</h1>
            {subtitle && <p className="ph__subtitle">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="ph__actions">{actions}</div>}
      </div>

      {context.length > 0 && (
        <div className="ph__context">
          {context.map((entry) => (
            <div key={entry.label} className="ph__ctx">
              <span className="ph__ctx-label">{entry.label}</span>

              {entry.to ? (
                <Link to={entry.to} className="ph__ctx-link">
                  {entry.value}
                  <FontAwesomeIcon icon={faUpRightFromSquare} />
                </Link>
              ) : (
                <span className={`ph__ctx-value ${entry.tone ? `ph__ctx-value--${entry.tone}` : ""}`}>
                  {entry.value}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
