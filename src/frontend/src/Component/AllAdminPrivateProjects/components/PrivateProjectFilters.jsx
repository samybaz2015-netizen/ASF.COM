import React, { useState } from "react";
import {
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

const filterFields = [
  {
    name: "ProjectName",
    label: "اسم المشروع",
    placeholder: "ابحث باسم المشروع",
  },
  {
    name: "ProjectPlace",
    label: "مكان المشروع",
    placeholder: "مكان المشروع",
  },
  {
    name: "BranchName",
    label: "الفرع",
    placeholder: "اسم الفرع",
  },
  {
    name: "Customer",
    label: "العميل",
    placeholder: "اسم العميل",
  },
  {
    name: "Consultant",
    label: "الاستشاري",
    placeholder: "اسم الاستشاري",
  },
  {
    name: "District",
    label: "الحي / المنطقة",
    placeholder: "المنطقة",
  },
  {
    name: "Contractor",
    label: "المقاول",
    placeholder: "اسم المقاول",
  },
  {
    name: "ProjectValue",
    label: "قيمة المشروع",
    placeholder: "قيمة المشروع",
  },
  {
    name: "StationNumber",
    label: "رقم المحطة",
    placeholder: "رقم المحطة",
  },
  {
    name: "TimeOfProject",
    label: "مدة المشروع",
    placeholder: "مدة المشروع",
  },
  {
    name: "WorkDescription",
    label: "وصف العمل",
    placeholder: "وصف العمل",
  },
  {
    name: "Coordinates",
    label: "الإحداثيات",
    placeholder: "الإحداثيات",
  },
];

const PrivateProjectFilters = ({
  filters,
  onChange,
  onApply,
  onReset,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={filters.ProjectName}
            onChange={(e) =>
              onChange("ProjectName", e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onApply();
              }
            }}
            placeholder="ابحث باسم المشروع..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm text-slate-700 outline-none transition focus:border-[#0F766E] focus:bg-white focus:ring-2 focus:ring-[#0F766E]/10"
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition ${
            open
              ? "border-[#0F766E] bg-[#0F766E]/5 text-[#0F766E]"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal size={18} />
          الفلاتر
        </button>

        <button
          type="button"
          onClick={onApply}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 text-sm font-bold text-white transition hover:bg-[#115E59]"
        >
          <Filter size={18} />
          بحث
        </button>
      </div>

      {open && (
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filterFields.map((field) => (
              <div key={field.name}>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  {field.label}
                </label>

                <input
                  value={filters[field.name] || ""}
                  onChange={(e) =>
                    onChange(field.name, e.target.value)
                  }
                  placeholder={field.placeholder}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-[#0F766E] focus:bg-white focus:ring-2 focus:ring-[#0F766E]/10"
                />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                مخالفات السلامة
              </label>

              <select
                value={filters.SafetyViolationsExist}
                onChange={(e) =>
                  onChange(
                    "SafetyViolationsExist",
                    e.target.value
                  )
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0F766E]"
              >
                <option value="">الكل</option>
                <option value="true">يوجد مخالفات</option>
                <option value="false">لا يوجد</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                مؤرشف
              </label>

              <select
                value={filters.IsArchived}
                onChange={(e) =>
                  onChange("IsArchived", e.target.value)
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0F766E]"
              >
                <option value="">الكل</option>
                <option value="true">مؤرشف</option>
                <option value="false">غير مؤرشف</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                تاريخ الطلب
              </label>

              <input
                type="datetime-local"
                value={filters.OrderDate}
                onChange={(e) =>
                  onChange("OrderDate", e.target.value)
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <RotateCcw size={16} />
              إعادة ضبط الفلاتر
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateProjectFilters;