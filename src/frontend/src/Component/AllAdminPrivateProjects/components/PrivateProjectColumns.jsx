import React from "react";
import { Columns3 } from "lucide-react";

const PrivateProjectColumns = ({
  columns,
  onToggle,
}) => {
  return (
    <details className="relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50">
        <Columns3 size={17} />
        الأعمدة
      </summary>

      <div className="absolute left-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
        <div className="mb-2 text-xs font-bold text-slate-400">
          إظهار / إخفاء الأعمدة
        </div>

        <div className="max-h-80 overflow-y-auto">
          {columns.map((column) => (
            <label
              key={column.key}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={column.visible}
                onChange={() => onToggle(column.key)}
                className="h-4 w-4 rounded border-slate-300 accent-[#0F766E]"
              />

              {column.label}
            </label>
          ))}
        </div>
      </div>
    </details>
  );
};

export default PrivateProjectColumns;