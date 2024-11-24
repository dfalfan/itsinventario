import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { FaCog, FaPlus, FaPencilAlt, FaTimes, FaEllipsisH } from 'react-icons/fa';
import './AssetsView.css';

function AssetsView() {
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/activos');
        
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

    fetchData();
  }, []);

  const columns = [
    {
      header: 'Tipo',
      accessorKey: 'tipo',
    },
    {
      header: 'Nombre Equipo',
      accessorKey: 'nombre_equipo',
    },
    {
      header: 'Modelo',
      accessorKey: 'modelo',
    },
    {
      header: 'Marca',
      accessorKey: 'marca',
    },
    {
      header: 'Serial',
      accessorKey: 'serial',
    },
    {
      header: 'RAM',
      accessorKey: 'ram',
    },
    {
      header: 'Disco',
      accessorKey: 'disco',
    },
    {
      header: 'Estado',
      accessorKey: 'estado',
      cell: ({ getValue }) => {
        const estado = getValue();
        return (
          <span className={`estado-badge ${estado.toLowerCase()}`}>
            {estado}
          </span>
        );
      }
    },
    {
      header: 'Activo Fijo',
      accessorKey: 'activo_fijo',
    },
    {
      header: 'Sede',
      accessorKey: 'sede',
    },
    {
      header: 'Asignado a',
      accessorKey: 'empleado',
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="action-buttons">
          <button 
            onClick={() => handleView(row.original)}
            className="action-button view-button"
            title="Ver detalles"
          >
            <FaEllipsisH />
          </button>
          <button 
            onClick={() => handleEdit(row.original)}
            className="action-button edit-button"
            title="Editar activo"
          >
            <FaPencilAlt />
          </button>
          <button 
            onClick={() => handleDelete(row.original)}
            className="action-button delete-button"
            title="Eliminar activo"
          >
            <FaTimes />
          </button>
        </div>
      ),
    },
  ];

  // ... resto del código similar al de App.js para la tabla

  return (
    <div className="assets-view">
      <div className="header-container">
        <h1>Inventario de Activos</h1>
        <button 
          className="add-button"
          onClick={() => {/* Manejar nuevo activo */}}
          title="Añadir nuevo activo"
        >
          <FaPlus className="add-icon" />
        </button>
      </div>
      
      {/* Resto del JSX similar al de App.js */}
    </div>
  );
}

export default AssetsView;