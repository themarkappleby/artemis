import React from 'react';
import './MeterBar.css';

export const MeterBar = ({ label, value, maxValue, minValue = 0, onChange, color = '#007AFF', style }) => {
  const handleIncrement = () => {
    if (value < maxValue && onChange) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > minValue && onChange) {
      onChange(value - 1);
    }
  };

  // Calculate fill percentage based on range
  const range = maxValue - minValue;
  const fillPercent = ((value - minValue) / range) * 100;

  return (
    <div className="meter-bar" style={style}>
      <div className="meter-header">
        <span className="meter-label">{label}</span>
        <span className="meter-value">{value} / {maxValue}</span>
      </div>
      <div className="meter-track">
        <div 
          className="meter-fill" 
          style={{ 
            width: `${fillPercent}%`,
            backgroundColor: color 
          }}
        />
      </div>
      <div className="meter-controls">
        <button 
          className="meter-button decrement" 
          onClick={handleDecrement}
          disabled={value <= minValue}
        >
          −
        </button>
        <button 
          className="meter-button increment" 
          onClick={handleIncrement}
          disabled={value >= maxValue}
        >
          +
        </button>
      </div>
    </div>
  );
};
