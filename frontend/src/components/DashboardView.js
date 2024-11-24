import React, { useState, useEffect } from 'react';
import { 
  FaLaptop, 
  FaUserSlash, 
  FaTools, 
  FaWarehouse,
  FaChartPie,
  FaBuilding
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
import { Pie, Bar } from 'react-chartjs-2';
import './DashboardView.css';

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard/stats');
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

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      {/* Tarjetas de Estadísticas */}
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

      {/* Gráficos */}
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
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;