import React, { useState, useRef, useEffect } from "react";
import { FaColumns } from "react-icons/fa";
import { TABLE_COLUMNS } from "../utils/Ordersconfig";

function ColumnPicker({ visibleKeys, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleKey = (key) => {
    onChange(visibleKeys.includes(key) ? visibleKeys.filter((k) => k !== key) : [...visibleKeys, key]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-teal-300 hover:text-teal-700"
      >
        <FaColumns size={13} />
        الأعمدة
        <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
          {visibleKeys.length}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 max-h-80 w-64 overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {TABLE_COLUMNS.map((col) => (
            <label
              key={col.key}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <span>{col.label}</span>
              <input
                type="checkbox"
                checked={visibleKeys.includes(col.key)}
                onChange={() => toggleKey(col.key)}
                className="h-4 w-4 accent-teal-700"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default ColumnPicker;