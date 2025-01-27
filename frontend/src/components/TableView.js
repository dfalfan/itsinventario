import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { FaCog, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { 
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import './TableView.css';

const DraggableHeader = ({ header, table }) => {
  const isSortable = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: header.id,
  });

  const style = {
    transform: transform ? `translateX(${transform.x}px)` : undefined,
    transition,
    width: header.column.getSize(),
  };

  const handleClick = (e) => {
    // Si el click fue en el ícono de ordenamiento o en el texto, permitir el ordenamiento
    if (!e.target.closest('.drag-handle')) {
      header.column.getToggleSortingHandler()?.(e);
    }
  };

  return (
    <th 
      ref={setNodeRef}
      style={style}
      className={isSortable ? 'sortable' : ''}
    >
      <div className="header-content">
        <div 
          className="drag-handle" 
          {...attributes} 
          {...listeners}
        >
          ⋮⋮
        </div>
        <div onClick={handleClick} style={{ cursor: 'pointer', flex: 1 }}>
          {flexRender(header.column.columnDef.header, header.getContext())}
          {isSortable && (
            <span className="sort-indicator">
              {sorted === false && <FaSort />}
              {sorted === 'asc' && <FaSortUp />}
              {sorted === 'desc' && <FaSortDown />}
            </span>
          )}
        </div>
      </div>
    </th>
  );
};

const TableView = ({
  data,
  columns,
  loading,
  error,
  columnVisibility,
  setColumnVisibility,
  onFetchData,
  defaultSorting = [],
  defaultPageSize = 30
}) => {
  const [sorting, setSorting] = useState(defaultSorting);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const [columnOrder, setColumnOrder] = useState(() => 
    columns
      .filter(col => col.id || col.accessorKey)
      .map(column => column.id || column.accessorKey)
  );

  // Calcular el ancho óptimo para cada columna
  const columnSizing = useMemo(() => {
    const sizing = {};
    columns.forEach(column => {
      const key = column.id || column.accessorKey;
      if (!key) return;

      try {
        // Obtener el ancho del encabezado
        const headerText = typeof column.header === 'string' ? 
          column.header : 
          column.header?.toString() || key;
        // Agregar espacio extra para el ícono de ordenamiento y el drag handle
        const headerWidth = (headerText.length * 7) + 45; // 7px por carácter + espacio para íconos

        // Obtener el ancho máximo del contenido en la página actual
        const contentWidth = data.reduce((max, row) => {
          const value = row[key];
          if (value == null) return max;
          const text = value.toString();
          const width = text.length * 7 + 16; // 7px por carácter + padding reducido
          return Math.max(max, width);
        }, 0);

        // Usar el mayor entre el ancho del encabezado y el contenido
        // El headerWidth se convierte en el mínimo absoluto
        sizing[key] = Math.max(headerWidth, contentWidth);
      } catch (error) {
        console.warn(`Error calculando ancho para columna ${key}:`, error);
        sizing[key] = 120; // ancho por defecto si hay error
      }
    });
    return sizing;
  }, [columns, data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      pagination,
      columnOrder,
      columnSizing,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting: true,
    defaultColumn: {
      minSize: 80,
      maxSize: 800,
      size: 120,
    },
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

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
        <div className="column-toggles">
          {table.getAllLeafColumns().map(column => {
            return (
              <div key={column.id} className="column-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                  />
                  {column.id}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="table-container">
      <div className="table-controls">
        <div className="search-container">
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            className="search-input"
          />
        </div>
        <button
          className="settings-button"
          onClick={() => setShowColumnSettings(!showColumnSettings)}
        >
          <FaCog />
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="table-wrapper">
            <table>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    <SortableContext
                      items={columnOrder}
                      strategy={horizontalListSortingStrategy}
                    >
                      {headerGroup.headers.map(header => (
                        <DraggableHeader
                          key={header.id}
                          header={header}
                          table={table}
                        />
                      ))}
                    </SortableContext>
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DndContext>
      )}

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

      <ColumnVisibilityControls />
    </div>
  );
};

export default TableView; 