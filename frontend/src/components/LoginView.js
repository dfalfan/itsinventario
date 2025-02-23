import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock, FaSpinner } from 'react-icons/fa';
import logo from './logo sura color.png';
import './LoginView.css';

const LoginView = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!credentials.username.trim()) {
      newErrors.username = 'El usuario es requerido';
    }
    if (!credentials.password) {
      newErrors.password = 'La contraseña es requerida';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(credentials.username, credentials.password);
    } catch (error) {
      setErrors({
        general: error.message || 'Error al iniciar sesión'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-view">
        <div className="login-container">
          <div className="login-box">
            <div className="login-header">
              <img src={logo} alt="Logo SURA" className="login-logo" />
              <span className="app-name">Inventario ITS</span>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <div className="input-icon-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Usuario"
                    value={credentials.username}
                    onChange={handleChange}
                    className={errors.username ? 'error' : ''}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>

              <div className="form-group">
                <div className="input-icon-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={credentials.password}
                    onChange={handleChange}
                    className={errors.password ? 'error' : ''}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              {errors.general && (
                <div className="error-alert">
                  <p>{errors.general}</p>
                </div>
              )}

              <button 
                type="submit" 
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="spinner" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView; 