import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import { searchPricingItems } from "../../../services/WorkOrderCreateApi";

/*
  ملحق الأسعار يعيد shortDescription و unitPrice. الأسماء البديلة مقبولة أيضاً
  حتى لا ينكسر القالب إن تغيّر شكل الرد لاحقاً.
*/
const readDescription = (item) =>
  item.shortDescription ?? item.description ?? item.longDescription ?? item.name ?? "";

const readPrice = (item) => item.unitPrice ?? item.price ?? 0;

const money = (value) =>
  Number(value || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * بنود الأعمال من ملحق الأسعار المعتمد.
 *
 * الوصف والوحدة والسعر تُؤخذ من البند ولا تُدخَل يدوياً — الإدخال اليدوي يسمح
 * بسعر لا يطابق الملحق المعتمد. المُدخَل الوحيد هو الكمية التقديرية.
 */
export function WorkItemsPicker({ branchId, items, onChange }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // بحث مؤجَّل: كل ضغطة مفتاح لا تستحق نداءً على الخادم.
  useEffect(() => {
    if (!branchId || term.trim().length < 2) {
      setResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchPricingItems({ branchId, search: term.trim() }));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [term, branchId]);

  useEffect(() => {
    const onDocClick = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [items]
  );

  const add = (source) => {
    if (items.some((i) => i.pricingItemId === source.id)) {
      setTerm("");
      setOpen(false);
      return;
    }

    const price = Number(readPrice(source));
    onChange([
      ...items,
      {
        pricingItemId: source.id,
        code: source.itemNumber ?? source.code ?? String(source.id),
        description: readDescription(source),
        uom: source.uom ?? source.unit ?? "",
        price,
        quantity: 1,
        total: price,
      },
    ]);

    setTerm("");
    setOpen(false);
  };

  const setQuantity = (pricingItemId, raw) => {
    const quantity = raw === "" ? "" : Math.max(0, Number(raw));
    onChange(
      items.map((item) =>
        item.pricingItemId === pricingItemId
          ? { ...item, quantity, total: Number(quantity || 0) * Number(item.price || 0) }
          : item
      )
    );
  };

  const remove = (pricingItemId) =>
    onChange(items.filter((item) => item.pricingItemId !== pricingItemId));

  return (
    <div className="wo-items">
      <div className={"wo-search" + (branchId ? "" : " wo-search--blocked")} ref={boxRef}>
        <label className="asf-field">
          <span>
            {branchId
              ? "ابحث في ملحق الأسعار"
              : "اختر الإدارة أولاً لعرض الأسعار الصحيحة، ثم ابحث في ملحق الأسعار"}
          </span>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            disabled={!branchId}
            placeholder="اكتب رقم البند أو وصفه…"
          />
        </label>

        {open && results.length > 0 && (
          <ul className="wo-results">
            {results.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => add(item)}>
                  <b>{item.itemNumber ?? item.code ?? item.id}</b>
                  <span>{readDescription(item)}</span>
                  <em>
                    {item.uom ?? item.unit ?? ""} · {money(readPrice(item))} ر.س
                  </em>
                </button>
              </li>
            ))}
          </ul>
        )}

        {searching && <span className="asf-hint">جارٍ البحث…</span>}
        {branchId && !searching && term.trim().length >= 2 && results.length === 0 && (
          <span className="asf-hint">لا بنود مطابقة في ملحق هذه الإدارة.</span>
        )}
      </div>

      <div className="asf-table__scroll" style={{ marginTop: 10 }}>
        <table className="asf-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>الكود</th>
              <th>الوصف</th>
              <th style={{ width: 70 }}>الوحدة</th>
              <th style={{ width: 110 }}>سعر الوحدة</th>
              <th style={{ width: 110 }}>الكمية التقديرية</th>
              <th style={{ width: 120 }}>الإجمالي</th>
              <th style={{ width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--asf-faint)" }}>
                  لم تُضف أي بنود بعد — ابحث واختر من ملحق الأسعار أعلاه.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.pricingItemId}>
                  <td><b>{item.code}</b></td>
                  <td>{item.description}</td>
                  <td>{item.uom || "—"}</td>
                  <td className="wo-num">{money(item.price)}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => setQuantity(item.pricingItemId, e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </td>
                  <td className="wo-num"><b>{money(item.total)}</b></td>
                  <td>
                    <button
                      type="button"
                      className="asf-icon-btn asf-icon-btn--danger"
                      title="إزالة البند"
                      onClick={() => remove(item.pricingItemId)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="wo-total">
        <span>إجمالي بنود الأعمال</span>
        <b>{money(total)} ر.س</b>
      </div>
    </div>
  );
}
