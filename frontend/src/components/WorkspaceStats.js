import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaExclamationTriangle, FaDatabase, FaUsers } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import './DashboardView.css';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

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

  if (loading) return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <div className="loading-text">Cargando estadísticas de Google Workspace</div>
      <div className="loading-subtext">
        Obteniendo información de correos, almacenamiento y licencias...
      </div>
    </div>
  );
  
  if (error) return (
    <div className="dashboard-error">
      <FaExclamationTriangle size={24} style={{ marginBottom: '1rem' }} />
      <div>{error}</div>
    </div>
  );
  if (!workspaceStats) return null;

  // Datos para el gráfico de almacenamiento
  const storageData = {
    labels: ['Usado', 'Disponible'],
    datasets: [{
      data: [
        workspaceStats.usedStorage,
        workspaceStats.totalStorage - workspaceStats.usedStorage
      ],
      backgroundColor: ['#2196f3', '#e0e0e0'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="workspace-stats">
      <h2>Estadísticas de Google Workspace</h2>
      
      <div className="workspace-stats-grid">
        {/* Uso de Almacenamiento */}
        <div className="workspace-card">
          <div className="workspace-card-header">
            <FaDatabase className="workspace-icon" />
            <h3>Uso de Almacenamiento</h3>
          </div>
          <div className="workspace-card-content">
            <div className="chart-container">
              <Doughnut data={storageData} options={chartOptions} />
            </div>
            <div className="stat-summary">
              <div className="stat-item">
                <span>Total</span>
                <strong>{workspaceStats.totalStorage} GB</strong>
              </div>
              <div className="stat-item">
                <span>Usado</span>
                <strong>{workspaceStats.usedStorage} GB</strong>
              </div>
              <div className="stat-item">
                <span>Promedio por Usuario</span>
                <strong>{workspaceStats.storageStats.averagePerUser} GB</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Licencias */}
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

        {/* Top Usuarios por Actividad */}
        <div className="workspace-card">
          <div className="workspace-card-header">
            <FaEnvelope className="workspace-icon" />
            <h3>Top Usuarios por Actividad (Última Semana)</h3>
          </div>
          <div className="workspace-card-content">
            <div className="top-users-list">
              {workspaceStats.topUsersByEmails.map((user, index) => (
                <div key={index} className="top-user-item">
                  <span className="user-rank">{index + 1}</span>
                  <span className="user-email">{user.email.split('@')[0]}</span>
                  <span className="user-value">{user.total.toLocaleString()} correos</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estadísticas de Correo */}
        <div className="workspace-card">
          <div className="workspace-card-header">
            <FaEnvelope className="workspace-icon" />
            <h3>Estadísticas de Correo</h3>
          </div>
          <div className="workspace-card-content">
            <div className="stat-item">
              <span>Total Enviados</span>
              <strong>{workspaceStats.emailStats.totalSent.toLocaleString()}</strong>
            </div>
            <div className="stat-item">
              <span>Total Recibidos</span>
              <strong>{workspaceStats.emailStats.totalReceived.toLocaleString()}</strong>
            </div>
            <div className="stat-item">
              <span>Promedio por Usuario</span>
              <strong>{workspaceStats.emailStats.averagePerUser.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Alertas de Capacidad */}
        <div className="workspace-card">
          <div className="workspace-card-header">
            <FaExclamationTriangle className="workspace-icon warning" />
            <h3>Alertas de Capacidad</h3>
          </div>
          <div className="workspace-card-content">
            <div className="alerts-list">
              {workspaceStats.storageAlerts.length > 0 ? (
                workspaceStats.storageAlerts.map((alert, index) => (
                  <div key={index} className="alert-item">
                    <span>{alert.email}</span>
                    <strong>{alert.percentage}% usado</strong>
                  </div>
                ))
              ) : (
                <p className="no-alerts">No hay alertas de capacidad</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceStats; 