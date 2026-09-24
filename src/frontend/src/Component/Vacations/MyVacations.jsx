import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "../../api/apiClient";
import Swal from "sweetalert2";
import { FaCalendarAlt, FaEdit, FaPaperclip } from "react-icons/fa";
import VacationRequest from "../../Pages/EngProfile/VacationRequest";
import axiosInstance from "../../api/apiClient";

/* ================= Utils ================= */

const isEmptyDate = (date) => !date || date.startsWith("0001");

const formatDate = (date) => {
  if (isEmptyDate(date)) return "—";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ar-SA");
};

// Safe value for <input type="date">: never feed it a placeholder "0001-01-01"
const toDateInputValue = (date) => (isEmptyDate(date) ? "" : date.split("T")[0]);

const toLocalISOString = (dateStr) => {
  const d = new Date(dateStr);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0") +
    "T00:00:00"
  );
};

const statusMap = {
  Pending: {
    label: "قيد المراجعة",
    class: "bg-yellow-100 text-yellow-800",
  },
  Approved: {
    label: "مقبولة",
    class: "bg-green-100 text-green-800",
  },
  Rejected: {
    label: "مرفوضة",
    class: "bg-red-100 text-red-800",
  },
};

// Extra timing badge based on isUpcoming / isActive / isFinished from the API
const getTimingBadge = (v) => {
  if (v.status !== "Approved") return null;
  if (v.isActive) {
    return { label: "جارية الآن", class: "bg-blue-100 text-blue-700" };
  }
  if (v.isUpcoming) {
    const daysLabel =
      v.daysUntilStart === 0
        ? "تبدأ اليوم"
        : v.daysUntilStart === 1
        ? "تبدأ غدًا"
        : `تبدأ خلال ${v.daysUntilStart} يوم`;
    return { label: daysLabel, class: "bg-purple-100 text-purple-700" };
  }
  if (v.isFinished) {
    return { label: "منتهية", class: "bg-gray-100 text-gray-600" };
  }
  return null;
};

/* ================= Component ================= */

const MyVacations = () => {
  /* ===== GET My Vacations ===== */
  const {
    data: vacations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["my-vacations"],
    queryFn: async () => {
      const res = await axiosInstance.get("/leaverequests/my");
      return res.data?.data || [];
    },
  });

  /* ===== Edit Vacation ===== */

