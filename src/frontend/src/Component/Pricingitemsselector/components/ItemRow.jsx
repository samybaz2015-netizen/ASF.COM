

export function ItemRow({ item, isSelected, onToggle, onShowDesc }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "10px 14px",
        borderRadius: "8px",
        background: isSelected ? "#f0fdf4" : "transparent",
        border: isSelected ? "1px solid #86efac" : "1px solid transparent",
        transition: "all 0.15s",
        marginBottom: "4px",
      }}
    >
      <div
        onClick={() => onToggle(item)}
        style={{ cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: 0 }}
      >
        <div style={{
          flexShrink: 0,
          marginTop: "3px",
          width: "18px",
          height: "18px",
          borderRadius: "4px",
          border: isSelected ? "none" : "2px solid #d1d5db",
          background: isSelected ? "#16a34a" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
        }}>
          {isSelected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "4px" }}>
            <span style={{
              background: "#e0f2fe", color: "#0369a1",
              borderRadius: "4px", padding: "1px 7px",
              fontSize: "11px", fontWeight: "700", flexShrink: 0,
            }}>
              {item.itemNumber}
            </span>
            <span style={{ fontSize: "12px", color: "#6b7280", flexShrink: 0 }}>{item.uom}</span>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#15803d", flexShrink: 0 }}>
              {item.unitPrice.toFixed(2)} {item.currency}
            </span>
          </div>
          <p style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: "500",
            color: "#111827",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {item.shortDescription}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={e => { e.stopPropagation(); onShowDesc(item); }}
        title="عرض الوصف الكامل"
        style={{
          flexShrink: 0,
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "6px",
          color: "#0369a1",
          cursor: "pointer",
          padding: "4px 9px",
          fontSize: "11px",
          fontWeight: "600",
          lineHeight: 1.4,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
          alignSelf: "center",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#e0f2fe"; e.currentTarget.style.borderColor = "#7dd3fc"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#f0f9ff"; e.currentTarget.style.borderColor = "#bae6fd"; }}
      >
        📋 تفاصيل
      </button>
    </div>
  );
}