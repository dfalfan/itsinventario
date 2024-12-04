import React, { useState } from 'react';
import './DeleteAssetModal.css';

function DeleteAssetModal({ asset, onClose, onDelete }) {
  const [selectedState, setSelectedState] = useState('');

  const handleDelete = async () => {
    if (!selectedState) {
      return;
    }
    await onDelete(asset.id, selectedState);
    onClose();
  };

  return (
    <div className="delete-asset-modal-overlay">
      <div className="delete-asset-modal-content">
        <h2>Eliminar Activo</h2>
        <p>¿Qué desea hacer con el activo <strong>{asset.nombre_equipo}</strong>?</p>
        
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="REPARACION"
              checked={selectedState === 'REPARACION'}
              onChange={(e) => setSelectedState(e.target.value)}
            />
            Enviar a Mantenimiento
          </label>
          
          <label>
            <input
              type="radio"
              value="DESINCORPORADO"
              checked={selectedState === 'DESINCORPORADO'}
              onChange={(e) => setSelectedState(e.target.value)}
            />
            Desincorporar Equipo
          </label>
        </div>

        <div className="modal-buttons">
          <button 
            className="delete-button"
            onClick={handleDelete}
            disabled={!selectedState}
          >
            Confirmar
          </button>
          <button 
            className="cancel-button"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteAssetModal; 