import React from 'react';
import { NavLink } from 'react-router-dom';
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
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 
            `navbar-item ${isActive ? 'active' : ''}`
          }
        >
          <FaChartBar className="navbar-icon" />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/empleados" 
          className={({ isActive }) => 
            `navbar-item ${isActive ? 'active' : ''}`
          }
        >
          <FaUsers className="navbar-icon" />
          <span>Empleados</span>
        </NavLink>
        <NavLink 
          to="/activos" 
          className={({ isActive }) => 
            `navbar-item ${isActive ? 'active' : ''}`
          }
        >
          <FaLaptop className="navbar-icon" />
          <span>Activos</span>
        </NavLink>
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