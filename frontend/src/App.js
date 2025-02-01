import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AssetsView from './components/AssetsView';
import EmployeesView from './components/EmployeesView';
import SmartphonesView from './components/SmartphonesView';
import PrintersView from './components/PrintersView';
import ExtensionsView from './components/ExtensionsView';
import ExtensionsDirectoryView from './components/ExtensionsDirectoryView';
import './App.css';

// Mapeo de rutas a títulos
const ROUTE_TITLES = {
  '/extensions-directory': 'Listado de Extensiones - SURA'
};

function AppContent() {
  const location = useLocation();

  React.useEffect(() => {
    // Actualizar el título basado en la ruta actual
    document.title = ROUTE_TITLES[location.pathname] || 'ITS Inventario - SURA';
  }, [location]);

  return (
    <div className="app-container">
      <div className={`App ${location.pathname === '/extensions-directory' ? 'no-navbar' : ''}`}>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/empleados" element={<EmployeesView />} />
            <Route path="/activos" element={<AssetsView />} />
            <Route path="/smartphones" element={<SmartphonesView />} />
            <Route path="/impresoras" element={<PrintersView />} />
            <Route path="/extensiones" element={<ExtensionsView />} />
            <Route path="/extensions-directory" element={<ExtensionsDirectoryView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;