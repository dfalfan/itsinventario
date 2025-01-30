import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaChartBar, FaUsers, FaLaptop, FaMobileAlt, FaPrint, FaPhoneSquare } from 'react-icons/fa';
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
        <Link 
          to="/smartphones" 
          className={`navbar-item ${location.pathname === '/smartphones' ? 'active' : ''}`}
        >
          <FaMobileAlt className="navbar-icon" />
          <span>Smartphones</span>
        </Link>
        <Link 
          to="/impresoras" 
          className={`navbar-item ${location.pathname === '/impresoras' ? 'active' : ''}`}
        >
          <FaPrint className="navbar-icon" />
          <span>Impresoras</span>
        </Link>
        <Link 
          to="/extensiones" 
          className={`navbar-item ${location.pathname === '/extensiones' ? 'active' : ''}`}
        >
          <FaPhoneSquare className="navbar-icon" />
          <span>Extensiones</span>
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