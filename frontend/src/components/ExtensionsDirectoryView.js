import React, { useState, useEffect } from 'react';
import { FaDownload, FaPrint } from 'react-icons/fa';
import './ExtensionsDirectoryView.css';
import logo from './logo sura color.png';

function ExtensionsDirectoryView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedData, setGroupedData] = useState({});

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
      
      // Filtrar solo empleados que tienen extensión y mapear los campos necesarios
      const extensiones = empleados
        .filter(emp => emp.extension)
        .map(emp => ({
          id: emp.id,
          sede: emp.sede || 'Sin asignar',
          nombre: emp.nombre || 'Sin asignar',
          departamento: emp.departamento || 'Sin asignar',
          cargo: emp.cargo || 'Sin asignar',
          extension: emp.extension || 'Sin asignar'
        }))
        .sort((a, b) => {
          // Primero ordenar por departamento
          const deptCompare = a.departamento.localeCompare(b.departamento);
          if (deptCompare !== 0) return deptCompare;
          // Luego por extensión
          return a.extension.localeCompare(b.extension);
        });

      // Agrupar primero por sede y luego por departamento
      const grouped = extensiones.reduce((acc, curr) => {
        if (!acc[curr.sede]) {
          acc[curr.sede] = {};
        }
        if (!acc[curr.sede][curr.departamento]) {
          acc[curr.sede][curr.departamento] = [];
        }
        acc[curr.sede][curr.departamento].push(curr);
        return acc;
      }, {});

      setGroupedData(grouped);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="extensions-directory">
      <div className="header no-print">
        <img src={logo} alt="Logo SURA" className="header-logo" />
        <div className="header-buttons">
          <button onClick={handlePrint} className="print-button">
            <FaPrint /> Imprimir
          </button>
          <a 
            href="/EXTENSIONES.pdf" 
            download 
            className="download-button"
          >
            <FaDownload /> Descargar PDF
          </a>
        </div>
      </div>

      <div className="directory-content">
        {Object.entries(groupedData).map(([sede, departamentos]) => (
          <div key={sede} className="sede-section">
            <h3 className="sede-title">{sede}</h3>
            {Object.entries(departamentos).map(([departamento, extensiones]) => (
              <div key={departamento} className="departamento-section">
                <h4 className="departamento-title">{departamento}</h4>
                <div className="extensions-grid">
                  {extensiones.map((ext) => (
                    <div key={ext.id} className="extension-card">
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
        ))}
      </div>
    </div>
  );
}

export default ExtensionsDirectoryView; 