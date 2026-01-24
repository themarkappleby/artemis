import React from 'react';
import './Modal.css';

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

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
