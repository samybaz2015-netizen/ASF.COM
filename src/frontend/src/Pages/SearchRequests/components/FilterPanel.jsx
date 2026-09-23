import React from "react";
import { FaFilter, FaChevronDown, FaTimes } from "react-icons/fa";
import { FILTER_CONFIG } from "../utils/Ordersconfig";
import FilterField from "./FilterField";

function FilterToggle({ open, onToggle, count }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
        open
          ? "border-teal-700 bg-teal-800 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
      }`}
    >
      <FaFilter size={13} />
      <span>الفلاتر</span>
      {count > 0 && (
        <span
          className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${
            open ? "bg-white text-teal-800" : "bg-amber-500 text-white"
          }`}
        >
          {count}
        </span>
      )}
      <FaChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function FilterPanel({ open, filters, onChange, dynamicOptions }) {
  if (!open) return null;
  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      {FILTER_CONFIG.map((field) => (
        <FilterField
          key={field.key}
          field={field}
          value={filters[field.key]}
          onChange={onChange}
          dynamicOptions={dynamicOptions}
        />
      ))}
    </div>
  );
}

function ClearFiltersButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
    >
      <FaTimes size={12} /> مسح الكل
    </button>
  );
}

export { FilterToggle, ClearFiltersButton };
export default FilterPanel;