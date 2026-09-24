import React, { useState } from "react";
import {
  FaEye,
  FaInbox,
  FaTrash,
  FaFileExcel,
} from "react-icons/fa";
import Swal from "sweetalert2";

import StatusBadge from "./StatusBadge";
import { formatFieldValue } from "../utils/Formatters";
import { deleteProject } from "../utils/projectDelete";

function CellValue({ column, request }) {
  const value = request[column.key];

  if (column.key === "situation") {
    return <StatusBadge situation={value} />;
  }

  if (
    column.key === "cableCompletion" &&
    value !== null &&
    value !== undefined &&
    value !== ""
  ) {
    const pct = Math.max(
      0,
      Math.min(100, Number(value) || 0)
    );

    return (
      <div className="flex items-center justify-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-amber-500"
            style={{
              width: `${pct}%`,
            }}
          />
        </div>

        <span className="text-xs text-slate-500">
          {pct}%
        </span>
      </div>
    );
  }

  if (
    column.key === "safetyViolationsExist" ||
    column.key === "isArchived"
  ) {
    return value ? (
      <span className="font-medium text-rose-600">
        نعم
      </span>
    ) : (
      <span className="text-slate-400">
        لا
      </span>
    );
  }

  const formatted = formatFieldValue(
    column.key,
    value
  );

  return (
    <span
      className={
        formatted === "لا يوجد"
          ? "text-slate-300"
          : ""
      }
    >
      {formatted}
    </span>
  );
}

function RequestsTable({
  requests,
  columns,
  selected,
  onToggle,
  onToggleAll,
  onView,
  token,
  onDeleted,
  onExportRow,
  isAdmin = false,
}) {
  const [deletingId, setDeletingId] =
    useState(null);

  const [exportingId, setExportingId] =
    useState(null);

  if (!requests?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-slate-400">
        <FaInbox size={28} />

        <p className="text-sm">
          لا توجد نتائج مطابقة لبحثك
        </p>
      </div>
    );
  }

  const allSelected =
    selected.length === requests.length &&
    requests.length > 0;

  const getProjectName = (request) => {
    return (
      request.projectName ||
      request.name ||
      request.projectNumber ||
      request.contractNumber ||
      request.id ||
      "هذا المشروع"
    );
  };

  const handleDelete = async (request) => {
    const id = request.id;
    const type = request.type;

    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: `سيتم حذف ${getProjectName(
        request
      )}. لا يمكن التراجع عن هذا الإجراء.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText:
        "نعم، احذف المشروع",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(`${type}-${id}`);

      await deleteProject({
        type,
        id,
        token,
      });

      await Swal.fire({
        title: "تم الحذف",
        text: "تم حذف المشروع بنجاح",
        icon: "success",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#0f766e",
      });

      if (onDeleted) {
        onDeleted(request);
      }
    } catch (error) {
      console.error(
        "Delete project error:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        "تعذر حذف المشروع";

      await Swal.fire({
        title: "فشل الحذف",
        text: message,
        icon: "error",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (request) => {
    if (!onExportRow || !request) return;

    try {
      setExportingId(
        `${request.type}-${request.id}`
      );

      await onExportRow(request);
    } catch (error) {
      console.error(
        "Export row error:",
        error
      );

      await Swal.fire({
        title: "فشل التصدير",
        text:
          error?.message ||
          "حدث خطأ أثناء تصدير الطلب",
        icon: "error",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div
      dir="rtl"
      className="relative h-[55vh] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <table className="w-full min-w-[1400px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-teal-900 text-white">
          <tr>
            {/* Select */}
            <th className="w-10 p-3 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="h-4 w-4 accent-amber-500"
              />
            </th>

            {/* View */}
            <th className="w-12 p-3 text-center font-medium">
              عرض
            </th>

            {/* Excel */}
            <th className="w-12 p-3 text-center font-medium">
              Excel
            </th>

            {/* Delete - Admin only */}
            {isAdmin && (
              <th className="w-12 p-3 text-center font-medium">
                حذف
              </th>
            )}

            {/* Dynamic Columns */}
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap p-3 text-center font-medium"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {requests.map((request, index) => {
            const rowKey = `${request.type}-${request.id}`;

            const isDeleting =
              deletingId === rowKey;

            const isExporting =
              exportingId === rowKey;

            return (
              <tr
                key={`${request.id}-${request.type}-${index}`}
                className={`border-b border-slate-100 text-center transition ${
                  selected.includes(index)
                    ? "bg-teal-50"
                    : "odd:bg-white even:bg-slate-50/50 hover:bg-teal-50/60"
                }`}
              >
                {/* Checkbox */}
                <td
                  className="p-2.5"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(
                      index
                    )}
                    onChange={() =>
                      onToggle(index)
                    }
                    className="h-4 w-4 accent-amber-500"
                  />
                </td>

                {/* View */}
                <td className="p-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onView(request)
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg text-teal-700 transition hover:bg-teal-100"
                    aria-label="عرض التفاصيل"
                    title="عرض التفاصيل"
                  >
                    <FaEye size={14} />
                  </button>
                </td>

                {/* Excel */}
                <td className="p-2.5">
                  <button
                    type="button"
                    disabled={
                      isExporting ||
                      !onExportRow
                    }
                    onClick={() =>
                      handleExport(request)
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="تصدير Excel"
                    title="تصدير هذا الطلب إلى Excel"
                  >
                    {isExporting ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                    ) : (
                      <FaFileExcel size={14} />
                    )}
                  </button>
                </td>

                {/* Delete - Admin Only */}
                {isAdmin && (
                  <td className="p-2.5">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() =>
                        handleDelete(request)
                      }
                      className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="حذف المشروع"
                      title="حذف المشروع"
                    >
                      {isDeleting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" />
                      ) : (
                        <FaTrash size={13} />
                      )}
                    </button>
                  </td>
                )}

                {/* Columns */}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap p-2.5 text-slate-600"
                  >
                    <CellValue
                      column={col}
                      request={request}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RequestsTable;