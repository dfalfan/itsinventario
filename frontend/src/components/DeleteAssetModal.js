import React, { useState } from 'react';
import './DeleteAssetModal.css';
import { FaTools, FaTrash, FaExclamationTriangle, FaCheck, FaTrashAlt } from 'react-icons/fa';
import PropTypes from 'prop-types';
import axiosInstance from '../utils/axiosConfig';

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

      // Ya no intentamos desasignar manualmente, el backend lo hace automáticamente
      
      if (selectedState === 'ELIMINAR') {
        // Eliminar definitivamente el activo
        const response = await axiosInstance.post(`/api/activos/${asset.id}/desincorporar`);
        
        if (!response.data || response.status !== 200) {
          throw new Error('Error al eliminar el activo');
        }
      } else {
        // Para todos los demás estados, usamos el endpoint de cambiar estado
        const response = await axiosInstance.post(`/api/activos/${asset.id}/cambiar-estado`, {
          estado: selectedState
        });
        
        if (!response.data || response.status !== 200) {
          throw new Error(`Error al cambiar el estado del activo a ${selectedState}`);
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al procesar la solicitud');
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
              value="DISPONIBLE"
              checked={selectedState === 'DISPONIBLE'}
              onChange={(e) => setSelectedState(e.target.value)}
            />
            <FaCheck className="option-icon" />
            <span>Hacer Disponible</span>
          </label>

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
            <span>Desincorporar</span>
          </label>

          <label className="radio-option">
            <input
              type="radio"
              value="ELIMINAR"
              checked={selectedState === 'ELIMINAR'}
              onChange={(e) => setSelectedState(e.target.value)}
            />
            <FaTrashAlt className="option-icon" />
            <span>Eliminar Definitivamente</span>
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
            className={`confirm-button ${
              selectedState === 'ELIMINAR' ? 'danger' : 
              selectedState === 'DESINCORPORADO' ? 'warning' :
              selectedState === 'REPARACION' ? 'warning' : 
              'success'
            }`}
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