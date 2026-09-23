import React from "react";

function NumberOfEquipment({ handleChange, value }) {
  return (
    <div className="groub_fe">
      <label> عدد المعدات</label>
      <input
        type="text"
        name="NumberOfEquipment"
        placeholder="عدد المعدات"
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}

export default NumberOfEquipment;
