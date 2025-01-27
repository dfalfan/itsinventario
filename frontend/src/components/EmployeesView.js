import React, { useState, useEffect, useMemo } from 'react';
import { FaEllipsisH, FaPencilAlt, FaTimes, FaPlus } from 'react-icons/fa';
import TableView from './TableView';
import EmployeeModal from './EmployeeModal';
import NewEmployeeModal from './NewEmployeeModal';
import './EmployeesView.css';

function EmployeesView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({
    sede: true,
    nombre: true,
    departamento: true,
    cargo: true,
    equipo_asignado: true,
    extension: true,
    correo: true,
    Acciones: true,
    ficha: false,
    gerencia: false,
    area: false,
  });

  const columns = useMemo(
    () => [
      {
        header: 'Sede',
        accessorKey: 'sede',
      },
      {
        header: 'Ficha',
        accessorKey: 'ficha',
      },
      {
        header: 'Nombre',
        accessorKey: 'nombre',
      },
      {
        header: 'Gerencia',
        accessorKey: 'gerencia',
      },
      {
        header: 'Departamento',
        accessorKey: 'departamento',
      },
      {
        header: 'Área',
        accessorKey: 'area',
      },
      {
        header: 'Cargo',
        accessorKey: 'cargo',
      },
      {
        header: 'Equipo Asignado',
        accessorKey: 'equipo_asignado',
      },
      {
        header: 'Acciones',
        id: 'acciones',
        cell: ({ row }) => (
          <div className="action-buttons">
            <button 
              onClick={() => setSelectedEmployee(row.original)}
              className="action-button view-button"
              title="Ver detalles"
            >
              <FaEllipsisH />
            </button>
            <button 
              onClick={() => handleEdit(row.original)}
              className="action-button edit-button"
              title="Editar empleado"
            >
              <FaPencilAlt />
            </button>
            <button 
              onClick={() => handleDelete(row.original)}
              className="action-button delete-button"
              title="Eliminar empleado"
            >
              <FaTimes />
            </button>
          </div>
        ),
      },
    ],
    []
  );

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
      
      const jsonData = await response.json();
      setData(jsonData);
      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(`Error cargando datos: ${error.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    console.log('Editar empleado:', employee);
  };

  const handleDelete = (employee) => {
    console.log('Eliminar empleado:', employee);
  };

  const handleEmployeeAdded = (newEmployee) => {
    setData(prevData => [...prevData, newEmployee]);
    setShowNewEmployeeModal(false);
  };

  return (
    <div className="employees-view">
      <div className="header">
        <h2>Empleados</h2>
        <button
          className="add-button"
          onClick={() => setShowNewEmployeeModal(true)}
        >
          <FaPlus /> Nuevo Empleado
        </button>
      </div>

      <TableView
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        onFetchData={fetchData}
        defaultPageSize={30}
      />

      {selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={fetchData}
        />
      )}

      {showNewEmployeeModal && (
        <NewEmployeeModal
          onClose={() => setShowNewEmployeeModal(false)}
          onEmployeeAdded={handleEmployeeAdded}
        />
      )}
    </div>
  );
}

export default EmployeesView; 