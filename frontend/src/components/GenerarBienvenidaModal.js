import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import './GenerarBienvenidaModal.css';

const GenerarBienvenidaModal = ({ isOpen, onClose, employee }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    windows: {
      enabled: true,
      username: '',
      password: ''
    },
    email: {
      enabled: true,
      username: '',
      password: ''
    },
    profit: {
      enabled: false,
      username: '',
      password: ''
    },
    fuerzaMovil: {
      enabled: false,
      id: '',
      username: '',
      password: ''
    },
    dispositivoMovil: {
      enabled: false
    },
    pinImpresion: {
      enabled: false,
      pin: ''
    }
  });

  useEffect(() => {
    if (employee) {
      // Generar usuario de Windows basado en el nombre
      const windowsUser = generateWindowsUsername(employee.nombre);
      // Generar correo basado en el nombre
      const emailUser = generateEmailUsername(employee.nombre);

      setFormData(prev => ({
        ...prev,
        windows: {
          ...prev.windows,
          username: windowsUser
        },
        email: {
          ...prev.email,
          username: emailUser
        }
      }));
    }
  }, [employee]);

  const generateWindowsUsername = (nombre) => {
    if (!nombre) return '';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length < 2) return '';
    const firstName = parts[parts.length - 1];
    const firstLetter = firstName.charAt(0);
    const lastName = parts[0];
    return `${firstLetter}${lastName}`.toLowerCase();
  };

  const generateEmailUsername = (nombre) => {
    if (!nombre) return '';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length < 2) return '';
    
    // El formato es nombre.apellido@sura.com.ve
    const firstName = parts[parts.length - 1].toLowerCase();
    const lastName = parts[0].toLowerCase();
    return `${firstName}.${lastName}@sura.com.ve`;
  };

  const handleCheckboxChange = (section) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: !prev[section].enabled
      }
    }));
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dataToSend = {
        ...formData,
        nombre_empleado: employee.nombre
      };
      
      const response = await axios.post('http://192.168.141.50:5000/api/generar-bienvenida', dataToSend, {
        responseType: 'blob'
      });
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bienvenida_${employee.nombre.replace(/\s+/g, '_').toLowerCase()}.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error('Error generando bienvenida:', error);
      setError('Error generando la imagen de bienvenida. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bienvenida-modal-overlay">
      <div className="bienvenida-modal-content">
        <div className="bienvenida-modal-header">
          <h2>Generar Imagen de Bienvenida</h2>
          <button className="bienvenida-close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="bienvenida-modal-body">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Generando imagen de bienvenida...</p>
            </div>
          ) : (
            <div className="bienvenida-form">
              <div className="form-section">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.windows.enabled}
                    onChange={() => handleCheckboxChange('windows')}
                  />
                  Usuario de Windows
                </label>
                {formData.windows.enabled && (
                  <div className="section-inputs">
                    <input
                      type="text"
                      value={formData.windows.username}
                      onChange={(e) => handleInputChange('windows', 'username', e.target.value)}
                      placeholder="Usuario"
                      readOnly
                    />
                    <input
                      type="text"
                      value={formData.windows.password}
                      onChange={(e) => handleInputChange('windows', 'password', e.target.value)}
                      placeholder="Contraseña"
                    />
                  </div>
                )}
              </div>

              <div className="form-section">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.email.enabled}
                    onChange={() => handleCheckboxChange('email')}
                  />
                  Correo Electrónico
                </label>
                {formData.email.enabled && (
                  <div className="section-inputs">
                    <input
                      type="text"
                      value={formData.email.username}
                      onChange={(e) => handleInputChange('email', 'username', e.target.value)}
                      placeholder="Correo"
                      readOnly
                    />
                    <input
                      type="text"
                      value={formData.email.password}
                      onChange={(e) => handleInputChange('email', 'password', e.target.value)}
                      placeholder="Contraseña"
                    />
                  </div>
                )}
              </div>

              <div className="form-section">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.profit.enabled}
                    onChange={() => handleCheckboxChange('profit')}
                  />
                  Perfil de Profit
                </label>
                {formData.profit.enabled && (
                  <div className="section-inputs">
                    <input
                      type="text"
                      value={formData.profit.username}
                      onChange={(e) => handleInputChange('profit', 'username', e.target.value)}
                      placeholder="Usuario"
                    />
                    <input
                      type="text"
                      value={formData.profit.password}
                      onChange={(e) => handleInputChange('profit', 'password', e.target.value)}
                      placeholder="Contraseña"
                    />
                  </div>
                )}
              </div>

              <div className="form-section">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.fuerzaMovil.enabled}
                    onChange={() => handleCheckboxChange('fuerzaMovil')}
                  />
                  App Fuerza Móvil
                </label>
                {formData.fuerzaMovil.enabled && (
                  <div className="section-inputs">
                    <input
                      type="text"
                      value={formData.fuerzaMovil.id}
                      onChange={(e) => handleInputChange('fuerzaMovil', 'id', e.target.value)}
                      placeholder="ID"
                    />
                    <input
                      type="text"
                      value={formData.fuerzaMovil.username}
                      onChange={(e) => handleInputChange('fuerzaMovil', 'username', e.target.value)}
                      placeholder="Usuario"
                    />
                    <input
                      type="text"
                      value={formData.fuerzaMovil.password}
                      onChange={(e) => handleInputChange('fuerzaMovil', 'password', e.target.value)}
                      placeholder="Contraseña"
                    />
                  </div>
                )}
              </div>

              <div className="form-section">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.dispositivoMovil.enabled}
                    onChange={() => handleCheckboxChange('dispositivoMovil')}
                  />
                  Acceso a Dispositivo Móvil
                </label>
              </div>

              <div className="form-section">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.pinImpresion.enabled}
                    onChange={() => handleCheckboxChange('pinImpresion')}
                  />
                  PIN de Impresión
                </label>
                {formData.pinImpresion.enabled && (
                  <div className="section-inputs">
                    <input
                      type="text"
                      value={formData.pinImpresion.pin}
                      onChange={(e) => handleInputChange('pinImpresion', 'pin', e.target.value)}
                      placeholder="PIN"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="error-message">
                  <FaExclamationTriangle />
                  <p>{error}</p>
                </div>
              )}

              <div className="form-actions">
                <button 
                  className="button primary" 
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <FaDownload className="button-icon" />
                  Generar y Descargar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerarBienvenidaModal; 