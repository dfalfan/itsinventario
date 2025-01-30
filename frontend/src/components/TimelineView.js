import React, { useState, useEffect } from 'react';
import { FaClock, FaMobileAlt, FaLaptop, FaPrint, FaSearch } from 'react-icons/fa';
import './TimelineView.css';

function TimelineView({ categoria, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [categoria]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`http://192.168.141.50:5000/api/logs/${categoria}`);
      if (!response.ok) {
        throw new Error('Error cargando el historial');
      }
      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoriaIcon = () => {
    switch (categoria) {
      case 'smartphones':
        return <FaMobileAlt />;
      case 'assets':
        return <FaLaptop />;
      case 'impresoras':
        return <FaPrint />;
      default:
        return <FaClock />;
    }
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredLogs = logs.filter(log => 
    log.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.accion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content timeline-modal">
        <div className="modal-header">
          <div className="timeline-title">
            {getCategoriaIcon()}
            <h2>Historial de {categoria}</h2>
          </div>
        </div>

        <div className="timeline-search">
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar en el historial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="timeline-content">
          {loading ? (
            <div className="loading">Cargando historial...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="no-logs">
              {searchTerm ? 'No se encontraron registros que coincidan con la búsqueda' : 'No hay registros para mostrar'}
            </div>
          ) : (
            <div className="timeline">
              {filteredLogs.map((log) => (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-marker">
                    <div className="timeline-dot"></div>
                    <div className="timeline-line"></div>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-date">{formatFecha(log.fecha)}</div>
                    <div className="timeline-action">{log.accion}</div>
                    <div className="timeline-description">{log.descripcion}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="timeline-footer">
          <button onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimelineView; 