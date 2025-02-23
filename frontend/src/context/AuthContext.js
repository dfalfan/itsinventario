import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = 'http://192.168.141.50:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Verificar el token al cargar la aplicación
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          console.log('Verificando token...');
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            console.log('Token válido, usuario:', data.user);
          } else {
            console.log('Token inválido, cerrando sesión');
            logout();
          }
        } catch (error) {
          console.error('Error al verificar el token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (username, password) => {
    try {
      console.log('Intentando login con:', { username });
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      console.log('Respuesta del servidor:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error de login:', error);
        throw new Error(error.message || 'Error al iniciar sesión');
      }

      const data = await response.json();
      console.log('Login exitoso:', data);
      
      // Guardar el token en localStorage
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);

      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    console.log('Sesión cerrada');
  };

  // Interceptor para añadir el token a todas las peticiones
  const authFetch = async (url, options = {}) => {
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
      logout();
      throw new Error('Sesión expirada');
    }

    return response;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 