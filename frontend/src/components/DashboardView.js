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
  FaMobileAlt,
  FaUser,
  FaPhoneSquare,
  FaPrint,
  FaCheck,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaCheckCircle,
  FaIndustry
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
import LoadingScreen from './LoadingScreen';

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

  const chartColors = {
    primary: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD'],  // Azules
    secondary: ['#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280'], // Grises
    success: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
    danger: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2'],
    purple: ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE']
  };

  const ImpresorasPanel = () => {
    const [stats, setStats] = useState({
      totalImpresoras: 0,
      porSede: [],
      porProveedor: [],
      alertas: [],
      estadoConexion: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchImpresorasStats().finally(() => {
        setLoading(false);
      });
    }, []);

    const fetchImpresorasStats = async () => {
      try {
        const response = await fetch('http://192.168.141.50:5000/api/impresoras');
        const impresoras = await response.json();

        // Calcular estadísticas
        const total = impresoras.length;

        // Agrupar por sede
        const porSede = impresoras.reduce((acc, imp) => {
          const sede = imp.sede || 'Sin asignar';
          acc[sede] = (acc[sede] || 0) + 1;
          return acc;
        }, {});

        // Agrupar por proveedor
        const porProveedor = impresoras.reduce((acc, imp) => {
          const proveedor = imp.proveedor || 'Sin asignar';
          acc[proveedor] = (acc[proveedor] || 0) + 1;
          return acc;
        }, {});

        // Verificar conectividad de impresoras
        const verificarConectividad = async (ip) => {
          try {
            const response = await fetch(`http://192.168.141.50:5000/api/impresoras/check-connection/${ip}`);
            const data = await response.json();
            return {
              isConnected: data.isConnected,
              status: data.status,
              info: data.info
            };
          } catch {
            return {
              isConnected: false,
              status: 'Error de conexión'
            };
          }
        };

        const estadoConexion = await Promise.all(
          impresoras.map(async (imp) => {
            if (imp.ip) {
              const status = await verificarConectividad(imp.ip);
              return {
                nombre: imp.nombre,
                ip: imp.ip,
                estado: status.status,
                detalles: status.info,
                sede: imp.sede
              };
            }
            return null;
          })
        ).then(results => results.filter(Boolean));

        // Generar alertas
        const alertas = [];
        
        // Alerta por impresoras sin IP
        const sinIP = impresoras.filter(imp => !imp.ip).length;
        if (sinIP > 0) {
          alertas.push({
            tipo: 'warning',
            mensaje: `${sinIP} impresoras sin IP asignada`,
            detalles: 'Se requiere configurar IP'
          });
        }

        // Alerta por impresoras desconectadas
        const desconectadas = estadoConexion.filter(imp => imp.estado === 'Sin conexión').length;
        if (desconectadas > 0) {
          alertas.push({
            tipo: 'error',
            mensaje: `${desconectadas} impresoras sin conexión`,
            detalles: 'Verificar conectividad de red'
          });
        }

        setStats({
          totalImpresoras: total,
          porSede: Object.entries(porSede).map(([sede, cantidad]) => ({
            sede,
            cantidad
          })),
          porProveedor: Object.entries(porProveedor).map(([proveedor, cantidad]) => ({
            proveedor,
            cantidad
          })),
          alertas,
          estadoConexion
        });

      } catch (error) {
        console.error('Error fetching impresoras stats:', error);
      }
    };

    if (loading) {
      return (
        <LoadingScreen 
          title="Verificando estado de impresoras"
          message="Comprobando conectividad y obteniendo información del estado de las impresoras..."
        />
      );
    }

    // Datos para los gráficos
    const chartData = {
      porSede: {
        labels: stats.porSede.map(item => item.sede),
        datasets: [{
          label: 'Impresoras por Sede',
          data: stats.porSede.map(item => item.cantidad),
          backgroundColor: [
            '#FF6384', // Rosa
            '#36A2EB', // Azul
            '#FFCE56', // Amarillo
            '#4BC0C0', // Verde agua
            '#9966FF'  // Morado
          ],
          borderWidth: 0
        }]
      },
      porProveedor: {
        labels: stats.porProveedor.map(item => item.proveedor),
        datasets: [{
          data: stats.porProveedor.map(item => item.cantidad),
          backgroundColor: [
            '#4BC0C0', // Verde agua
            '#FF6384', // Rosa
            '#36A2EB', // Azul
            '#FFCE56', // Amarillo
            '#9966FF'  // Morado
          ],
          borderWidth: 0
        }]
      },
      estadoConexion: {
        labels: ['Conectadas', 'Sin Conexión'],
        datasets: [{
          data: [
            stats.estadoConexion.filter(imp => imp.estado === 'Conectada').length,
            stats.estadoConexion.filter(imp => imp.estado !== 'Conectada').length
          ],
          backgroundColor: ['#4BC0C0', '#FF6384'], // Verde agua y Rosa
          borderWidth: 0
        }]
      }
    };

    return (
      <div className="impresoras-dashboard">
        <h1>Dashboard de Impresoras</h1>
        <div className="stats-cards">
          <div className="stat-card total">
            <div className="stat-icon">
              <FaPrint />
            </div>
            <div className="stat-info">
              <h3>Total Impresoras</h3>
              <p>{stats.totalImpresoras}</p>
            </div>
          </div>

          <div className="stat-card conectadas">
            <div className="stat-icon">
              <FaCheck />
            </div>
            <div className="stat-info">
              <h3>Conectadas</h3>
              <p>{stats.estadoConexion.filter(imp => imp.estado === 'Conectada').length}</p>
              <span className="stat-percentage">
                {Math.round((stats.estadoConexion.filter(imp => imp.estado === 'Conectada').length / stats.totalImpresoras) * 100)}%
              </span>
            </div>
          </div>

          <div className="stat-card desconectadas">
            <div className="stat-icon">
              <FaExclamationTriangle />
            </div>
            <div className="stat-info">
              <h3>Desconectadas</h3>
              <p>{stats.estadoConexion.filter(imp => imp.estado !== 'Conectada').length}</p>
              <span className="stat-percentage">
                {Math.round((stats.estadoConexion.filter(imp => imp.estado !== 'Conectada').length / stats.totalImpresoras) * 100)}%
              </span>
            </div>
          </div>

          <div className="stat-card sedes">
            <div className="stat-icon">
              <FaBuilding />
            </div>
            <div className="stat-info">
              <h3>Sedes</h3>
              <p>{stats.porSede.length}</p>
            </div>
          </div>
        </div>

        <div className="info-panels">
          <div className="panel">
            <h3>
              <FaChartPie className="panel-icon" />
              Distribución por Sede
            </h3>
            <div className="chart-wrapper">
              <Pie 
                data={chartData.porSede}
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            </div>
          </div>

          <div className="panel">
            <h3>
              <FaNetworkWired className="panel-icon" />
              Estado de Conexión
            </h3>
            <div className="status-grid">
              {stats.estadoConexion.map((imp, index) => (
                <div key={index} className="status-item">
                  <div className="status-info">
                    <span className="printer-name">{imp.nombre}</span>
                    <span className="printer-ip">{imp.ip}</span>
                  </div>
                  <div className={`status-badge ${imp.estado.toLowerCase().replace(' ', '-')}`}>
                    <span className="status-dot"></span>
                    {imp.estado}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>
              <FaIndustry className="panel-icon" />
              Distribución por Proveedor
            </h3>
            <div className="chart-wrapper">
              <Doughnut 
                data={chartData.porProveedor}
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            </div>
          </div>

          <div className="panel">
            <h3>
              <FaBell className="panel-icon" />
              Alertas
            </h3>
            <div className="alerts-container">
              {stats.alertas.length > 0 ? (
                stats.alertas.map((alerta, index) => (
                  <div key={index} className={`alert-item ${alerta.tipo}`}>
                    <div className="alert-icon">
                      {alerta.tipo === 'error' ? <FaExclamationCircle /> : <FaExclamationTriangle />}
                    </div>
                    <div className="alert-content">
                      <span className="alert-message">{alerta.mensaje}</span>
                      <span className="alert-details">{alerta.detalles}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-alerts">
                  <FaCheckCircle />
                  <span>No hay alertas activas</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <div className="nav-items">
          <button
            className={`nav-item ${selectedDashboard === 'equipos' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('equipos')}
          >
            Inventario de Equipos
          </button>
          <button
            className={`nav-item ${selectedDashboard === 'smartphones' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('smartphones')}
          >
            Gestión de Móviles
          </button>
          <button
            className={`nav-item ${selectedDashboard === 'dominio' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('dominio')}
          >
            Control de Dominio
          </button>
          <button
            className={`nav-item ${selectedDashboard === 'correos' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('correos')}
          >
            Gestión de Correos
          </button>
          <button
            className={`nav-item ${selectedDashboard === 'impresoras' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('impresoras')}
          >
            Control de Impresoras
          </button>
          <button
            className={`nav-item ${selectedDashboard === 'servidores' ? 'active' : ''}`}
            onClick={() => setSelectedDashboard('servidores')}
          >
            Monitoreo de Servidores
          </button>
        </div>
      </nav>
      
      <main className="dashboard-content">
        {selectedDashboard === 'equipos' && (
          <>
            <h1>Equipos</h1>
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
          <>
            <h1>Dashboard de Smartphones</h1>
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaMobileAlt />
                </div>
                <div className="stat-info">
                  <h3>Total Smartphones</h3>
                  <p>{stats.totalSmartphones || 0}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaUserSlash />
                </div>
                <div className="stat-info">
                  <h3>Sin Asignar</h3>
                  <p>{stats.smartphonesSinAsignar || 0}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaUser />
                </div>
                <div className="stat-info">
                  <h3>Asignados</h3>
                  <p>{stats.smartphonesAsignados || 0}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FaPhoneSquare />
                </div>
                <div className="stat-info">
                  <h3>Líneas Activas</h3>
                  <p>{stats.lineasActivas || 0}</p>
                </div>
              </div>
            </div>

            <div className="charts-container">
              <div className="chart-card">
                <h3>Estado de Asignación</h3>
                <div className="chart-wrapper">
                  <Doughnut 
                    data={{
                      labels: ['Asignados', 'Disponibles'],
                      datasets: [{
                        data: [
                          stats.smartphonesAsignados || 0,
                          stats.smartphonesSinAsignar || 0
                        ],
                        backgroundColor: [
                          '#4BC0C0',
                          '#FF6384'
                        ]
                      }]
                    }}
                    options={{
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
                <h3>Asignaciones Mensuales</h3>
                <div className="chart-wrapper">
                  <Bar 
                    data={{
                      labels: stats.asignacionesPorMes?.map(item => item.mes) || [],
                      datasets: [{
                        label: 'Asignaciones',
                        data: stats.asignacionesPorMes?.map(item => item.cantidad) || [],
                        backgroundColor: '#36A2EB'
                      }]
                    }}
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
            </div>
          </>
        )}

        {selectedDashboard === 'impresoras' && (
          <ImpresorasPanel />
        )}
      </main>
    </div>
  );
}

export default DashboardView;