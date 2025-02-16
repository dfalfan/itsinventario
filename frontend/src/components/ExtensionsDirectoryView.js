import React, { useState, useEffect } from 'react';
import { FaDownload, FaPrint } from 'react-icons/fa';
import './ExtensionsDirectoryView.css';
import logo from './logo sura color.png';

// Extensiones fijas que no dependen de la base de datos
const FIXED_EXTENSIONS = {
  "SALAS DE CONFERENCIAS": [
    { nombre: "Sala de Conferencias CDN", cargo: "Sala", extension: "1995", sede: "CDN", isFixed: true },
    { nombre: "Sala de Conferencias CDN", cargo: "Sala", extension: "1998", sede: "CDN", isFixed: true },
    { nombre: "Sala de Conferencias Almacén", cargo: "Sala", extension: "1996", sede: "CDN", isFixed: true },
    { nombre: "Sala de Conferencias A1", cargo: "Sala", extension: "2201", sede: "CA1", isFixed: true },
    { nombre: "Sala de Reunión CA1-I", cargo: "Sala", extension: "2202", sede: "CA1", isFixed: true },
    { nombre: "Sala de Reunión CA1-II", cargo: "Sala", extension: "2203", sede: "CA1", isFixed: true }
  ],
  "COMEDOR": [
    { nombre: "Comedor", cargo: "Comedor", extension: "2205", sede: "CA1", isFixed: true }
  ],
  "DATA CENTER": [
    { nombre: "CDN", cargo: "Data Center", extension: "1979", sede: "CDN", isFixed: true },
    { nombre: "CA1", cargo: "Data Center", extension: "2200", sede: "CA1", isFixed: true }
  ],
  "RECEPCIÓN": [
    { nombre: "Recepcionista", cargo: "Recepcionista", extension: "1900", sede: "CA1", isFixed: true },
    { nombre: "Vigilancia", cargo: "Vigilancia", extension: "1990", sede: "CDN", isFixed: true },
    { nombre: "Supervisor de Seguridad", cargo: "Vigilancia", extension: "1952", sede: "CDN", isFixed: true }
  ],
  "DESARROLLO DE PRODUCTOS Y CALIDAD": [
    { nombre: "Laboratorio", cargo: "Laboratorio", extension: "1934", sede: "CDN", isFixed: true }
  ],
  "ITS": [
    { nombre: "Soporte ITS", cargo: "Soporte", extension: "3000", sede: "CDN", isFixed: true }
  ],
  "SEGURIDAD INDUSTRIAL Y PCP": [
    { nombre: "Romana", cargo: "Romana", extension: "1928", sede: "CDN", isFixed: true }
  ]
};

// Mapeo de nombres de departamentos para normalización
const DEPARTMENT_MAPPINGS = {
  'I.T.S': 'ITS',
  'SUPPLY CHAIN': 'ALMACEN Y DESPACHO',
  'SUPPLY & CHAIN': 'ALMACEN Y DESPACHO',
  'ALMACÉN Y DESPACHO': 'ALMACEN Y DESPACHO'
};

// Mapeo de prioridades de cargos
const CARGO_PRIORITY = {
  'PRESIDENTE': 1,
  'GERENTE': 2,
  'JEFE': 3,
  'COORDINADOR': 4,
  'ANALISTA': 5,
  'ASISTENTE': 6
};

// Actualizar constante para prioridad de departamentos
const DEPARTMENT_PRIORITY = {
  'PRESIDENCIA': 1,
  'GERENCIA GENERAL': 2  // Cambiado a plural para coincidir con el nombre del departamento
};

// Función para obtener la prioridad del departamento
const getDepartmentPriority = (departamento) => {
  if (!departamento) return 999;
  const deptUpper = departamento.toUpperCase();
  return DEPARTMENT_PRIORITY[deptUpper] || 999;
};

// Modificar la función getCargoWeight para incluir más cargos específicos
const getCargoWeight = (cargo) => {
  if (!cargo) return 999;
  const cargoUpper = cargo.toUpperCase();
  
  if (cargoUpper.includes('PRESIDENTE')) return 1;
  if (cargoUpper.includes('VICEPRESIDENTE')) return 2;
  if (cargoUpper.includes('GERENTE')) return 3;
  if (cargoUpper.includes('DIRECTOR')) return 4;
  if (cargoUpper.includes('JEFE')) return 5;
  if (cargoUpper.includes('COORDINADOR')) return 6;
  if (cargoUpper.includes('SUPERVISOR')) return 7;
  if (cargoUpper.includes('ANALISTA')) return 8;
  if (cargoUpper.includes('ASISTENTE')) return 9;
  
  return 999;
};

