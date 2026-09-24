import React from "react";

const WorkDescriptionInput = ({ value, onChange }) => {
  return (
    <div className="groub_fe">
      <label>وصف لنطاق عمل المشروع</label>
      <input
        type="text"
        name="WorkDescription"
        placeholder="وصف لنطاق عمل المشروع"
        value={value || ""}
        onChange={onChange}
        required
      />
    </div>
  );
};

export default WorkDescriptionInput;
