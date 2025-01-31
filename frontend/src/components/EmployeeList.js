import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './EmployeeList.css';

function EmployeeList({ onEdit }) {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmpleados = async () => {
    try {
      const response = await axios.get('http://192.168.141.50:5000/api/empleados');
      setEmpleados(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching empleados:', error);
      setError('Error al cargar la lista de empleados');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const deleteEmpleado = async (id) => {
    try {
      const response = await axios.delete(`http://192.168.141.50:5000/api/empleados/${id}`);
      if (response.status === 200) {
        window.alert(response.data.message);
        setEmpleados(prev => prev.filter(e => e.id !== id));
        await fetchEmpleados();
      }
    } catch (error) {
      console.error('Error completo:', error);
      window.alert(error.response?.data?.error || 'Error al eliminar el empleado');
    }
  };

  const handleDelete = (empleado) => {
    const nombre = empleado.nombre_completo || 'Empleado sin nombre';
    const mensaje = `¿Está seguro que desea eliminar a ${nombre}?`;
    
    if (window.confirm(mensaje)) {
      deleteEmpleado(empleado.id);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="employee-list">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Ficha</th>
              <th>Nombre</th>
              <th>Sede</th>
              <th>Gerencia</th>
              <th>Departamento</th>
              <th>Área</th>
              <th>Cargo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map(empleado => (
              <tr key={empleado.id}>
                <td>{empleado.ficha}</td>
                <td>{empleado.nombre_completo || 'Nombre no disponible'}</td>
                <td>{empleado.sede}</td>
                <td>{empleado.gerencia}</td>
                <td>{empleado.departamento}</td>
                <td>{empleado.area}</td>
                <td>{empleado.cargo}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-button edit-button" 
                      onClick={() => onEdit(empleado)}
                      title="Editar empleado"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="action-button delete-button" 
                      onClick={() => handleDelete(empleado)}
                      title="Eliminar empleado"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeList; 