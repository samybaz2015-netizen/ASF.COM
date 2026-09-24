import React from "react";
import { FaSpinner } from "react-icons/fa";

function LoadingOverlay({ show, label = "جاري تحضير البيانات..." }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-slate-900/60 text-white backdrop-blur-sm">
      <FaSpinner className="animate-spin" size={32} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default LoadingOverlay;