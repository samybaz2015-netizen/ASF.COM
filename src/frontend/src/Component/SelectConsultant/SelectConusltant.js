import React from "react";

const SelectConsultant = ({ value, onChange }) => {
  return (
    <div className="flex flex-col items-start w-1/2">
      <label>اسم المشرف</label>
      <input
        type="text"
        name="Consultant"
        value={value}
        onChange={onChange}
        required
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
        placeholder="أدخل اسم المشرف"
      />
    </div>
  );
};

export default SelectConsultant;
