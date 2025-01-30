import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AssetsView from './components/AssetsView';
import EmployeesView from './components/EmployeesView';
import SmartphonesView from './components/SmartphonesView';
import PrintersView from './components/PrintersView';
import ExtensionsView from './components/ExtensionsView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/empleados" element={<EmployeesView />} />
            <Route path="/activos" element={<AssetsView />} />
            <Route path="/smartphones" element={<SmartphonesView />} />
            <Route path="/impresoras" element={<PrintersView />} />
            <Route path="/extensiones" element={<ExtensionsView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;