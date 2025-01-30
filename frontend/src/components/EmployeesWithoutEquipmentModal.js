import React, { useState, useEffect } from 'react';
import './Modal.css';
import PropTypes from 'prop-types';

function EmployeesWithoutEquipmentModal({ onClose, onAssign, asset }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showConstanciaModal, setShowConstanciaModal] = useState(false);

  useEffect(() => {
    const fetchEmployeesWithoutEquipment = async () => {
      try {
        const response = await fetch('http://192.168.141.50:5000/api/empleados/sin-equipo');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEmployees(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('Error al cargar los empleados');
        setLoading(false);
      }
    };

    fetchEmployeesWithoutEquipment();
  }, []);

  if (!asset || !asset.id) {
    console.error('Asset prop is required with an id');
    return null;
  }

  const handleAssign = async () => {
    if (!selectedEmployee || !asset.id) {
      setError('Por favor seleccione un empleado');
      return;
    }
    
    // Generar el nombre del equipo
    const getTipoPrefix = (tipo) => {
      switch(tipo.toUpperCase()) {
        case 'AIO': return 'A';
        case 'LAPTOP': return 'L';
        case 'DESKTOP': return 'D';
        default: return 'X';
      }
    };

    const getSedePrefix = (sede) => {
      switch(sede.toUpperCase()) {
        case 'CDN': return 'G';
        case 'CA1': return 'V';
        case 'MERCADEO': return 'C';
        case 'COMERCIAL': return 'F';
        default: return 'X';
      }
    };

    const generateEmployeeCode = (nombreCompleto) => {
      const partes = nombreCompleto.trim().split(' ');
      if (partes.length >= 2) {
        const apellido = partes[0];
        const inicial = partes[partes.length - 1].charAt(0);
        return `${inicial}${apellido}`.toUpperCase();
      }
      return nombreCompleto.substring(0, 8).toUpperCase();
    };

    const tipoPrefix = getTipoPrefix(asset.tipo);
    const sedePrefix = getSedePrefix(selectedEmployee.sede);
    const employeeCode = generateEmployeeCode(selectedEmployee.nombre);
    const newNombreEquipo = `${tipoPrefix}${sedePrefix}-${employeeCode}`;
    
    try {
      // Primero actualizamos el nombre del equipo
      const updateResponse = await fetch(`http://192.168.141.50:5000/api/activos/${asset.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre_equipo: newNombreEquipo }),
      });

      if (!updateResponse.ok) {
        throw new Error('Error al actualizar el nombre del equipo');
      }

      // Luego realizamos la asignación
      const assignResponse = await fetch(`http://192.168.141.50:5000/api/activos/${asset.id}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ empleado_id: selectedEmployee.id }),
      });

      if (!assignResponse.ok) {
        const errorData = await assignResponse.json();
        throw new Error(errorData.error || 'Error al asignar equipo');
      }

      // Mostrar modal de confirmación para el PDF
      setShowConstanciaModal(true);
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al asignar el equipo');
    }
  };

  const handleConstanciaDecision = async (decision) => {
    setShowConstanciaModal(false);
    
    if (decision) {
      try {
        // Generar y descargar la constancia
        const constanciaResponse = await fetch(`http://192.168.141.50:5000/api/activos/${asset.id}/constancia`);
        if (!constanciaResponse.ok) {
          throw new Error('Error al generar la constancia');
        }

        const blob = await constanciaResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `constancia_entrega_${selectedEmployee.nombre}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error generando constancia:', error);
      }
    }
    
    onAssign(selectedEmployee);
    onClose();
  };

  if (showConstanciaModal) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Confirmar Asignación</h2>
          <div className="modal-body">
            <p>¿Desea generar la constancia de entrega?</p>
            <div className="asset-info">
              <p><strong>Equipo:</strong> {asset.nombre_equipo}</p>
              <p><strong>Serial:</strong> {asset.serial}</p>
              <p><strong>Empleado:</strong> {selectedEmployee.nombre}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={() => handleConstanciaDecision(false)} className="button secondary">
              No Generar
            </button>
            <button onClick={() => handleConstanciaDecision(true)} className="button primary">
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
        <h2>Asignar {asset.tipo} - {asset.nombre_equipo}</h2>
        
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
                value={selectedEmployee?.id || ''}
                onChange={(e) => {
                  const employee = employees.find(emp => emp.id === parseInt(e.target.value));
                  setSelectedEmployee(employee);
                }}
                className="form-control"
              >
                <option value="">Seleccione un empleado</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nombre} - {employee.departamento}
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
            disabled={loading || !selectedEmployee}
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
}

EmployeesWithoutEquipmentModal.propTypes = {
  asset: PropTypes.shape({
    id: PropTypes.number.isRequired,
    tipo: PropTypes.string.isRequired,
    nombre_equipo: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
};

export default EmployeesWithoutEquipmentModal;