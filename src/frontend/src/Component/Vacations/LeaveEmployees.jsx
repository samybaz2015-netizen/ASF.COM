import React, { useEffect, useState, useRef } from "react";
import axios from "../../api/apiClient";
import Swal from "sweetalert2";
import "./EmployeeLeaveCalendar.css";
import axiosInstance from "../../api/apiClient";

 const API_URL = "leaverequests";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAYS_AR   = ["أح","إث","ث","أر","خ","ج","س"];

function getDaysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

function getLeaveForDay(leaves, year, month, day) {
  const d = Date.UTC(year, month, day);
  for (const leave of leaves) {
    const fromDate = new Date(leave.from);
    const toDate   = new Date(leave.to);
    const from = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const to   = Date.UTC(toDate.getFullYear(),   toDate.getMonth(),   toDate.getDate());
    if (d >= from && d <= to) return leave;
  }
  return null;
}

const STATUS_CLASS = { Approved: "day-approved", Pending: "day-pending", Rejected: "day-rejected" };
const STATUS_LABEL = { Approved: "مقبولة", Pending: "قيد المراجعة", Rejected: "مرفوضة" };

/* ─── Modal ─────────────────────────────────────── */
const LeaveModal = ({ leave, employeeName, onClose, onApprove, onReject }) => {
  if (!leave) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 className="modal-title">{employeeName}</h3>
        <div className="modal-row"><span className="modal-label">السبب</span><span className="modal-value">{leave.reason || "—"}</span></div>
        <div className="modal-row"><span className="modal-label">من</span><span className="modal-value">{new Date(leave.from).toLocaleDateString("ar-EG")}</span></div>
        <div className="modal-row"><span className="modal-label">إلى</span><span className="modal-value">{new Date(leave.to).toLocaleDateString("ar-EG")}</span></div>
        <div className="modal-row"><span className="modal-label">عدد الأيام</span><span className="modal-value">{leave.numberOfDays || leave.totalDays || "—"}</span></div>
        <div className="modal-row">
          <span className="modal-label">الحالة</span>
          <span className={`modal-status status-${leave.status?.toLowerCase()}`}>{STATUS_LABEL[leave.status] || leave.status}</span>
        </div>
        {leave.file && (
          <div className="modal-row">
            <span className="modal-label">المرفق</span>
            <a href={leave.file} target="_blank" rel="noreferrer" className="modal-link">📎 عرض الملف</a>
          </div>
        )}
        {leave.status === "Pending" && (
          <div className="modal-actions">
            <button className="btn-approve" onClick={() => onApprove(leave)}>✅ قبول</button>
            <button className="btn-reject"  onClick={() => onReject(leave)}>❌ رفض</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Month/Year Picker ──────────────────────────── */
const MonthYearPicker = ({ year, month, onChange, onClose }) => {
  const [pickerYear, setPickerYear] = useState(year);
  return (
    <div
      style={{
        position: "absolute", top: "110%", left: "50%", transform: "translateX(-50%)",
        background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        padding: "16px 20px", zIndex: 1000, minWidth: 280, direction: "rtl",
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => setPickerYear(y => y - 1)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#4f46e5" }}>&#8250;</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{pickerYear}</span>
        <button onClick={() => setPickerYear(y => y + 1)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#4f46e5" }}>&#8249;</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {MONTHS_AR.map((m, i) => {
          const isActive = i === month && pickerYear === year;
          return (
            <button
              key={i}
              onClick={() => { onChange(pickerYear, i); onClose(); }}
              style={{
                padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                background: isActive ? "#4f46e5" : "#f3f4f6",
                color: isActive ? "#fff" : "#374151",
                fontWeight: isActive ? 700 : 400,
                fontSize: 13, transition: "all 0.15s",
              }}
            >{m}</button>
          );
        })}
      </div>
      <button
        onClick={onClose}
        style={{
          marginTop: 12, width: "100%", padding: "7px", borderRadius: 8,
          border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer",
          color: "#6b7280", fontSize: 13,
        }}
      >إغلاق</button>
    </div>
  );
};

/* ─── Branch Filter ──────────────────────────────── */
const BranchFilter = ({ branches, selectedBranch, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, direction: "rtl" }}>
    {branches.map(b => (
      <button
        key={b.value}
        onClick={() => onChange(b.value)}
        style={{
          padding: "6px 16px", borderRadius: 20, border: "1.5px solid",
          borderColor: selectedBranch === b.value ? "#4f46e5" : "#e5e7eb",
          background: selectedBranch === b.value ? "#4f46e5" : "#fff",
          color: selectedBranch === b.value ? "#fff" : "#374151",
          fontWeight: selectedBranch === b.value ? 700 : 400,
          fontSize: 13, cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap",
        }}
      >
        {b.label}
      </button>
    ))}
  </div>
);

/* ─── Name Search ────────────────────────────────── */
const NameSearch = ({ value, onChange }) => (
  <div style={{ position: "relative", direction: "rtl" }}>
    <span style={{
      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
      color: "#9ca3af", fontSize: 14, pointerEvents: "none",
    }}></span>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="بحث بالاسم..."
      style={{
        paddingRight: 32, paddingLeft: value ? 28 : 12,
        paddingTop: 6, paddingBottom: 6,
        borderRadius: 20, border: "1.5px solid #e5e7eb",
        fontSize: 13, outline: "none", width: 180,
        color: "#374151", direction: "rtl",
        transition: "border-color 0.18s",
      }}
      onFocus={e => (e.target.style.borderColor = "#4f46e5")}
      onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
    />
    {value && (
      <button
        onClick={() => onChange("")}
        style={{
          position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "#9ca3af", fontSize: 14, lineHeight: 1, padding: 0,
        }}
      >✕</button>
    )}
  </div>
);

/* ─── Main Component ─────────────────────────────── */
const LeaveEmployees = ({ selectedBranch, onBranchChange, branches = [] }) => {
  const [employees,       setEmployees]       = useState([]);
  const [selectedLeave,   setSelectedLeave]   = useState(null);
  const [selectedEmpName, setSelectedEmpName] = useState("");
  const [showPicker,      setShowPicker]      = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [searchName,      setSearchName]      = useState("");

  const now = new Date();
  const [currentYear,  setCurrentYear]  = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const pickerRef = useRef(null);

  
  /* ── Fetch — re-runs on branch change ── */
  const fetchAll = (branch) => {
    setLoading(true);
    const params = branch ? { branchId: branch } : {};
    axiosInstance
     .get("leaverequests/all", { params })
      .then(res => {
        const grouped = Object.values(
          res.data.data.reduce((acc, cur) => {
            acc[cur.employeeId] ??= {
              employeeId:   cur.employeeId,
              employeeName: cur.employeeName,
              leaves:       [],
            };
            acc[cur.employeeId].leaves.push(cur);
            return acc;
          }, {})
        );
        setEmployees(grouped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll(selectedBranch);
    setSearchName(""); // reset search when branch changes
  }, [selectedBranch]);

  /* ── Close picker on outside click ── */
  useEffect(() => {
    const handler = e => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setShowPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Filter by name (client-side) ── */
  const filteredEmployees = searchName.trim()
    ? employees.filter(emp =>
        emp.employeeName?.toLowerCase().includes(searchName.trim().toLowerCase())
      )
    : employees;

  /* ── Navigation ── */
  const changeMonth = (dir) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m > 11) { m = 0;  y++; }
    if (m < 0)  { m = 11; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const days = getDaysInMonth(currentYear, currentMonth);

  const getTotalApproved = (leaves) =>
    leaves
      .filter(l => l.status === "Approved")
      .reduce((s, l) => s + (l.totalDays || l.numberOfDays || 0), 0);

  /* ── Approve / Reject ── */
  const handleApprove = (leave) => {
    setSelectedLeave(null);
    Swal.fire({
      title: "قبول الإجازة", input: "textarea",
      inputPlaceholder: "اكتب ملاحظة (اختياري)...",
      showCancelButton: true, confirmButtonText: "قبول", cancelButtonText: "إلغاء",
      confirmButtonColor: "#16a34a",
    }).then(res => {
      if (!res.isConfirmed) return;
      axiosInstance
     .put(`${API_URL}/update-status/${leave.id}?status=Approved`, { reason: res.value })
        .then(() => { Swal.fire("تم", "تم قبول الإجازة", "success"); fetchAll(selectedBranch); })
        .catch(() => Swal.fire("خطأ", "حصلت مشكلة", "error"));
    });
  };

  const handleReject = (leave) => {
    setSelectedLeave(null);
    Swal.fire({
      title: "رفض الإجازة", input: "textarea",
      inputPlaceholder: "اكتب سبب الرفض...",
      showCancelButton: true, confirmButtonText: "رفض", cancelButtonText: "إلغاء",
      confirmButtonColor: "#dc2626",
      inputValidator: v => !v && "السبب مطلوب",
    }).then(res => {
      if (!res.isConfirmed) return;
      axiosInstance
        .put(`${API_URL}/update-status/${leave.id}?status=Rejected`, { reason: res.value },
          )
        .then(() => { Swal.fire("تم", "تم رفض الإجازة", "success"); fetchAll(selectedBranch); })
        .catch(() => Swal.fire("خطأ", "حصلت مشكلة", "error"));
    });
  };

  const handleCellClick = (leave, empName) => {
    if (!leave) return;
    setSelectedEmpName(empName);
    setSelectedLeave(leave);
  };

  return (
    <div className="leave-calendar-wrapper">

      {/* ── Top bar ── */}
      <div className="month-nav" style={{ flexWrap: "wrap", gap: 10 }}>

        <button className="month-nav-btn" onClick={() => changeMonth(-1)}>&#8249;</button>

        <div ref={pickerRef} style={{ position: "relative" }}>
          <button
            className="month-nav-label"
            onClick={() => setShowPicker(v => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: "inherit",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {MONTHS_AR[currentMonth]} {currentYear}
            <span style={{ fontSize: 12, opacity: 0.6 }}>▼</span>
          </button>

          {showPicker && (
            <MonthYearPicker
              year={currentYear}
              month={currentMonth}
              onChange={(y, m) => { setCurrentYear(y); setCurrentMonth(m); }}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>

        <button className="month-nav-btn" onClick={() => changeMonth(1)}>&#8250;</button>

        {/* Branch pills */}
        {branches.length > 0 && (
          <BranchFilter
            branches={branches}
            selectedBranch={selectedBranch}
            onChange={onBranchChange}
          />
        )}

        {/* Name search */}
        <NameSearch value={searchName} onChange={setSearchName} />
      </div>

      {/* Legend */}
      <div className="leave-legend">
        <span><span className="legend-dot approved"></span>مقبولة</span>
        <span><span className="legend-dot pending"></span>قيد المراجعة</span>
        <span><span className="legend-dot rejected"></span>مرفوضة</span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280", fontSize: 14 }}>
          جاري التحميل...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="leave-calendar-scroll">
          <table className="leave-calendar-table">
            <thead>
              <tr>
                <th className="name-header">الاسم</th>
                <th className="balance-header">رصيد الإجازة</th>
                {Array.from({ length: days }, (_, i) => i + 1).map(d => {
                  const dow = new Date(currentYear, currentMonth, d).getDay();
                  const isWeekend = dow === 5 || dow === 6;
                  return (
                    <th key={d} className={isWeekend ? "weekend-col" : ""}>
                      {d}<br /><span style={{ fontSize: 10 }}>{DAYS_AR[dow]}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={days + 2}
                    style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: 14 }}
                  >
                    {searchName
                      ? `لا يوجد موظف باسم "${searchName}"`
                      : "لا يوجد موظفون"}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.employeeId}>
                    <td className="name-cell">{emp.employeeName}</td>
                    <td className="balance-cell">{getTotalApproved(emp.leaves)}</td>
                    {Array.from({ length: days }, (_, i) => i + 1).map(d => {
                      const dow = new Date(currentYear, currentMonth, d).getDay();
                      const isWeekend = dow === 5 || dow === 6;
                      const leave = getLeaveForDay(emp.leaves, currentYear, currentMonth, d);
                      const cls = [leave ? STATUS_CLASS[leave.status] : "", isWeekend ? "weekend-day" : ""].join(" ").trim();
                      return (
                        <td
                          key={d}
                          className={cls}
                          style={{ cursor: leave ? "pointer" : "default" }}
                          title={leave ? `${leave.reason || "إجازة"} — ${STATUS_LABEL[leave.status]}` : ""}
                          onClick={() => handleCellClick(leave, emp.employeeName)}
                        />
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <LeaveModal
        leave={selectedLeave}
        employeeName={selectedEmpName}
        onClose={() => setSelectedLeave(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default LeaveEmployees;