import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaChartBar, FaUsers, FaLaptop } from 'react-icons/fa';
import logo from './logo sura color.png';
import './Navbar.css';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="Logo SURA" className="navbar-logo" />
      </div>
      
      <div className="navbar-menu">
        <Link 
          to="/" 
          className={`navbar-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <FaChartBar className="navbar-icon" />
          <span>Dashboard</span>
        </Link>
        
        <Link 
          to="/empleados" 
          className={`navbar-item ${location.pathname === '/empleados' ? 'active' : ''}`}
        >
          <FaUsers className="navbar-icon" />
          <span>Empleados</span>
        </Link>
        <Link 
          to="/activos" 
          className={`navbar-item ${location.pathname === '/activos' ? 'active' : ''}`}
        >
          <FaLaptop className="navbar-icon" />
          <span>Activos</span>
        </Link>
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