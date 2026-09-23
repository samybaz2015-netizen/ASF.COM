import * as XLSX from "xlsx";

/**
 * تصدير واستيراد بيانات الموظفين.
 *
 * التصدير يكتب ما تعرضه الشاشة بعد الفلترة لا كل ما في القاعدة: الملف نسخة
 * ممّا يراه المستخدم، فلا يحمل صفاً لا يحقّ له أو استبعده بفلتره.
 */

/** الأعمدة: المفتاح في البيانات، والعنوان في الملف. */
const COLUMNS = [
  { key: "employeeNumber", label: "الرقم الوظيفي" },
  { key: "displayName", label: "الاسم" },
  { key: "userName", label: "اسم المستخدم" },
  { key: "email", label: "البريد الإلكتروني" },
  { key: "phoneNumber", label: "الجوال" },
  { key: "nationalId", label: "رقم الهوية" },
  { key: "jobTitle", label: "المسمّى الوظيفي" },
  { key: "specialization", label: "التخصص" },
  { key: "city", label: "المدينة" },
  { key: "branchName", label: "الفرع" },
  { key: "officeName", label: "المكتب" },
  { key: "hireDate", label: "تاريخ التعيين", date: true },
  { key: "residenceExpiryDate", label: "انتهاء الإقامة", date: true },
  { key: "isActiveEmployee", label: "الحالة", bool: ["على رأس العمل", "منتهية الخدمة"] },
];

function cell(row, column) {
  const value = row[column.key];

  if (column.bool) return value ? column.bool[0] : column.bool[1];
  if (value === null || value === undefined || value === "") return "";

  if (column.date) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }

  return value;
}

export function exportRows(rows, fileName = "الموظفون") {
  const header = COLUMNS.map((c) => c.label);
  const body = rows.map((row) => COLUMNS.map((c) => cell(row, c)));

  const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  sheet["!cols"] = COLUMNS.map((c) => ({ wch: c.label.length + 8 }));

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "الموظفون");
  XLSX.writeFile(book, `${fileName}.xlsx`);
}

// ─────────── الاستيراد ───────────

/** أعمدة الاستيراد وأسماؤها المقبولة. المطلوب اسم المستخدم وحده. */
export const IMPORT_COLUMNS = [
  { key: "userName", label: "اسم المستخدم", required: true, aliases: ["المستخدم", "الحساب"] },
  { key: "displayName", label: "الاسم", aliases: ["الاسم الكامل", "اسم الموظف"] },
  { key: "employeeNumber", label: "الرقم الوظيفي", aliases: ["الرقم", "رقم الموظف"] },
  { key: "email", label: "البريد الإلكتروني", aliases: ["الايميل", "البريد"] },
  { key: "phoneNumber", label: "الجوال", aliases: ["الهاتف", "رقم الجوال"] },
  { key: "nationalId", label: "رقم الهوية", aliases: ["الهوية", "الاقامة"] },
  { key: "jobTitle", label: "المسمّى الوظيفي", aliases: ["المسمى", "الوظيفة"] },
  { key: "specialization", label: "التخصص", aliases: [] },
  { key: "city", label: "المدينة", aliases: [] },
  { key: "hireDate", label: "تاريخ التعيين", aliases: ["التعيين", "تاريخ المباشرة"] },
  { key: "salary", label: "الراتب", aliases: [] },
];

/** يوحّد العنوان: تشكيل، ألف، ياء، تاء مربوطة، وعلامات التزيين. */
function normalize(value) {
  return String(value ?? "")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[*:()[\]#.،,]/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const HEADER_MAP = (() => {
  const map = new Map();
  IMPORT_COLUMNS.forEach((column) => {
    map.set(normalize(column.label), column.key);
    (column.aliases || []).forEach((alias) => map.set(normalize(alias), column.key));
  });
  return map;
})();

function cellToText(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

export function parseEmployeeWorkbook(arrayBuffer) {
  const book = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const sheetName = book.SheetNames[0];
  if (!sheetName) throw new Error("الملف لا يحتوي على أي ورقة.");

  const matrix = XLSX.utils.sheet_to_json(book.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: "",
  });

  if (matrix.length < 2) throw new Error("الملف لا يحتوي على بيانات تحت صف العناوين.");

  // صف العناوين هو أول صف يُعرف فيه عمودان، فلا يُفسده شعارٌ فوق الجدول.
  let headerIndex = -1;
  let mapping = [];

  for (let i = 0; i < Math.min(matrix.length, 10); i += 1) {
    const candidate = matrix[i].map((c) => HEADER_MAP.get(normalize(c)) || null);
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
  const missingRequired = IMPORT_COLUMNS.filter(
    (c) => c.required && !recognised.has(c.key)
  ).map((c) => c.label);

  const missingOptional = IMPORT_COLUMNS.filter(
    (c) => !c.required && !recognised.has(c.key)
  ).map((c) => c.label);

  const rows = [];

  for (let i = headerIndex + 1; i < matrix.length; i += 1) {
    const raw = matrix[i];
    if (!raw || raw.every((c) => cellToText(c) === "")) continue;

    const row = { rowNumber: i + 1 };
    mapping.forEach((key, column) => {
      if (key) row[key] = cellToText(raw[column]);
    });

    rows.push(row);
  }

  return {
    columns: IMPORT_COLUMNS.filter((c) => recognised.has(c.key)).map((c) => c.label),
    missingRequired,
    missingOptional,
    rows,
  };
}

export function downloadImportTemplate() {
  const header = IMPORT_COLUMNS.map((c) => (c.required ? `${c.label} *` : c.label));
  const example = [
    "m.ali", "محمد علي", "1042", "m.ali@asf.com", "0500000000",
    "1012345678", "مهندس موقع", "كهرباء", "جدة", "2026-01-15", "9000",
  ];

  const sheet = XLSX.utils.aoa_to_sheet([header, example]);
  sheet["!cols"] = IMPORT_COLUMNS.map(() => ({ wch: 18 }));

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "الموظفون");
  XLSX.writeFile(book, "قالب-استيراد-الموظفين.xlsx");
}
