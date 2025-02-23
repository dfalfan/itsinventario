import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import './Modal.css';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, itemInfo }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title || 'Confirmar Eliminación'}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="warning-icon">
            <FaExclamationTriangle size={48} color="#f0ad4e" />
          </div>
          <p className="confirmation-message">
            {message || '¿Está seguro que desea eliminar este elemento?'}
          </p>
          {itemInfo && (
            <div className="item-info">
              {Object.entries(itemInfo).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {value || 'No especificado'}</p>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="button secondary"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="button danger"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal; 