import React from 'react';
import './MenuGroup.css';

export const MenuGroup = ({ title, children }) => {
  return (
    <div className="menu-group">
      {title && <div className="menu-group-header">{title}</div>}
      <div className="menu-group-items">
        {children}
      </div>
    </div>
  );
};
