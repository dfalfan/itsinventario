import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaExclamationTriangle, FaDatabase, FaUsers } from 'react-icons/fa';
import './WorkspaceStats.css';

function WorkspaceStats() {
  const [workspaceStats, setWorkspaceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkspaceStats = async () => {
      try {
        const response = await fetch('http://192.168.141.50:5000/api/workspace/stats');
        if (!response.ok) throw new Error('Error al cargar estadísticas de Workspace');
        const data = await response.json();
        setWorkspaceStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceStats();
  }, []);

  if (loading) return <div className="loading">Cargando estadísticas de Workspace...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!workspaceStats) return null;

  return (
    <div className="workspace-stats">
      <h2>Estadísticas de Google Workspace</h2>
      
      <div className="workspace-stats-grid">
        <div className="workspace-card">
          <div className="workspace-card-header">
            <FaEnvelope className="workspace-icon" />
            <h3>Uso de Correo</h3>
          </div>
          <div className="workspace-card-content">
            <div className="stat-item">
              <span>Almacenamiento Total</span>
              <strong>{workspaceStats.totalStorage} GB</strong>
            </div>
            <div className="stat-item">
              <span>Almacenamiento Usado</span>
              <strong>{workspaceStats.usedStorage} GB</strong>
            </div>
            <div className="stat-item">
              <span>Cuentas Activas</span>
              <strong>{workspaceStats.activeAccounts}</strong>
            </div>
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-header">
            <FaExclamationTriangle className="workspace-icon" />
            <h3>Alertas de Capacidad</h3>
          </div>
          <div className="workspace-card-content">
            <div className="alerts-list">
              {workspaceStats.storageAlerts.map((alert, index) => (
                <div key={index} className="alert-item">
                  <span>{alert.email}</span>
                  <strong>{alert.usedPercentage}% usado</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-header">
            <FaDatabase className="workspace-icon" />
            <h3>Top Usuarios por Almacenamiento</h3>
          </div>
          <div className="workspace-card-content">
            <div className="top-users-list">
              {workspaceStats.topUsers.map((user, index) => (
                <div key={index} className="user-item">
                  <span>{user.email}</span>
                  <strong>{user.storageUsed} GB</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-header">
            <FaUsers className="workspace-icon" />
            <h3>Resumen de Licencias</h3>
          </div>
          <div className="workspace-card-content">
            <div className="stat-item">
              <span>Licencias Totales</span>
              <strong>{workspaceStats.totalLicenses}</strong>
            </div>
            <div className="stat-item">
              <span>Licencias Asignadas</span>
              <strong>{workspaceStats.assignedLicenses}</strong>
            </div>
            <div className="stat-item">
              <span>Licencias Disponibles</span>
              <strong>{workspaceStats.availableLicenses}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceStats; 