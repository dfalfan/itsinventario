import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Modal.css';

function AssignSmartphoneModal({ smartphone, onClose, onAssign }) {
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
    setShowConfirmModal(true);
  };

  const handleConfirmAssign = async (generatePDF) => {
    try {
      await axios.post(`http://192.168.141.50:5000/api/smartphones/${smartphone.id}/asignar`, {
        empleado_id: selectedEmpleado
      });

      if (generatePDF) {
        try {
          const response = await axios.get(
            `http://192.168.141.50:5000/api/smartphones/${smartphone.id}/constancia`,
            { responseType: 'blob' }
          );
          
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          const empleado = empleados.find(e => e.id === parseInt(selectedEmpleado));
          link.setAttribute('download', `constancia_smartphone_${empleado.nombre}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error al generar el PDF:', error);
        }
      }

      onAssign();
    } catch (error) {
      console.error('Error al asignar smartphone:', error);
      setError('Error al asignar el smartphone');
      setShowConfirmModal(false);
    }
  };

  if (showConfirmModal) {
    const empleado = empleados.find(e => e.id === parseInt(selectedEmpleado));
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Confirmar Asignación</h2>
          <div className="modal-body">
            <p>¿Desea generar la constancia de entrega?</p>
            <div className="asset-info">
              <p><strong>Marca:</strong> {smartphone.marca}</p>
              <p><strong>Modelo:</strong> {smartphone.modelo}</p>
              <p><strong>Empleado:</strong> {empleado?.nombre}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={() => handleConfirmAssign(false)} className="button secondary">
              No Generar
            </button>
            <button onClick={() => handleConfirmAssign(true)} className="button primary">
              Generar PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Asignar Smartphone</h2>
        
        <div className="modal-body">
          <div className="asset-info">
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