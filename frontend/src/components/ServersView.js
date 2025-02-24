import React, { useState, useEffect, useMemo } from 'react';
import { FaServer, FaPlus, FaSync, FaTrash, FaChartLine, FaTerminal } from 'react-icons/fa';
import TableView from './TableView';
import './AssetsView.css';

function ServersView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    nombre: true,
    ip: true,
    sistema_operativo: true,
    rol: true,
    estado: true,
    recursos: true,
    ultima_actualizacion: true,
    acciones: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.141.50:5000/api/servidores');
      
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
      const response = await fetch(`http://192.168.141.50:5000/api/servidores/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el servidor');
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
    if (!window.confirm('¿Está seguro de que desea eliminar este servidor?')) {
      return;
    }

    try {
      const response = await fetch(`http://192.168.141.50:5000/api/servidores/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el servidor');
      }

      setData(prevData => prevData.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting server:', error);
      alert('Error al eliminar el servidor');
    }
  };

  const handleCheckStatus = async (id) => {
    try {
      const response = await fetch(`http://192.168.141.50:5000/api/servidores/${id}/estado`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al verificar el estado');
      }

      const updatedServer = await response.json();
      setData(prevData => prevData.map(item => 
        item.id === id ? { ...item, estado: updatedServer.estado, recursos: updatedServer.recursos } : item
      ));
    } catch (error) {
      console.error('Error checking status:', error);
      alert('Error al verificar el estado del servidor');
    }
  };

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
      },
      {
        header: 'Nombre',
        accessorKey: 'nombre',
        cell: ({ row }) => (
          <div className="nombre-cell">
            {row.original.nombre || 'Sin nombre'}
          </div>
        )
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
        header: 'Sistema Operativo',
        accessorKey: 'sistema_operativo',
        cell: ({ row }) => (
          <div className="sistema-cell">
            {row.original.sistema_operativo || 'No especificado'}
          </div>
        )
      },
      {
        header: 'Rol',
        accessorKey: 'rol',
        cell: ({ row }) => (
          <div className="rol-cell">
            {row.original.rol || 'No especificado'}
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
        header: 'Recursos',
        accessorKey: 'recursos',
        cell: ({ row }) => (
          <div className="recursos-cell">
            {row.original.recursos ? (
              <>
                <div>CPU: {row.original.recursos.cpu}%</div>
                <div>RAM: {row.original.recursos.ram}%</div>
                <div>Disco: {row.original.recursos.disco}%</div>
              </>
            ) : 'Sin datos'}
          </div>
        )
      },
      {
        header: 'Última Actualización',
        accessorKey: 'ultima_actualizacion',
        cell: ({ row }) => row.original.ultima_actualizacion ? 
          new Date(row.original.ultima_actualizacion).toLocaleString('es-ES') : 
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
              className="action-button stats-button"
              title="Ver estadísticas"
              onClick={() => {/* TODO: Implementar vista de estadísticas */}}
            >
              <FaChartLine />
            </button>
            <button 
              className="action-button terminal-button"
              title="Abrir terminal"
              onClick={() => {/* TODO: Implementar conexión SSH */}}
            >
              <FaTerminal />
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
        <h2>Servidores</h2>
        <div className="header-buttons">
          <button className="add-button" onClick={() => setShowAddModal(true)}>
            <FaPlus className="add-icon" />
            Agregar Servidor
          </button>
        </div>
      </div>

      {/* TODO: Implementar modal de creación */}
      {/* {showAddModal && (
        <AddServerModal
          onClose={() => setShowAddModal(false)}
          onAdd={(newServer) => setData(prev => [...prev, newServer])}
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
        defaultSorting={[{ id: 'nombre', desc: false }]}
      />
    </div>
  );
}

export default ServersView;