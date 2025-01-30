import React, { useState, useEffect, useMemo } from 'react';
import { FaEllipsisH, FaPencilAlt, FaTimes, FaPlus, FaUser } from 'react-icons/fa';
import TableView from './TableView';
import axios from 'axios';
import './AssetsView.css';

function SmartphonesView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    marca: true,
    modelo: true,
    serial: true,
    estado: true,
    empleado: true,
    linea: true,
    imei: false,
    imei2: false,
    fecha_asignacion: false,
    acciones: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.141.50:5000/api/smartphones');
      
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

  const handleSave = async (id, field, value) => {
    try {
      await axios.patch(`http://192.168.141.50:5000/api/smartphones/${id}`, { [field]: value });
      // Actualizar el estado local
      setData(prevData => prevData.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));
    } catch (error) {
      console.error('Error al actualizar el smartphone:', error);
    }
  };

  const handleAssign = async (id) => {
    try {
      await axios.post(`http://192.168.141.50:5000/api/smartphones/${id}/asignar`);
      fetchData(); // Recargar datos
    } catch (error) {
      console.error('Error al asignar el smartphone:', error);
    }
  };

  const handleUnassign = async (id) => {
    try {
      await axios.post(`http://192.168.141.50:5000/api/smartphones/${id}/desasignar`);
      fetchData(); // Recargar datos
    } catch (error) {
      console.error('Error al desasignar el smartphone:', error);
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
          className="editable-cell-input"
        />
      );
    }

    return (
      <div onDoubleClick={handleDoubleClick} className="editable-cell">
        {value || 'Sin asignar'}
      </div>
    );
  };

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
      },
      {
        header: 'Marca',
        accessorKey: 'marca',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.marca}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Modelo',
        accessorKey: 'modelo',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.modelo}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Serial',
        accessorKey: 'serial',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.serial}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'IMEI',
        accessorKey: 'imei',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.imei}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'IMEI2',
        accessorKey: 'imei2',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.imei2}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Estado',
        accessorKey: 'estado',
        cell: ({ row }) => {
          const estado = row.original.estado?.toLowerCase() || '';
          return (
            <span className={`estado-badge ${estado}`}>
              {row.original.estado || 'Sin asignar'}
            </span>
          );
        }
      },
      {
        header: 'Empleado',
        accessorKey: 'empleado',
        cell: ({ row }) => {
          const empleado = row.original.empleado;
          if (!empleado) return <span className="no-employee">Sin asignar</span>;
          
          return (
            <span className="employee-type">
              <FaUser className="employee-icon" />
              <span className="employee-name">{empleado}</span>
            </span>
          );
        }
      },
      {
        header: 'Línea',
        accessorKey: 'linea',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.linea}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Fecha de Asignación',
        accessorKey: 'fecha_asignacion',
        cell: ({ row }) => {
          const fecha = row.original.fecha_asignacion;
          if (!fecha) return <span className="no-employee">Sin asignar</span>;
          return new Date(fecha).toLocaleDateString('es-ES');
        }
      },
      {
        header: 'Acciones',
        id: 'acciones',
        cell: ({ row }) => (
          <div className="action-buttons">
            <button 
              className="action-button view-button"
              title="Ver detalles"
            >
              <FaEllipsisH />
            </button>
            <button 
              onClick={() => row.original.empleado ? handleUnassign(row.original.id) : handleAssign(row.original.id)}
              className="action-button assign-button"
              title={row.original.empleado ? 'Desasignar' : 'Asignar'}
            >
              {row.original.empleado ? '↩' : '→'}
            </button>
            <button 
              className="action-button delete-button"
              title="Eliminar"
            >
              <FaTimes />
            </button>
          </div>
        ),
      }
    ],
    []
  );

  return (
    <div className="assets-view">
      <div className="header">
        <h2>Smartphones</h2>
        <div className="header-buttons">
          <button className="add-button">
            <FaPlus className="add-icon" />
            Agregar Smartphone
          </button>
        </div>
      </div>

      <TableView
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        defaultPageSize={30}
        defaultSorting={[{ id: 'id', desc: false }]}
      />
    </div>
  );
}

export default SmartphonesView; 