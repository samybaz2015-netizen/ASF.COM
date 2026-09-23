import React from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Pagination = ({
  page,
  totalPages,
  pageSize,
  setPage,
  setPageSize,
}) => {
  const pages = [];

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>عرض</span>

        {[10, 20, 50, 100].map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => {
              setPageSize(size);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              pageSize === size
                ? "bg-[#0F766E] text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={17} />
        </button>

        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPage(item)}
            className={`h-9 min-w-9 rounded-lg px-2 text-sm font-bold ${
              page === item
                ? "bg-[#0F766E] text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item}
          </button>
        ))}

        <button
          type="button"
          disabled={page === totalPages}
          onClick={() =>
            setPage((p) => Math.min(totalPages, p + 1))
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={17} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;