import React from 'react';
import './ConfirmDialog.css';

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-content">
          {title && <h2 className="confirm-dialog-title">{title}</h2>}
          <p className="confirm-dialog-message">{message}</p>
        </div>
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-button confirm-dialog-button-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-dialog-button confirm-dialog-button-confirm" onClick={onConfirm}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};
