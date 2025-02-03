import React, { useState, useEffect } from 'react';
import { FaUsers, FaDesktop, FaUserShield, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import './DomainStats.css';

function DomainStats() {
  const [domainStats, setDomainStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDomainStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://192.168.141.50:5000/api/domain/stats');
        if (!response.ok) throw new Error('Error al cargar estadísticas del dominio');
        const data = await response.json();
        
        // Validar que los datos estén completos antes de mostrarlos
        if (!data.users || !data.computers || !data.groups) {
          throw new Error('Datos incompletos del dominio');
        }
        
        // Validar específicamente los datos de equipos inactivos
        if (!data.computers.inactive || !Array.isArray(data.computers.inactive)) {
          throw new Error('Datos de equipos inactivos no disponibles');
        }
        
        setDomainStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDomainStats();
  }, []);

  if (loading) return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p>Cargando estadísticas del dominio...</p>
      <small>Esto puede tomar unos momentos mientras se procesan los datos del Active Directory</small>
    </div>
  );
  if (error) return <div className="error">{error}</div>;
  if (!domainStats) return null;

  return (
    <div className="domain-stats">
      <h2>Estadísticas del Dominio</h2>
      
      <div className="domain-stats-grid">
        {/* Estadísticas de Usuarios */}
        <div className="domain-card">
          <div className="domain-card-header">
            <FaUsers className="domain-icon" />
            <h3>Usuarios del Dominio</h3>
          </div>
          <div className="domain-card-content">
            <div className="stat-item">
              <span>Total de Usuarios</span>
              <strong>{domainStats.users.total}</strong>
            </div>
            <div className="stat-item">
              <div className="stat-with-icon">
                <FaCheckCircle className="status-icon active" />
                <span>Usuarios Activos</span>
              </div>
              <strong>{domainStats.users.active}</strong>
            </div>
            <div className="stat-item">
              <div className="stat-with-icon">
                <FaTimesCircle className="status-icon disabled" />
                <span>Usuarios Deshabilitados</span>
              </div>
              <strong>{domainStats.users.disabled}</strong>
            </div>
            <div className="stat-item">
              <span>Porcentaje Activos</span>
              <strong>{domainStats.users.activePercentage}%</strong>
            </div>
          </div>
        </div>

        {/* Estadísticas de Equipos */}
        <div className="domain-card">
          <div className="domain-card-header">
            <FaDesktop className="domain-icon" />
            <h3>Equipos en el Dominio</h3>
          </div>
          <div className="domain-card-content">
            <div className="stat-item">
              <span>Total de Equipos</span>
              <strong>{domainStats.computers.total}</strong>
            </div>
            <div className="os-distribution">
              <h4>Distribución por Sistema Operativo</h4>
              {Object.entries(domainStats.computers.byOperatingSystem).map(([os, count]) => (
                <div key={os} className="stat-item">
                  <span>{os}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estadísticas de Grupos */}
        <div className="domain-card">
          <div className="domain-card-header">
            <FaUserShield className="domain-icon" />
            <h3>Grupos de Seguridad</h3>
          </div>
          <div className="domain-card-content">
            <div className="stat-item">
              <span>Total de Grupos</span>
              <strong>{domainStats.groups.total}</strong>
            </div>
            <div className="top-groups">
              <h4>Grupos con más Miembros</h4>
              {domainStats.groups.topByMembers.map((group, index) => (
                <div key={index} className="stat-item">
                  <span>{group.name}</span>
                  <strong>{group.members} miembros</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Equipos Inactivos */}
        <div className="domain-card">
          <div className="domain-card-header">
            <FaClock className="domain-icon" />
            <h3>Equipos Inactivos</h3>
          </div>
          <div className="domain-card-content">
            <div className="inactive-computers">
              <h4>Equipos con Mayor Tiempo sin Actividad</h4>
              {domainStats.computers.inactive.map((computer, index) => (
                <div key={index} className="stat-item">
                  <div className="computer-info">
                    <span>{computer.name}</span>
                    <small>Último inicio: {computer.lastLogon}</small>
                  </div>
                  <strong>{computer.daysInactive} días</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DomainStats; 