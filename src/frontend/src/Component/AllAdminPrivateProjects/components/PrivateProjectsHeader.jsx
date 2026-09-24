import React from "react";
import {
  FolderKanban,
  Plus,
  RefreshCw,
} from "lucide-react";

const PrivateProjectsHeader = ({
  totalCount,
  onAdd,
  onRefresh,
  loading,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F766E]/10 text-[#0F766E]">
          <FolderKanban size={25} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            المشاريع الخاصة
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            إدارة ومتابعة جميع المشاريع الخاصة
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
          <div className="text-xs text-slate-400">
            إجمالي المشاريع
          </div>

          <div className="text-lg font-bold text-[#0F766E]">
            {totalCount.toLocaleString("ar-EG")}
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />

          تحديث
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="flex h-11 items-center gap-2 rounded-xl bg-[#0F766E] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#115E59]"
        >
          <Plus size={19} />

          إضافة مشروع
        </button>
      </div>
    </div>
  );
};

export default PrivateProjectsHeader;