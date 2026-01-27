import React, { useState, useEffect } from 'react';
import './Modal.css';

export const Modal = ({ isOpen, onClose, onBack, title, children, action }) => {
  const [animationDirection, setAnimationDirection] = useState('none');
  const [prevOnBack, setPrevOnBack] = useState(null);

  // Detect when stepping in or out based on onBack prop changes
  useEffect(() => {
    if (isOpen) {
      if (onBack && !prevOnBack) {
        // Stepped in - slide from right
        setAnimationDirection('step-in');
      } else if (!onBack && prevOnBack) {
        // Stepped back - slide from left
        setAnimationDirection('step-out');
      }
      setPrevOnBack(onBack);
      
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setAnimationDirection('none');
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setPrevOnBack(null);
      setAnimationDirection('none');
    }
  }, [onBack, isOpen, prevOnBack]);

  return (
    <div 
      className={`modal-overlay ${isOpen ? 'modal-open' : ''}`} 
      onClick={onBack || onClose}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <button className="modal-close-button" onClick={onBack || onClose}>
            {onBack ? '← Back' : 'Cancel'}
          </button>
          <h2 className="modal-title">{title}</h2>
          {action ? (
            <button 
              className="modal-action-button" 
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ) : (
            <div className="modal-header-spacer"></div>
          )}
        </div>
        <div className={`modal-body ${animationDirection}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const ModalField = ({ label, children }) => (
  <div className="modal-field">
    {label && <label className="modal-label">{label}</label>}
    {children}
  </div>
);
