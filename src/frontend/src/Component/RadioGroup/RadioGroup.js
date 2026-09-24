const RadioGroup = ({ label, options, name, selectedValue, onChange }) => (
  <div className="violations">
    <h4>{label}</h4>
    <div className="radio-group">
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={
              selectedValue === (option.value === "exists" ? true : false)
            }
            onChange={onChange}
          />
          <span className="radio-circle" />
          {option.label}
        </label>
      ))}
    </div>
  </div>
);

export default RadioGroup;
