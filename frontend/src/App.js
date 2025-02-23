import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardView from './components/DashboardView';
import AssetsView from './components/AssetsView';
import EmployeesView from './components/EmployeesView';
import SmartphonesView from './components/SmartphonesView';
import PrintersView from './components/PrintersView';
import ExtensionsView from './components/ExtensionsView';
import ExtensionsDirectoryView from './components/ExtensionsDirectoryView';
import LoginView from './components/LoginView';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Mapeo de rutas a títulos
const ROUTE_TITLES = {
  '/extensions-directory': 'Listado de Extensiones - SURA',
  '/login': 'Iniciar Sesión - SURA',
  '/dashboard': 'Dashboard - SURA'
};

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();

  React.useEffect(() => {
    // Actualizar el título basado en la ruta actual
    document.title = ROUTE_TITLES[location.pathname] || 'ITS Inventario - SURA';
  }, [location]);

  const shouldShowNavbar = !['/extensions-directory', '/login'].includes(location.pathname);

  // Redirigir a dashboard si el usuario está autenticado y está en la ruta raíz
  if (location.pathname === '/' && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirigir a login si el usuario no está autenticado y está en la ruta raíz
  if (location.pathname === '/' && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <div className={`App ${shouldShowNavbar ? '' : 'no-navbar'}`}>
        {shouldShowNavbar && <Navbar />}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route path="/extensions-directory" element={<ExtensionsDirectoryView />} />
            
            {/* Rutas Protegidas */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardView />
              </PrivateRoute>
            } />
            <Route path="/empleados" element={
              <PrivateRoute>
                <EmployeesView />
              </PrivateRoute>
            } />
            <Route path="/activos" element={
              <PrivateRoute>
                <AssetsView />
              </PrivateRoute>
            } />
            <Route path="/smartphones" element={
              <PrivateRoute>
                <SmartphonesView />
              </PrivateRoute>
            } />
            <Route path="/impresoras" element={
              <PrivateRoute>
                <PrintersView />
              </PrivateRoute>
            } />
            <Route path="/extensiones" element={
              <PrivateRoute>
                <ExtensionsView />
              </PrivateRoute>
            } />

            {/* Ruta por defecto */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;