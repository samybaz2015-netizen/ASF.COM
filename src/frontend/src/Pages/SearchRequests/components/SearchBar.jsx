import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <FaSearch className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="ابحث برقم العطل..."
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-9 text-sm text-slate-700 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="مسح البحث"
        >
          <FaTimes size={12} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;