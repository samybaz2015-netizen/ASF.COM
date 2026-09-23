import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./locales/ar.json";
import en from "./locales/en.json";

/**
 * تهيئة الترجمة.
 *
 * النظام عربي في الأصل ولا يحوي بنية ترجمة، فالعربية هي اللغة الافتراضية ولغة
 * الاحتياط معاً. المترجَم حالياً: الهيدر والقوائم وعناوين الصفحات الجديدة.
 * بقية الصفحات نصوصها مكتوبة داخل مكوّناتها وتُنقل تدريجياً إلى هذه الملفات.
 */

export const SUPPORTED_LANGUAGES = [
  { code: "ar", label: "AR", name: "العربية", dir: "rtl" },
  { code: "en", label: "EN", name: "English", dir: "ltr" },
];

const STORAGE_KEY = "app-language";

export function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch {
    // التخزين قد يكون محجوباً في التصفح الخاص — نكمل بالافتراضي
  }
  return "ar";
}

export function getDirection(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.dir || "rtl";
}

/** يطبّق اللغة على المستند: الاتجاه والسمة، ويحفظ الاختيار. */
export function applyLanguage(code) {
  const dir = getDirection(code);
  document.documentElement.setAttribute("lang", code);
  document.documentElement.setAttribute("dir", dir);
  document.body.setAttribute("dir", dir);

  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // تجاهل: الاختيار يبقى في الجلسة الحالية فقط
  }
}

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

applyLanguage(i18n.language);

i18n.on("languageChanged", applyLanguage);

export default i18n;