function ExtensionsDirectoryView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedData, setGroupedData] = useState({});
  const [selectedSede, setSelectedSede] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.141.50:5000/api/empleados');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const empleados = await response.json();
      
      // Volver a usar departamento en lugar de área
      const extensiones = empleados
        .filter(emp => emp.extension)
        .map(emp => ({
          id: emp.id,
          sede: emp.sede || 'Sin asignar',
          nombre: emp.nombre || 'Sin asignar',
          departamento: normalizeDepartmentName(emp.departamento) || 'Sin asignar',
          cargo: emp.cargo || 'Sin asignar',
          extension: emp.extension || 'Sin asignar'
        }));

      // Agrupar por departamento
      const grouped = extensiones.reduce((acc, curr) => {
        if (!acc[curr.departamento]) {
          acc[curr.departamento] = [];
        }
        acc[curr.departamento].push(curr);
        return acc;
      }, {});

      // Ordenar los departamentos según prioridad
      const orderedGrouped = Object.entries(grouped)
        .sort(([deptA], [deptB]) => {
          const priorityA = getDepartmentPriority(deptA);
          const priorityB = getDepartmentPriority(deptB);
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          return deptA.localeCompare(deptB);
        })
        .reduce((acc, [dept, items]) => {
          acc[dept] = items;
          return acc;
        }, {});

      setGroupedData(orderedGrouped);
      setData(extensiones);
      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(`Error cargando datos: ${error.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para normalizar nombres de departamentos
  const normalizeDepartmentName = (departamento) => {
    if (!departamento) return 'Sin asignar';
    const normalizedName = departamento.toUpperCase().trim();
    return DEPARTMENT_MAPPINGS[normalizedName] || normalizedName;
  };

  const filterData = () => {
    let filteredData = { ...groupedData };
    
    // Agregar las extensiones fijas a los departamentos
    Object.entries(FIXED_EXTENSIONS).forEach(([departamento, extensiones]) => {
      const normalizedDepartamento = normalizeDepartmentName(departamento);
      if (!filteredData[normalizedDepartamento]) {
        filteredData[normalizedDepartamento] = [];
      }
      filteredData[normalizedDepartamento] = [
        ...filteredData[normalizedDepartamento],
        ...extensiones
      ];
    });
    
    // Filtrar por sede
    if (selectedSede !== 'todas') {
      Object.keys(filteredData).forEach(departamento => {
        filteredData[departamento] = filteredData[departamento].filter(ext => 
          ext.sede === selectedSede
        );
        if (filteredData[departamento].length === 0) {
          delete filteredData[departamento];
        }
      });
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      Object.keys(filteredData).forEach(departamento => {
        filteredData[departamento] = filteredData[departamento].filter(ext => 
          ext.nombre.toLowerCase().includes(searchLower) ||
          ext.extension.includes(searchLower) ||
          ext.cargo.toLowerCase().includes(searchLower) ||
          departamento.toLowerCase().includes(searchLower)
        );
        if (filteredData[departamento].length === 0) {
          delete filteredData[departamento];
        }
      });
    }

    // Ordenar las extensiones dentro de cada departamento
    Object.keys(filteredData).forEach(departamento => {
      filteredData[departamento].sort((a, b) => {
        const cargoPriorityA = getCargoWeight(a.cargo);
        const cargoPriorityB = getCargoWeight(b.cargo);
        if (cargoPriorityA !== cargoPriorityB) {
          return cargoPriorityA - cargoPriorityB;
        }
        return a.extension.localeCompare(b.extension);
      });
    });

    // Ordenar los departamentos según prioridad
    const orderedData = Object.entries(filteredData)
      .sort(([deptA], [deptB]) => {
        const priorityA = getDepartmentPriority(deptA);
        const priorityB = getDepartmentPriority(deptB);
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return deptA.localeCompare(deptB);
      })
      .reduce((acc, [dept, items]) => {
        acc[dept] = items;
        return acc;
      }, {});

    return orderedData;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  const filteredData = filterData();
  const sedes = [...new Set(data.map(ext => ext.sede))];

  return (
    <div className="extensions-directory">
      <div className="header">
        <div className="header-left">
          <img src={logo} alt="Logo SURA" className="header-logo" />
          <h1 className="page-title">LISTADO DE EXTENSIONES</h1>
        </div>
        <div className="header-right">
          <input
            type="text"
            placeholder="Buscar por nombre, extensión, departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="sede-filters">
            <button
              className={`sede-filter ${selectedSede === 'todas' ? 'active' : ''}`}
              onClick={() => setSelectedSede('todas')}
            >
              Todas
            </button>
            {sedes.map(sede => (
              <button
                key={sede}
                className={`sede-filter ${selectedSede === sede ? 'active' : ''}`}
                onClick={() => setSelectedSede(sede)}
              >
                {sede}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="directory-content">
        {Object.entries(filteredData).map(([departamento, extensiones]) => (
          <div key={departamento} className="sede-section">
            <h3 className="sede-title">{departamento}</h3>
            <div className="extensions-grid">
              {Array.isArray(extensiones) && extensiones.map((ext, index) => (
                <div 
                  key={`${ext.extension}-${index}`} 
                  className={`extension-card ${ext.isFixed ? 'fixed-extension' : ''}`}
                >
                  <div className="extension-number">{ext.extension}</div>
                  <div className="extension-details">
                    <div className="extension-name">{ext.nombre}</div>
                    <div className="extension-position">{ext.cargo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExtensionsDirectoryView; 