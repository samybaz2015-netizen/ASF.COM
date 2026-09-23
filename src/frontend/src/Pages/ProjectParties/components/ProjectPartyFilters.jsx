import React from "react";

const TYPES = ["المقاول", "المهندس", "المشرف"];

const ProjectPartyFilters = ({
  typeFilter,
  onTypeChange,
  branchId,
  onBranchChange,
  branches,
}) => {
  return (
    <div className="mb-4 flex items-center flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">فلترة حسب النوع:</label>
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">الكل</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">فلترة حسب الفرع:</label>
        <select
          value={branchId}
          onChange={(e) => onBranchChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">الكل</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ProjectPartyFilters;