import * as XLSX from "xlsx";

/**
 * قراءة ملحق الأسعار (Pricing Attachment) وتحويله إلى بنود تسعير.
 *
 * بنية الملف كما في النموذج المعتمد:
 *   صف 1: عنوان
 *   صف 2: ترويسة عربية   — رقم العقد | رقم البند | نوع البند | الوصف المختصر | ...
 *   صف 3: ترويسة إنجليزية — Contract No. | Item | Line type | Short Description | ...
 *   صف 4+: البيانات
 *
 * عمود "نوع البند" يفرّق بين:
 *   Description = صف عنوان هرمي بلا سعر ولا وحدة  → يُتجاهل
 *   Breakdown   = بند مسعّر فعلي                   → يُستورد
 */

const COLUMN_PATTERNS = {
  contractNumber: [/^contract\s*no/i, /رقم\s*العقد/],
  itemNumber: [/^item$/i, /^item\s*(no|number)/i, /رقم\s*البند/],
  lineType: [/^line\s*type/i, /نوع\s*البند/],
  shortDescription: [/^short\s*desc/i, /الوصف\s*المختصر/, /الـوصــــف\s*المختصر/],
  longDescription: [/^long\s*desc/i, /الوصف\s*الكامل/, /الـوصــــف\s*الكامل/],
  uom: [/^uom$/i, /^unit\s*of\s*measure/i, /الوحدة/],
  unitPrice: [/^unit\s*price/i, /سعر\s*الوحدة/],
  currency: [/^currency$/i, /العملة/],
  paymentType: [/^payment\s*type/i, /نوع\s*الدفع/],
};

const PREFERRED_SHEET = "ملحق الأسعار";

function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** يبحث عن صف الترويسة ويبني خريطة الأعمدة من العربية أو الإنجليزية. */
function locateColumns(rows) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 12); rowIndex += 1) {
    const row = rows[rowIndex] || [];
    const mapping = {};

    row.forEach((cell, columnIndex) => {
      const header = normalizeHeader(cell);
      if (!header) return;

      for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
        if (mapping[field] !== undefined) continue;
        if (patterns.some((pattern) => pattern.test(header))) {
          mapping[field] = columnIndex;
        }
      }
    });

    // الترويسة الصالحة لا بد أن تحوي رقم البند وسعر الوحدة على الأقل
    if (mapping.itemNumber !== undefined && mapping.unitPrice !== undefined) {
      // الترويسة قد تمتد على صفين (عربي ثم إنجليزي) — ادمج الصف التالي
      const nextRow = rows[rowIndex + 1] || [];
      nextRow.forEach((cell, columnIndex) => {
        const header = normalizeHeader(cell);
        if (!header) return;
        for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
          if (mapping[field] !== undefined) continue;
          if (patterns.some((pattern) => pattern.test(header))) {
            mapping[field] = columnIndex;
          }
        }
      });

      const nextIsHeader =
        nextRow.some((cell) => /contract|line type|short desc|unit price/i.test(normalizeHeader(cell)));

      return { mapping, dataStartRow: rowIndex + (nextIsHeader ? 2 : 1) };
    }
  }

  return null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * @param {ArrayBuffer} buffer محتوى ملف Excel
 * @returns {{items: Array, warnings: Array<string>, stats: Object, sheetName: string}}
 */
export function parsePricingWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetName =
    workbook.SheetNames.find((name) => name.trim() === PREFERRED_SHEET) || workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("الملف لا يحتوي أي ورقة عمل.");
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    blankrows: false,
    defval: null,
  });

  const located = locateColumns(rows);
  if (!located) {
    throw new Error(
      "تعذّر التعرّف على ترويسة الملف. المتوقع أعمدة: رقم البند ووصف البند والوحدة وسعر الوحدة."
    );
  }

  const { mapping, dataStartRow } = located;
  const items = [];
  const warnings = [];
  const seen = new Map();
  const skipped = { descriptionRows: 0, noNumber: 0, noPrice: 0, duplicates: 0 };

  for (let rowIndex = dataStartRow; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    const excelRow = rowIndex + 1;

    const itemNumber = cleanText(row[mapping.itemNumber]);
    const lineType = cleanText(row[mapping.lineType]);
    const unitPrice = toNumber(row[mapping.unitPrice]);

    if (!itemNumber) {
      skipped.noNumber += 1;
      continue;
    }

    // صفوف العناوين الهرمية: بلا سعر ولا وحدة
    if (/^description$/i.test(lineType) || unitPrice === null) {
      if (/^description$/i.test(lineType)) skipped.descriptionRows += 1;
      else skipped.noPrice += 1;
      continue;
    }

    if (unitPrice < 0) {
      warnings.push(`صف ${excelRow}: سعر سالب للبند ${itemNumber} — تم تخطّيه.`);
      continue;
    }

    if (seen.has(itemNumber)) {
      skipped.duplicates += 1;
      warnings.push(
        `صف ${excelRow}: رقم البند ${itemNumber} مكرر (ظهر في صف ${seen.get(itemNumber)}) — اعتُمد الأول.`
      );
      continue;
    }
    seen.set(itemNumber, excelRow);

    const shortDescription = cleanText(row[mapping.shortDescription]);
    if (!shortDescription) {
      warnings.push(`صف ${excelRow}: البند ${itemNumber} بلا وصف مختصر.`);
    }

    items.push({
      excelRow,
      itemNumber,
      shortDescription,
      longDescription: cleanText(row[mapping.longDescription]),
      uom: cleanText(row[mapping.uom]),
      unitPrice,
      currency: cleanText(row[mapping.currency]) || "SAR",
      paymentType: cleanText(row[mapping.paymentType]),
      contractNumber: cleanText(row[mapping.contractNumber]),
    });
  }

  const currencies = [...new Set(items.map((i) => i.currency))];
  if (currencies.length > 1) {
    warnings.push(`الملف يحوي أكثر من عملة: ${currencies.join(" · ")}.`);
  }

  return {
    sheetName,
    items,
    warnings,
    stats: {
      totalRows: rows.length - dataStartRow,
      imported: items.length,
      ...skipped,
      uoms: [...new Set(items.map((i) => i.uom).filter(Boolean))],
      currencies,
      minPrice: items.length ? Math.min(...items.map((i) => i.unitPrice)) : 0,
      maxPrice: items.length ? Math.max(...items.map((i) => i.unitPrice)) : 0,
    },
  };
}
