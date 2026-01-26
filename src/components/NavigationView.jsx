import React, { useRef, useEffect } from 'react';
import './NavigationView.css';

export const NavigationView = ({ title, onBack, children, scrollPosition, onScrollChange, viewKey, actionIcon, onAction, rightIcon = 'star' }) => {
  const contentRef = useRef(null);

  // Restore scroll position when component mounts or viewKey changes
  useEffect(() => {
    if (contentRef.current && scrollPosition !== undefined) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [viewKey]);

  // Save scroll position on scroll
  const handleScroll = () => {
    if (contentRef.current && onScrollChange) {
      onScrollChange(contentRef.current.scrollTop);
    }
  };

  return (
    <div className="navigation-view">
      <div className="navigation-bar">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            <svg width="13" height="21" viewBox="0 0 13 21" fill="none">
              <path d="M11 2L2 10.5L11 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back</span>
          </button>
        )}
        <h1 className="navigation-title">{title}</h1>
        {onAction && (
          <button className={`action-button ${actionIcon ? 'active' : ''}`} onClick={onAction}>
            {rightIcon === 'plus' ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.245 7.455L18 8.265L14 12.145L15.09 18L10 15.455L4.91 18L6 12.145L2 8.265L7.755 7.455L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        )}
      </div>
      <div 
        className="navigation-content" 
        ref={contentRef}
        onScroll={handleScroll}
      >
        {children}
      </div>
    </div>
  );
};
