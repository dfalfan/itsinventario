import React, { useState, useEffect } from 'react';
import { FaUsers, FaDesktop, FaUserShield, FaCheckCircle, FaTimesCircle, FaClock, FaLock, FaShieldAlt, FaHistory, FaServer, FaExclamationTriangle } from 'react-icons/fa';
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

        {/* Equipos sin Actividad */}
        <div className="domain-card">
          <div className="domain-card-header">
            <FaClock className="domain-icon" />
            <h3>Equipos sin Actividad</h3>
          </div>
          <div className="domain-card-content">
            <div className="stat-item total-inactive">
              <span>Total Equipos Inactivos</span>
              <strong className={domainStats.computers.security[0].critical ? 'critical' : ''}>
                {domainStats.computers.security[0].count} equipos
              </strong>
              <small>Equipos sin actividad por más de 30 días</small>
            </div>
            <div className="inactive-computers">
              <h4>Top 5 Equipos con Mayor Tiempo sin Actividad</h4>
              {domainStats.computers.inactive.map((computer, index) => (
                <div key={index} className="stat-item">
                  <div className="computer-info">
                    <span>{computer.name}</span>
                    <small>Último inicio: {computer.lastLogon}</small>
                  </div>
                  <strong className={computer.daysInactive > 90 ? 'critical' : ''}>
                    {computer.daysInactive} días
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grupos de Seguridad */}
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

        {/* Contraseñas por Expirar */}
        <div className="domain-card">
          <div className="domain-card-header">
            <FaLock className="domain-icon" />
            <h3>Contraseñas por Expirar</h3>
          </div>
          <div className="domain-card-content">
            {domainStats.users.passwordsToExpire?.length > 0 ? (
              <div className="passwords-list">
                {domainStats.users.passwordsToExpire
                  .sort((a, b) => a.daysUntilExpire - b.daysUntilExpire)
                  .map((user, index) => (
                    <div key={index} className="stat-item">
                      <span>{user.name.replace('@sura.com.ve', '@sura.corp')}</span>
                      <strong className={user.daysUntilExpire <= 15 ? 'critical' : ''}>
                        {user.daysUntilExpire} días
                      </strong>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="no-data">No hay contraseñas próximas a expirar</div>
            )}
          </div>
        </div>

        {/* Estado de Servicios */}
        <div className="domain-card">
          <div className="domain-card-header">
            <FaServer className="domain-icon" />
            <h3>Estado de Servicios</h3>
          </div>
          <div className="domain-card-content">
            <div className="services-grid">
              {domainStats.services?.length > 0 ? (
                domainStats.services.map((service, index) => (
                  <div key={index} className="service-item">
                    <div className="service-header">
                      <span className="service-name">{service.name}</span>
                      <div className={`service-status ${service.status.toLowerCase()}`}>
                        {service.status === 'Error' ? (
                          <FaExclamationTriangle className="status-icon error" />
                        ) : (
                          <FaCheckCircle className="status-icon active" />
                        )}
                      </div>
                    </div>
                    <div className="service-details">
                      <small className="server-name">{service.server}</small>
                      <small className="status-details">{service.details}</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">No hay información de servicios disponible</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DomainStats; 