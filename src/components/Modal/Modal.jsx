import React, { useRef, useEffect, useReducer } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

export const Modal = ({ isOpen, onClose, onBack, title, children, action }) => {
  const hasBackButton = !!onBack;
  const prevHasBackRef = useRef(null);
  const animationDirectionRef = useRef('none');
  const outgoingContentRef = useRef(null);
  const prevChildrenRef = useRef(children);
  const [, forceRender] = useReducer(x => x + 1, 0);

  // Compute animation direction and capture outgoing content synchronously DURING render
  // This ensures both the animation class and outgoing content are ready on the same render
  if (!isOpen) {
    prevHasBackRef.current = null;
    animationDirectionRef.current = 'none';
    outgoingContentRef.current = null;
  } else if (prevHasBackRef.current === null) {
    // Modal just opened, initialize without animation
    prevHasBackRef.current = hasBackButton;
    animationDirectionRef.current = 'none';
    outgoingContentRef.current = null;
  } else if (prevHasBackRef.current !== hasBackButton) {
    // Transition detected - capture outgoing content and set animation direction
    outgoingContentRef.current = prevChildrenRef.current;
    animationDirectionRef.current = hasBackButton ? 'step-in' : 'step-out';
    prevHasBackRef.current = hasBackButton;
  }

  // Update prev children ref after computing animation state
  prevChildrenRef.current = children;

  const animationDirection = animationDirectionRef.current;
  const outgoingContent = outgoingContentRef.current;

  // Clear animation class and outgoing content after animation completes
  useEffect(() => {
    if (animationDirection !== 'none') {
      const timer = setTimeout(() => {
        animationDirectionRef.current = 'none';
        outgoingContentRef.current = null;
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
        <div className="modal-body-container">
          {/* Outgoing content with exit animation */}
          {outgoingContent && animationDirection !== 'none' && (
            <div className={`modal-body ${animationDirection === 'step-in' ? 'exit-left' : 'exit-right'}`}>
              {outgoingContent}
            </div>
          )}
          {/* Current content with entry animation */}
          <div className={`modal-body ${animationDirection}`}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const ModalField = ({ label, children, style }) => (
  <div className="modal-field" style={style}>
    {label && <label className="modal-label">{label}</label>}
    {children}
  </div>
);
