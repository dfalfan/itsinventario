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
    <div className="auth-page">
      <div className="auth-view">
        <div className="auth-container">
          <div className="auth-box">
            <div className="auth-header">
              <img src={logo} alt="Logo SURA" className="auth-logo" />
              <span className="auth-app-name">Inventario ITS</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-group">
                <div className="auth-input-wrapper">
                  <FaUser className="auth-input-icon" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Usuario"
                    value={credentials.username}
                    onChange={handleChange}
                    className={errors.username ? 'auth-input auth-error' : 'auth-input'}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
                {errors.username && <span className="auth-error-message">{errors.username}</span>}
              </div>

              <div className="auth-form-group">
                <div className="auth-input-wrapper">
                  <FaLock className="auth-input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={credentials.password}
                    onChange={handleChange}
                    className={errors.password ? 'auth-input auth-error' : 'auth-input'}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && <span className="auth-error-message">{errors.password}</span>}
              </div>

              {errors.general && (
                <div className="auth-error-alert">
                  <p>{errors.general}</p>
                </div>
              )}

              <button 
                type="submit" 
                className="auth-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="auth-spinner" />
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