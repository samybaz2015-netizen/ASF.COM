import { useCallback, useEffect, useRef, useState } from "react";
import { DescriptionModal } from "../../Component/Pricingitemsselector/components/DescriptionModal";
import { QuantityTable } from "../../Component/Pricingitemsselector/components/QuantityTable";
import { FilterField, inputStyle, pageBtnStyle } from "../../Component/Pricingitemsselector/Helpers";
import { ItemRow } from "../../Component/Pricingitemsselector/components/ItemRow";
import { fetchItems } from "../../Component/Pricingitemsselector/Api";
import { branchOptions, uomOptions } from "../../Component/Pricingitemsselector/Constants";

export default function PricingItemsSelector({
  value = [],
  onChange,
  initialItems = [],
  entityType,
  projectId,
  token,
  branchId,
}) {

  const [open, setOpen]             = useState(false);
  const [items, setItems]           = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [descModalItem, setDescModalItem] = useState(null);

  const [selectedItems, setSelectedItems] = useState([]);

  const allItemsMapRef = useRef({});

  const [quantities, setQuantities] = useState({});

  const [filters, setFilters] = useState({
    branchId: "", search: "", itemNumber: "", uom: "",
    minPrice: "", maxPrice: "", isActive: "",
    pageIndex: 1, pageSize: 15,
  });

  useEffect(() => {
    if (branchId !== undefined) {
      setFilters((prev) => ({
        ...prev,
        branchId: branchId || "",
        pageIndex: 1,
      }));
    }
  }, [branchId]);

  const searchTimer = useRef(null);
  const panelRef    = useRef(null);

  const hasInitializedRef = useRef(false); 

  useEffect(() => {
    if (!hasInitializedRef.current && initialItems && initialItems.length > 0) {
      const initQtys = {};
      initialItems.forEach(item => {
        const id = item.id ?? item.pricingItemId;
        allItemsMapRef.current[id] = item;

        initQtys[id] = {
          estimatedQuantity: item.estimatedQuantity ?? "",
          executedQuantity: 0, 
          totalExecutedQuantity: parseFloat(item.executedQuantity) || 0,
        };
      });

      setSelectedItems(initialItems);
      setQuantities(initQtys);
      hasInitializedRef.current = true; 
    }
  }, [initialItems]); 

  const load = useCallback(async (f) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchItems(f);
      const fetched = data.items || [];
      fetched.forEach(item => {
        allItemsMapRef.current[item.id] = item;
      });
      setItems(fetched);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  if (!open) return;

  if (branchId !== undefined && !branchId) {
    setItems([]);
    setTotalPages(1);
    return;
  }

  load(filters);
}, [open, filters, branchId, load]);


  useEffect(() => {
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function handleFilterChange(key, val) {
    clearTimeout(searchTimer.current);
    if (key === "search") {
      searchTimer.current = setTimeout(
        () => setFilters(f => ({ ...f, search: val, pageIndex: 1 })),
        400
      );
    } else {
      setFilters(f => ({ ...f, [key]: val, pageIndex: 1 }));
    }
  }

  function toggleItem(item) {
    allItemsMapRef.current[item.id] = item;

    const exists = selectedItems.find(s => (s.id ?? s.pricingItemId) === item.id);
    let nextItems;
    let nextQtys = { ...quantities };

    if (exists) {
      nextItems = selectedItems.filter(s => (s.id ?? s.pricingItemId) !== item.id);
      delete nextQtys[item.id];
    } else {
      nextItems = [...selectedItems, item];
      if (!nextQtys[item.id]) {
        nextQtys[item.id] = {
          estimatedQuantity: "",
          executedQuantity: 0,
          totalExecutedQuantity: parseFloat(item.executedQuantity) || 0, 
        };
      }
    }

    setSelectedItems(nextItems);
    setQuantities(nextQtys);
    emitChange(nextItems, nextQtys);
  }

  function removeItem(pricingItemId) {
    const nextItems = selectedItems.filter(s => (s.id ?? s.pricingItemId) !== pricingItemId);
    const nextQtys  = { ...quantities };
    delete nextQtys[pricingItemId];
    setSelectedItems(nextItems);
    setQuantities(nextQtys);
    emitChange(nextItems, nextQtys);
  }

  function handleQuantityChange(pricingItemId, field, val) {
    const nextQtys = {
      ...quantities,
      [pricingItemId]: { ...(quantities[pricingItemId] || {}), [field]: val },
    };
    setQuantities(nextQtys);
    emitChange(selectedItems, nextQtys);
  }


  function handleExecutedSaved(pricingItemId, delta, serverTotal) {
    const current  = quantities[pricingItemId] || {};
    const prevTotal = parseFloat(current.totalExecutedQuantity) || 0;

    const newTotal = serverTotal !== null && serverTotal !== undefined
      ? parseFloat(serverTotal) || 0
      : prevTotal + delta;

    const nextQtys = {
      ...quantities,
      [pricingItemId]: {
        ...current,
        executedQuantity: 0,
        totalExecutedQuantity: newTotal,
      },
    };

    setQuantities(nextQtys);
    emitChange(selectedItems, nextQtys);
  }

  function clearAll() {
    setSelectedItems([]);
    setQuantities({});
    onChange([], []);
  }

  const tableRows = selectedItems.map(item => {
    const id       = item.id ?? item.pricingItemId;
    const fullItem = allItemsMapRef.current[id] || item;
    const q        = quantities[id] || {};
    return {
      pricingItemId:        id,
      itemNumber:           fullItem.itemNumber       || item.itemNumber       || "—",
      shortDescription:     fullItem.shortDescription || item.shortDescription || "—",
      longDescription:      fullItem.longDescription  || item.longDescription  || "",
      uom:                  fullItem.uom              || item.uom              || "—",
      unitPrice:            fullItem.unitPrice        ?? item.unitPrice        ?? 0,
      currency:             fullItem.currency         || item.currency         || "SAR",
      estimatedQuantity:    q.estimatedQuantity ?? item.estimatedQuantity ?? "",
      executedQuantity:     q.executedQuantity ?? 0,
      // totalExecutedQuantity: q.totalExecutedQuantity ?? parseFloat(fullItem.executedQuantity) ?? 0,
      totalExecutedQuantity: q.totalExecutedQuantity ?? (parseFloat(fullItem.executedQuantity) || 0),
    };
  });

  const isItemSelected = (itemId) =>
    selectedItems.some(s => (s.id ?? s.pricingItemId) === itemId);

  function emitChange(selItems, qtys) {
    const ids = selItems.map(i => i.id ?? i.pricingItemId);

    const dtos = selItems.map(item => {
      const id            = item.id ?? item.pricingItemId;
      const fullItem       = allItemsMapRef.current[id] || item;
      const q               = qtys[id] || {};
      const estimated        = parseFloat(q.estimatedQuantity)      || 0;
      const executed          = parseFloat(q.executedQuantity)       || 0;
      const totalExecuted     = parseFloat(q.totalExecutedQuantity)  || 0; 
      const unitPrice          = parseFloat(fullItem.unitPrice)       || 0;

      return {
        pricingItemId:          id,
        estimatedQuantity:      estimated,
        totalPrice:             parseFloat((estimated * unitPrice).toFixed(2)),
        executedQuantity:       executed,
        totalExecutedQuantity:  totalExecuted,
        executedWorksValue:     parseFloat((executed * unitPrice).toFixed(2)),
        executionPercentage:    estimated > 0
          ? parseFloat(Math.min((totalExecuted / estimated) * 100, 100).toFixed(2))
          : 0,
        id:               id,
        itemNumber:       fullItem.itemNumber,
        shortDescription: fullItem.shortDescription,
        longDescription:  fullItem.longDescription,
        uom:              fullItem.uom,
        unitPrice:        fullItem.unitPrice,
        currency:         fullItem.currency,
      };
    });

    const totals = dtos.reduce(
      (acc, d) => {
        acc.totalEstimatedValue += d.totalPrice;
        acc.totalExecutedValue += d.executedWorksValue;
        return acc;
      },
      { totalEstimatedValue: 0, totalExecutedValue: 0 }
    );

    onChange(ids, dtos, totals);
  }

  return (
    <div style={{ marginBottom: "16px" }} dir="rtl">

      {descModalItem && (
        <DescriptionModal item={descModalItem} onClose={() => setDescModalItem(null)} />
      )}

      <label style={{ display: "block", fontWeight: "600", fontSize: "13px", marginBottom: "8px", color: "#374151" }}>
        بنود المقايسة
        {selectedItems.length > 0 && (
          <span style={{
            marginRight: "8px",
            background: "#16a34a", color: "#fff",
            borderRadius: "12px", padding: "1px 9px",
            fontSize: "11px", fontWeight: "700",
          }}>
            {selectedItems.length} محدد
          </span>
        )}
      </label>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "9px 18px",
            background: open ? "#1d4ed8" : "#2563eb",
            color: "#fff", border: "none", borderRadius: "8px",
            fontSize: "13px", fontWeight: "600", cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "16px" }}>＋</span>
          إضافة / تعديل بنود المقايسة
        </button>
        {selectedItems.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            style={{
              background: "transparent", border: "1px solid #fca5a5",
              color: "#dc2626", fontSize: "12px", cursor: "pointer",
              padding: "8px 14px", borderRadius: "8px", fontWeight: "500",
            }}
          >
            مسح الكل
          </button>
        )}
      </div>

      {open && (
        <div
          ref={panelRef}
          style={{
            marginTop: "10px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}
        >
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#f9fafb",
          }}>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>
              اختر بنود المقايسة
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                style={{
                  padding: "5px 12px",
                  background: showFilters ? "#dbeafe" : "#f3f4f6",
                  border: "1px solid " + (showFilters ? "#93c5fd" : "#e5e7eb"),
                  borderRadius: "6px", fontSize: "12px", cursor: "pointer",
                  color: showFilters ? "#1d4ed8" : "#374151", fontWeight: "500",
                }}
              >
                🔍 فلترة
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  padding: "5px 10px", background: "transparent",
                  border: "1px solid #e5e7eb", borderRadius: "6px",
                  fontSize: "13px", cursor: "pointer", color: "#6b7280",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {showFilters && (
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid #f3f4f6",
              background: "#fafafa",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "10px",
            }}>
              <FilterField label="بحث نصي">
                <input type="text" placeholder="ابحث..." defaultValue={filters.search}
                  onChange={e => handleFilterChange("search", e.target.value)} style={inputStyle} />
              </FilterField>

              <FilterField label="الفرع">
                <select value={filters.branchId} onChange={e => handleFilterChange("branchId", e.target.value)} style={inputStyle}>
                  <option value="">الكل</option>
                  {branchOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </FilterField>

              <FilterField label="رقم البند">
                <input type="text" placeholder="مثال: 201010101" value={filters.itemNumber}
                  onChange={e => handleFilterChange("itemNumber", e.target.value)} style={inputStyle} />
              </FilterField>

              <FilterField label="وحدة القياس">
                <select value={filters.uom} onChange={e => handleFilterChange("uom", e.target.value)} style={inputStyle}>
                  <option value="">الكل</option>
                  {uomOptions.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </FilterField>

              <FilterField label="أدنى سعر">
                <input type="number" placeholder="0" value={filters.minPrice}
                  onChange={e => handleFilterChange("minPrice", e.target.value)} style={inputStyle} />
              </FilterField>

              <FilterField label="أقصى سعر">
                <input type="number" placeholder="9999" value={filters.maxPrice}
                  onChange={e => handleFilterChange("maxPrice", e.target.value)} style={inputStyle} />
              </FilterField>

              <FilterField label="الحالة">
                <select value={filters.isActive} onChange={e => handleFilterChange("isActive", e.target.value)} style={inputStyle}>
                  <option value="">الكل</option>
                  <option value="true">نشط</option>
                  <option value="false">غير نشط</option>
                </select>
              </FilterField>

              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setFilters(f => ({
                    ...f, branchId: "", search: "", itemNumber: "",
                    uom: "", minPrice: "", maxPrice: "", isActive: "", pageIndex: 1,
                  }))}
                  style={{
                    padding: "6px 14px", background: "#fee2e2",
                    border: "1px solid #fca5a5", borderRadius: "6px",
                    color: "#dc2626", fontSize: "12px", cursor: "pointer",
                    fontWeight: "500", width: "100%",
                  }}
                >
                  إعادة تعيين
                </button>
              </div>
            </div>
          )}

          <div style={{ maxHeight: "360px", overflowY: "auto", padding: "10px 14px" }}>
            {loading && (
              <div style={{ textAlign: "center", padding: "30px", color: "#6b7280", fontSize: "13px" }}>
                <span style={{ fontSize: "20px" }}>⏳</span>
                <p style={{ margin: "8px 0 0" }}>جارٍ التحميل...</p>
              </div>
            )}
            {error && (
              <div style={{ textAlign: "center", padding: "20px", color: "#dc2626", fontSize: "13px" }}>
                ⚠️ {error}
                <br />
                <button type="button" onClick={() => load(filters)} style={{
                  marginTop: "8px", color: "#2563eb",
                  background: "none", border: "none",
                  cursor: "pointer", textDecoration: "underline",
                }}>
                  إعادة المحاولة
                </button>
              </div>
            )}
            {!loading && !error && items.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px", color: "#6b7280", fontSize: "13px" }}>
                لا توجد نتائج
              </div>
            )}
            {!loading && !error && items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                isSelected={isItemSelected(item.id)}
                onToggle={toggleItem}
                onShowDesc={setDescModalItem}
              />
            ))}
          </div>

          {!loading && totalPages > 1 && (
            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid #f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#f9fafb",
            }}>
              <button type="button"
                disabled={filters.pageIndex <= 1}
                onClick={() => setFilters(f => ({ ...f, pageIndex: f.pageIndex - 1 }))}
                style={pageBtnStyle(filters.pageIndex <= 1)}
              >
                → السابق
              </button>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                صفحة {filters.pageIndex} من {totalPages}
              </span>
              <button type="button"
                disabled={filters.pageIndex >= totalPages}
                onClick={() => setFilters(f => ({ ...f, pageIndex: f.pageIndex + 1 }))}
                style={pageBtnStyle(filters.pageIndex >= totalPages)}
              >
                التالي ←
              </button>
            </div>
          )}

          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid #e5e7eb",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#fff",
          }}>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              {selectedItems.length === 0 ? "لم يتم اختيار أي بند" : `تم اختيار ${selectedItems.length} بند`}
            </span>
            <button type="button" onClick={() => setOpen(false)} style={{
              padding: "8px 20px", background: "#16a34a",
              color: "#fff", border: "none", borderRadius: "8px",
              fontSize: "13px", fontWeight: "600", cursor: "pointer",
            }}>
              تأكيد الاختيار ✓
            </button>
          </div>
        </div>
      )}

      <QuantityTable
        selectedQuantities={tableRows}
        onQuantityChange={handleQuantityChange}
        onExecutedSaved={handleExecutedSaved}
        onRemove={removeItem}
        allItemsMap={allItemsMapRef.current}
        entityType={entityType}
        projectId={projectId}
        token={token}
      />
    </div>
  );
}

