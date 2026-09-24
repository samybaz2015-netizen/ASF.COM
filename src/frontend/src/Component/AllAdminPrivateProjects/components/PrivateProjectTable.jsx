import React from "react";
import {
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

const getValue = (project, keys, fallback = "-") => {
  for (const key of keys) {
    if (
      project?.[key] !== undefined &&
      project?.[key] !== null &&
      project?.[key] !== ""
    ) {
      return project[key];
    }
  }

  return fallback;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatMoney = (value) => {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) return value;

  return number.toLocaleString("ar-EG");
};

const columnsConfig = [
  {
    key: "ProjectName",
    label: "اسم المشروع",
    render: (p) =>
      getValue(p, ["projectName", "ProjectName"]),
  },
  {
    key: "ProjectPlace",
    label: "مكان المشروع",
    render: (p) =>
      getValue(p, ["projectPlace", "ProjectPlace"]),
  },
  {
    key: "BranchName",
    label: "الفرع",
    render: (p) =>
      getValue(p, ["branchName", "BranchName"]),
  },
  {
    key: "Customer",
    label: "العميل",
    render: (p) =>
      getValue(p, ["customer", "Customer"]),
  },
  {
    key: "Consultant",
    label: "الاستشاري",
    render: (p) =>
      getValue(p, ["consultant", "Consultant"]),
  },
  {
    key: "Contractor",
    label: "المقاول",
    render: (p) =>
      getValue(p, ["contractor", "Contractor"]),
  },
  {
    key: "ProjectOwner",
    label: "مالك المشروع",
    render: (p) =>
      getValue(p, ["projectOwner", "ProjectOwner"]),
  },
  {
    key: "ProjectParty",
    label: "جهة المشروع",
    render: (p) =>
      getValue(p, ["projectParty", "ProjectParty"]),
  },
  {
    key: "ContractNumber",
    label: "رقم العقد",
    render: (p) =>
      getValue(p, ["contractNumber", "ContractNumber"]),
  },
  {
    key: "ProjectValue",
    label: "قيمة المشروع",
    render: (p) =>
      formatMoney(
        getValue(p, ["projectValue", "ProjectValue"], "")
      ),
  },
  {
    key: "StationNumber",
    label: "رقم المحطة",
    render: (p) =>
      getValue(p, ["stationNumber", "StationNumber"]),
  },
  {
    key: "TimeOfProject",
    label: "مدة المشروع",
    render: (p) =>
      getValue(p, ["timeOfProject", "TimeOfProject"]),
  },
  {
    key: "OrderDate",
    label: "تاريخ الطلب",
    render: (p) =>
      formatDate(
        getValue(p, ["orderDate", "OrderDate"], "")
      ),
  },
  {
    key: "SafetyViolationsExist",
    label: "مخالفات السلامة",
    render: (p) => {
      const value = getValue(
        p,
        ["safetyViolationsExist", "SafetyViolationsExist"],
        null
      );

      if (value === null) return "-";

      return value ? "يوجد" : "لا يوجد";
    },
  },
  {
    key: "WorkDescription",
    label: "وصف العمل",
    render: (p) =>
      getValue(p, ["workDescription", "WorkDescription"]),
  },
  {
    key: "IsArchived",
    label: "الأرشفة",
    render: (p) => {
      const value = getValue(
        p,
        ["isArchived", "IsArchived"],
        null
      );

      if (value === null) return "-";

      return value ? "مؤرشف" : "نشط";
    },
  },
  {
    key: "Coordinates",
    label: "الإحداثيات",
    render: (p) =>
      getValue(p, ["coordinates", "Coordinates"]),
  },
];

export { columnsConfig };

const PrivateProjectTable = ({
  projects,
  visibleColumns,
  onView,
  onEdit,
  onDelete,
}) => {
  const getId = (project) =>
    project?.id ||
    project?.Id ||
    project?.privateProjectId ||
    project?.PrivateProjectId;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table
          dir="rtl"
          className="min-w-[1900px] w-full border-collapse"
        >
          <thead>
            <tr className="bg-[#115E59] text-white">
              <th className="sticky right-0 z-10 bg-[#115E59] px-4 py-4 text-right text-xs font-bold">
                #
              </th>

              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold"
                >
                  {column.label}
                </th>
              ))}

              <th className="sticky left-0 z-10 bg-[#115E59] px-5 py-4 text-center text-xs font-bold">
                الإجراءات
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {projects.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 2}
                  className="py-16 text-center text-sm text-slate-400"
                >
                  لا توجد مشاريع مطابقة للبحث
                </td>
              </tr>
            ) : (
              projects.map((project, index) => {
                const id = getId(project);

                return (
                  <tr
                    key={id || index}
                    className="group transition hover:bg-slate-50"
                  >
                    <td className="sticky right-0 z-10 bg-white px-4 py-4 text-sm font-bold text-slate-500 group-hover:bg-slate-50">
                      {index + 1}
                    </td>

                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className="max-w-[280px] whitespace-nowrap px-5 py-4 text-sm text-slate-600"
                      >
                        {column.render(project)}
                      </td>
                    ))}

                    <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="عرض"
                          onClick={() => onView(id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#0F766E]/10 hover:text-[#0F766E]"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          title="تعديل"
                          onClick={() => onEdit(id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          title="حذف"
                          onClick={() => onDelete(id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrivateProjectTable;