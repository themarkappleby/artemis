import React, { useRef, useEffect } from 'react';
import './NavigationView.css';

export const NavigationView = ({ title, onBack, children, scrollPosition, onScrollChange, viewKey }) => {
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
