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
import EmployeesWithoutEquipmentModal from './EmployeesWithoutEquipmentModal';
import UnassignAssetModal from './UnassignAssetModal';
import DeleteAssetModal from './DeleteAssetModal';
import NewAssetModal from './NewAssetModal';
import AssetModal from './AssetModal';

function AssetsView() {
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([
    {
      id: 'id',
      desc: true
    }
  ]);
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
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [sedes, setSedes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [rams, setRams] = useState([]);
  const [discos, setDiscos] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState({
    sedes: false,
    tipos: false,
    marcas: false,
    rams: false,
    discos: false
  });
  const [optionsError, setOptionsError] = useState({
    sedes: null,
    tipos: null,
    marcas: null,
    rams: null,
    discos: null
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewAssetModal, setShowNewAssetModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);

  const handleView = (asset) => {
    setSelectedAsset(asset);
    setShowAssetModal(true);
  };

  const handleEdit = (asset) => {
    console.log('Editar activo:', asset);
  };

  const handleDelete = (asset) => {
    setSelectedAsset(asset);
    setShowDeleteModal(true);
  };

  const handleAssignClick = (asset) => {
    setSelectedAsset(asset);
    if (asset.estado?.toLowerCase() === 'asignado') {
      setShowUnassignModal(true);
    } else {
      setShowModal(true);
    }
  };

  const handleAssignSuccess = () => {
    // Recargar los datos después de asignar
    fetchData();  // Asegúrate de tener esta función definida
    setShowModal(false);
    setSelectedAsset(null);
  };

  const handleUnassignSuccess = () => {
    fetchData();
    setShowUnassignModal(false);
    setSelectedAsset(null);
  };

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

  const fetchSedes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sedes');
      if (!response.ok) {
        throw new Error('Error al cargar sedes');
      }
      const data = await response.json();
      setSedes(data.map(sede => ({
        id: sede.id,
        nombre: sede.nombre
      })));
    } catch (error) {
      console.error('Error cargando sedes:', error);
      setOptionsError(prev => ({ ...prev, sedes: error.message }));
    }
  };

  const fetchOptions = async () => {
    const endpoints = {
      tipos: '/api/tipos',
      marcas: '/api/marcas',
      rams: '/api/rams',
      discos: '/api/discos'
    };

    for (const [key, endpoint] of Object.entries(endpoints)) {
      try {
        setLoadingOptions(prev => ({ ...prev, [key]: true }));
        setOptionsError(prev => ({ ...prev, [key]: null }));

        const response = await fetch(`http://localhost:5000${endpoint}`);
        if (!response.ok) throw new Error(`Error al cargar ${key}`);
        
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error(`Formato de datos inválido para ${key}`);
        }

        switch(key) {
          case 'tipos': setTipos(data); break;
          case 'marcas': setMarcas(data); break;
          case 'rams': setRams(data); break;
          case 'discos': setDiscos(data); break;
          default: break;
        }
      } catch (error) {
        console.error(`Error cargando ${key}:`, error);
        setOptionsError(prev => ({ ...prev, [key]: error.message }));
      } finally {
        setLoadingOptions(prev => ({ ...prev, [key]: false }));
      }
    }
  };

  useEffect(() => {
    fetchData();
    fetchSedes();
    fetchOptions();
  }, []);

  const handleSaveEdit = async (assetId, field, value) => {
    try {
      console.log('Saving edit:', { assetId, field, value }); // Para debugging
      const response = await fetch(`http://localhost:5000/api/activos/${assetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el activo');
      }

      // Actualizar los datos localmente
      setData(prevData => prevData.map(item => 
        item.id === assetId ? { ...item, [field]: value } : item
      ));

      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  const EditableCell = ({ value, row, field, displayField = field }) => {
    const isEditing = editingCell?.id === row.original.id && editingCell?.field === field;
    
    return isEditing ? (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => handleSaveEdit(row.original.id, field, editValue)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSaveEdit(row.original.id, field, editValue);
          }
        }}
        autoFocus
        className="editable-cell-input"
      />
    ) : (
      <span
        onDoubleClick={() => {
          setEditingCell({ id: row.original.id, field: field });
          setEditValue(value);
        }}
        className="editable-cell"
        title="Doble clic para editar"
      >
        {value}
      </span>
    );
  };

  const EditableCellSelect = ({ value, row, field, options }) => {
    const isEditing = editingCell?.id === row.original.id && editingCell?.field === field;
    const isLoading = loadingOptions[field];
    const error = optionsError[field];

    const handleDoubleClick = () => {
      console.log('Double click detected', field, row.original.id); // Para debugging
      setEditingCell({ id: row.original.id, field: field });
      setEditValue(value || '');
    };
    
    return isEditing ? (
      <div className="editable-cell-container">
        <select
          value={editValue}
          onChange={(e) => {
            handleSaveEdit(row.original.id, field, e.target.value);
            setEditingCell(null);
          }}
          onBlur={() => setEditingCell(null)}
          autoFocus
          className={`editable-cell-select ${isLoading ? 'loading' : ''} ${error ? 'error' : ''}`}
          disabled={isLoading}
        >
          <option value="">Seleccionar...</option>
          {options?.map(option => (
            <option 
              key={option.id || option} 
              value={option.nombre || option}
            >
              {option.nombre || option}
            </option>
          ))}
        </select>
        {isLoading && (
          <div className="editable-cell-loading">
            <span className="loading-spinner"></span>
          </div>
        )}
        {error && (
          <div className="editable-cell-error" title={error}>
            ⚠️
          </div>
        )}
      </div>
    ) : (
      <div 
        className="editable-cell-wrapper"
        onDoubleClick={handleDoubleClick}
        title="Doble clic para editar"
      >
        <span className="editable-cell">
          {value || ''}
        </span>
        <span className="edit-indicator">✎</span>
      </div>
    );
  };

  const columns = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: ({ getValue }) => getValue(),
      size: 70,
    },
    {
      header: 'Sede',
      accessorKey: 'sede',
      cell: ({ row, getValue }) => (
        <EditableCellSelect
          value={getValue()}
          row={row}
          field="sede"
          options={sedes}
        />
      )
    },
    {
      header: 'Tipo',
      accessorKey: 'tipo',
      cell: ({ row, getValue }) => (
        <EditableCellSelect
          value={getValue()}
          row={row}
          field="tipo"
          options={tipos}
        />
      )
    },
    {
      header: 'Estado',
      accessorKey: 'estado',
      cell: ({ row, getValue }) => (
        <span 
          className={`estado-badge ${getValue()?.toLowerCase()}`}
          onClick={() => handleAssignClick(row.original)}
          style={{ cursor: 'pointer' }}
        >
          {getValue()}
        </span>
      )
    },
    {
      header: 'Asignado a',
      accessorKey: 'empleado',
      cell: ({ getValue }) => getValue() || '-'
    },
    {
      header: 'Nombre Equipo',
      accessorKey: 'nombre_equipo',
      cell: ({ row, getValue }) => (
        <EditableCell 
          value={getValue()} 
          row={row} 
          field="nombre_equipo"
        />
      )
    },
    {
      header: 'Marca',
      accessorKey: 'marca',
      cell: ({ row, getValue }) => (
        <EditableCellSelect
          value={getValue()}
          row={row}
          field="marca"
          options={marcas}
        />
      )
    },
    {
      header: 'Modelo',
      accessorKey: 'modelo',
      cell: ({ row, getValue }) => (
        <EditableCell 
          value={getValue()} 
          row={row} 
          field="modelo"
        />
      )
    },
    {
      header: 'Serial',
      accessorKey: 'serial',
      cell: ({ row, getValue }) => (
        <EditableCell 
          value={getValue()} 
          row={row} 
          field="serial"
        />
      )
    },
    {
      header: 'Activo Fijo',
      accessorKey: 'activo_fijo',
      cell: ({ row, getValue }) => (
        <EditableCell 
          value={getValue()} 
          row={row} 
          field="activo_fijo"
        />
      )
    },
    {
      header: 'RAM',
      accessorKey: 'ram',
      cell: ({ row, getValue }) => (
        <EditableCellSelect
          value={getValue()}
          row={row}
          field="ram"
          options={rams}
        />
      ),
      show: false // Oculta por defecto
    },
    {
      header: 'Disco',
      accessorKey: 'disco',
      cell: ({ row, getValue }) => (
        <EditableCellSelect
          value={getValue()}
          row={row}
          field="disco"
          options={discos}
        />
      ),
      show: false // Oculta por defecto
    },
    {
      header: 'Acciones',
      id: 'Acciones',
      cell: ({ row }) => (
        <div className="acciones-cell">
          <FaEllipsisH onClick={() => handleView(row.original)} title="Ver detalles" />
          <FaTimes onClick={() => handleDelete(row.original)} title="Eliminar activo" />
        </div>
      )
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
    initialState: {
      sorting: [
        {
          id: 'id',
          desc: true
        }
      ]
    }
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

  const handleDeleteConfirm = async (assetId, newState) => {
    try {
      const response = await fetch(`http://localhost:5000/api/activos/${assetId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: newState })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del activo');
      }

      // Actualizar los datos localmente
      setData(prevData => prevData.map(item => 
        item.id === assetId ? { ...item, estado: newState } : item
      ));

      setShowDeleteModal(false);
      setSelectedAsset(null);
    } catch (error) {
      console.error('Error:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  const handleDeleteSuccess = () => {
    fetchData();  // Recargar los datos
    setShowDeleteModal(false);
    setSelectedAsset(null);
  };

  const handleAssetAdded = (newAsset) => {
    // Agregar el nuevo activo al inicio de la tabla
    setData(prevData => [newAsset, ...prevData]);
    setShowNewAssetModal(false);
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="App">
      <div className="header-container">
        <h1>Inventario de Activos</h1>
        <div className="header-buttons">
          <button 
            className="add-button"
            onClick={() => setShowNewAssetModal(true)}
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

      {showModal && (
        <EmployeesWithoutEquipmentModal
          asset={selectedAsset}
          onClose={() => setShowModal(false)}
          onAssign={handleAssignSuccess}
        />
      )}

      {showUnassignModal && (
        <UnassignAssetModal
          asset={selectedAsset}
          onClose={() => setShowUnassignModal(false)}
          onUnassign={handleUnassignSuccess}
        />
      )}

      {showDeleteModal && (
        <DeleteAssetModal
          asset={selectedAsset}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDeleteConfirm}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {showNewAssetModal && (
        <NewAssetModal 
          onClose={() => setShowNewAssetModal(false)}
          onAssetAdded={handleAssetAdded}
        />
      )}

      {showAssetModal && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setShowAssetModal(false)}
        />
      )}
    </div>
  );
}

export default AssetsView;