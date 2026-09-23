const PRODUCTION_DOMAIN = "https://asfconsult-002-site1.ftempurl.com";

/**
 * أصل خدمات الواجهة الخلفية.
 *
 * - غير معرّف         → خادم الإنتاج (سلوك البناء المنشور كما كان)
 * - معرّف بنص فارغ    → نداءات نسبية على نفس أصل الصفحة
 * - معرّف بعنوان      → ذلك العنوان
 *
 * الفرق بين "غير معرّف" و"فارغ" مقصود: الفارغ اختيار صريح للنداء النسبي ولا
 * يجوز أن يرتدّ إلى الإنتاج. استعمال `||` هنا كان يخلط بينهما لأن النص الفارغ
 * قيمة زائفة، فكان التشغيل المحلي ينادي خادم الإنتاج بلا قصد.
 */
const configured = process.env.REACT_APP_API_DOMAIN;

export const domain =
  configured === undefined || configured === null ? PRODUCTION_DOMAIN : configured.trim();

export const Url = `${domain}/api/`;
