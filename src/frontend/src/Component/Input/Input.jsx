import React from "react";

function InputField({ label, name, value, onChange, placeholder, type = "text", required = true }) {
  return (

      <div className="groub_fe">
        <label>{label}</label>
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value || ""}
          onChange={onChange}
          required={required}
        />
      </div>
    
  );
}

export default InputField;
