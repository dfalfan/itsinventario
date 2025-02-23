import React, { useState, useEffect, useMemo } from 'react';
import { FaEllipsisH, FaTimes, FaPlus, FaLaptop, FaDesktop, FaMobileAlt, FaHistory, FaBolt } from 'react-icons/fa';
import TableView from './TableView';
import EmployeeModal from './EmployeeModal';
import NewEmployeeModal from './NewEmployeeModal';
import AssetModal from './AssetModal';
import SmartphoneModal from './SmartphoneModal';
import TimelineView from './TimelineView';
import ADUserModal from './ADUserModal';
import CreateADUserModal from './CreateADUserModal';
import CreateEmailModal from './CreateEmailModal';
import GenerarFirmaModal from './GenerarFirmaModal';
import GenerarBienvenidaModal from './GenerarBienvenidaModal';
import DeleteEmployeeModal from './DeleteEmployeeModal';
import './EmployeesView.css';
import axiosInstance from '../utils/axiosConfig';

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
          response = await axiosInstance.get('/api/gerencias');
          setOptions(response.data);
          break;
        case 'departamento':
          if (row.original.gerencia_id) {
            response = await axiosInstance.get(`/api/departamentos/${row.original.gerencia_id}`);
            setOptions(response.data);
          }
          break;
        case 'area':
          if (row.original.departamento_id) {
            response = await axiosInstance.get(`/api/areas/${row.original.departamento_id}`);
            setOptions(response.data);
          }
          break;
        case 'cargo':
          if (row.original.area_id) {
            response = await axiosInstance.get(`/api/cargos/${row.original.area_id}`);
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
  const [showTimeline, setShowTimeline] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState({
    sede: true,
    ficha: false,
    cedula: false,
    nombre: true,
    gerencia: true,
    departamento: true,
    area: true,
    cargo: true,
    extension: false,
    correo: false,
    equipo_asignado: false,
    smartphone_asignado: false,
    acciones: true,
  });
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [showADUserModal, setShowADUserModal] = useState(false);
  const [adUserInfo, setADUserInfo] = useState(null);
  const [showCreateADUserModal, setShowCreateADUserModal] = useState(false);
  const [selectedEmployeeForAD, setSelectedEmployeeForAD] = useState(null);
  const [showCreateEmailModal, setShowCreateEmailModal] = useState(false);
  const [selectedEmployeeForEmail, setSelectedEmployeeForEmail] = useState(null);
  const [showGenerarFirmaModal, setShowGenerarFirmaModal] = useState(false);
  const [selectedEmployeeForFirma, setSelectedEmployeeForFirma] = useState(null);
  const [showGenerarBienvenidaModal, setShowGenerarBienvenidaModal] = useState(false);
  const [selectedEmployeeForBienvenida, setSelectedEmployeeForBienvenida] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployeeForDelete, setSelectedEmployeeForDelete] = useState(null);

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
        accessorKey: 'acciones',
        cell: ({ row }) => (
          <div className={`action-buttons ${activeActionMenu === row.original.id ? 'menu-active' : ''}`}>
            <button
              className="action-button view-button"
              onClick={() => handleViewEmployee(row.original)}
              title="Ver detalles"
            >
              <FaEllipsisH />
            </button>

            <div className="quick-actions-container">
              <button
                className={`icon-button ${activeActionMenu === row.original.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveActionMenu(activeActionMenu === row.original.id ? null : row.original.id);
                }}
                title="Acciones rápidas"
              >
                <FaBolt />
              </button>
              {activeActionMenu === row.original.id && (
                <div className="quick-actions-menu">
                  <button onClick={() => {
                    setSelectedEmployeeForAD(row.original);
                    setShowCreateADUserModal(true);
                    setActiveActionMenu(null);
                  }}>
                    Crear usuario AD
                  </button>
                  <button onClick={() => {
                    setSelectedEmployeeForEmail(row.original);
                    setShowCreateEmailModal(true);
                    setActiveActionMenu(null);
                  }}>
                    Crear email
                  </button>
                  <button onClick={() => handleVerifyADUser(row.original)}>
                    Verificar usuario AD
                  </button>
                  <button onClick={() => {
                    setSelectedEmployeeForFirma(row.original);
                    setShowGenerarFirmaModal(true);
                    setActiveActionMenu(null);
                  }}>
                    Generar firma de correo
                  </button>
                  <button onClick={() => {
                    setSelectedEmployeeForBienvenida(row.original);
                    setShowGenerarBienvenidaModal(true);
                    setActiveActionMenu(null);
                  }}>
                    Generar bienvenida
                  </button>
                </div>
              )}
            </div>

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
    [activeActionMenu]
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
      const response = await axiosInstance.patch(`/api/empleados/${id}`, { [field]: value });
      if (response.data.success) {
        setData(old =>
          old.map(row =>
            row.id === id
              ? { ...row, [field]: value }
              : row
          )
        );
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  const handleDelete = (employee) => {
    setSelectedEmployeeForDelete(employee);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (options) => {
    try {
      const response = await axiosInstance.delete(`/api/empleados/${selectedEmployeeForDelete.id}`);
      if (response.data.success) {
        setData(data.filter(e => e.id !== selectedEmployeeForDelete.id));
        setSelectedEmployeeForDelete(null);
        window.alert('Empleado eliminado exitosamente');
      }
    } catch (error) {
      console.error('Error:', error);
      throw new Error(error.response?.data?.error || 'Error al eliminar');
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

  const generateADUsername = (nombre) => {
    if (!nombre) {
      console.log('Nombre vacío');
      return '';
    }
    
    console.log('Generando nombre de usuario para:', nombre);
    // Eliminar espacios extra y dividir el nombre
    const parts = nombre.trim().split(/\s+/);
    console.log('Partes del nombre:', parts);
    
    if (parts.length < 2) {
      console.log('Nombre incompleto');
      return '';
    }
    
    // El formato es "APELLIDOS NOMBRES", así que el nombre está al final
    const firstName = parts[parts.length - 1];
    const firstLetter = firstName.charAt(0);
    
    // El apellido es la primera palabra
    const lastName = parts[0];
    
    const username = `${firstLetter}${lastName}`.toLowerCase();
    console.log('Nombre de usuario generado:', username);
    return username;
  };

  const handleVerifyADUser = async (employee) => {
    try {
      console.log('Verificando empleado:', employee);
      
      if (!employee.nombre) {
        console.log('Empleado sin nombre');
        setADUserInfo({
          expectedUsername: '',
          exists: false,
          error: 'El empleado no tiene nombre asignado',
          loading: false
        });
        setShowADUserModal(true);
        return;
      }

      const expectedUsername = generateADUsername(employee.nombre);
      console.log('Nombre de usuario generado:', expectedUsername);
      
      if (!expectedUsername) {
        console.log('No se pudo generar el nombre de usuario');
        setADUserInfo({
          expectedUsername: '',
          exists: false,
          error: 'No se pudo generar el nombre de usuario. El formato del nombre debe ser "APELLIDOS NOMBRES"',
          loading: false
        });
        setShowADUserModal(true);
        return;
      }

      setADUserInfo({ expectedUsername, loading: true });
      setShowADUserModal(true);

      console.log('Haciendo petición al backend para:', expectedUsername);
      const response = await axiosInstance.get(`/api/verify-ad-user/${expectedUsername}`);
      console.log('Respuesta del backend:', response.data);
      
      setADUserInfo({
        expectedUsername,
        exists: response.data.exists,
        active: response.data.active,
        domain: response.data.domain,
        groups: response.data.groups,
        lastLogin: response.data.lastLogin,
        message: response.data.message,
        loading: false
      });
    } catch (error) {
      console.error('Error verificando usuario AD:', error);
      console.error('Detalles del error:', {
        response: error.response,
        message: error.message,
        config: error.config
      });
      
      setADUserInfo({
        expectedUsername: generateADUsername(employee.nombre) || '',
        exists: false,
        error: error.response?.data?.message || 'Error al verificar el usuario',
        loading: false
      });
    }
  };

  return (
    <div className="employees-view">
      <div className="header">
        <h2>Empleados</h2>
        <div className="header-buttons">
          <button className="history-button" onClick={() => setShowTimeline(true)}>
            <FaHistory className="history-icon" />
            Historial
          </button>
          <button
            className="add-button"
            onClick={() => setShowNewEmployeeModal(true)}
          >
            <FaPlus /> Nuevo Empleado
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
        onFetchData={fetchData}
        defaultPageSize={30}
        defaultSorting={[{ id: 'nombre', desc: false }]}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        activeActionMenu={activeActionMenu}
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

      {showTimeline && (
        <TimelineView
          categoria="employees"
          onClose={() => setShowTimeline(false)}
        />
      )}

      {showADUserModal && (
        <ADUserModal
          isOpen={showADUserModal}
          onClose={() => {
            setShowADUserModal(false);
            setADUserInfo(null);
          }}
          userInfo={adUserInfo}
        />
      )}

      {showCreateADUserModal && (
        <CreateADUserModal
          isOpen={showCreateADUserModal}
          onClose={() => {
            setShowCreateADUserModal(false);
            setSelectedEmployeeForAD(null);
          }}
          employee={selectedEmployeeForAD}
        />
      )}

      {showCreateEmailModal && (
        <CreateEmailModal
          isOpen={showCreateEmailModal}
          onClose={() => {
            setShowCreateEmailModal(false);
            setSelectedEmployeeForEmail(null);
          }}
          employee={selectedEmployeeForEmail}
        />
      )}

      {showGenerarFirmaModal && (
        <GenerarFirmaModal
          isOpen={showGenerarFirmaModal}
          onClose={() => {
            setShowGenerarFirmaModal(false);
            setSelectedEmployeeForFirma(null);
          }}
          employee={{
            nombre: selectedEmployeeForFirma?.nombre,
            cargo: selectedEmployeeForFirma?.cargo_area?.cargo_base?.nombre || selectedEmployeeForFirma?.cargo,
            extension: selectedEmployeeForFirma?.extension
          }}
        />
      )}

      {showGenerarBienvenidaModal && (
        <GenerarBienvenidaModal
          isOpen={showGenerarBienvenidaModal}
          onClose={() => {
            setShowGenerarBienvenidaModal(false);
            setSelectedEmployeeForBienvenida(null);
          }}
          employee={selectedEmployeeForBienvenida}
        />
      )}

      {showDeleteModal && selectedEmployeeForDelete && (
        <DeleteEmployeeModal
          employee={selectedEmployeeForDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedEmployeeForDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

export default EmployeesView; 