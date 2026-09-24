import React from "react";
import { FaTimes, FaHardHat, FaBolt, FaTools, FaRoad, FaBuilding } from "react-icons/fa";

const PROJECT_TYPES = [
  {
    key: "construction",
    title: "الإنشاءات",
    description: "إضافة مشروع جديد ضمن مشاريع الإنشاءات",
    icon: FaBuilding,
  },
  {
    key: "emergency",
    title: "الطوارئ",
    description: "إضافة مشروع جديد ضمن مشاريع الطوارئ",
    icon: FaBolt,
  },
  {
    key: "maintenance",
    title: "الصيانة",
    description: "إضافة مشروع جديد ضمن مشاريع الصيانة",
    icon: FaTools,
  },
  {
    key: "rehabilitation",
    title: "أعمال التأهيل",
    description: "إضافة مشروع جديد ضمن أعمال التأهيل",
    icon: FaRoad,
  },
  {
    key: "private",
    title: "المشاريع الخاصة",
    description: "إضافة مشروع جديد ضمن المشاريع الخاصة",
    icon: FaHardHat,
  },
];

export default function AdminProjectTypeModal({
  isOpen,
  onClose,
  onSelect,
}) {
  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              إضافة مشروع جديد
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              اختر نوع المشروع الذي تريد إضافته
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <FaTimes />
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECT_TYPES.map((project) => {
            const Icon = project.icon;

            return (
              <button
                key={project.key}
                type="button"
                onClick={() => onSelect(project.key)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-right shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl"
              >
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-teal-900 to-teal-700">
                  <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur-sm transition group-hover:scale-110">
                    <Icon size={38} />
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-800">
                    {project.title}
                  </h3>

                  <p className="mt-2 min-h-[42px] text-sm leading-6 text-slate-400">
                    {project.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-teal-700">
                      إضافة المشروع
                    </span>

                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
                      ←
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}