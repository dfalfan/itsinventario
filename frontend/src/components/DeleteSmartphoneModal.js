import React, { useState } from 'react';
import './DeleteAssetModal.css';  // Reutilizamos los estilos del modal de activos
import { FaTools, FaTrash, FaExclamationTriangle, FaCheck, FaTrashAlt } from 'react-icons/fa';
import PropTypes from 'prop-types';

function DeleteSmartphoneModal({ smartphone, onClose, onSuccess }) {
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

      // Si el smartphone está asignado, primero lo desasignamos
      if (smartphone.empleado_id) {
        const unassignResponse = await fetch(`http://192.168.141.50:5000/api/smartphones/${smartphone.id}/desasignar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!unassignResponse.ok) {
          throw new Error('Error al desasignar el smartphone');
        }
      }

      if (selectedState === 'ELIMINAR') {
        // Eliminar definitivamente el smartphone
        const response = await fetch(`http://192.168.141.50:5000/api/smartphones/${smartphone.id}/desincorporar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Error al eliminar el smartphone');
        }
      } else {
        // Para todos los demás estados, usamos el endpoint de cambiar estado
        const response = await fetch(`http://192.168.141.50:5000/api/smartphones/${smartphone.id}/cambiar-estado`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ estado: selectedState })
        });

        if (!response.ok) {
          throw new Error(`Error al cambiar el estado del smartphone a ${selectedState}`);
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
          Cambiar Estado del Smartphone
        </h2>
        
        <p className="modal-description">
          ¿Qué desea hacer con el smartphone <strong>{smartphone.marca} {smartphone.modelo}</strong>?
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

DeleteSmartphoneModal.propTypes = {
  smartphone: PropTypes.shape({
    id: PropTypes.number.isRequired,
    marca: PropTypes.string.isRequired,
    modelo: PropTypes.string.isRequired,
    empleado_id: PropTypes.number
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default DeleteSmartphoneModal; 