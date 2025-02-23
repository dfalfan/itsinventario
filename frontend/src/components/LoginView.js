import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginView.css';

const LoginView = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    general: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  // Si ya hay un usuario autenticado, redirigir a dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors = {
      username: '',
      password: '',
      general: ''
    };

    if (!credentials.username.trim()) {
      newErrors.username = 'El usuario es requerido';
    }

    if (!credentials.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(credentials.username, credentials.password);
      // La redirección se maneja en el useEffect
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error.message || 'Error al iniciar sesión. Por favor, intente nuevamente.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/logo_sura.png" alt="Logo SURA" className="login-logo" />
        <h2>ITS Inventario</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              disabled={isLoading}
              autoComplete="username"
            />
            {errors.username && <div className="field-error">{errors.username}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>
          {errors.general && <div className="error-message">{errors.general}</div>}
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView; 