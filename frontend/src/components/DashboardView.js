import React, { useState, useEffect } from 'react';
import { 
  FaLaptop, 
  FaUserSlash, 
  FaTools, 
  FaWarehouse,
  FaChartPie,
  FaBuilding,
  FaBell,
  FaChevronLeft,
  FaChevronRight,
  FaChartLine,
  FaEnvelope,
  FaNetworkWired,
  FaMobileAlt
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import './DashboardView.css';
import WorkspaceStats from './WorkspaceStats';
import DomainStats from './DomainStats';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function DashboardView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDashboard, setSelectedDashboard] = useState('equipos');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://192.168.141.50:5000/api/dashboard/stats');
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="loading">Cargando estadísticas...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return null;

  const equiposPorTipoData = {
    labels: stats.equiposPorTipo.map(item => item.tipo),
    datasets: [{
      data: stats.equiposPorTipo.map(item => item.cantidad),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  const equiposPorSedeData = {
    labels: stats.equiposPorSede.map(item => item.sede),
    datasets: [{
      label: 'Equipos por Sede',
      data: stats.equiposPorSede.map(item => item.cantidad),
      backgroundColor: '#36A2EB'
    }]
  };

  const tasaUtilizacionData = {
    labels: stats.tasaUtilizacion.map(item => item.estado),
    datasets: [{
      data: stats.tasaUtilizacion.map(item => item.cantidad),
      backgroundColor: [
        '#4BC0C0',
        '#FF6384'
      ]
    }]
  };

  const equiposPorDepartamentoData = {
    labels: stats.equiposPorDepartamento.map(item => item.departamento),
    datasets: [{
      label: 'Equipos por Departamento',
      data: stats.equiposPorDepartamento.map(item => item.cantidad),
      backgroundColor: '#FFCE56'
    }]
  };

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <div className="nav-items">
          <button
            className={`nav-item ${selectedDashboard === 'equipos' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('equipos')}
          >
            Equipos
          </button>
          <button
            className={`nav-item ${selectedDashboard === 'smartphones' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('smartphones')}
          >
            Smartphones
          </button>
          <button
            className={`nav-item ${selectedDashboard === 'dominio' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('dominio')}
          >
            Dominio
          </button>
          <button
            className={`nav-item ${selectedDashboard === 'correos' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('correos')}
          >
            Correos
          </button>
          <button
            className={`nav-item ${selectedDashboard === 'impresoras' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('impresoras')}
          >
            Impresoras
          </button>
          <button
            className={`nav-item ${selectedDashboard === 'servidores' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('servidores')}
          >
            Servidores
          </button>
        </div>
      </nav>
      
      <main className="dashboard-content">
        {selectedDashboard === 'equipos' && (
          <>
            <h1>Dashboard Principal</h1>
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaLaptop />
                </div>
                <div className="stat-info">
                  <h3>Total Equipos</h3>
                  <p>{stats.totalEquipos}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaUserSlash />
                </div>
                <div className="stat-info">
                  <h3>Sin Equipo Asignado</h3>
                  <p>{stats.empleadosSinEquipo}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaTools />
                </div>
                <div className="stat-info">
                  <h3>En Reparación</h3>
                  <p>{stats.equiposEnReparacion}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaWarehouse />
                </div>
                <div className="stat-info">
                  <h3>En Stock</h3>
                  <p>{stats.equiposEnStock}</p>
                </div>
              </div>
            </div>

            <div className="charts-container">
              <div className="chart-card">
                <h3>Equipos por Tipo</h3>
                <div className="chart-wrapper">
                  <Pie data={equiposPorTipoData} />
                </div>
              </div>

              <div className="chart-card">
                <h3>Distribución por Sede</h3>
                <div className="chart-wrapper">
                  <Bar 
                    data={equiposPorSedeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-card">
                <h3>Tasa de Utilización</h3>
                <div className="chart-wrapper">
                  <Doughnut 
                    data={tasaUtilizacionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-card">
                <h3>Top 10 Departamentos</h3>
                <div className="chart-wrapper">
                  <Bar 
                    data={equiposPorDepartamentoData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      scales: {
                        x: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
        
        {selectedDashboard === 'correos' && (
          <WorkspaceStats />
        )}
        
        {selectedDashboard === 'dominio' && (
          <DomainStats />
        )}
        
        {selectedDashboard === 'smartphones' && (
          <h1>Dashboard de Smartphones</h1>
          // Contenido del dashboard de smartphones
        )}
      </main>
    </div>
  );
}

export default DashboardView;