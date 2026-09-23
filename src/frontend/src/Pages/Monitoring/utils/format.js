/**
 * تنسيق الأرقام والمبالغ.
 *
 * الأرقام لاتينية لا عربية-هندية: الجداول تُقرأ بالمقارنة العمودية، والخلط
 * بين الشكلين يكسر المحاذاة. والمبلغ بلا كسور — ريالات لا هللات.
 */

const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const MONEY = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? NUMBER.format(n) : "—";
}

export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return MONEY.format(n);
}

/** المبالغ الكبيرة تُختصر في البطاقات: ١٢٣٤٥٦٧ لا يُقرأ بلمحة. */
export function moneyShort(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}م`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}ألف`;

  return MONEY.format(n);
}

export function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
}
