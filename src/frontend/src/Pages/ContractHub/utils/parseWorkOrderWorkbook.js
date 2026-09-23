import * as XLSX from "xlsx";

/**
 * قراءة ملف أوامر العمل.
 *
 * أسماء الأعمدة تُطابَق مرنةً: تُتجاهل المسافات الزائدة، وتُوحَّد الألف والياء
 * والتاء المربوطة، ويُقبل أكثر من تسمية للعمود الواحد. فملف كُتب بخط اليد لا
 * يُرفض لأن كاتبه قال «رقم الأمر» بدل «رقم أمر العمل».
 */

/**
 * الأعمدة المتوقّعة، وأسماؤها المقبولة.
 *
 * المطلوب منها رقم أمر العمل وحده: به تُعرف هويّة الصف ويُكشف التكرار. أما
 * البقية فتُقرأ إن وُجدت وتُتجاهل إن غابت، فلا يُرفض ملفٌ كامل لأن عموداً
 * واحداً ناقص.
 */
export const COLUMNS = [
  { key: "orderNumber", label: "رقم أمر العمل", required: true, aliases: ["رقم الأمر", "رقم العطل", "رقم الطلب"] },
  { key: "workOrderType", label: "نوع أمر العمل", aliases: ["النوع", "نوع الأمر"] },
  { key: "description", label: "وصف العمل", aliases: ["الوصف", "وصف المشروع", "البيان"] },
  { key: "district", label: "الحي", aliases: ["الحى", "المنطقة", "الموقع"] },
  { key: "contractor", label: "المقاول", aliases: ["اسم المقاول"] },
  { key: "duration", label: "مدة التنفيذ", aliases: ["المدة", "مده التنفيذ"] },
  { key: "receivedAt", label: "تاريخ الاستلام", aliases: ["الاستلام", "تاريخ الاستلام"] },
  { key: "completionDate", label: "تاريخ الإنجاز", aliases: ["الإنجاز", "تاريخ الانجاز"] },
  { key: "contractNumber", label: "رقم العقد", aliases: ["العقد"] },
  { key: "stationNumber", label: "رقم المحطة", aliases: ["المحطة", "رقم المحطه"] },
  { key: "estimatedValue", label: "القيمة التقديرية", aliases: ["القيمة", "القيمه التقديريه"] },
  { key: "consultant", label: "الاستشاري", aliases: ["الإستشاري"] },
  { key: "note", label: "ملاحظات", aliases: ["ملاحظة", "الملاحظات"] },
];

/**
 * يوحّد النص للمقارنة: تشكيل، ألف، ياء، تاء مربوطة، مسافات.
 *
 * ويزيل علامات التزيين حول العنوان — النجمة والنقطتان والأقواس — لأن القالب
 * نفسه يضع نجمة على الأعمدة المطلوبة، ولأن المستخدمين يكتبون «الحي:» و«(الحي)».
 * بدونها لا يتعرّف القارئ على عناوين القالب الذي ولّده هو.
 */
function normalize(value) {
  return String(value ?? "")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[*:()\[\]#.،,]/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** خريطة الاسم المُوحَّد → مفتاح الحقل. */
const HEADER_MAP = (() => {
  const map = new Map();
  COLUMNS.forEach((column) => {
    map.set(normalize(column.label), column.key);
    (column.aliases || []).forEach((alias) => map.set(normalize(alias), column.key));
  });
  return map;
})();

/**
 * التاريخ قد يصل رقماً تسلسلياً من الإكسل. نحوّله إلى نص ISO هنا، فيصل الخادم
 * قيمةً واحدة مفهومة بدل صيغ متفرّقة.
 */
function cellToText(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/**
 * يقرأ المصنّف ويعيد { columns, rows, missingRequired }.
 * columns: الأعمدة التي تعرّف عليها، لعرضها للمستخدم قبل الاستيراد.
 */
export function parseWorkOrderWorkbook(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("الملف لا يحتوي على أي ورقة.");

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });

  if (matrix.length < 2) throw new Error("الملف لا يحتوي على بيانات تحت صف العناوين.");

  // صف العناوين هو أول صف يتعرّف فيه على عمودين على الأقل، فلا يُفسد الاستيراد
  // عنوانٌ أو شعارٌ فوق الجدول.
  let headerIndex = -1;
  let mapping = [];

  for (let i = 0; i < Math.min(matrix.length, 10); i += 1) {
    const candidate = matrix[i].map((cell) => HEADER_MAP.get(normalize(cell)) || null);
    if (candidate.filter(Boolean).length >= 2) {
      headerIndex = i;
      mapping = candidate;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error("تعذّر التعرّف على صف العناوين. نزّل القالب واستعمل عناوينه.");
  }

  const recognised = new Set(mapping.filter(Boolean));
  const missingRequired = COLUMNS.filter((c) => c.required && !recognised.has(c.key)).map((c) => c.label);

  // أعمدة معروفة لم يحملها الملف: تُعرض للعلم فقط ولا تمنع الاستيراد.
  const missingOptional = COLUMNS.filter((c) => !c.required && !recognised.has(c.key)).map((c) => c.label);

  const rows = [];

  for (let i = headerIndex + 1; i < matrix.length; i += 1) {
    const raw = matrix[i];
    if (!raw || raw.every((cell) => cellToText(cell) === "")) continue;

    const row = { rowNumber: i + 1 };
    mapping.forEach((key, columnIndex) => {
      if (key) row[key] = cellToText(raw[columnIndex]);
    });

    rows.push(row);
  }

  return {
    sheetName,
    columns: COLUMNS.filter((c) => recognised.has(c.key)).map((c) => c.label),
    missingRequired,
    missingOptional,
    rows,
  };
}

/** ينشئ قالب إكسل فارغاً بعناوين الأعمدة المتوقّعة. */
export function downloadTemplate() {
  const header = COLUMNS.map((c) => (c.required ? `${c.label} *` : c.label));
  const example = [
    "12345", "إيصال", "تمديد كيبل جهد متوسط", "حي النزهة", "مؤسسة المقاولات",
    "30", "2026-09-01", "2026-10-01", "", "", "", "", "",
  ];

  const sheet = XLSX.utils.aoa_to_sheet([header, example]);
  sheet["!cols"] = COLUMNS.map(() => ({ wch: 18 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "أوامر العمل");
  XLSX.writeFile(workbook, "قالب-استيراد-أوامر-العمل.xlsx");
}
