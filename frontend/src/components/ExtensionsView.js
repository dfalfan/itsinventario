import React, { useState, useEffect, useMemo } from 'react';
import TableView from './TableView';
import axios from 'axios';
import './AssetsView.css';

function ExtensionsView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({
    sede: true,
    nombre: true,
    departamento: true,
    cargo: true,
    extension: true,
  });

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
        .sort((a, b) => a.extension.localeCompare(b.extension));
      
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

  const handleSave = async (id, field, value) => {
    try {
      await axios.patch(`http://192.168.141.50:5000/api/empleados/${id}`, { [field]: value });
      // Actualizar el estado local
      setData(prevData => prevData.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Error al actualizar la extensión:', error);
    }
  };

  const EditableCell = ({ value, column, row, table, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleChange = (e) => {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      onSave(row.original.id, column.id, newValue);
      setIsEditing(false);
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        const newValue = e.target.value;
        setCurrentValue(newValue);
        onSave(row.original.id, column.id, newValue);
        setIsEditing(false);
      }
      if (e.key === 'Escape') {
        setIsEditing(false);
        setCurrentValue(value);
      }
    };

    if (isEditing) {
      return (
        <input
          type="text"
          value={currentValue || ''}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleChange}
          onKeyDown={handleKeyPress}
          autoFocus
          className="editable-cell-input extension-input"
        />
      );
    }

    return (
      <div onDoubleClick={handleDoubleClick} className="editable-cell">
        <span className="extension-number large">
          {value || 'Sin asignar'}
        </span>
      </div>
    );
  };

  const columns = useMemo(
    () => [
      {
        header: 'Sede',
        accessorKey: 'sede',
      },
      {
        header: 'Nombre',
        accessorKey: 'nombre',
      },
      {
        header: 'Departamento',
        accessorKey: 'departamento',
      },
      {
        header: 'Cargo',
        accessorKey: 'cargo',
      },
      {
        header: 'Extensión',
        accessorKey: 'extension',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.extension}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      }
    ],
    []
  );

  return (
    <div className="assets-view">
      <div className="header">
        <h2>Extensiones</h2>
      </div>

      <TableView
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        defaultPageSize={30}
        defaultSorting={[{ id: 'extension', desc: false }]}
      />
    </div>
  );
}

export default ExtensionsView; 