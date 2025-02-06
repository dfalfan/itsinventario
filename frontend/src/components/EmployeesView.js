import React, { useState, useEffect, useMemo } from 'react';
import { FaEllipsisH, FaTimes, FaPlus, FaLaptop, FaDesktop, FaMobileAlt } from 'react-icons/fa';
import TableView from './TableView';
import EmployeeModal from './EmployeeModal';
import NewEmployeeModal from './NewEmployeeModal';
import AssetModal from './AssetModal';
import SmartphoneModal from './SmartphoneModal';
import './EmployeesView.css';
import axios from 'axios';

// Componente para celdas editables
const EditableCell = ({ value, column, row, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setValue] = useState(value);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(value);
  }, [value]);

  // Función para obtener el mensaje del tooltip según el campo
  const getTooltipMessage = () => {
    switch (column.id) {
      case 'departamento':
        return !row.original.gerencia_id ? 'Primero debes seleccionar una Gerencia' : 'Doble clic para editar';
      case 'area':
        return !row.original.departamento_id ? 'Primero debes seleccionar un Departamento' : 'Doble clic para editar';
      case 'cargo':
        return !row.original.area_id ? 'Primero debes seleccionar un Área' : 'Doble clic para editar';
      default:
        return 'Doble clic para editar';
    }
  };

  const fetchOptions = async (field) => {
    setLoading(true);
    try {
      let response;
      switch (field) {
        case 'gerencia':
          response = await axios.get('http://192.168.141.50:5000/api/gerencias');
          setOptions(response.data);
          break;
        case 'departamento':
          if (row.original.gerencia_id) {
            response = await axios.get(`http://192.168.141.50:5000/api/departamentos/${row.original.gerencia_id}`);
            setOptions(response.data);
          }
          break;
        case 'area':
          if (row.original.departamento_id) {
            response = await axios.get(`http://192.168.141.50:5000/api/areas/${row.original.departamento_id}`);
            setOptions(response.data);
          }
          break;
        case 'cargo':
          if (row.original.area_id) {
            response = await axios.get(`http://192.168.141.50:5000/api/cargos/${row.original.area_id}`);
            setOptions(response.data.filter(cargo => cargo.asignado));
          }
          break;
      }
    } catch (error) {
      console.error('Error cargando opciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleClick = () => {
    if (['departamento', 'area', 'cargo'].includes(column.id)) {
      if ((column.id === 'departamento' && !row.original.gerencia_id) ||
          (column.id === 'area' && !row.original.departamento_id) ||
          (column.id === 'cargo' && !row.original.area_id)) {
        return;
      }
    }
    
    if (['gerencia', 'departamento', 'area', 'cargo'].includes(column.id)) {
      fetchOptions(column.id);
    }
    setIsEditing(true);
  };

  const handleChange = async (e) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (['gerencia', 'departamento', 'area', 'cargo'].includes(column.id)) {
      const selectedOption = options.find(opt => opt.id.toString() === newValue);
      if (selectedOption) {
        // Actualizar el campo con el ID correspondiente
        await onSave(row.original.id, `${column.id}_id`, selectedOption.id);
        
        // Actualizar el estado local con el nuevo valor
        setValue(selectedOption.nombre);
      }
    } else {
      await onSave(row.original.id, column.id, newValue);
    }
    
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleChange(e);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(value);
    }
  };

  if (isEditing) {
    if (['gerencia', 'departamento', 'area', 'cargo'].includes(column.id)) {
      return (
        <select
          value={currentValue || ''}
          onChange={handleChange}
          onBlur={handleChange}
          onKeyDown={handleKeyPress}
          autoFocus
          className="editable-cell-input"
          disabled={loading}
        >
          <option value="">Seleccione una opción</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.nombre}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={currentValue || ''}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleChange}
        onKeyDown={handleKeyPress}
        autoFocus
        className="editable-cell-input"
      />
    );
  }

  return (
    <div 
      onDoubleClick={handleDoubleClick} 
      className="editable-cell"
      title={getTooltipMessage()}
    >
      {value || 'Sin asignar'}
    </div>
  );
};

