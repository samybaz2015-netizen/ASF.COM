import React from "react";

const SelectSituation = ({ value, onChange }) => {
  return (
    <div className="w-full my-4 flex flex-col gap-2 items-start justify-start">
      <label>موقف التنفيذ</label>
      <select
        id="Situation"
        name="Situation"
        className="selectSituation"
        onChange={onChange}
        value={value || ""}
      >
        <option value="" disabled>
          اختر الحالة
        </option>
        <option value="pending">تحت التنفيذ</option>
        <option value="finished">تم التنفيذ</option>
        <option value="certificateIssued">صدور شهادة الإنجاز</option>
        <option value="inExtract">دخلت مستخلص</option>
        <option value="paid">تم الصرف</option>
      </select>
    </div>
  );
};

export default SelectSituation;
