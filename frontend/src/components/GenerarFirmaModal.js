import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaDownload, FaExclamationTriangle, FaTimes, FaSpinner } from 'react-icons/fa';
import axiosInstance from '../utils/axiosConfig';
import './Modal.css';

const GenerarFirmaModal = ({ isOpen, onClose, employee }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [numeroCelular, setNumeroCelular] = useState('');

  useEffect(() => {
    console.log('Datos del empleado recibidos:', employee);
    // Validar que los datos necesarios estén presentes
    if (!employee?.nombre || !employee?.cargo) {
      setValidationError('El empleado debe tener nombre y cargo asignados para generar la firma');
    } else {
      setValidationError(null);
    }
    setNumeroCelular(employee?.numero_celular || '');
  }, [employee]);

  const validatePhoneNumber = (number) => {
    const regex = /^(0414|0424|0412|0416|0426)[0-9]{7}$/;
    return regex.test(number);
  };

  const handleNumeroCelularChange = (e) => {
    const value = e.target.value;
    setNumeroCelular(value);
    if (value && !validatePhoneNumber(value)) {
      setValidationError('El número debe comenzar con 0414, 0424, 0412, 0416 o 0426 y tener 11 dígitos');
    } else {
      setValidationError(null);
    }
  };

  const handleGenerarFirma = async () => {
    if (validationError) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Enviando datos para generar firma:', {
        nombre: employee.nombre,
        cargo: employee.cargo,
        extension: employee.extension,
        numero_celular: numeroCelular
      });
      
      const response = await axiosInstance.post('/api/generar-firma', {
        nombre: employee.nombre,
        cargo: employee.cargo,
        extension: employee.extension,
        numero_celular: numeroCelular
      }, {
        responseType: 'blob'
      });
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `firma_${employee.nombre.replace(/\s+/g, '_').toLowerCase()}.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error('Error generando firma:', error);
      setError('Error generando la firma. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Generar Firma de Correo</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Generando firma...</p>
            </div>
          ) : (
            <div className="firma-container">
              <div className="info-preview">
                <p><strong>Nombre:</strong> {employee?.nombre || 'No asignado'}</p>
                <p><strong>Cargo:</strong> {employee?.cargo || 'No asignado'}</p>
                {employee?.extension && (
                  <p><strong>Extensión:</strong> {employee.extension}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="numeroCelular">Número Celular (opcional):</label>
                <input 
                  id="numeroCelular"
                  type="text"
                  value={numeroCelular}
                  onChange={handleNumeroCelularChange}
                  placeholder="Ingrese número celular"
                />
              </div>

              {validationError && (
                <div className="warning-message">
                  <FaExclamationTriangle />
                  <p>{validationError}</p>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <p>{error}</p>
                </div>
              )}

              <button 
                className="button primary" 
                onClick={handleGenerarFirma}
                disabled={loading || validationError}
              >
                <FaEnvelope className="button-icon" />
                Generar y Descargar Firma
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerarFirmaModal; 