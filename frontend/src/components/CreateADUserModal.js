import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import axiosInstance from '../utils/axiosConfig';
import './Modal.css';

const CreateADUserModal = ({ isOpen, onClose, employee }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (isOpen && employee?.nombre) {
      // Generar nombre de usuario sugerido
      const parts = employee.nombre.trim().split(/\s+/);
      if (parts.length >= 2) {
        const firstName = parts[parts.length - 1];
        const lastName = parts[0];
        setUsername(`${firstName.charAt(0)}${lastName}`.toLowerCase());
      }
    }
  }, [isOpen, employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post('/api/ad/create-user', {
        username,
        fullName: employee?.nombre || '',
        departamento: employee?.departamento,
        cargo: employee?.cargo || '',
        extension: employee?.extension || ''
      });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error creando usuario:', error);
      setError(error.response?.data?.error || 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Crear Usuario AD</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Creando usuario...</p>
            </div>
          ) : success ? (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <p>Usuario creado exitosamente</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="create-user-form">
              <div className="form-group">
                <label>Nombre Completo:</label>
                <div className="info-field">{employee?.nombre || 'No disponible'}</div>
              </div>
              
              <div className="form-group">
                <label>Departamento:</label>
                <div className="info-field">{employee?.departamento || 'No disponible'}</div>
              </div>
              
              <div className="form-group">
                <label>Cargo:</label>
                <div className="info-field">{employee?.cargo || 'No disponible'}</div>
              </div>
              
              <div className="form-group">
                <label>Nombre de Usuario Sugerido:</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                  placeholder="Nombre de usuario"
                />
                <small className="form-text">Este será el nombre de usuario en Active Directory</small>
              </div>

              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <p>{error}</p>
                </div>
              )}

              <div className="modal-footer">
                <button type="submit" className="button primary" disabled={loading}>
                  Crear Usuario
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

export default CreateADUserModal; 