import React, { useState, useEffect } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import './Modal.css';

const CreateEmailModal = ({ isOpen, onClose, employee }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [emailUser, setEmailUser] = useState('');
  const [warning, setWarning] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);

  useEffect(() => {
    if (isOpen && employee?.nombre) {
      console.log('Generando sugerencia de correo para:', employee.nombre);
      // Generar correo sugerido basado en el nombre
      const parts = employee.nombre.trim().split(/\s+/);
      console.log('Partes del nombre:', parts);
      
      if (parts.length >= 2) {
        const primerNombre = parts[parts.length - 1].toLowerCase();
        const primerApellido = parts[0].toLowerCase();
        const sugerencia = `${primerNombre}.${primerApellido}`;
        console.log('Sugerencia de correo generada:', sugerencia);
        setEmailUser(sugerencia);
      } else {
        console.warn('El nombre no tiene suficientes partes para generar una sugerencia');
      }
    }
  }, [isOpen, employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);
    setTempPassword(null);
    
    const emailCompleto = `${emailUser}@sura.com.ve`;
    console.log('Intentando crear correo:', emailCompleto);
    console.log('Datos del empleado:', employee);
    
    try {
        console.log('Enviando solicitud al servidor...');
        const response = await axios.post('http://192.168.141.50:5000/api/empleados/actualizar-correos', {
            empleado_id: employee.id,
            correo: emailCompleto
        });
        
        console.log('Respuesta del servidor:', response.data);
        
        if (response.data.google_workspace?.success) {
            setSuccess(true);
            if (response.data.google_workspace?.temp_password) {
                setTempPassword(response.data.google_workspace.temp_password);
            } else {
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        }
        
    } catch (error) {
        console.error('Error completo:', error);
        const errorData = error.response?.data;
        
        if (errorData?.message === 'already exists') {
            setError('Este correo ya existe. Por favor, intente con otro.');
        } else if (errorData?.error?.includes('No hay licencias disponibles')) {
            setError('No hay licencias disponibles en Google Workspace.');
        } else {
            setError(errorData?.error || 'Error al crear el correo electrónico');
        }
        
        if (errorData?.google_workspace?.warning) {
            setWarning(errorData.google_workspace.warning);
        }
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Crear Correo Electrónico</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Creando correo electrónico...</p>
            </div>
          ) : success ? (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <p>Correo electrónico creado exitosamente</p>
              {tempPassword && (
                <div className="temp-password-info">
                  <p>Contraseña temporal:</p>
                  <code>{tempPassword}</code>
                  <small>Por favor, guarde esta contraseña. Se solicitará cambiarla en el primer inicio de sesión.</small>
                </div>
              )}
              <button className="button primary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="create-user-form">
              <div className="form-group">
                <label>Nombre Completo:</label>
                <div className="info-field">{employee?.nombre || 'No disponible'}</div>
              </div>
              
              <div className="form-group">
                <label>
                  <FaEnvelope className="input-icon" /> Correo Electrónico
                </label>
                <div className="email-input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={emailUser}
                    onChange={(e) => setEmailUser(e.target.value.toLowerCase())}
                    required
                    placeholder="nombre.apellido"
                  />
                  <span className="email-domain">@sura.com.ve</span>
                </div>
                <small className="form-text">Este será el correo electrónico del empleado</small>
              </div>

              {warning && (
                <div className="warning-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>{warning}</p>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <p>{error}</p>
                </div>
              )}

              <div className="modal-footer">
                <button type="submit" className="button primary" disabled={loading}>
                  Crear Correo
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEmailModal; 