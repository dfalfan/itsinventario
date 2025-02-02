import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaEllipsisH, FaPencilAlt, FaTimes, FaPlus, FaUser, FaHistory } from 'react-icons/fa';
import TableView from './TableView';
import EmployeesWithoutEquipmentModal from './EmployeesWithoutEquipmentModal';
import UnassignAssetModal from './UnassignAssetModal';
import DeleteAssetModal from './DeleteAssetModal';
import NewAssetModal from './NewAssetModal';
import AssetModal from './AssetModal';
import EmployeeModal from './EmployeeModal';
import TimelineView from './TimelineView';
import BrandLogo from './BrandLogo';
import './AssetsView.css';
import axios from 'axios';

function AssetsView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewAssetModal, setShowNewAssetModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    sede: true,
    tipo: true,
    marca: true,
    modelo: true,
    estado: true,
    empleado: true,
    nombre_equipo: true,
    acciones: true,
    serial: false,
    ram: false,
    disco: false,
    activo_fijo: false,
    fecha_asignacion: false,
  });
  const [sedes, setSedes] = useState([]);
  const [tipos, setTipos] = useState(['LAPTOP', 'DESKTOP', 'AIO']);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [rams, setRams] = useState([]);
  const [discos, setDiscos] = useState([]);

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
            options={sedes.map(sede => ({ id: sede.id, nombre: sede.nombre }))}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Tipo',
        accessorKey: 'tipo',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.tipo}
            column={column}
            row={row}
            table={table}
            options={tipos}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Marca',
        accessorKey: 'marca',
        cell: ({ row }) => (
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
            options={modelos}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Estado',
        accessorKey: 'estado',
        cell: ({ row }) => {
          const estado = row.original.estado?.toLowerCase() || '';
          return (
            <span className={`estado-badge ${estado}`}>
              {row.original.estado}
            </span>
          );
        }
      },
      {
        header: 'Empleado',
        accessorKey: 'empleado',
        cell: ({ row }) => {
          const empleado = row.original.empleado;
          const empleadoId = row.original.empleado_id;
          
          if (!empleado) return <span className="no-employee">Sin asignar</span>;
          
          return (
            <span 
              className="employee-type"
              onClick={() => handleViewEmployee(empleadoId)}
              title={empleado}
            >
              <FaUser className="employee-icon" />
              <span className="employee-name">{empleado}</span>
            </span>
          );
        }
      },
      {
        header: 'Nombre de Equipo',
        accessorKey: 'nombre_equipo',
        cell: ({ row, column, table }) => (
          row.original.nombre_equipo ? 
          <EditableCell
            value={row.original.nombre_equipo}
            column={column}
            row={row}
            table={table}
            options={[]}
            onSave={handleSave}
          /> :
          <span className="no-employee">Sin asignar</span>
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
            options={[]}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'RAM',
        accessorKey: 'ram',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.ram}
            column={column}
            row={row}
            table={table}
            options={rams}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Disco',
        accessorKey: 'disco',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.disco}
            column={column}
            row={row}
            table={table}
            options={discos}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Activo Fijo',
        accessorKey: 'activo_fijo',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.activo_fijo}
            column={column}
            row={row}
            table={table}
            options={[]}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Fecha de Asignación',
        accessorKey: 'fecha_asignacion',
        cell: ({ row }) => {
          const fecha = row.original.fecha_asignacion;
          if (!fecha) return <span className="no-employee">Sin asignar</span>;
          return new Date(fecha).toLocaleDateString('es-ES');
        }
      },
      {
        header: 'Acciones',
        id: 'acciones',
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
              onClick={() => handleAssignClick(row.original)}
              className="action-button assign-button"
              title={row.original.estado?.toLowerCase() === 'asignado' ? 'Desasignar' : 'Asignar'}
            >
              {row.original.estado?.toLowerCase() === 'asignado' ? '↩' : '→'}
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
      }
    ],
    [sedes, tipos, marcas, modelos, rams, discos]
  );

  useEffect(() => {
    fetchData();
    fetchSedes();
    fetchMarcas();
    fetchModelos();
    fetchRams();
    fetchDiscos();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.141.50:5000/api/activos');
      
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
      const response = await fetch('http://192.168.141.50:5000/api/sedes');
      if (!response.ok) throw new Error('Error al cargar sedes');
      const data = await response.json();
      setSedes(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMarcas = async () => {
    try {
      const response = await fetch('http://192.168.141.50:5000/api/marcas');
      if (!response.ok) throw new Error('Error al cargar marcas');
      const data = await response.json();
      setMarcas(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchModelos = async () => {
    try {
      const response = await fetch('http://192.168.141.50:5000/api/modelos');
      if (!response.ok) throw new Error('Error al cargar modelos');
      const data = await response.json();
      setModelos(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchRams = async () => {
    try {
      const response = await fetch('http://192.168.141.50:5000/api/rams');
      if (!response.ok) throw new Error('Error al cargar tipos de RAM');
      const data = await response.json();
      setRams(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchDiscos = async () => {
    try {
      const response = await fetch('http://192.168.141.50:5000/api/discos');
      if (!response.ok) throw new Error('Error al cargar tipos de disco');
      const data = await response.json();
      setDiscos(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleView = (asset) => {
    setSelectedAsset(asset);
    setShowAssetModal(true);
  };

  const handleAssignClick = (asset) => {
    setSelectedAsset(asset);
    if (asset.estado?.toLowerCase() === 'asignado') {
      setShowUnassignModal(true);
    } else {
      setShowModal(true);
    }
  };

  const handleDelete = (asset) => {
    setSelectedAsset(asset);
    setShowDeleteModal(true);
  };

  const handleAssignSuccess = () => {
    fetchData();
    setShowModal(false);
    setSelectedAsset(null);
  };

  const handleUnassignSuccess = () => {
    fetchData();
    setShowUnassignModal(false);
      setSelectedAsset(null);
  };

  const handleDeleteSuccess = () => {
    fetchData();
    setShowDeleteModal(false);
    setSelectedAsset(null);
  };

  const handleAssetAdded = (newAsset) => {
    setData(prevData => [...prevData, newAsset]);
    setShowNewAssetModal(false);
  };

  const handleViewEmployee = async (empleadoId) => {
    try {
      const response = await fetch(`http://192.168.141.50:5000/api/empleados/${empleadoId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener detalles del empleado');
      }
      
      const empleado = await response.json();
      setSelectedEmployee(empleado);
      setShowEmployeeModal(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async (id, field, value) => {
    try {
      await axios.patch(`http://192.168.141.50:5000/api/activos/${id}`, { [field]: value });
      // Actualizar el estado local
      setData(prevData => prevData.map(asset => 
        asset.id === id ? { ...asset, [field]: value } : asset
      ));
    } catch (error) {
      console.error('Error al actualizar el activo:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  const EditableCell = ({ value, column, row, table, options, onSave }) => {
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
            const newValue = e.target.value;
            setCurrentValue(newValue);
            onSave(row.original.id, column.id, newValue);
            setIsEditing(false);
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            setCurrentValue(value);
        }
    };

    // Determinar si el campo debe ser un input de texto o un select
    const textFields = ['modelo', 'nombre_equipo', 'serial', 'activo_fijo'];
    const selectFields = ['sede', 'tipo', 'marca', 'ram', 'disco'];
    const isTextField = textFields.includes(column.id);
    const isSelectField = selectFields.includes(column.id);

    if (isEditing && (isTextField || isSelectField)) {
        if (isTextField) {
            return (
                <input
                    type="text"
                    value={currentValue || ''}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onBlur={handleChange}
                    onKeyDown={handleKeyPress}
                    autoFocus
                    className="editable-cell-input"
                />
            );
        }

        if (isSelectField) {
            return (
                <select
                    value={currentValue || ''}
                    onChange={handleChange}
                    onBlur={() => setIsEditing(false)}
                    autoFocus
                >
                    <option value="">Seleccionar...</option>
                    {Array.isArray(options) ? 
                        options.map((option) => (
                            <option key={option.id || option} value={option.nombre || option}>
                                {option.nombre || option}
                            </option>
                        ))
                        : null
                    }
                </select>
            );
        }
    }

    return (
        <div onDoubleClick={handleDoubleClick} className="editable-cell">
            {value || 'Sin asignar'}
        </div>
    );
  };

  return (
    <div className="assets-view">
      <div className="header">
        <h2>Activos</h2>
        <div className="header-buttons">
          <button className="history-button" onClick={() => setShowTimeline(true)}>
            <FaHistory className="history-icon" />
            Historial
          </button>
          <button className="add-button" onClick={() => setShowNewAssetModal(true)}>
            <FaPlus className="add-icon" />
            Agregar Activo
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

      {showModal && selectedAsset && (
        <EmployeesWithoutEquipmentModal
          onClose={() => setShowModal(false)}
          onAssign={handleAssignSuccess}
          asset={selectedAsset}
        />
      )}

      {showUnassignModal && selectedAsset && (
        <UnassignAssetModal
          asset={selectedAsset}
          onClose={() => setShowUnassignModal(false)}
          onUnassign={handleUnassignSuccess}
        />
      )}

      {showDeleteModal && selectedAsset && (
        <DeleteAssetModal
          asset={selectedAsset}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {showNewAssetModal && (
        <NewAssetModal 
          onClose={() => setShowNewAssetModal(false)}
          onAssetAdded={handleAssetAdded}
        />
      )}

      {showAssetModal && selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => {
            setShowAssetModal(false);
            setSelectedAsset(null);
          }}
          onUpdate={fetchData}
        />
      )}

      {showEmployeeModal && selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => {
            setShowEmployeeModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {showTimeline && (
        <TimelineView
          categoria="assets"
          onClose={() => setShowTimeline(false)}
        />
      )}
    </div>
  );
}

export default AssetsView;