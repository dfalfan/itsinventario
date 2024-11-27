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
import AssetsView from './components/AssetsView'; 
import UnassignAssetModal from './components/UnassignAssetModal';
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
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/empleados');
      
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

  const handleUnassignSuccess = async () => {
    await fetchData();
    setShowUnassignModal(false);
    setSelectedAsset(null);
  };

  const columns = [
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
      header: 'Equipo Asignado',
      accessorKey: 'equipo_asignado',
      cell: ({ row }) => {
        const equipo = row.original.equipo_asignado;
        
        if (!equipo) {
          return <span className="no-equipment">Sin equipo</span>;
        }

        const asset = {
          id: row.original.asset_id,
          tipo: equipo.split(' - ')[0],
          nombre_equipo: equipo.split(' - ')[1] || equipo,
          empleado: row.original.nombre
        };

        return (
          <span 
            className="equipment-type"
            onClick={() => {
              setSelectedAsset(asset);
              setShowUnassignModal(true);
            }}
            style={{ cursor: 'pointer' }}
            title="Click para ver detalles del equipo"
          >
            {equipo}
          </span>
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
    {
      header: 'Ficha',
      accessorKey: 'ficha',
      id: 'ficha',
    },
    {
      header: 'Gerencia',
      accessorKey: 'gerencia',
    },
    {
      header: 'Área',
      accessorKey: 'area',
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
            onClick={() => {
              console.log('Estado actual showColumnSettings:', showColumnSettings);
              setShowColumnSettings(!showColumnSettings);
            }}
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
      
      {showUnassignModal && (
        <UnassignAssetModal
          asset={selectedAsset}
          onClose={() => setShowUnassignModal(false)}
          onUnassign={handleUnassignSuccess}
        />
      )}
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