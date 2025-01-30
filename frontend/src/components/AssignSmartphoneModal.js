import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Modal.css';

function AssignSmartphoneModal({ smartphone, onClose, onAssign }) {
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      const response = await axios.get('http://192.168.141.50:5000/api/empleados/sin-smartphone');
      setEmpleados(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      setError('Error al cargar la lista de empleados');
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedEmpleado) {
      setError('Por favor seleccione un empleado');
      return;
    }

    try {
      await axios.post(`http://192.168.141.50:5000/api/smartphones/${smartphone.id}/asignar`, {
        empleado_id: selectedEmpleado
      });
      onAssign();
    } catch (error) {
      console.error('Error al asignar smartphone:', error);
      setError('Error al asignar el smartphone');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Asignar Smartphone</h2>
        
        <div className="modal-body">
          <div className="smartphone-info">
            <p><strong>Marca:</strong> {smartphone.marca}</p>
            <p><strong>Modelo:</strong> {smartphone.modelo}</p>
            <p><strong>Serial:</strong> {smartphone.serial}</p>
            <p><strong>IMEI:</strong> {smartphone.imei}</p>
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
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button secondary">
            Cancelar
          </button>
          <button 
            onClick={handleAssign} 
            className="button primary"
            disabled={loading || !selectedEmpleado}
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignSmartphoneModal; 