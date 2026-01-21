import React from 'react';
import './MenuItem.css';

export const MenuItem = ({ icon, label, subtitle, value, onClick, showChevron = true }) => {
  return (
    <div className="menu-item" onClick={onClick}>
      <div className="menu-item-content">
        {icon && <div className="menu-item-icon">{icon}</div>}
        <div className="menu-item-text">
          <span className="menu-item-label">{label}</span>
          {subtitle && <span className="menu-item-subtitle">{subtitle}</span>}
        </div>
      </div>
      <div className="menu-item-end">
        {value && <span className="menu-item-value">{value}</span>}
        {showChevron && (
          <svg className="menu-item-chevron" width="8" height="13" viewBox="0 0 8 13" fill="none">
            <path d="M1 1L6.5 6.5L1 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  );
};
