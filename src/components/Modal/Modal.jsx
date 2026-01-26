import React from 'react';
import './Modal.css';

export const Modal = ({ isOpen, onClose, title, children, footer, fullScreen = false }) => {
  // For non-fullscreen modals, use simple conditional rendering
  if (!fullScreen && !isOpen) return null;

  // For fullscreen modals, always render but control visibility with CSS
  if (fullScreen) {
    return (
      <div 
        className={`modal-overlay modal-fullscreen ${isOpen ? 'modal-open' : ''}`} 
        onClick={onClose}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        <div 
          className="modal-content modal-fullscreen-content" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <button className="modal-close-button" onClick={onClose}>
              Cancel
            </button>
            <h2 className="modal-title">{title}</h2>
            <div className="modal-header-spacer"></div>
          </div>
          <div className="modal-body">
            {children}
          </div>
          {footer && (
            <div className="modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
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

export const ModalButton = ({ onClick, disabled, variant = 'default', children }) => {
  const className = `modal-button ${variant === 'cancel' ? 'modal-cancel' : ''} ${variant === 'create' ? 'modal-create' : ''}`;
  return (
    <button 
      className={className} 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
