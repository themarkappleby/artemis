import React from 'react';
import './StatBar.css';

export const StatBar = ({ icon, iconBg, label, value, maxValue = 5, minValue = 1, onChange }) => {
  const options = [];
  for (let i = minValue; i <= maxValue; i++) {
    options.push(i);
  }
  
  return (
    <div className="stat-bar">
      <div className="stat-label">
        {icon && (
          <span 
            className="stat-icon" 
            style={iconBg ? { backgroundColor: iconBg } : undefined}
          >
            {icon}
          </span>
        )}
        {label}
      </div>
      <select 
        className="stat-select"
        value={value}
        onChange={(e) => onChange && onChange(parseInt(e.target.value))}
      >
        {options.map((val) => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>
    </div>
  );
};
