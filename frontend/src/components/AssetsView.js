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
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    sede: true,
    tipo: true,
    nombre_equipo: true,
    marca: true,
    estado: true,
    empleado: true,
    Acciones: true,
    modelo: false,
    serial: false,
    ram: false,
    disco: false,
    activo_fijo: false,
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });

  const handleView = (asset) => {
    console.log('Ver activo:', asset);
  };

  const handleEdit = (asset) => {
    console.log('Editar activo:', asset);
  };

  const handleDelete = (asset) => {
    console.log('Eliminar activo:', asset);
  };

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
      header: 'Sede',
      accessorKey: 'sede',
    },
    {
      header: 'Tipo',
      accessorKey: 'tipo',
    },
    {
      header: 'Nombre',
      accessorKey: 'nombre_equipo',
    },
    {
      header: 'Marca',
      accessorKey: 'marca',
    },
    {
      header: 'Estado',
      accessorKey: 'estado',
      cell: ({ getValue }) => {
        const estado = getValue()?.toLowerCase() || '';
        
        // Mapa simplificado de estados
        const estadosMap = {
          'asignado': 'Asignado',
          'disponible': 'Disponible',
          'reparacion': 'En Reparación'
        };

        const displayText = estadosMap[estado] || estado;

        return (
          <span className={`estado-badge ${estado}`}>
            {displayText}
          </span>
        );
      }
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
    {
      header: 'Modelo',
      accessorKey: 'modelo',
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
      header: 'Activo Fijo',
      accessorKey: 'activo_fijo',
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const ColumnVisibilityControls = () => (
    <div className={`column-settings ${showColumnSettings ? 'show' : ''}`}>
      <div className="column-settings-content">
        <div className="column-settings-header">
          <h3>Mostrar/Ocultar Columnas</h3>
          <button 
            className="close-settings-button"
            onClick={() => setShowColumnSettings(false)}
          >
            ×
          </button>
        </div>
        {table.getAllLeafColumns().map(column => {
          if (column.id === 'Acciones') return null;
          return (
            <label key={column.id} className="column-toggle">
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={column.getToggleVisibilityHandler()}
              />
              {column.columnDef.header}
            </label>
          );
        })}
      </div>
    </div>
  );

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="App">
      <div className="header-container">
        <h1>Inventario de Activos</h1>
        <div className="header-buttons">
          <button 
            className="add-button"
            onClick={() => {/* Manejar nuevo activo */}}
            title="Añadir nuevo activo"
          >
            <FaPlus className="add-icon" />
          </button>
          <button 
            className="settings-button"
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            title="Configurar columnas"
          >
            <FaCog className="settings-icon" />
          </button>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Buscar en todas las columnas..."
          className="search-input"
        />
      </div>

      <ColumnVisibilityControls />

      <div className="table-container">
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() && (
                      header.column.getIsSorted() === 'asc' ? ' 🔼' : ' 🔽'
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <span>
          Página{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} de{' '}
            {table.getPageCount()}
          </strong>
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
      </div>
    </div>
  );
}

export default AssetsView;