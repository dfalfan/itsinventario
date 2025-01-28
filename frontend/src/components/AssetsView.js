import React, { useState, useEffect, useMemo } from 'react';
import { FaEllipsisH, FaPencilAlt, FaTimes, FaPlus, FaUser } from 'react-icons/fa';
import TableView from './TableView';
import EmployeesWithoutEquipmentModal from './EmployeesWithoutEquipmentModal';
import UnassignAssetModal from './UnassignAssetModal';
import DeleteAssetModal from './DeleteAssetModal';
import NewAssetModal from './NewAssetModal';
import AssetModal from './AssetModal';
import EmployeeModal from './EmployeeModal';
import './AssetsView.css';

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
  });

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
      },
      {
        header: 'Sede',
        accessorKey: 'sede',
      },
      {
        header: 'Tipo',
        accessorKey: 'tipo',
      },
      {
        header: 'Marca',
        accessorKey: 'marca',
      },
      {
        header: 'Modelo',
        accessorKey: 'modelo',
      },
      {
        header: 'Estado',
        accessorKey: 'estado',
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
        header: 'Activo Fijo',
        accessorKey: 'activo_fijo',
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
    []
  );

  useEffect(() => {
    fetchData();
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

  return (
    <div className="assets-view">
      <div className="header">
        <h2>Activos</h2>
          <button 
            className="add-button"
            onClick={() => setShowNewAssetModal(true)}
        >
          <FaPlus /> Nuevo Activo
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
        defaultSorting={[{ id: 'id', desc: false }]}
      />

      {showModal && (
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
          onDelete={handleDeleteSuccess}
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
    </div>
  );
}

export default AssetsView;