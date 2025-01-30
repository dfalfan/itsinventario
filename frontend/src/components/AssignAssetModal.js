import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Modal.css';

function AssignAssetModal({ asset, onClose, onAssign }) {
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      const response = await axios.get('http://192.168.141.50:5000/api/empleados/sin-equipo');
      setEmpleados(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      setError('Error al cargar la lista de empleados');
      setLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Confirmar Asignación</h2>
          <div className="modal-body">
            <p>¿Desea imprimir el acta de entrega?</p>
            <div className="asset-info">
              <p><strong>Equipo:</strong> {asset.nombre_equipo}</p>
              <p><strong>Serial:</strong> {asset.serial}</p>
              <p><strong>Nombre asignado:</strong> {nombreEquipo}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={handleAssignWithoutPDF} className="button secondary">
              No Imprimir
            </button>
            <button onClick={handleAssignWithPDF} className="button primary">
              Imprimir PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Asignar Equipo</h2>
        
        <div className="modal-body">
          <div className="asset-info">
            <p><strong>Tipo:</strong> {asset.tipo}</p>
            <p><strong>Equipo:</strong> {asset.nombre_equipo}</p>
            <p><strong>Modelo:</strong> {asset.modelo}</p>
            <p><strong>Serial:</strong> {asset.serial}</p>
            <p><strong>RAM:</strong> {asset.ram}</p>
            <p><strong>Disco:</strong> {asset.disco}</p>
          </div>

          {loading ? (
            <p>Cargando empleados...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <div className="form-group">
              <label htmlFor="empleado">Seleccionar Empleado:</label>
              <select
                id="empleado"
                value={selectedEmpleado}
                onChange={(e) => setSelectedEmpleado(e.target.value)}
                className="form-control"
              >
                <option value="">Seleccione un empleado</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombre} - {empleado.departamento}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nombreEquipo">Nombre del Equipo:</label>
            <input
              id="nombreEquipo"
              type="text"
              value={nombreEquipo}
              onChange={(e) => setNombreEquipo(e.target.value)}
              className="form-control"
              placeholder="Ingrese el nombre del equipo"
            />
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button secondary">
            Cancelar
          </button>
          <button 
            onClick={handleAssign} 
            className="button primary"
            disabled={!nombreEquipo.trim() || !selectedEmpleado}
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignAssetModal; 