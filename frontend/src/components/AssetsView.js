import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaEllipsisH, FaPencilAlt, FaTimes, FaPlus, FaUser, FaHistory, FaBolt } from 'react-icons/fa';
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
import axiosInstance from '../utils/axiosConfig';

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
  const [activeActionMenu, setActiveActionMenu] = useState(null);
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
  const [showConstanciaModal, setShowConstanciaModal] = useState(false);
  const [showADVerifyModal, setShowADVerifyModal] = useState(false);
  const [adEquipmentInfo, setADEquipmentInfo] = useState(null);

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
          <div className={`action-buttons ${activeActionMenu === row.original.id ? 'menu-active' : ''}`}>
            <button 
              onClick={() => handleView(row.original)}
              className="action-button view-button"
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
                    handleAssignClick(row.original);
                    setActiveActionMenu(null);
                  }}>
                    {row.original.estado?.toLowerCase() === 'asignado' ? 'Desasignar equipo' : 'Asignar equipo'}
                  </button>
                  <button onClick={() => {
                    if (row.original.estado?.toLowerCase() === 'asignado') {
                      setSelectedAsset(row.original);
                      setShowConstanciaModal(true);
                    }
                    setActiveActionMenu(null);
                  }}>
                    Imprimir constancia de entrega
                  </button>
                  <button onClick={() => {
                    handleVerifyAD(row.original);
                    setActiveActionMenu(null);
                  }}>
                    Verificar en AD
                  </button>
                  <button onClick={() => {
                    handleVerifyName(row.original);
                    setActiveActionMenu(null);
                  }}>
                    Verificar nombre en DB
                  </button>
                  <button onClick={() => {
                    handleCopyInfo(row.original);
                    setActiveActionMenu(null);
                  }}>
                    Copiar información
                  </button>
                  {row.original.tipo?.toUpperCase() === 'LAPTOP' && 
                   row.original.estado?.toLowerCase() === 'asignado' && (
                    <button onClick={() => {
                      handleVigilanciaSheet();
                      setActiveActionMenu(null);
                    }}>
                      Imprimir hoja de vigilancia
                    </button>
                  )}
                </div>
              )}
            </div>

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
    [sedes, tipos, marcas, modelos, rams, discos, activeActionMenu]
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
      const response = await axiosInstance.get('/api/activos');
      setData(response.data);
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
      const response = await axiosInstance.get('/api/sedes');
      setSedes(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMarcas = async () => {
    try {
      const response = await axiosInstance.get('/api/marcas');
      setMarcas(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchModelos = async () => {
    try {
      const response = await axiosInstance.get('/api/modelos');
      setModelos(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchRams = async () => {
    try {
      const response = await axiosInstance.get('/api/rams');
      setRams(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchDiscos = async () => {
    try {
      const response = await axiosInstance.get('/api/discos');
      setDiscos(response.data);
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
      const response = await axiosInstance.get(`/api/empleados/${empleadoId}`);
      setSelectedEmployee(response.data);
      setShowEmployeeModal(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async (id, field, value) => {
    try {
      console.log('handleSave called:', { id, field, value });
      const response = await axiosInstance.patch(`/api/activos/${id}`, { [field]: value });
      console.log('API Response:', response.data);
      
      if (response.data.message) {
        console.log('Updating state with:', { field, value, updates: response.data.updated_fields });
        setData(old =>
          old.map(row =>
            row.id === id
              ? { ...row, [field]: value, ...response.data.updated_fields }
              : row
          )
        );
        return true;
      }
      console.log('Update not successful');
      return false;
    } catch (error) {
      console.error('Error in handleSave:', error);
      return false;
    }
  };

  const handleVerifyAD = async (asset) => {
    try {
      console.log('Verificando equipo:', asset);
      
      if (!asset.nombre_equipo) {
        console.log('Equipo sin nombre');
        setADEquipmentInfo({
          expectedName: '',
          exists: false,
          error: 'El equipo no tiene nombre asignado',
          loading: false
        });
        setShowADVerifyModal(true);
        return;
      }

      setADEquipmentInfo({ expectedName: asset.nombre_equipo, loading: true });
      setShowADVerifyModal(true);

      console.log('Haciendo petición al backend para:', asset.nombre_equipo);
      const response = await axiosInstance.get('/api/verificar_equipos');
      console.log('Respuesta del backend:', response.data);
      
      const equipoInfo = response.data[asset.nombre_equipo];
      
      setADEquipmentInfo({
        expectedName: asset.nombre_equipo,
        ...equipoInfo,
        loading: false
      });
    } catch (error) {
      console.error('Error verificando equipo en AD:', error);
      console.error('Detalles del error:', {
        response: error.response,
        message: error.message,
        config: error.config
      });
      
      setADEquipmentInfo({
        expectedName: asset.nombre_equipo || '',
        exists: false,
        error: error.response?.data?.message || 'Error al verificar el equipo',
        loading: false
      });
    }
  };

  const handleCopyInfo = (asset) => {
    const info = `
Equipo: ${asset.nombre_equipo || 'N/A'}
Tipo: ${asset.tipo || 'N/A'}
Marca: ${asset.marca || 'N/A'}
Modelo: ${asset.modelo || 'N/A'}
Serial: ${asset.serial || 'N/A'}
RAM: ${asset.ram || 'N/A'}
Disco: ${asset.disco || 'N/A'}
Activo Fijo: ${asset.activo_fijo || 'N/A'}
Estado: ${asset.estado || 'N/A'}
${asset.empleado ? `Asignado a: ${asset.empleado}` : 'Sin asignar'}
    `.trim();

    try {
      // Crear un elemento textarea temporal
      const el = document.createElement('textarea');
      el.value = info;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      
      // Seleccionar y copiar el texto
      el.select();
      document.execCommand('copy');
      
      // Eliminar el elemento temporal
      document.body.removeChild(el);
      
      // Mostrar mensaje de éxito
      alert('✅ Información copiada al portapapeles');
    } catch (err) {
      console.error('Error al copiar:', err);
      alert('❌ Error al copiar la información');
    }
  };

  const handleVerifyName = (asset) => {
    if (!asset.nombre_equipo) {
      alert('El equipo no tiene nombre asignado');
      return;
    }

    const getTipoPrefix = (tipo) => {
      switch(tipo.toUpperCase()) {
        case 'AIO': return 'A';
        case 'LAPTOP': return 'L';
        case 'DESKTOP': return 'D';
        default: return 'X';
      }
    };

    const getSedePrefix = (sede) => {
      switch(sede?.toUpperCase()) {
        case 'CDN': return 'G';
        case 'CA1': return 'V';
        case 'MERCADEO': return 'C';
        case 'COMERCIAL': return 'F';
        default: return 'X';
      }
    };

    const nombreActual = asset.nombre_equipo;
    const formatoEsperado = `${getTipoPrefix(asset.tipo)}${getSedePrefix(asset.sede)}-`;

    if (nombreActual.startsWith(formatoEsperado)) {
      alert('✅ El nombre del equipo sigue el formato correcto');
    } else {
      alert(`⚠️ El nombre del equipo debería comenzar con: ${formatoEsperado}`);
    }
  };

  const handleVigilanciaSheet = async () => {
    try {
      // Obtener solo las laptops
      const laptops = data.filter(asset => 
        asset.tipo?.toUpperCase() === 'LAPTOP' && 
        asset.estado?.toLowerCase() === 'asignado'
      );

      if (laptops.length === 0) {
        alert('⚠️ No hay laptops asignadas para generar la hoja de vigilancia');
        return;
      }

      const response = await axiosInstance.get('/api/activos/hoja-vigilancia', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hoja_vigilancia_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generando hoja de vigilancia:', error);
      alert('❌ Error al generar la hoja de vigilancia');
    }
  };

  const EditableCell = ({ value, column, row, table, options, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
      console.log('Value changed:', { value, currentValue, column: column.id });
      setCurrentValue(value);
    }, [value]);

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
        let valueToSave = newValue;
        
        if (selectFields.includes(column.id)) {
          valueToSave = newValue;
          console.log('Using select value directly:', valueToSave);
        }

        console.log('Attempting to save:', { id: row.original.id, field: column.id, value: valueToSave });
        const success = await onSave(row.original.id, column.id, valueToSave);
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
            onChange={handleInputChange}
            onBlur={handleChange}
            autoFocus
            className="editable-cell-input"
          />
        );
      }

      if (isSelectField) {
        if (column.id === 'tipo') {
          return (
            <select
              value={currentValue || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              autoFocus
            >
              <option value="">Seleccionar...</option>
              {['LAPTOP', 'DESKTOP', 'AIO'].map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }

        return (
          <select
            value={currentValue || ''}
            onChange={handleChange}
            onBlur={handleBlur}
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
        activeActionMenu={activeActionMenu}
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

      {showConstanciaModal && selectedAsset && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirmar Impresión</h2>
            <div className="modal-body">
              <p>¿Desea generar la constancia de entrega?</p>
              <div className="asset-info">
                <p><strong>Equipo:</strong> {selectedAsset.nombre_equipo}</p>
                <p><strong>Serial:</strong> {selectedAsset.serial}</p>
                <p><strong>Empleado:</strong> {selectedAsset.empleado}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => {
                setShowConstanciaModal(false);
                setSelectedAsset(null);
              }} className="button secondary">
                No Generar
              </button>
              <button onClick={async () => {
                try {
                  const response = await axiosInstance.get(`/api/activos/${selectedAsset.id}/constancia`, {
                    responseType: 'blob'
                  });

                  const blob = new Blob([response.data]);
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `constancia_entrega_${selectedAsset.empleado}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Error generando constancia:', error);
                }
                setShowConstanciaModal(false);
                setSelectedAsset(null);
              }} className="button primary">
                Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {showADVerifyModal && adEquipmentInfo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Verificación en Active Directory</h2>
            <div className="modal-body">
              {adEquipmentInfo.loading ? (
                <p>Verificando equipo en AD...</p>
              ) : adEquipmentInfo.error ? (
                <div className="error-message">
                  <p>{adEquipmentInfo.error}</p>
                </div>
              ) : (
                <div className="ad-info">
                  <p><strong>Nombre del equipo:</strong> {adEquipmentInfo.expectedName}</p>
                  <p><strong>Estado en AD:</strong> {
                    adEquipmentInfo.exists ? 
                      <span className="status-success">Encontrado en AD</span> : 
                      <span className="status-error">No encontrado en AD</span>
                  }</p>
                  {adEquipmentInfo.exists && (
                    <>
                      <p><strong>Estado de conexión:</strong> {
                        adEquipmentInfo.estado === 'verde' ? 
                          <span className="status-success">Conectado</span> : 
                          <span className="status-error">Desconectado</span>
                      }</p>
                      {adEquipmentInfo.operating_system && (
                        <p><strong>Sistema Operativo:</strong> {adEquipmentInfo.operating_system}</p>
                      )}
                      {adEquipmentInfo.last_logon && (
                        <p><strong>Último inicio de sesión:</strong> {adEquipmentInfo.last_logon}</p>
                      )}
                      {adEquipmentInfo.dias_inactivo !== null && (
                        <p><strong>Días inactivo:</strong> {
                          adEquipmentInfo.dias_inactivo > 30 ? 
                            <span className="status-error">{adEquipmentInfo.dias_inactivo} días</span> :
                            <span className="status-success">{adEquipmentInfo.dias_inactivo} días</span>
                        }</p>
                      )}
                      {adEquipmentInfo.last_changed && (
                        <p><strong>Último cambio:</strong> {adEquipmentInfo.last_changed}</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => {
                setShowADVerifyModal(false);
                setADEquipmentInfo(null);
              }} className="button primary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetsView;