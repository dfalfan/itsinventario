import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Si está cargando, mostramos nada o un spinner
  if (loading) {
    return null;
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay usuario, mostrar la ruta protegida
  return children;
};

export default PrivateRoute; 