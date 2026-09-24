import React, { useMemo } from "react";
import { FaClipboardList, FaCoins, FaFileInvoiceDollar, FaReceipt } from "react-icons/fa";
import { parseNumber, formatCurrency } from "../utils/Formatters";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-3 sm:p-4">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${accent}`}>
        <Icon size={14} className="sm:hidden" />
        <Icon size={16} className="hidden sm:block" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-slate-400 sm:text-xs">{label}</p>
        <p className="break-words text-base font-bold text-slate-800 sm:text-lg">{value}</p>
      </div>
    </div>
  );
}

function TotalsSummary({ requests }) {
  const stats = useMemo(() => {
    const workOrderTypes = new Set(requests.map((r) => r.orderType).filter(Boolean)).size;
    const extractNumbers = new Set(requests.map((r) => r.extractNumber).filter(Boolean)).size;
    const estimated = requests.reduce((sum, r) => sum + parseNumber(r.estimatedValue), 0);
    const actual = requests.reduce((sum, r) => sum + parseNumber(r.actualValue), 0);
    return { workOrderTypes, extractNumbers, estimated, actual };
  }, [requests]);

  return (
    <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={FaClipboardList}
        label="عدد أوامر العمل"
        value={stats.workOrderTypes}
        accent="bg-teal-50 text-teal-700"
      />
      <StatCard
        icon={FaCoins}
        label="إجمالي القيمة التقديرية"
        value={`${formatCurrency(stats.estimated)} ر.س`}
        accent="bg-amber-50 text-amber-700"
      />
      <StatCard
        icon={FaFileInvoiceDollar}
        label="إجمالي القيمة الفعلية"
        value={`${formatCurrency(stats.actual)} ر.س`}
        accent="bg-emerald-50 text-emerald-700"
      />
      <StatCard
        icon={FaReceipt}
        label="عدد أرقام المستخلص"
        value={stats.extractNumbers}
        accent="bg-sky-50 text-sky-700"
      />
    </div>
  );
}

export default TotalsSummary;