import React, { useState, useEffect, useMemo } from 'react';
import { FaNetworkWired, FaPlus, FaSync, FaTrash, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import TableView from './TableView';
import './AssetsView.css';

function NetworksView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    ip: true,
    hostname: true,
    tipo: true,
    ubicacion: true,
    estado: true,
    ultima_verificacion: true,
    acciones: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.141.50:5000/api/redes');
      
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
      const response = await fetch(`http://192.168.141.50:5000/api/redes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el dispositivo');
      }

      const updatedData = await response.json();
      setData(prevData => prevData.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));
      return true;
    } catch (error) {
      console.error('Error in handleSave:', error);
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este dispositivo?')) {
      return;
    }

    try {
      const response = await fetch(`http://192.168.141.50:5000/api/redes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el dispositivo');
      }

      setData(prevData => prevData.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Error al eliminar el dispositivo');
    }
  };

  const handleCheckStatus = async (id) => {
    try {
      const response = await fetch(`http://192.168.141.50:5000/api/redes/${id}/verificar`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al verificar el estado');
      }

      const updatedDevice = await response.json();
      setData(prevData => prevData.map(item => 
        item.id === id ? { ...item, estado: updatedDevice.estado, ultima_verificacion: updatedDevice.ultima_verificacion } : item
      ));
    } catch (error) {
      console.error('Error checking status:', error);
      alert('Error al verificar el estado del dispositivo');
    }
  };

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
      },
      {
        header: 'IP',
        accessorKey: 'ip',
        cell: ({ row }) => (
          <div className="ip-cell">
            <span className="ip-value">{row.original.ip}</span>
          </div>
        )
      },
      {
        header: 'Hostname',
        accessorKey: 'hostname',
        cell: ({ row }) => (
          <div className="hostname-cell">
            {row.original.hostname || 'Sin asignar'}
          </div>
        )
      },
      {
        header: 'Tipo',
        accessorKey: 'tipo',
        cell: ({ row }) => (
          <div className="tipo-cell">
            {row.original.tipo || 'No especificado'}
          </div>
        )
      },
      {
        header: 'Ubicación',
        accessorKey: 'ubicacion',
        cell: ({ row }) => (
          <div className="ubicacion-cell">
            {row.original.ubicacion || 'No especificada'}
          </div>
        )
      },
      {
        header: 'Estado',
        accessorKey: 'estado',
        cell: ({ row }) => (
          <div className={`estado-cell ${row.original.estado?.toLowerCase()}`}>
            <span className="estado-indicator"></span>
            {row.original.estado || 'Desconocido'}
          </div>
        )
      },
      {
        header: 'Última Verificación',
        accessorKey: 'ultima_verificacion',
        cell: ({ row }) => row.original.ultima_verificacion ? 
          new Date(row.original.ultima_verificacion).toLocaleString('es-ES') : 
          'Nunca'
      },
      {
        header: 'Acciones',
        id: 'acciones',
        cell: ({ row }) => (
          <div className="action-buttons">
            <button 
              className="action-button check-button"
              title="Verificar estado"
              onClick={() => handleCheckStatus(row.original.id)}
            >
              <FaSync />
            </button>
            <button 
              className="action-button search-button"
              title="Buscar dispositivo"
              onClick={() => {/* TODO: Implementar búsqueda */}}
            >
              <FaSearch />
            </button>
            <button 
              className="action-button delete-button"
              title="Eliminar"
              onClick={() => handleDelete(row.original.id)}
            >
              <FaTrash />
            </button>
          </div>
        ),
      }
    ],
    []
  );

  return (
    <div className="assets-view">
      <div className="header">
        <h2>Redes</h2>
        <div className="header-buttons">
          <button className="add-button" onClick={() => setShowAddModal(true)}>
            <FaPlus className="add-icon" />
            Agregar Dispositivo
          </button>
        </div>
      </div>

      {/* TODO: Implementar modal de creación */}
      {/* {showAddModal && (
        <AddNetworkDeviceModal
          onClose={() => setShowAddModal(false)}
          onAdd={(newDevice) => setData(prev => [...prev, newDevice])}
        />
      )} */}

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

export default NetworksView; 