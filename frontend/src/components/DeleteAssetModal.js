import React, { useState } from 'react';
import './DeleteAssetModal.css';
import { FaTools, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import PropTypes from 'prop-types';

function DeleteAssetModal({ asset, onClose, onSuccess }) {
  const [selectedState, setSelectedState] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStateChange = async () => {
    if (!selectedState) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Si el activo está asignado, primero lo desasignamos
      if (asset.empleado_id) {
        const unassignResponse = await fetch(`http://192.168.141.50:5000/api/activos/${asset.id}/desasignar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!unassignResponse.ok) {
          throw new Error('Error al desasignar el activo');
        }
      }

      if (selectedState === 'REPARACION') {
        // Actualizar estado a REPARACION usando POST
        const response = await fetch(`http://192.168.141.50:5000/api/activos/${asset.id}/cambiar-estado`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ estado: 'REPARACION' })
        });

        if (!response.ok) {
          throw new Error('Error al enviar el activo a reparación');
        }
      } else if (selectedState === 'DESINCORPORADO') {
        // Desincorporar el activo usando POST
        const response = await fetch(`http://192.168.141.50:5000/api/activos/${asset.id}/desincorporar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Error al desincorporar el activo');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-asset-modal" onClick={e => e.stopPropagation()}>
        <h2>
          <FaExclamationTriangle className="warning-icon" />
          Cambiar Estado del Activo
        </h2>
        
        <p className="modal-description">
          ¿Qué desea hacer con el activo <strong>{asset.nombre_equipo}</strong>?
        </p>
        
        <div className="radio-options">
          <label className="radio-option">
            <input
              type="radio"
              value="REPARACION"
              checked={selectedState === 'REPARACION'}
              onChange={(e) => setSelectedState(e.target.value)}
            />
            <FaTools className="option-icon" />
            <span>Enviar a Mantenimiento</span>
          </label>
          
          <label className="radio-option">
            <input
              type="radio"
              value="DESINCORPORADO"
              checked={selectedState === 'DESINCORPORADO'}
              onChange={(e) => setSelectedState(e.target.value)}
            />
            <FaTrash className="option-icon" />
            <span>Desincorporar Equipo</span>
          </label>
        </div>

        {error && (
          <div className="error-message">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button 
            className="cancel-button"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            className={`confirm-button ${selectedState === 'DESINCORPORADO' ? 'danger' : 'warning'}`}
            onClick={handleStateChange}
            disabled={!selectedState || loading}
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

DeleteAssetModal.propTypes = {
  asset: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nombre_equipo: PropTypes.string.isRequired,
    empleado_id: PropTypes.number
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default DeleteAssetModal; 