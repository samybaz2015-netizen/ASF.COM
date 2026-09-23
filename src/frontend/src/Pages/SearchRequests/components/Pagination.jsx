import React from "react";
import { PAGE_SIZE_OPTIONS } from "../utils/Ordersconfig";

function Pagination({ pageIndex, totalPages, onPageChange, pageSize, onPageSizeChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <button
          disabled={pageIndex <= 1}
          onClick={() => onPageChange(pageIndex - 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          » السابق
        </button>
        <span className="whitespace-nowrap text-xs text-slate-500 sm:text-sm">
          صفحة <strong className="text-slate-700">{pageIndex}</strong> من {totalPages}
        </span>
        <button
          disabled={pageIndex >= totalPages}
          onClick={() => onPageChange(pageIndex + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          التالي «
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
        <span className="text-xs text-slate-400">عرض:</span>
        {PAGE_SIZE_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPageSizeChange(s)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              pageSize === s ? "bg-teal-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Pagination;