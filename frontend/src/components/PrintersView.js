import React, { useState, useEffect, useMemo } from 'react';
import { FaEllipsisH, FaPencilAlt, FaTimes, FaPlus, FaExternalLinkAlt } from 'react-icons/fa';
import TableView from './TableView';
import axios from 'axios';
import './AssetsView.css';
import AddPrinterModal from './AddPrinterModal';
import BrandLogo from './BrandLogo';

function PrintersView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    sede: true,
    marca: true,
    modelo: true,
    nombre: true,
    serial: true,
    ip: true,
    proveedor: true,
    acciones: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.141.50:5000/api/impresoras');
      
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

  const handleSave = async (id, field, value) => {
    try {
      console.log('handleSave called:', { id, field, value });
      const response = await axios.patch(`http://192.168.141.50:5000/api/impresoras/${id}`, { [field]: value });
      console.log('API Response:', response.data);
      
      if (response.data.message) {
        console.log('Updating state with:', { field, value, updates: response.data.updated_fields });
        setData(prevData => prevData.map(item => 
          item.id === id ? { ...item, [field]: value, ...response.data.updated_fields } : item
        ));
        return true;
      }
      console.log('Update not successful');
      return false;
    } catch (error) {
      console.error('Error in handleSave:', error);
      return false;
    }
  };

  const EditableCell = ({ value, column, row, table, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const [sedes, setSedes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      console.log('Value changed:', { value, currentValue, column: column.id });
      setCurrentValue(value);
    }, [value]);

    useEffect(() => {
      if (column.id === 'sede' && isEditing) {
        fetchSedes();
      }
    }, [isEditing, column.id]);

    const fetchSedes = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://192.168.141.50:5000/api/sedes');
        if (!response.ok) throw new Error('Error al cargar sedes');
        const data = await response.json();
        console.log('Sedes loaded:', data);
        setSedes(data);
      } catch (error) {
        console.error('Error loading sedes:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleDoubleClick = () => {
      console.log('Double click, starting edit mode');
      setIsEditing(true);
    };

    const handleInputChange = (e) => {
      console.log('Input value changed:', e.target.value);
      setCurrentValue(e.target.value);
    };

    const handleChange = async (e) => {
      const newValue = e.target.value;
      console.log('handleChange called:', { newValue, field: column.id });
      
      try {
        let success;
        if (column.id === 'sede') {
          const selectedSede = sedes.find(sede => sede.id.toString() === newValue);
          console.log('Selected sede:', selectedSede);
          if (selectedSede) {
            success = await onSave(row.original.id, 'sede_id', selectedSede.id);
          }
        } else if (column.id === 'marca' || column.id === 'proveedor') {
          success = await onSave(row.original.id, column.id, newValue);
        } else {
          success = await onSave(row.original.id, column.id, newValue);
        }

        console.log('Save result:', success);
        if (success) {
          setCurrentValue(newValue);
        } else {
          console.log('Save failed, reverting to:', value);
          setCurrentValue(value);
        }
      } catch (error) {
        console.error('Error in handleChange:', error);
        setCurrentValue(value);
      }
      setIsEditing(false);
    };

    const handleBlur = () => {
      console.log('Input/Select blurred');
      setIsEditing(false);
    };

    if (isEditing) {
      if (column.id === 'sede') {
        return (
          <select
            value={currentValue || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoFocus
            className="editable-cell-input"
            disabled={loading}
          >
            <option value="">Seleccione una sede</option>
            {sedes.map(sede => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
        );
      }

      if (column.id === 'marca') {
        return (
          <select
            value={currentValue || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoFocus
            className="editable-cell-input"
          >
            <option value="">Seleccione una marca</option>
            {['Canon', 'HP', 'Kyocera', 'Konica', 'Lexmark', 'Epson'].map(marca => (
              <option key={marca} value={marca}>
                {marca}
              </option>
            ))}
          </select>
        );
      }

      if (column.id === 'proveedor') {
        return (
          <select
            value={currentValue || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            autoFocus
            className="editable-cell-input"
          >
            <option value="">Seleccione un proveedor</option>
            <option value="DELCOP">DELCOP</option>
            <option value="SYSCOPY">SYSCOPY</option>
          </select>
        );
      }

      return (
        <input
          type="text"
          value={currentValue || ''}
          onChange={handleInputChange}
          onBlur={handleChange}
          autoFocus
          className="editable-cell-input"
        />
      );
    }

    return (
      <div onDoubleClick={handleDoubleClick} className="editable-cell">
        {value || 'Sin asignar'}
      </div>
    );
  };

  const IpCell = ({ value, column, row, table, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleChange = (e) => {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      onSave(row.original.id, column.id, newValue);
      setIsEditing(false);
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleChange(e);
      }
      if (e.key === 'Escape') {
        setIsEditing(false);
        setCurrentValue(value);
      }
    };

    const handleClick = () => {
      if (!isEditing && value) {
        const url = row.original.url || `http://${value}:8000/rps/`;
        window.open(url, '_blank');
      }
    };

    if (isEditing) {
      return (
        <input
          type="text"
          value={currentValue || ''}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleChange}
          onKeyDown={handleKeyPress}
          autoFocus
          className="editable-cell-input"
          pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
          placeholder="Ej: 192.168.141.20"
          title="Ingrese una dirección IP válida (Ej: 192.168.141.20)"
        />
      );
    }

    return (
      <div 
        onClick={handleClick}
        onDoubleClick={handleDoubleClick} 
        className={`editable-cell ip-cell ${value ? 'clickable' : ''}`}
        title={value ? 'Haga clic para abrir la configuración' : 'Doble clic para editar'}
      >
        {value || 'Sin asignar'}
      </div>
    );
  };

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
      },
      {
        header: 'Sede',
        accessorKey: 'sede',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.sede}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Marca',
        accessorKey: 'marca',
        cell: ({ row, column, table }) => (
          <BrandLogo 
            brand={row.original.marca} 
            onSave={(newValue) => handleSave(row.original.id, 'marca', newValue)}
            isEditable={true}
          />
        )
      },
      {
        header: 'Modelo',
        accessorKey: 'modelo',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.modelo}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Nombre',
        accessorKey: 'nombre',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.nombre}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Serial',
        accessorKey: 'serial',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.serial}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'IP',
        accessorKey: 'ip',
        cell: ({ row }) => {
          const ip = row.original.ip;
          const url = row.original.url;
          
          if (!ip) return <span>Sin asignar</span>;
          
          return (
            <a 
              className={`ip-cell ${url ? 'clickable' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (url) window.open(url, '_blank');
              }}
              href={url || '#'}
              title={url ? 'Haga clic para abrir la configuración' : ''}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: url ? 'underline' : 'none',
                color: url ? '#0066cc' : 'inherit',
                cursor: url ? 'pointer' : 'default',
                fontFamily: 'monospace',
                fontSize: '0.95rem'
              }}
            >
              {ip}
              {url && <span style={{ marginLeft: '6px', fontSize: '0.8em', opacity: 0.7 }}>🔗</span>}
            </a>
          );
        }
      },
      {
        header: 'Proveedor',
        accessorKey: 'proveedor',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.proveedor}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
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

  const handleAddPrinter = (newPrinter) => {
    setData(prevData => [...prevData, newPrinter]);
  };

  return (
    <div className="assets-view">
      <div className="header">
        <h2>Impresoras</h2>
        <div className="header-buttons">
          <button className="add-button" onClick={() => setShowAddModal(true)}>
            <FaPlus className="add-icon" />
            Agregar Impresora
          </button>
        </div>
      </div>

      {showAddModal && (
        <AddPrinterModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPrinter}
        />
      )}

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