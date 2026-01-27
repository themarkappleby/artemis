import React, { useRef, useEffect, useReducer } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

export const Modal = ({ isOpen, onClose, onBack, title, children, action }) => {
  const hasBackButton = !!onBack;
  const prevHasBackRef = useRef(null);
  const animationDirectionRef = useRef('none');
  const [, forceRender] = useReducer(x => x + 1, 0);

  // Compute animation direction synchronously DURING render (not in effect)
  // This ensures the animation class is applied on the same render as content change
  if (!isOpen) {
    prevHasBackRef.current = null;
    animationDirectionRef.current = 'none';
  } else if (prevHasBackRef.current === null) {
    // Modal just opened, initialize without animation
    prevHasBackRef.current = hasBackButton;
    animationDirectionRef.current = 'none';
  } else if (prevHasBackRef.current !== hasBackButton) {
    // Transition detected - set animation direction immediately
    animationDirectionRef.current = hasBackButton ? 'step-in' : 'step-out';
    prevHasBackRef.current = hasBackButton;
  }

  const animationDirection = animationDirectionRef.current;

  // Clear animation class after animation completes
  useEffect(() => {
    if (animationDirection !== 'none') {
      const timer = setTimeout(() => {
        animationDirectionRef.current = 'none';
        forceRender();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [animationDirection]);

  // Render modal at document.body level using portal to escape transformed ancestors
  return createPortal(
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
            {onBack ? 'Back' : 'Cancel'}
          </button>
          <h2 className="modal-title">{title}</h2>
          {action && (
            <button 
              className="modal-action-button" 
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          )}
        </div>
        <div className={`modal-body ${animationDirection}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export const ModalField = ({ label, children }) => (
  <div className="modal-field">
    {label && <label className="modal-label">{label}</label>}
    {children}
  </div>
);
