import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./EmployeeLeaveCalendar.css";
import Swal from "sweetalert2";
import axiosInstance from "../../api/apiClient";

const API_URL = "leaverequests"; 

const colors = {
  Approved: "#22c55e",
  Pending: "#facc15",
  Rejected: "#ef4444",
};

const EmployeeLeaveCalendar = ({ employee, onBack }) => {
  /* ===== Calendar Events ===== */

  const events = employee.leaves
    .filter((l) => l.from && l.to)
    .map((l) => ({
      title: l.reason || "إجازة",
      start: l.from,
      end: new Date(new Date(l.to).setDate(new Date(l.to).getDate() + 1)),
      display: "block",
      classNames: [`leave-${l.status.toLowerCase()}`],
      extendedProps: l,
    }));

  /* ===== Update Status ===== */

  const updateRequestStatus = (leave, status) => {
    const isApprove = status === "Approved";

    Swal.fire({
      title: isApprove ? "قبول الإجازة" : "رفض الإجازة",
      input: "textarea",
      inputPlaceholder: isApprove
        ? "اكتب ملاحظة (اختياري أو إجباري حسب النظام)..."
        : "اكتب سبب الرفض...",
      showCancelButton: true,
      confirmButtonText: isApprove ? "قبول" : "رفض",
      cancelButtonText: "إلغاء",
      confirmButtonColor: isApprove ? "#16a34a" : "#dc2626",
      inputValidator: (value) => {
        if (!value) {
          return "السبب مطلوب";
        }
      },
    }).then((res) => {
      if (res.isConfirmed) {
        axiosInstance
          .put(`${API_URL}/update-status/${leave.id}?status=${status}`, {
            reason: res.value,
          })
          .then(() => {
            Swal.fire(
              "تم",
              isApprove ? "تم قبول الإجازة" : "تم رفض الإجازة",
              "success"
            );
            onBack();
          })
          .catch(() => {
            Swal.fire("خطأ", "حصلت مشكلة أثناء تحديث الحالة", "error");
          });
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <button onClick={onBack} className="mb-4 text-blue-600">
        ← رجوع
      </button>

      <h2 className="text-xl font-bold mb-4">
        تقويم إجازات: {employee.employeeName}
      </h2>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ar"
        events={events}
        eventClick={(info) => {
          const e = info.event.extendedProps;

          Swal.fire({
            title: e.employeeName,
            html: `
                    <div style="text-align:right">
                    <p><b>السبب:</b> ${e.reason || "—"}</p>
                    <p><b>من:</b> ${new Date(e.from).toLocaleDateString("ar-SA")}</p>
                    <p><b>إلى:</b> ${new Date(e.to).toLocaleDateString("ar-SA")}</p>
                    <p><b>عدد الأيام:</b> ${e.numberOfDays}</p>
                    ${
                      e.file
                        ? `<p><a href="${e.file}" target="_blank">📎 عرض المرفق</a></p>`
                        : ""
                    }
                    <p><b>الحالة:</b> ${e.status}</p>
                    </div>
                `,
            showCancelButton: true,
            showDenyButton: e.status === "Pending",
            confirmButtonText: "✅ قبول",
            denyButtonText: "❌ رفض",
            cancelButtonText: "إغلاق",
            confirmButtonColor: "#16a34a",
            denyButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
          }).then((res) => {
            if (res.isConfirmed) updateRequestStatus(e, "Approved");
            if (res.isDenied) updateRequestStatus(e, "Rejected");
          });
        }}
      />
    </div>
  );
};

export default EmployeeLeaveCalendar;