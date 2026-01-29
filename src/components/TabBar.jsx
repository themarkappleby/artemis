import React from 'react';
import './TabBar.css';

export const TabBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'explore', label: 'The Forge', icon: '🧭' },
    { id: 'character', label: 'Character', icon: '⚔️' },
    { id: 'moves', label: 'Moves', icon: '📖' },
    { id: 'oracle', label: 'Oracle', icon: '🔮' }
  ];

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
