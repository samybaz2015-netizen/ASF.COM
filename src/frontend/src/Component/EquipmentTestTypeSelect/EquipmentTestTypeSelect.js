import React from "react";

function EquipmentTestTypeSelect({ handleChange, value }) {
  return (
    <div className="groub_fe">
      <label>نوع اختبار المعده</label>
      <select
        className="border w-full "
        name="TypeOfStomachTest"
        value={value}
        onChange={handleChange}
      >
        <option value="كابلات">كابلات</option>
        <option value="محطات">محطات</option>
        <option value="وحده حلقيه">وحده حلقيه</option>
        <option value="محولات هوائيه">محولات هوائيه</option>
        <option value="كابلات">كابلات</option>
        <option value="كابلات- محطات">كابلات- محطات</option>
        <option value="كابلات-وحدة حلقية">كابلات-وحدة حلقية</option>
        <option value="كابلات-محطات-وحدة حلقية">كابلات-محطات-وحدة حلقية</option>
        <option value="محطات- وحدة حلقية">محطات- وحدة حلقية</option>
        <option value="ميني بيلر">ميني بيلر</option>
        <option value="اخري">اخري</option>
      </select>
    </div>
  );
}

export default EquipmentTestTypeSelect;
