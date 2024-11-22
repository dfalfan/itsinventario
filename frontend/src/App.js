import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="App">
        <h1>Lista de Empleados</h1>
        
        <div className="search-container">
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Buscar en todas las columnas..."
            className="search-input"
          />
        </div>

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