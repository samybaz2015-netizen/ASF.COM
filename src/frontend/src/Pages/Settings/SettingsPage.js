import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";

import { PricingImport } from "./components/PricingImport";
import "./Settings.css";

/** صفحة الإعدادات — تضم حالياً قسم استيراد ملحق الأسعار. */
function SettingsPage() {
  const { t } = useTranslation();

  return (
    <>
      
      <main className="st-page">
        <PricingImport />
      </main>
    </>
  );
}

export default SettingsPage;
