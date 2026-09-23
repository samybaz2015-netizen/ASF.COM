import React from "react";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

function FilterField({ field, value, onChange, dynamicOptions }) {
  const { key, label, type, options } = field;

  const wrap = (children) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );

  if (type === "select" || type === "dynamic-select") {
    const opts = type === "select" ? options : dynamicOptions[key] || [];
    return wrap(
      <select name={key} value={value} onChange={onChange} className={fieldClass}>
        <option value="">الكل</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (type === "boolean") {
    return wrap(
      <select name={key} value={value} onChange={onChange} className={fieldClass}>
        <option value="">الكل</option>
        <option value="true">نعم</option>
        <option value="false">لا</option>
      </select>
    );
  }

  if (type === "date") {
    return wrap(<input type="date" name={key} value={value} onChange={onChange} className={fieldClass} />);
  }

  if (type === "number") {
    return wrap(
      <input type="number" name={key} value={value} onChange={onChange} placeholder={label} className={fieldClass} />
    );
  }

  return wrap(
    <input type="text" name={key} value={value} onChange={onChange} placeholder={label} className={fieldClass} />
  );
}

export default FilterField;