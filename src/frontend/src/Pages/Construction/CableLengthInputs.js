import React from "react";

function CableLengthInputs({
  handleChange,
  CableCompletion,
  CableLength,
  ProjectCableLength,
  DailyCableLength,
  apiData,
}) {
  return (
    <div className="flex flex-wrap flex-col lg:flex-row gap-3">
      {/* <div className="groub_fe">
        <label>طول تمديديسش الكيبل للمشروع</label>
        <input
          type="text"
          name="ProjectCableLength"
          placeholder="طول تمديد الكيبل للمشروع"
          value={ProjectCableLength || ""}
          onChange={handleChange}
    
        />
      </div> */}

      {/* <div className="groub_fe">
        <label>طول تمديد الكيبل المنفذ اليومي</label>
        <input
          type="text"
          name="DailyCableLength"
          placeholder="طول تمديد الكيبل المنفذ اليومي"
          value={DailyCableLength || ""}
          onChange={handleChange}

        />
      </div> */}

      {apiData && (
        <div className="groub_fe">
          <label>طول تمديد الكيبل المنفذ للمشروع</label>
          <input
            type="text"
            name="CableLength"
            placeholder="طول تمديد الكيبل المنفذ للمشروع"
            value={CableLength || ""}
            onChange={handleChange}
            readOnly
          />
        </div>
      )}

      {apiData && (
        <div className="groub_fe">
          <label>نسبة انجاز الكيبل </label>
          <input
            type="text"
            name="CableCompletion"
            placeholder="نسبة انجاز الكيبل "
            value={CableCompletion || ""}
            onChange={handleChange}
            readOnly
          />
        </div>
      )}
    </div>
  );
}

export default CableLengthInputs;
