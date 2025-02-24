import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaUser, 
  FaChartBar, 
  FaUsers, 
  FaLaptop, 
  FaMobileAlt, 
  FaPrint, 
  FaSignOutAlt,
  FaNetworkWired,
  FaServer,
  FaTools
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import logo from './logo sura color.png';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="Logo SURA" className="navbar-logo" />
      </div>
      
      <div className="navbar-menu">
        <Link 
          to="/dashboard" 
          className={`navbar-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
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
          <span>Equipos</span>
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
          to="/redes" 
          className={`navbar-item ${location.pathname === '/redes' ? 'active' : ''}`}
        >
          <FaNetworkWired className="navbar-icon" />
          <span>Redes</span>
        </Link>
        <Link 
          to="/servidores" 
          className={`navbar-item ${location.pathname === '/servidores' ? 'active' : ''}`}
        >
          <FaServer className="navbar-icon" />
          <span>Servidores</span>
        </Link>
        <Link 
          to="/mantenimientos" 
          className={`navbar-item maintenance-item ${location.pathname === '/mantenimientos' ? 'active' : ''}`}
        >
          <FaTools className="navbar-icon" />
          <span>Mantenimientos</span>
        </Link>
      </div>

      <div className="navbar-user">
        <button 
          className="user-button" 
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <FaUser className="navbar-icon" />
          <span>{user?.username || 'Usuario'}</span>
        </button>
        {showDropdown && (
          <div className="user-dropdown">
            <div className="user-info">
              <strong>{user?.username}</strong>
              <span className="user-role">{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt className="navbar-icon" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;