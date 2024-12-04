import React, { useState } from 'react';
import './DeleteAssetModal.css';
import PropTypes from 'prop-types';

function DeleteAssetModal({ asset, onClose, onDelete, onSuccess }) {
  const [selectedState, setSelectedState] = useState('');

  const handleDelete = async () => {
    if (!selectedState) {
      return;
    }

    try {
      // Desasignar el activo del empleado
      const unassignResponse = await fetch(`http://localhost:5000/api/activos/${asset.id}/desasignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!unassignResponse.ok) {
        throw new Error('Error al desasignar el activo');
      }

      // Cambiar el estado del activo
      await onDelete(asset.id, selectedState);
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
    }
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

DeleteAssetModal.propTypes = {
  asset: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default DeleteAssetModal; 