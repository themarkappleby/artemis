import React from 'react';
import './MeterBar.css';

export const MeterBar = ({ label, value, maxValue, onChange, color = '#007AFF', style }) => {
  const handleIncrement = () => {
    if (value < maxValue && onChange) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > 0 && onChange) {
      onChange(value - 1);
    }
  };

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
            width: `${(value / maxValue) * 100}%`,
            backgroundColor: color 
          }}
        />
      </div>
      <div className="meter-controls">
        <button 
          className="meter-button decrement" 
          onClick={handleDecrement}
          disabled={value <= 0}
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
