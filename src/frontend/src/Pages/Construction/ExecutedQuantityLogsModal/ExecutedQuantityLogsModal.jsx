import React, { useEffect, useState } from "react";
import { getExecutedQuantityLogs } from "../../../services/ExecutedQuantityApi";

function splitDateTime(changeDate) {
  if (!changeDate) return { date: "—", time: "—" };
  const d = new Date(changeDate);
  if (isNaN(d.getTime())) return { date: "—", time: "—" };
  return {
    date: d.toLocaleDateString("ar-EG"),
    time: d.toLocaleTimeString("ar-EG"),
  };
}

export default function ExecutedQuantityLogsModal({
  entityType,
  projectId,
  token,
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getExecutedQuantityLogs({ entityType, projectId, token });
        const list = Array.isArray(data) ? data : (data?.logs || data?.items || []);
        if (active) setLogs(list);
      } catch {
        if (active) setError("تعذر تحميل سجل التعديلات، حاول مرة أخرى.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [entityType, projectId, token]);

 return (
  <div
    dir="rtl"
    style={{
      background: "#fff",
      borderRadius: "14px",
      width: "100%",
      border: "1px solid #e5e7eb",
      overflow: "hidden",
    }}
  >
        <div style={{
          background: "linear-gradient(135deg,#1e40af,#1d4ed8)", color: "#fff",
          padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontWeight: 700, fontSize: "14px" }}>📜 سجل التغييرات</span>
          <div
          style={{
            background: "linear-gradient(135deg,#1e40af,#1d4ed8)",
            color: "#fff",
            padding: "16px 20px",
            fontWeight: 700,
          }}
        >
          📜 سجل التغييرات
        </div>
        </div>

        <div style={{ padding: "16px 20px", overflowY: "auto" }}>
          {loading && <p style={{ textAlign: "center", color: "#6b7280" }}>جارٍ التحميل...</p>}
          {error && <p style={{ textAlign: "center", color: "#dc2626" }}>{error}</p>}
          {!loading && !error && logs.length === 0 && (
            <p style={{ textAlign: "center", color: "#6b7280" }}>لا يوجد أي تعديلات مسجّلة بعد.</p>
          )}
          {!loading && !error && logs.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  {["#", "المستخدم", "رقم البند", "وصف البند", "الوصف", "التاريخ", "الساعة"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const { date, time } = splitDateTime(log.changeDate);
                  return (
                    <tr key={log.id ?? i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#6b7280" }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          {log.userProfileImage && (
                            <img
                              src={log.userProfileImage}
                              alt={log.userName || "user"}
                              style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover" }}
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          )}
                          <span>{log.userName || "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                        {log.itemNumber ?? "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        {log.itemDescription || "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        {log.changeDescription || "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                        {date}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                        {time}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    
  );
}