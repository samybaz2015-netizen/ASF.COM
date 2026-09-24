export default function BranchTabs({ tabs, active, onChange }) {
  if (tabs.length < 2) return null;

  return (
    <div className="flex gap-1.5 bg-[#F4F6FA] p-1.5 rounded-xl mb-5 shrink-0">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 py-2.5 rounded-[10px] font-cairo font-bold text-sm border-none transition-all
            ${active === t.key
              ? "bg-white text-mainColor shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              : "bg-transparent text-[rgba(42,56,91,0.4)]"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}