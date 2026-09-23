import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

import { SUPPORTED_LANGUAGES } from "../../i18n";

/** تبديل اللغة — يغيّر الاتجاه والنصوص دون تسجيل خروج (البند 11). */
export function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.split("-")[0] || "ar";

  return (
    <div className="ah-lang" role="group" aria-label={t("header.language")}>
      <FontAwesomeIcon icon={faGlobe} className="ah-lang__icon" />
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          className={`ah-lang__btn ${current === language.code ? "ah-lang__btn--active" : ""}`}
          onClick={() => i18n.changeLanguage(language.code)}
          aria-pressed={current === language.code}
          title={language.name}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}
