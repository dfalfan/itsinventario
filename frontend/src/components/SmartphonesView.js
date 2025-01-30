import React, { useState, useMemo } from 'react';
import { FaEllipsisH, FaPencilAlt, FaTimes, FaPlus, FaUser } from 'react-icons/fa';
import TableView from './TableView';
import './AssetsView.css';

function SmartphonesView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
      },
      {
        header: 'Marca',
        accessorKey: 'marca',
      },
      {
        header: 'Modelo',
        accessorKey: 'modelo',
      },
      {
        header: 'Serial',
        accessorKey: 'serial',
      },
      {
        header: 'IMEI',
        accessorKey: 'imei',
      },
      {
        header: 'IMEI2',
        accessorKey: 'imei2',
      },
      {
        header: 'Estado',
        accessorKey: 'estado',
        cell: ({ row }) => {
          const estado = row.original.estado?.toLowerCase() || '';
          return (
            <span className={`estado-badge ${estado}`}>
              {row.original.estado}
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
              className="action-button assign-button"
              title="Asignar"
            >
              →
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