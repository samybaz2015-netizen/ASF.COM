import { useState } from "react";
import { DescriptionModal } from "./DescriptionModal";
import ExecutedQuantityLogsModal from "../../../Pages/Construction/ExecutedQuantityLogsModal/ExecutedQuantityLogsModal";
import { calcRow, fmtNum, qtyInputStyle } from "../Helpers";
import { ExecutedQuantityCell } from "./ExecutedQuantityCell";

import { SectionLabel } from "../../Common/SectionLabel";
export function QuantityTable({selectedQuantities, onQuantityChange, onExecutedSaved, onRemove, allItemsMap,
  entityType, projectId, token,}) {
  const [descItem, setDescItem] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  if (selectedQuantities.length === 0) return null;

  const totals = selectedQuantities.reduce(
    (acc, sq) => {
      const { totalPrice, executedWorksValue, totalExecutedValue } = calcRow(sq);
      acc.totalPrice            += totalPrice;
      acc.executedWorksValue    += executedWorksValue;
      acc.totalExecutedQuantity += (parseFloat(sq.totalExecutedQuantity) || 0);
      acc.totalExecutedValue    += totalExecutedValue; 
      return acc;
    },
    { totalPrice: 0, executedWorksValue: 0, totalExecutedQuantity: 0, totalExecutedValue: 0 }
  );

  return (
    <div style={{ marginTop: "16px", overflowX: "auto" }}>
      {descItem && (
        <DescriptionModal item={descItem} onClose={() => setDescItem(null)} />
      )}

      {showLogs && (
        <ExecutedQuantityLogsModal
          entityType={entityType} projectId={projectId} token={token}
          itemsMap={allItemsMap} onClose={() => setShowLogs(false)}
        />
      )}

      <SectionLabel split>
        <span>جدول بنود المقايسة</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            background: "#16a34a",
            color: "#fff",
            borderRadius: "12px",
            padding: "1px 10px",
            fontSize: "11px",
            fontWeight: "700",
          }}>
            {selectedQuantities.length} بند
          </span>
          {/* {projectId && (
            <button
              type="button" onClick={() => setShowLogs(true)}
              style={{
                background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8",
                borderRadius: "6px", padding: "3px 10px", fontSize: "11px",
                fontWeight: 600, cursor: "pointer",
              }}
            >
              📜 سجل التعديلات
            </button>
          )} */}
        </div>
      </SectionLabel>

    <>
  <style>{`
    .items-table-wrap {
      width: 100%;
      overflow-x: auto;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1100px;
      font-size: 12px;
      background: #ffffff;
    }
    .items-table thead th {
      background: #1e40af;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 9px 10px;
      white-space: nowrap;
      text-align: center;
      position: sticky;
      top: 0;
    }
    .items-table tbody tr {
      border-top: 1px solid #f1f5f9;
      transition: background 0.15s;
    }
    .items-table tbody tr:hover {
      background: #f8fafc;
    }
    .items-table td {
      padding: 8px 10px;
      text-align: center;
      vertical-align: middle;
    }
  `}</style>

  <div className="items-table-wrap">
    <table className="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>رقم البند</th>
          <th style={{ textAlign: "right", minWidth: "220px" }}>الوصف</th>
          <th>وحدة القياس</th>
          <th>سعر الوحدة</th>
          <th>الكمية التقديرية</th>
          <th>إجمالي السعر</th>
          <th>الكمية المنفذة اليومي</th>
          <th>قيمة الأعمال المنفذة</th>
          <th>إجمالي الكمية المنفذة</th>
          <th>إجمالي قيمة الكمية المنفذة</th>
          <th style={{ minWidth: "110px" }}>نسبة التنفيذ</th>
          <th>حذف</th>
        </tr>
      </thead>
      <tbody>
        {selectedQuantities.map((sq, idx) => {
          const { totalPrice, executedWorksValue, totalExecutedValue, executionPercentage } = calcRow(sq);
          const pct = executionPercentage;
          const pctColor = pct >= 100 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";
          const fullItem = { ...(allItemsMap[sq.pricingItemId] || {}), ...sq };

          return (
            <tr key={sq.pricingItemId}>
              {/* رقم */}
              <td>
                <span style={{
                  background: "#e0f2fe", color: "#0369a1",
                  borderRadius: "4px", padding: "2px 7px",
                  fontWeight: "700", fontSize: "11px",
                }}>
                  {idx + 1}
                </span>
              </td>

              {/* رقم البند */}
              <td>
                <span style={{
                  background: "#f0fdf4", color: "#15803d",
                  borderRadius: "4px", padding: "2px 7px",
                  fontWeight: "700", fontSize: "11px", whiteSpace: "nowrap",
                }}>
                  {sq.itemNumber}
                </span>
              </td>

              {/* الوصف */}
              <td style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    title={sq.shortDescription}
                    style={{
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      color: "#111827", fontWeight: "500", flex: 1, minWidth: 0, fontSize: "12px",
                      maxWidth: "260px", display: "inline-block",
                    }}
                  >
                    {sq.shortDescription || "—"}
                  </span>
                  <button
                    type="button"
                    title="عرض الوصف التفصيلي"
                    onClick={() => setDescItem(fullItem)}
                    style={{
                      flexShrink: 0, background: "#dbeafe", border: "none",
                      borderRadius: "5px", color: "#1d4ed8", cursor: "pointer",
                      padding: "3px 7px", fontSize: "11px", fontWeight: "700",
                      lineHeight: 1, whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#bfdbfe"}
                    onMouseLeave={e => e.currentTarget.style.background = "#dbeafe"}
                  >
                    📋 عرض
                  </button>
                </div>
              </td>

              {/* وحدة القياس */}
              <td style={{ color: "#6b7280", fontSize: "11px" }}>
                {sq.uom}
              </td>

              {/* سعر الوحدة */}
              <td style={{ fontWeight: "600", color: "#1e40af", whiteSpace: "nowrap" }}>
                {isNaN(parseFloat(sq.unitPrice)) ? "—" : parseFloat(sq.unitPrice).toFixed(2)}
              </td>

              {/* الكمية التقديرية */}
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={sq.estimatedQuantity}
                  onChange={e => onQuantityChange(sq.pricingItemId, "estimatedQuantity", e.target.value)}
                  style={qtyInputStyle("#dcfce7", "#16a34a")}
                />
              </td>

              {/* إجمالي السعر */}
              <td>
                <span style={{
                  fontWeight: "700", color: "#1e40af",
                  background: "#eff6ff", borderRadius: "4px",
                  padding: "3px 8px", whiteSpace: "nowrap",
                }}>
                  {totalPrice.toFixed(2)}
                </span>
              </td>

              {/* الكمية المنفذة اليومي */}
              <td>
                <ExecutedQuantityCell
                  pricingItemId={sq.pricingItemId}
                  value={sq.executedQuantity}
                  entityType={entityType}
                  projectId={projectId}
                  token={token}
                  onLocalChange={onQuantityChange}
                  onSaved={onExecutedSaved}
                />
              </td>

              {/* قيمة الأعمال المنفذة */}
              <td>
                <span style={{
                  fontWeight: "700", color: "#15803d",
                  background: "#f0fdf4", borderRadius: "4px",
                  padding: "3px 8px", whiteSpace: "nowrap",
                }}>
                  {executedWorksValue.toFixed(2)}
                </span>
              </td>

              {/* إجمالي الكمية المنفذة */}
              <td>
                <span style={{
                  fontWeight: "700", color: "#1d4ed8",
                  background: "#dbeafe", borderRadius: "4px",
                  padding: "3px 8px", whiteSpace: "nowrap",
                }}>
                  {fmtNum(sq.totalExecutedQuantity)}
                </span>
              </td>

              {/* إجمالي قيمة الكمية المنفذة */}
              <td>
                <span style={{
                  fontWeight: "700", color: "#7c3aed",
                  background: "#f3e8ff", borderRadius: "4px",
                  padding: "3px 8px", whiteSpace: "nowrap",
                }}>
                  {fmtNum(totalExecutedValue)}
                </span>
              </td>

              {/* نسبة التنفيذ */}
              <td>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontWeight: "700", color: pctColor, fontSize: "12px" }}>
                    {pct.toFixed(1)}%
                  </span>
                  <div style={{ width: "80px", height: "5px", background: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`, height: "100%",
                      background: pctColor, borderRadius: "3px",
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                </div>
              </td>

              {/* حذف */}
              <td>
                <button
                  type="button"
                  onClick={() => onRemove(sq.pricingItemId)}
                  title="حذف البند"
                  style={{
                    background: "#fee2e2", border: "none", borderRadius: "6px",
                    color: "#dc2626", cursor: "pointer", padding: "4px 8px",
                    fontSize: "13px", fontWeight: "600", lineHeight: 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fca5a5"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fee2e2"}
                >
                  ✕
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

  {/* الإجماليات */}
  <div style={{
    marginTop: "16px", background: "#1e3a8a", borderRadius: "10px",
    padding: "12px 16px", display: "flex", flexWrap: "wrap",
    gap: "16px", justifyContent: "space-between", alignItems: "center",
  }}>
    <span style={{ fontWeight: "700", color: "#fff", fontSize: "13px" }}>الإجماليات</span>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
      <span style={{ color: "#93c5fd", fontWeight: "700", fontSize: "12px" }}>
        إجمالي السعر: {fmtNum(totals.totalPrice)}
      </span>
      <span style={{ color: "#86efac", fontWeight: "700", fontSize: "12px" }}>
        قيمة الأعمال المنفذة: {fmtNum(totals.executedWorksValue)}
      </span>
      <span style={{ color: "#93c5fd", fontWeight: "700", fontSize: "12px" }}>
        إجمالي الكمية المنفذة: {fmtNum(totals.totalExecutedQuantity)}
      </span>
      <span style={{ color: "#c4b5fd", fontWeight: "700", fontSize: "12px" }}>
        إجمالي قيمة الكمية المنفذة: {fmtNum(totals.totalExecutedValue)}
      </span>
    </div>
  </div>
</>
    </div>
  );
}