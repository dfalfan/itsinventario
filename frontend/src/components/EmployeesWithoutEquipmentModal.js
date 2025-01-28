import React, { useState, useEffect } from 'react';
import './EmployeesWithoutEquipmentModal.css';
import PropTypes from 'prop-types';

function EmployeesWithoutEquipmentModal({ onClose, onAssign, asset }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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
      setError('Información incompleta para asignar');
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
      // El formato es "Apellido Nombre"
      const partes = nombreCompleto.trim().split(' ');
      if (partes.length >= 2) {
        // El apellido es la primera parte y el nombre es la última
        const apellido = partes[0];
        const inicial = partes[partes.length - 1].charAt(0);
        // Ponemos la inicial del nombre ANTES del apellido
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
      
      onAssign(selectedEmployee);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al asignar el equipo');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="employees-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Asignar {asset.tipo} - {asset.nombre_equipo}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        {loading && <div className="loading">Cargando...</div>}
        {error && <div className="error">{error}</div>}
        
        {!loading && !error && (
          <>
            <div className="employees-list">
              {employees.length === 0 ? (
                <p>No hay empleados sin equipo asignado</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Sede</th>
                      <th>Nombre</th>
                      <th>Departamento</th>
                      <th>Cargo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr 
                        key={employee.ficha}
                        onClick={() => setSelectedEmployee(employee)}
                        className={selectedEmployee?.ficha === employee.ficha ? 'selected' : ''}
                      >
                        <td>{employee.sede}</td>
                        <td>{employee.nombre}</td>
                        <td>{employee.departamento}</td>
                        <td>{employee.cargo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="assign-button"
                disabled={!selectedEmployee}
                onClick={handleAssign}
              >
                Asignar Equipo
              </button>
            </div>
          </>
        )}
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