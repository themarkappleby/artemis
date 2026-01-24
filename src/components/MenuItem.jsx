import React from 'react';
import ReactMarkdown from 'react-markdown';
import './MenuItem.css';

export const MenuItem = ({ icon, iconBg, label, subtitle, value, onClick, showChevron = true, isButton = false, destructive = false, muted = false }) => {
  if (isButton) {
    return (
      <div className={`menu-item menu-item-button ${destructive ? 'menu-item-destructive' : ''}`} onClick={onClick}>
        <span className="menu-item-label-button">{label}</span>
      </div>
    );
  }
  
  return (
    <div className={`menu-item ${muted ? 'menu-item-muted' : ''}`} onClick={onClick}>
      <div className="menu-item-content">
        {icon && (
          <div 
            className="menu-item-icon" 
            style={iconBg ? { backgroundColor: iconBg } : undefined}
          >
            {icon}
          </div>
        )}
        <div className="menu-item-text">
          <span className="menu-item-label">{label}</span>
          {subtitle && <div className="menu-item-subtitle"><ReactMarkdown>{subtitle}</ReactMarkdown></div>}
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
