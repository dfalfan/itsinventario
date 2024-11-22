import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { FaCog, FaPlus } from 'react-icons/fa';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({
    ficha: false,
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/empleados');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("La respuesta no es JSON!");
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
      header: 'Ficha',
      accessorKey: 'ficha',
    },
    {
      header: 'Nombre',
      accessorKey: 'nombre',
    },
    {
      header: 'Sede',
      accessorKey: 'sede',
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
      header: 'Ext.',
      accessorKey: 'extension',
    },
    {
      header: 'Correo',
      accessorKey: 'correo',
    },
    {
      header: 'Más',
      cell: ({ row }) => (
        <button 
          onClick={() => console.log('Más info de:', row.original)}
          className="more-button"
        >
          •••
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
          if (column.id === 'Más') return null;
          
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

  if (loading) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="App">
          <div className="loading">Cargando datos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="App">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="App">
        <div className="header-container">
          <h1>Lista de Empleados</h1>
          <div className="header-buttons">
            <button 
              className="add-button"
              onClick={() => console.log('Añadir nuevo empleado')}
              title="Añadir nuevo empleado"
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
          {data.length === 0 ? (
            <p>No hay datos disponibles</p>
          ) : (
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
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted()] ?? null}
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
          )}
        </div>
      </div>
    </div>
  );
}

export default App;