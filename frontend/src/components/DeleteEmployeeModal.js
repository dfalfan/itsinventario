import React, { useState, useEffect } from 'react';
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

  // Establecer opciones por defecto basadas en el empleado
  useEffect(() => {
    if (employee) {
      setOptions(prev => ({
        ...prev,
        unassignAsset: !!employee.equipo_asignado,
        unassignSmartphone: !!employee.smartphone_asignado,
        disableADUser: !!employee.correo,
        removeADComputer: !!employee.equipo_asignado,
        deleteEmail: false // Siempre falso por ahora
      }));
    }
  }, [employee]);

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
      const response = await fetch(`http://192.168.141.50:5000/api/empleados/${employee.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al procesar la solicitud');
      }

      const data = await response.json();
      onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="delete-asset-modal delete-employee-modal">
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
          {employee.equipo_asignado && (
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={options.unassignAsset}
                onChange={() => handleOptionChange('unassignAsset')}
              />
              Desasignar equipo asignado
            </label>
          )}

          {employee.smartphone_asignado && (
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={options.unassignSmartphone}
                onChange={() => handleOptionChange('unassignSmartphone')}
              />
              Desasignar smartphone asignado
            </label>
          )}

          {employee.correo && (
            <>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={options.disableADUser}
                  onChange={() => handleOptionChange('disableADUser')}
                />
                Deshabilitar usuario AD
              </label>

              {employee.equipo_asignado && (
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={options.removeADComputer}
                    onChange={() => handleOptionChange('removeADComputer')}
                  />
                  Eliminar equipo asignado de AD
                </label>
              )}

              <label className="checkbox-option" title="Funcionalidad no disponible">
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                />
                Eliminar correo (No disponible)
              </label>
            </>
          )}
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
    nombre_completo: PropTypes.string.isRequired,
    equipo_asignado: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    smartphone_asignado: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    correo: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default DeleteEmployeeModal; 