function EmployeesView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showSmartphoneModal, setShowSmartphoneModal] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    sede: true,
    ficha: false,
    cedula: false,
    nombre: true,
    gerencia: false,
    departamento: true,
    area: true,
    cargo: true,
    extension: false,
    correo: false,
    equipo_asignado: false,
    smartphone_asignado: false,
    acciones: true,
  });

  const columns = useMemo(
    () => [
      {
        header: 'Sede',
        accessorKey: 'sede',
      },
      {
        header: 'Ficha',
        accessorKey: 'ficha',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            column={{ id: 'ficha' }}
            row={row}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Cédula',
        accessorKey: 'cedula',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            column={{ id: 'cedula' }}
            row={row}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Nombre',
        accessorKey: 'nombre',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            column={{ id: 'nombre_completo' }}
            row={row}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Gerencia',
        accessorKey: 'gerencia',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            column={{ id: 'gerencia' }}
            row={row}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Departamento',
        accessorKey: 'departamento',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            column={{ id: 'departamento' }}
            row={row}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Área',
        accessorKey: 'area',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            column={{ id: 'area' }}
            row={row}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Cargo',
        accessorKey: 'cargo',
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            column={{ id: 'cargo' }}
            row={row}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'Equipo Asignado',
        accessorKey: 'equipo_asignado',
        cell: ({ row }) => {
          const equipo = row.original.equipo_asignado;
          const tipo = row.original.asset_type;
          const nombreEquipo = row.original.asset_name;
          
          if (!equipo) return <span className="no-equipment">Sin equipo asignado</span>;
          
          return (
            <span 
              className="equipment-type"
              onClick={() => handleViewEquipment(equipo)}
              title={nombreEquipo}
            >
              {tipo?.toUpperCase() === 'LAPTOP' ? (
                <FaLaptop className="equipment-icon" />
              ) : tipo?.toUpperCase() === 'AIO' || tipo?.toUpperCase() === 'PC' ? (
                <FaDesktop className="equipment-icon" />
              ) : null}
              <span className="equipment-id"> {equipo}</span>
              {nombreEquipo && <span className="equipment-name"> ({nombreEquipo})</span>}
            </span>
          );
        }
      },
      {
        header: 'Smartphone Asignado',
        accessorKey: 'smartphone_asignado',
        cell: ({ row }) => {
          const smartphone = row.original.smartphone_asignado;
          const modelo = row.original.smartphone_modelo;
          
          if (!smartphone) return <span className="no-equipment">Sin smartphone asignado</span>;
          
          return (
            <span 
              className="equipment-type"
              onClick={() => handleViewSmartphone(smartphone)}
              title={modelo}
            >
              <FaMobileAlt className="equipment-icon" />
              <span className="equipment-id"> {smartphone}</span>
              {modelo && <span className="equipment-name"> ({modelo})</span>}
            </span>
          );
        }
      },
      {
        header: 'Extensión',
        accessorKey: 'extension',
      },
      {
        header: 'Correo',
        accessorKey: 'correo',
      },
      {
        header: 'Acciones',
        id: 'acciones',
        cell: ({ row }) => (
          <div className="action-buttons">
            <button 
              onClick={() => handleViewEmployee(row.original)}
              className="action-button view-button"
              title="Ver detalles"
            >
              <FaEllipsisH />
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
    ],
    []
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.141.50:5000/api/empleados');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      // Procesar los datos para incluir la información del smartphone
      const processedData = jsonData.map(empleado => ({
        ...empleado,
        smartphone_asignado: empleado.sp_asignado ? empleado.sp_asignado.id : null,
        smartphone_modelo: empleado.sp_asignado ? `${empleado.sp_asignado.marca} ${empleado.sp_asignado.modelo}` : null,
        smartphone_linea: empleado.sp_asignado ? empleado.sp_asignado.linea : null
      }));
      
      setData(processedData);
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
      const response = await axios.patch(`http://192.168.141.50:5000/api/empleados/${id}`, { [field]: value });
      
      if (response.data.empleado) {
        // Actualizar el estado local con todos los datos actualizados del empleado
        setData(prevData => prevData.map(empleado => 
          empleado.id === id ? {
            ...empleado,
            gerencia: response.data.empleado.gerencia,
            gerencia_id: response.data.empleado.gerencia_id,
            departamento: response.data.empleado.departamento,
            departamento_id: response.data.empleado.departamento_id,
            area: response.data.empleado.area,
            area_id: response.data.empleado.area_id,
            cargo: response.data.empleado.cargo,
            cargo_id: response.data.empleado.cargo_id,
            [field]: value
          } : empleado
        ));
      }
    } catch (error) {
      console.error('Error al actualizar el empleado:', error);
      alert('Error al actualizar el campo');
    }
  };

  const handleDelete = async (employee) => {
    const confirmacion = window.confirm(`¿Confirmas eliminar a ${employee.nombre_completo || 'este empleado'}?`);
    if (confirmacion) {
      try {
        const response = await axios.delete(`http://192.168.141.50:5000/api/empleados/${employee.id}`);
        if (response.status === 200) {
          setData(prev => prev.filter(e => e.id !== employee.id));
          window.alert('Empleado eliminado exitosamente');
        }
      } catch (error) {
        console.error('Error:', error);
        window.alert(error.response?.data?.error || 'Error al eliminar');
      }
    }
  };

  const handleEmployeeAdded = (newEmployee) => {
    setData(prevData => [...prevData, newEmployee]);
    setShowNewEmployeeModal(false);
  };

  const handleViewEquipment = async (equipoAsignado) => {
    try {
      console.log('Equipo asignado (ID):', equipoAsignado);
      
      const response = await fetch(`http://192.168.141.50:5000/api/activos/buscar?nombre=${encodeURIComponent(equipoAsignado)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener detalles del equipo');
      }
      
      const asset = await response.json();
      console.log('Asset encontrado:', asset);
      setSelectedAsset(asset);
      setShowAssetModal(true);
    } catch (error) {
      console.error('Error completo:', error);
    }
  };

  const handleViewSmartphone = async (smartphoneId) => {
    try {
      console.log('Smartphone asignado (ID):', smartphoneId);
      
      const response = await fetch(`http://192.168.141.50:5000/api/smartphones/${smartphoneId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener detalles del smartphone');
      }
      
      const smartphone = await response.json();
      console.log('Smartphone encontrado:', smartphone);
      setSelectedAsset(smartphone);
      setShowSmartphoneModal(true);
    } catch (error) {
      console.error('Error al obtener detalles del smartphone:', error);
    }
  };

  const handleViewEmployee = async (empleado) => {
    try {
      const response = await fetch(`http://192.168.141.50:5000/api/empleados/${empleado.id}`);
      if (!response.ok) {
        throw new Error('Error al obtener datos del empleado');
      }
      const empleadoData = await response.json();
      setSelectedEmployee(empleadoData);
    } catch (error) {
      console.error('Error al obtener datos del empleado:', error);
    }
  };

  return (
    <div className="employees-view">
      <div className="header">
        <h2>Empleados</h2>
        <button
          className="add-button"
          onClick={() => setShowNewEmployeeModal(true)}
        >
          <FaPlus /> Nuevo Empleado
        </button>
      </div>

      <TableView
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        onFetchData={fetchData}
        defaultPageSize={30}
        defaultSorting={[{ id: 'nombre', desc: false }]}
      />

      {selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={fetchData}
        />
      )}

      {showNewEmployeeModal && (
        <NewEmployeeModal
          onClose={() => setShowNewEmployeeModal(false)}
          onEmployeeAdded={handleEmployeeAdded}
        />
      )}

      {showAssetModal && selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => {
            setShowAssetModal(false);
            setSelectedAsset(null);
          }}
        />
      )}

      {showSmartphoneModal && selectedAsset && (
        <SmartphoneModal
          smartphone={selectedAsset}
          onClose={() => {
            setShowSmartphoneModal(false);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}

export default EmployeesView; 