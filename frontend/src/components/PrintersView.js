import React, { useState, useMemo } from 'react';
import { FaEllipsisH, FaPencilAlt, FaTimes, FaPlus } from 'react-icons/fa';
import TableView from './TableView';
import './AssetsView.css';

function PrintersView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    sede: true,
    impresora: true,
    proveedor: true,
    acciones: true,
  });

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
      },
      {
        header: 'Sede',
        accessorKey: 'sede',
      },
      {
        header: 'Impresora',
        accessorKey: 'impresora',
      },
      {
        header: 'Proveedor',
        accessorKey: 'proveedor',
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
        <h2>Impresoras</h2>
        <div className="header-buttons">
          <button className="add-button">
            <FaPlus className="add-icon" />
            Agregar Impresora
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

export default PrintersView; 