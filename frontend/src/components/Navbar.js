import React from 'react';
import { FaUser, FaChartBar, FaUsers, FaLaptop } from 'react-icons/fa';
import logoSura from './logo sura color.png';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img 
          src={logoSura}
          alt="Sura Logo" 
          className="navbar-logo"
        />
      </div>
      
      <div className="navbar-menu">
        <a href="/dashboard" className="navbar-item">
          <FaChartBar className="navbar-icon" />
          <span>Dashboard</span>
        </a>
        <a href="/activos" className="navbar-item">
          <FaLaptop className="navbar-icon" />
          <span>Activos</span>
        </a>
        <a href="/empleados" className="navbar-item active">
          <FaUsers className="navbar-icon" />
          <span>Empleados</span>
        </a>
      </div>

      <div className="navbar-user">
        <button className="user-button">
          <FaUser className="navbar-icon" />
          <span>Usuario</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;