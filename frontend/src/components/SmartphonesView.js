import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaEllipsisH, 
  FaPencilAlt, 
  FaTimes, 
  FaPlus, 
  FaUser, 
  FaHistory, 
  FaBolt, 
  FaMobileAlt,
  FaSort, 
  FaSortUp, 
  FaSortDown, 
  FaTrash 
} from 'react-icons/fa';
import TableView from './TableView';
import AssignSmartphoneModal from './AssignSmartphoneModal';
import EmployeeModal from './EmployeeModal';
import TimelineView from './TimelineView';
import AddSmartphoneModal from './AddSmartphoneModal';
import SmartphoneModal from './SmartphoneModal';
import DeleteSmartphoneModal from './DeleteSmartphoneModal';
import GlobalFilter from './GlobalFilter';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import axiosInstance from '../utils/axiosConfig';
import './AssetsView.css';

function SmartphonesView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedSmartphone, setSelectedSmartphone] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    marca: true,
    modelo: true,
    serial: true,
    estado: true,
    empleado: true,
    linea: true,
    imei: false,
    imei2: false,
    fecha_asignacion: false,
    acciones: true,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showSmartphoneModal, setShowSmartphoneModal] = useState(false);
  const [selectedSmartphoneForView, setSelectedSmartphoneForView] = useState(null);
  const [showConstanciaModal, setShowConstanciaModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/smartphones');
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

  const handleSave = async (id, field, value) => {
    try {
      console.log('handleSave called:', { id, field, value });
      const response = await axiosInstance.patch(`/api/smartphones/${id}`, { [field]: value });
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

  const handleAssignClick = (smartphone) => {
    setSelectedSmartphone(smartphone);
    setShowAssignModal(true);
  };

  const handleAssignSuccess = () => {
    setShowAssignModal(false);
    setSelectedSmartphone(null);
    fetchData();
  };

  const handleUnassignClick = (smartphone) => {
    setSelectedSmartphone(smartphone);
    setShowConfirmModal(true);
  };

  const handleUnassign = async () => {
    try {
      await axiosInstance.post(`/api/smartphones/${selectedSmartphone.id}/desasignar`);
      setData(prevData =>
        prevData.map(smartphone =>
          smartphone.id === selectedSmartphone.id
            ? { ...smartphone, empleado_id: null, empleado: null }
            : smartphone
        )
      );
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error al desasignar:', error);
      alert('Error al desasignar el smartphone');
    }
  };

  const handleEmployeeClick = async (empleadoId) => {
    try {
      const empleadoResponse = await axiosInstance.get(`/api/empleados/${empleadoId}`);
      setSelectedEmployee(empleadoResponse.data);
      setShowEmployeeModal(true);
    } catch (error) {
      console.error('Error al obtener datos del empleado:', error);
    }
  };

  const handleAddSmartphone = (newSmartphone) => {
    setData(prevData => [...prevData, newSmartphone]);
  };

  const handleView = (smartphone) => {
    setSelectedSmartphoneForView(smartphone);
    setShowSmartphoneModal(true);
  };

  const handleSmartphoneUpdate = (updatedSmartphone) => {
    setData(prevData => prevData.map(item => 
      item.id === updatedSmartphone.id ? updatedSmartphone : item
    ));
  };

  const handleCopyInfo = (smartphone) => {
    const info = `
Marca: ${smartphone.marca || 'N/A'}
Modelo: ${smartphone.modelo || 'N/A'}
Serial: ${smartphone.serial || 'N/A'}
IMEI: ${smartphone.imei || 'N/A'}
IMEI2: ${smartphone.imei2 || 'N/A'}
Línea: ${smartphone.linea || 'N/A'}
Estado: ${smartphone.estado || 'N/A'}
${smartphone.empleado ? `Asignado a: ${smartphone.empleado}` : 'Sin asignar'}
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

  const handleDelete = (smartphone) => {
    setSelectedSmartphone(smartphone);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setSelectedSmartphone(null);
    fetchData();
  };

  const EditableCell = ({ value, column, row, onSave }) => {
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
        console.log('Attempting to save:', { id: row.original.id, field: column.id, value: newValue });
        const success = await onSave(row.original.id, column.id, newValue);
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

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
      },
      {
        header: 'Marca',
        accessorKey: 'marca',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.marca}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
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
        header: 'IMEI',
        accessorKey: 'imei',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.imei}
            column={column}
            row={row}
            table={table}
            onSave={handleSave}
          />
        )
      },
      {
        header: 'IMEI2',
        accessorKey: 'imei2',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.imei2}
            column={column}
            row={row}
            table={table}
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
              {row.original.estado || 'Sin asignar'}
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
            <div 
              className="employee-type clickable"
              onClick={() => handleEmployeeClick(empleadoId)}
              style={{ cursor: 'pointer' }}
            >
              <FaUser className="employee-icon" />
              <span className="employee-name">{empleado}</span>
            </div>
          );
        }
      },
      {
        header: 'Línea',
        accessorKey: 'linea',
        cell: ({ row, column, table }) => (
          <EditableCell
            value={row.original.linea}
            column={column}
            row={row}
            table={table}
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
              className="action-button view-button"
              title="Ver detalles"
              onClick={() => handleView(row.original)}
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
                    row.original.empleado ? handleUnassignClick(row.original) : handleAssignClick(row.original);
                    setActiveActionMenu(null);
                  }}>
                    {row.original.empleado ? 'Desasignar smartphone' : 'Asignar smartphone'}
                  </button>
                  <button onClick={() => {
                    if (row.original.empleado) {
                      setSelectedSmartphone(row.original);
                      setShowConstanciaModal(true);
                    }
                    setActiveActionMenu(null);
                  }}>
                    Imprimir constancia de entrega
                  </button>
                  <button onClick={() => {
                    handleCopyInfo(row.original);
                    setActiveActionMenu(null);
                  }}>
                    Copiar información
                  </button>
                </div>
              )}
            </div>

            <button 
              className="action-button delete-button"
              title="Cambiar estado"
              onClick={() => handleDelete(row.original)}
            >
              <FaTimes />
            </button>
          </div>
        ),
      }
    ],
    [activeActionMenu]
  );

  return (
    <div className="assets-view">
      <div className="header">
        <h2>Smartphones</h2>
        <div className="header-buttons">
          <button className="history-button" onClick={() => setShowTimeline(true)}>
            <FaHistory className="history-icon" />
            Historial
          </button>
          <button className="add-button" onClick={() => setShowAddModal(true)}>
            <FaPlus className="add-icon" />
            Agregar Smartphone
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

      {showAssignModal && selectedSmartphone && (
        <AssignSmartphoneModal
          smartphone={selectedSmartphone}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedSmartphone(null);
          }}
          onAssign={handleAssignSuccess}
        />
      )}

      {showConfirmModal && selectedSmartphone && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirmar Desasignación</h2>
            <div className="modal-body">
              <p>¿Está seguro que desea desasignar el siguiente smartphone?</p>
              <div className="smartphone-info">
                <p><strong>Marca:</strong> {selectedSmartphone.marca}</p>
                <p><strong>Modelo:</strong> {selectedSmartphone.modelo}</p>
                <p><strong>Empleado:</strong> {selectedSmartphone.empleado}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedSmartphone(null);
                }} 
                className="button secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUnassign}
                className="button primary"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
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

      {showAddModal && (
        <AddSmartphoneModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSmartphone}
        />
      )}

      {showTimeline && (
        <TimelineView
          categoria="smartphones"
          onClose={() => setShowTimeline(false)}
        />
      )}

      {showSmartphoneModal && selectedSmartphoneForView && (
        <SmartphoneModal
          smartphone={selectedSmartphoneForView}
          onClose={() => {
            setShowSmartphoneModal(false);
            setSelectedSmartphoneForView(null);
          }}
          onUpdate={handleSmartphoneUpdate}
        />
      )}

      {showConstanciaModal && selectedSmartphone && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirmar Impresión</h2>
            <div className="modal-body">
              <p>¿Desea generar la constancia de entrega?</p>
              <div className="smartphone-info">
                <p><strong>Marca:</strong> {selectedSmartphone.marca}</p>
                <p><strong>Modelo:</strong> {selectedSmartphone.modelo}</p>
                <p><strong>Empleado:</strong> {selectedSmartphone.empleado}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => {
                setShowConstanciaModal(false);
                setSelectedSmartphone(null);
              }} className="button secondary">
                No Generar
              </button>
              <button onClick={async () => {
                try {
                  const constanciaResponse = await fetch(`http://192.168.141.50:5000/api/smartphones/${selectedSmartphone.id}/constancia`);
                  if (!constanciaResponse.ok) {
                    throw new Error('Error al generar la constancia');
                  }

                  const blob = await constanciaResponse.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `constancia_entrega_${selectedSmartphone.empleado}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Error generando constancia:', error);
                }
                setShowConstanciaModal(false);
                setSelectedSmartphone(null);
              }} className="button primary">
                Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedSmartphone && (
        <DeleteSmartphoneModal
          smartphone={selectedSmartphone}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}

export default SmartphonesView; 