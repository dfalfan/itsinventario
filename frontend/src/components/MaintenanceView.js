import React, { useState, useEffect, useMemo } from 'react';
import { FaTools, FaPlus, FaCheck, FaTimes, FaHistory, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import TableView from './TableView';
import './AssetsView.css';

function MaintenanceView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    equipo: true,
    tipo: true,
    fecha_programada: true,
    estado: true,
    responsable: true,
    observaciones: true,
    acciones: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.141.50:5000/api/mantenimientos');
      
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
      const response = await fetch(`http://192.168.141.50:5000/api/mantenimientos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el mantenimiento');
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
    if (!window.confirm('¿Está seguro de que desea eliminar este mantenimiento?')) {
      return;
    }

    try {
      const response = await fetch(`http://192.168.141.50:5000/api/mantenimientos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el mantenimiento');
      }

      setData(prevData => prevData.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      alert('Error al eliminar el mantenimiento');
    }
  };

  const handleComplete = async (id) => {
    try {
      const response = await fetch(`http://192.168.141.50:5000/api/mantenimientos/${id}/completar`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al completar el mantenimiento');
      }

      const updatedMaintenance = await response.json();
      setData(prevData => prevData.map(item => 
        item.id === id ? { ...item, estado: 'Completado', fecha_completado: updatedMaintenance.fecha_completado } : item
      ));
    } catch (error) {
      console.error('Error completing maintenance:', error);
      alert('Error al completar el mantenimiento');
    }
  };

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
      },
      {
        header: 'Equipo',
        accessorKey: 'equipo',
        cell: ({ row }) => (
          <div className="equipo-cell">
            {row.original.equipo || 'No especificado'}
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
        header: 'Fecha Programada',
        accessorKey: 'fecha_programada',
        cell: ({ row }) => (
          <div className="fecha-cell">
            {new Date(row.original.fecha_programada).toLocaleDateString('es-ES')}
          </div>
        )
      },
      {
        header: 'Estado',
        accessorKey: 'estado',
        cell: ({ row }) => (
          <div className={`estado-cell ${row.original.estado?.toLowerCase()}`}>
            <span className="estado-indicator"></span>
            {row.original.estado || 'Pendiente'}
          </div>
        )
      },
      {
        header: 'Responsable',
        accessorKey: 'responsable',
        cell: ({ row }) => (
          <div className="responsable-cell">
            {row.original.responsable || 'Sin asignar'}
          </div>
        )
      },
      {
        header: 'Observaciones',
        accessorKey: 'observaciones',
        cell: ({ row }) => (
          <div className="observaciones-cell">
            {row.original.observaciones || 'Sin observaciones'}
          </div>
        )
      },
      {
        header: 'Acciones',
        id: 'acciones',
        cell: ({ row }) => (
          <div className="action-buttons">
            {row.original.estado !== 'Completado' && (
              <button 
                className="action-button complete-button"
                title="Marcar como completado"
                onClick={() => handleComplete(row.original.id)}
              >
                <FaCheck />
              </button>
            )}
            <button 
              className="action-button history-button"
              title="Ver historial"
              onClick={() => {/* TODO: Implementar vista de historial */}}
            >
              <FaHistory />
            </button>
            <button 
              className="action-button report-button"
              title="Generar reporte"
              onClick={() => {/* TODO: Implementar generación de reporte */}}
            >
              <FaFileAlt />
            </button>
            <button 
              className="action-button delete-button"
              title="Eliminar"
              onClick={() => handleDelete(row.original.id)}
            >
              <FaTimes />
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
        <h2>Mantenimientos</h2>
        <div className="header-buttons">
          <button className="add-button" onClick={() => setShowAddModal(true)}>
            <FaPlus className="add-icon" />
            Programar Mantenimiento
          </button>
        </div>
      </div>

      {/* TODO: Implementar modal de creación */}
      {/* {showAddModal && (
        <AddMaintenanceModal
          onClose={() => setShowAddModal(false)}
          onAdd={(newMaintenance) => setData(prev => [...prev, newMaintenance])}
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
        defaultSorting={[{ id: 'fecha_programada', desc: false }]}
      />
    </div>
  );
}

export default MaintenanceView; 