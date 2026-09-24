import { useEffect } from "react";

// ─── Description Modal ────────────────────────────────────────────────────────
export function DescriptionModal({ item, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.15s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          width: "min(600px, 92vw)",
          overflow: "hidden",
          animation: "slideUp 0.2s ease",
        }}
      >
        <div style={{
          background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)",
          padding: "18px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                borderRadius: "6px",
                padding: "3px 10px",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.5px",
              }}>
                {item.itemNumber}
              </span>
              <span style={{
                background: "rgba(255,255,255,0.15)",
                color: "#bfdbfe",
                borderRadius: "6px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: "600",
              }}>
                {item.uom}
              </span>
            </div>
            <div style={{ color: "#93c5fd", fontSize: "12px", fontWeight: "500" }}>
              سعر الوحدة:{" "}
              <span style={{ color: "#fff", fontWeight: "700", fontSize: "14px" }}>
                {parseFloat(item.unitPrice).toFixed(2)}
              </span>
              <span style={{ color: "#93c5fd", marginRight: "4px", fontSize: "11px" }}>
                {item.currency || "SAR"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              cursor: "pointer",
              padding: "6px 10px",
              fontSize: "14px",
              lineHeight: 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              marginBottom: "8px",
            }}>
              <div style={{
                width: "4px", height: "18px",
                background: "#2563eb",
                borderRadius: "2px",
              }} />
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                الوصف المختصر
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: "600",
              color: "#111827",
              lineHeight: "1.6",
              background: "#f8fafc",
              borderRadius: "8px",
              padding: "12px 14px",
              border: "1px solid #e2e8f0",
            }}>
              {item.shortDescription}
            </p>
          </div>

          {item.longDescription && (
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "8px",
              }}>
                <div style={{
                  width: "4px", height: "18px",
                  background: "#16a34a",
                  borderRadius: "2px",
                }} />
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  الوصف التفصيلي
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: "13px",
                color: "#374151",
                lineHeight: "1.8",
                background: "#f0fdf4",
                borderRadius: "8px",
                padding: "12px 14px",
                border: "1px solid #bbf7d0",
                maxHeight: "180px",
                overflowY: "auto",
              }}>
                {item.longDescription}
              </p>
            </div>
          )}
        </div>

        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid #f3f4f6",
          display: "flex", justifyContent: "flex-end",
          background: "#fafafa",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}