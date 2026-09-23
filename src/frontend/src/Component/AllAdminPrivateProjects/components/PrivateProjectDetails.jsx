import React from "react";
import ProjectPhotos from "./ProjectPhotos";

const getValue = (data, keys) => {
  for (const key of keys) {
    if (
      data?.[key] !== undefined &&
      data?.[key] !== null &&
      data?.[key] !== ""
    ) {
      return data[key];
    }
  }

  return "-";
};

const PrivateProjectDetails = ({ project }) => {
  if (!project) return null;

  const fields = [
    ["اسم المشروع", ["projectName", "ProjectName"]],
    ["مكان المشروع", ["projectPlace", "ProjectPlace"]],
    ["رقم العقد", ["contractNumber", "ContractNumber"]],
    ["العميل", ["customer", "Customer"]],
    ["الاستشاري", ["consultant", "Consultant"]],
    ["المقاول", ["contractor", "Contractor"]],
    ["مالك المشروع", ["projectOwner", "ProjectOwner"]],
    ["جهة المشروع", ["projectParty", "ProjectParty"]],
    ["قيمة المشروع", ["projectValue", "ProjectValue"]],
    ["رقم المحطة", ["stationNumber", "StationNumber"]],
    ["مدة المشروع", ["timeOfProject", "TimeOfProject"]],
    ["الفرع", ["branchName", "BranchName"]],
    ["الإحداثيات", ["coordinates", "Coordinates"]],
    ["وصف العمل", ["workDescription", "WorkDescription"]],
    ["الملاحظات", ["note", "Note"]],
  ];

  const modelPhotos =
    project?.modelPhotos ||
    project?.ModelPhotos ||
    [];

  const sitePhotos =
    project?.sitePhotos ||
    project?.SitePhotos ||
    [];

  const safetyPhotos =
    project?.safetyWastePhotos ||
    project?.SafetyWastePhotos ||
    [];

  return (
    <div dir="rtl" className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map(([label, keys]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="mb-1 text-xs font-semibold text-slate-400">
              {label}
            </div>

            <div className="text-sm font-bold text-slate-700">
              {getValue(project, keys)}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 text-xs font-semibold text-slate-400">
          مخالفات السلامة
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
            getValue(project, [
              "safetyViolationsExist",
              "SafetyViolationsExist",
            ]) === true
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {getValue(project, [
            "safetyViolationsExist",
            "SafetyViolationsExist",
          ]) === true
            ? "يوجد مخالفات"
            : "لا يوجد مخالفات"}
        </span>
      </div>

      <ProjectPhotos
        title="صور الموديل"
        photos={modelPhotos}
        readonly
      />

      <ProjectPhotos
        title="صور الموقع"
        photos={sitePhotos}
        readonly
      />

      <ProjectPhotos
        title="صور مخلفات السلامة"
        photos={safetyPhotos}
        readonly
      />
    </div>
  );
};

export default PrivateProjectDetails;