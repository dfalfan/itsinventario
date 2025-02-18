import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import './DeleteAssetModal.css';

const DeleteEmployeeModal = ({ employee, onClose, onConfirm }) => {
  const [options, setOptions] = useState({
    unassignAsset: false,
    unassignSmartphone: false,
    disableADUser: false,
    removeADComputer: false,
    deleteEmail: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOptionChange = (option) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm(options);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="delete-asset-modal">
        <div className="modal-header">
          <FaExclamationTriangle className="warning-icon" />
          <h2>Confirmar Egreso de Empleado</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-description">
          <p>¿Confirmas el egreso de <strong>{employee.nombre_completo}</strong>?</p>
          <p>Selecciona las acciones a realizar:</p>
        </div>

        <div className="options-container">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={options.unassignAsset}
              onChange={() => handleOptionChange('unassignAsset')}
            />
            Desasignar equipo en caso de tenerlo
          </label>

          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={options.unassignSmartphone}
              onChange={() => handleOptionChange('unassignSmartphone')}
            />
            Desasignar smartphone en caso de tenerlo
          </label>

          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={options.disableADUser}
              onChange={() => handleOptionChange('disableADUser')}
            />
            Deshabilitar usuario AD
          </label>

          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={options.removeADComputer}
              onChange={() => handleOptionChange('removeADComputer')}
            />
            Eliminar equipo asignado de AD
          </label>

          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={options.deleteEmail}
              onChange={() => handleOptionChange('deleteEmail')}
            />
            Eliminar correo
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-buttons">
          <button 
            className="cancel-button" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            className="confirm-button warning"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Confirmar Egreso'}
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteEmployeeModal.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nombre_completo: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default DeleteEmployeeModal; 