const handleEdit = (vacation) => {
    const fromValue = toDateInputValue(vacation.from);
    const toValue = toDateInputValue(vacation.to);

    Swal.fire({
      title: "تعديل طلب الإجازة",
      html: `
        <div style="text-align:right; display:flex; flex-direction:column; gap:10px;">

          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <label style="font-size:13px; font-weight:600; margin-bottom:4px;">من</label>
            <input id="from" type="date" value="${fromValue}"
              class="swal2-input"
              style="margin:0; width:100%; box-sizing:border-box; text-align:right;" />
          </div>

          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <label style="font-size:13px; font-weight:600; margin-bottom:4px;">إلى</label>
            <input id="to" type="date" value="${toValue}"
              class="swal2-input"
              style="margin:0; width:100%; box-sizing:border-box; text-align:right;" />
          </div>

          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <label style="font-size:13px; font-weight:600; margin-bottom:4px;">عدد الأيام</label>
            <input id="days" type="text" readonly
              value="${vacation.totalDays || ""}"
              class="swal2-input"
              style="margin:0; width:100%; box-sizing:border-box; text-align:right; background:#f3f4f6;" />
          </div>

          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <label style="font-size:13px; font-weight:600; margin-bottom:4px;">السبب</label>
            <input id="reason" type="text" value="${vacation.reason || ""}"
              class="swal2-input"
              style="margin:0; width:100%; box-sizing:border-box; text-align:right;" />
          </div>

          <div style="display:flex; flex-direction:column; align-items:flex-end;">
            <label style="font-size:13px; font-weight:600; margin-bottom:4px;">الملف</label>
            <input id="file" type="file"
              class="swal2-input"
              style="margin:0; width:100%; box-sizing:border-box;" />
            ${
              vacation.file
                ? `<a href="${vacation.file}" target="_blank"
                    style="display:block;margin-top:5px;color:#2563eb;font-size:13px;">
                    📎 عرض الملف الحالي
                  </a>`
                : `<small style="color:#9ca3af;">لا يوجد ملف مرفق</small>`
            }
          </div>

        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "حفظ",

      didOpen: () => {
        const from = document.getElementById("from");
        const to = document.getElementById("to");
        const days = document.getElementById("days");

        const calcDays = () => {
          if (from.value && to.value) {
            const d1 = new Date(from.value);
            const d2 = new Date(to.value);

            if (d1 > d2) {
              days.value = "غير صحيح";
              return;
            }

            const diff =
              Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
            days.value = diff;
          }
        };

        from.addEventListener("change", calcDays);
        to.addEventListener("change", calcDays);
      },

      preConfirm: () => {
        const from = document.getElementById("from").value;
        const to = document.getElementById("to").value;
        const reason = document.getElementById("reason").value;
        const file = document.getElementById("file").files[0];
        const days = document.getElementById("days").value;

        if (!from || !to || !reason) {
          Swal.showValidationMessage("كل الحقول مطلوبة");
          return false;
        }

        if (days === "غير صحيح") {
          Swal.showValidationMessage("تاريخ البداية لازم يكون قبل تاريخ النهاية");
          return false;
        }

        return { from, to, reason, days, file };
      },
    }).then(async (res) => {
      if (!res.isConfirmed) return;

      const fd = new FormData();
      fd.append("From", toLocalISOString(res.value.from));
      fd.append("To", toLocalISOString(res.value.to));
      fd.append("NumberOfDays", Number(res.value.days));
      fd.append("Reason", res.value.reason);

      if (res.value.file instanceof File) {
        fd.append("File", res.value.file);
      }

      try {
        await axiosInstance.put(`leaverequests/${vacation.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Swal.fire("تم", "تم تعديل الإجازة بنجاح", "success");
        refetch();
      } catch (err) {
        console.error(err);
        Swal.fire("خطأ", "حدث خطأ أثناء تعديل الإجازة، حاول مرة أخرى", "error");
      }
    });
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10">
      <div className="max-w-4xl mx-auto px-4 space-y-8">

        {/* Header */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <VacationRequest />
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-mainColor/10 text-mainColor p-3 rounded-full">
              <FaCalendarAlt className="text-xl" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-800">
                إجازاتي
              </h1>
              <p className="text-sm text-gray-500">
                عرض وإدارة طلبات الإجازة الخاصة بك
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : vacations.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            لا توجد طلبات إجازة
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-mainColor text-white">
                <tr>
                  <th className="px-4 py-3 text-center">من</th>
                  <th className="px-4 py-3 text-center">إلى</th>
                  <th className="px-4 py-3 text-center">عدد الأيام</th>
                  <th className="px-4 py-3 text-center">السبب</th>
                  <th className="px-4 py-3 text-center">الملف</th>
                  <th className="px-4 py-3 text-center">الحالة</th>
                  <th className="px-4 py-3 text-center">إجراء</th>
                </tr>
              </thead>

              <tbody>
                {vacations.map((v) => {
                  const status = statusMap[v.status] || {};
                  const timingBadge = getTimingBadge(v);
                  return (
                    <tr key={v.id} className="border-b hover:bg-gray-50">

                      <td className="px-4 py-3 text-center">
                        {formatDate(v.from)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {formatDate(v.to)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {v.totalDays || "—"}
                      </td>

                      <td className="px-4 py-3 text-center max-w-[160px] truncate" title={v.reason || ""}>
                        {v.reason || "—"}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {v.file ? (
                          <a
                            href={v.file}
                            target="_blank"
                            rel="noreferrer"
                            className="text-mainColor hover:text-secondaryColor inline-flex items-center gap-1"
                          >
                            <FaPaperclip />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${status.class}`}
                          >
                            {status.label || v.status}
                          </span>
                          {timingBadge && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${timingBadge.class}`}
                            >
                              {timingBadge.label}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {v.status === "Pending" && (
                          <button
                            onClick={() => handleEdit(v)}
                            className="text-mainColor hover:text-secondaryColor flex items-center gap-1 mx-auto"
                          >
                            <FaEdit />
                            تعديل
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyVacations;