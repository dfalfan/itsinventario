import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AssetsView from './components/AssetsView';
import EmployeesView from './components/EmployeesView';
import SmartphonesView from './components/SmartphonesView';
import PrintersView from './components/PrintersView';
import ExtensionsView from './components/ExtensionsView';
import ExtensionsDirectoryView from './components/ExtensionsDirectoryView';
import './App.css';

function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/extensions-directory';

  return (
    <div className="App">
      {showNavbar && <Navbar />}
      <main className={`main-content ${!showNavbar ? 'no-navbar' : ''}`}>
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
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;