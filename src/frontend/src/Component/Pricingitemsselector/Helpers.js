// ─── helpers math ─────────────────────────────────────────────────────────────
export const fmtNum = (n) => {
  const num = parseFloat(n) || 0;
  return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, "");
};

export function calcRow(sq) {
  const estimated        = parseFloat(sq.estimatedQuantity)      || 0;
  const executed          = parseFloat(sq.executedQuantity)       || 0;
  const totalExecuted     = parseFloat(sq.totalExecutedQuantity)  || 0;
  const unitPrice          = parseFloat(sq.unitPrice)              || 0;
  const totalPrice         = estimated * unitPrice;
  const executedWorksValue = executed * unitPrice;
  const totalExecutedValue = totalExecuted * unitPrice; // ✅ الجديد
  const executionPercentage = estimated > 0
    ? Math.min((totalExecuted / estimated) * 100, 100)
    : 0;
  return { totalPrice, executedWorksValue, totalExecutedValue, executionPercentage };
}

export function FilterField({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "4px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputStyle = {
  width: "100%", padding: "6px 10px",
  border: "1px solid #d1d5db", borderRadius: "6px",
  fontSize: "12px", background: "#fff",
  outline: "none", boxSizing: "border-box",
};

export function qtyInputStyle(bg, color) {
  return {
    width: "80px", padding: "4px 6px",
    border: `1.5px solid ${color}33`,
    borderRadius: "6px", fontSize: "12px",
    fontWeight: "600", color,
    background: bg, outline: "none",
    textAlign: "center", boxSizing: "border-box",
    display: "block", margin: "0 auto",
  };
}

export function tdStyle(align = "right") {
  return {
    padding: "8px 10px",
    borderBottom: "1px solid #f3f4f6",
    borderLeft: "1px solid #f3f4f6",
    textAlign: align,
    verticalAlign: "middle",
  };
}

export function pageBtnStyle(disabled) {
  return {
    padding: "5px 14px",
    background: disabled ? "#f3f4f6" : "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "12px",
    cursor: disabled ? "not-allowed" : "pointer",
    color: disabled ? "#9ca3af" : "#374151",
    fontWeight: "500",
  };
}
