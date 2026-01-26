import React from 'react';
import './DiceInput.css';

const DiceIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 256 256" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M192,32H64A32.03667,32.03667,0,0,0,32,64V192a32.03667,32.03667,0,0,0,32,32H192a32.03667,32.03667,0,0,0,32-32V64A32.03667,32.03667,0,0,0,192,32ZM92,176a12,12,0,1,1,12-12A12,12,0,0,1,92,176Zm0-72a12,12,0,1,1,12-12A12,12,0,0,1,92,104Zm36,36a12,12,0,1,1,12-12A12,12,0,0,1,128,140Zm36,36a12,12,0,1,1,12-12A12,12,0,0,1,164,176Zm0-72a12,12,0,1,1,12-12A12,12,0,0,1,164,104Z"/>
  </svg>
);

export const DiceInput = ({ value, onChange, onDiceClick, placeholder, ...props }) => (
  <div className="dice-input-wrapper">
    <input
      type="text"
      className="dice-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
    <button
      type="button"
      className="dice-input-button"
      onClick={onDiceClick}
      aria-label="Roll random value"
    >
      <DiceIcon />
    </button>
  </div>
);
