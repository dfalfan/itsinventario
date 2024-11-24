import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { FaCog, FaPlus, FaPencilAlt, FaTimes, FaEllipsisH } from 'react-icons/fa';
import Navbar from './components/Navbar';
import EmployeeModal from './components/EmployeeModal';
import NewEmployeeModal from './components/NewEmployeeModal';
import DashboardView from './components/DashboardView';
import './App.css';

// Componentes de vista
function EmployeesView() {
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/empleados');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("La respuesta no es JSON!");
        }

        const jsonData = await response.json();
        const uniqueData = Array.from(new Map(jsonData.map(item => [item.ficha, item])).values());
        setData(uniqueData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([]);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      header: 'Ficha',
      accessorKey: 'ficha',
      id: 'ficha',
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
      cell: ({ getValue }) => {
        const tipo = getValue();
        return tipo ? (
          <span className="equipment-type">{tipo}</span>
        ) : (
          <span className="no-equipment">Sin equipo</span>
        );
      }
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
      header: 'Acciones',
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
  ];

  const handleEdit = (employee) => {
    console.log('Editar empleado:', employee);
  };

  const handleDelete = (employee) => {
    console.log('Eliminar empleado:', employee);
  };

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
    getRowId: row => row.ficha,
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

  return (
    <div className="App">
      <div className="header-container">
        <h1>Lista de Empleados</h1>
        <div className="header-buttons">
          <button 
            className="add-button"
            onClick={() => setShowNewEmployeeModal(true)}
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
          <>
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
          </>
        )}
      </div>

      {showNewEmployeeModal && (
        <NewEmployeeModal 
          onClose={() => setShowNewEmployeeModal(false)}
        />
      )}
      
      {selectedEmployee && (
        <EmployeeModal 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}

function AssetsView() {
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({});
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
        return estado ? (
          <span className={`estado-badge ${estado.toLowerCase()}`}>
            {estado}
          </span>
        ) : null;
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
      header: 'Notas',
      accessorKey: 'notas',
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

  const handleView = (asset) => {
    console.log('Ver activo:', asset);
  };

  const handleEdit = (asset) => {
    console.log('Editar activo:', asset);
  };

  const handleDelete = (asset) => {
    console.log('Eliminar activo:', asset);
  };

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
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/empleados" element={<EmployeesView />} />
          <Route path="/activos" element={<AssetsView />} />
          <Route path="/" element={<DashboardView />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;