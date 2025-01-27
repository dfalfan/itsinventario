import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AssetsView from './components/AssetsView';
import EmployeesView from './components/EmployeesView';
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;