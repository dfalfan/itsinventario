import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FaTools, FaHistory, FaFileAlt, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import './MaintenanceView.css';
import axiosInstance from '../utils/axiosConfig';

// Estilos CSS en línea
const styles = {
  kanbanBoard: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    minHeight: 'calc(100vh - 200px)',
    overflowX: 'auto',
    width: '100%',
    background: '#f0f2f5',
    borderRadius: '12px',
  },
  column: {
    background: '#ffffff',
    borderRadius: '12px',
    width: '320px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '500px',
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  columnHeader: {
    padding: '1rem',
    marginBottom: '1rem',
    borderRadius: '8px',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: '1.1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  columnCounter: {
    background: 'rgba(255,255,255,0.2)',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
  },
  droppableArea: {
    minHeight: '200px',
    background: 'rgba(255,255,255,0.5)',
    borderRadius: '8px',
    padding: '0.5rem',
    transition: 'background-color 0.2s ease',
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '0.8rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    userSelect: 'none',
    border: '1px solid #e1e4e8',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      transform: 'translateY(-2px)',
    },
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: '0.8rem',
    fontSize: '1.1rem',
    color: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  cardMeta: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  cardDescription: {
    fontSize: '0.9rem',
    color: '#444',
    marginTop: '0.8rem',
    padding: '0.8rem',
    background: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
  },
  cardDate: {
    fontSize: '0.85rem',
    color: '#666',
    marginTop: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#f8f9fa',
    padding: '0.5rem',
    borderRadius: '4px',
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    padding: '0.8rem 0',
    borderTop: '1px solid #e9ecef',
    justifyContent: 'space-around',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666',
    padding: '0.5rem 0.8rem',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    fontSize: '0.9rem',
    '&:hover': {
      background: '#f0f0f0',
      color: '#1a1a1a',
    },
  },
  badge: {
    padding: '0.3rem 0.8rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
};

const columnColors = {
  pendientes: '#FF8B8B',
  reparando: '#FFD93D',
  completados: '#95CD41',
};

function CompletarMantenimientoModal({ show, onClose, onConfirm, item }) {
  const [solucion, setSolucion] = useState('');
  const [diagnostico, setDiagnostico] = useState('');

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Completar Mantenimiento</h2>
        <div className="modal-body">
          <div className="form-group">
            <label>Equipo:</label>
            <p>{item?.equipo}</p>
          </div>
          <div className="form-group">
            <label>Diagnóstico:</label>
            <textarea
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Ingrese el diagnóstico del problema..."
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Solución:</label>
            <textarea
              value={solucion}
              onChange={(e) => setSolucion(e.target.value)}
              placeholder="Describa la solución aplicada..."
              rows={3}
              required
            />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="button secondary">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(diagnostico, solucion)}
            className="button primary"
            disabled={!solucion.trim()}
          >
            Completar
          </button>
        </div>
      </div>
    </div>
  );
}

function MaintenanceView() {
  const [items, setItems] = useState({
    pendientes: [],
    reparando: [],
    completados: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCompletarModal, setShowCompletarModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dragMemory, setDragMemory] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Obtener los activos en reparación
      const response = await axiosInstance.get('/api/activos');
      const activos = response.data;

      // Obtener mantenimientos
      const mantenimientosResponse = await axiosInstance.get('/api/mantenimientos');
      const mantenimientos = mantenimientosResponse.data;

      // Obtener IDs de activos que ya tienen mantenimientos en progreso o completados
      const activosConMantenimiento = new Set(
        mantenimientos.map(m => m.activo.id.toString())
      );

      // Filtrar los activos por estado, excluyendo los que ya tienen mantenimientos
      const activosEnReparacion = activos
        .filter(activo => 
          activo.estado === 'REPARACION' && 
          !activosConMantenimiento.has(activo.id.toString())
        )
        .map(activo => ({
          id: activo.id.toString(),
          equipo: `${activo.tipo} ${activo.marca} ${activo.modelo}`,
          tipo: 'Reparación',
          responsable: 'Sin asignar',
          observaciones: activo.notas || 'Sin observaciones',
          fecha_programada: new Date().toISOString().split('T')[0],
          estado: 'Pendiente',
          serial: activo.serial,
          isHistoryCard: false
        }));

      // Organizar los mantenimientos
      const mantenimientosOrganizados = {
        pendientes: activosEnReparacion,
        reparando: mantenimientos
          .filter(m => m.estado === 'En Progreso')
          .map(m => ({
            id: m.id.toString(),
            equipo: `${m.activo.tipo} ${m.activo.marca} ${m.activo.modelo}`,
            tipo: 'Reparación',
            responsable: 'Sin asignar',
            observaciones: m.descripcion,
            diagnostico: m.diagnostico,
            fecha_programada: new Date(m.fecha_inicio).toISOString().split('T')[0],
            estado: 'Reparando',
            serial: m.activo.serial,
            isHistoryCard: false,
            activo_id: m.activo.id
          })),
        completados: mantenimientos
          .filter(m => m.estado === 'Completado')
          .map(m => ({
            id: `hist_${m.id}`,
            equipo: `${m.activo.tipo} ${m.activo.marca} ${m.activo.modelo}`,
            tipo: 'Reparación',
            responsable: 'Sin asignar',
            observaciones: m.descripcion,
            diagnostico: m.diagnostico,
            solucion: m.solucion,
            fecha_programada: new Date(m.fecha_inicio).toISOString().split('T')[0],
            fecha_completado: m.fecha_fin ? new Date(m.fecha_fin).toISOString().split('T')[0] : null,
            estado: 'Completado',
            serial: m.activo.serial,
            isHistoryCard: true,
            activo_id: m.activo.id
          }))
      };

      setItems(mantenimientosOrganizados);
      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(`Error cargando datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // No permitir mover tarjetas de historial
    const movedItem = items[source.droppableId].find(item => item.id === draggableId);
    if (movedItem.isHistoryCard) return;

    // Crear una copia del estado actual
    const newItems = { ...items };
    const [draggedItem] = newItems[source.droppableId].splice(source.index, 1);

    // Si se mueve a completados
    if (destination.droppableId === 'completados') {
      setSelectedItem(draggedItem);
      setDragMemory({ source, destination, draggedItem });
      setShowCompletarModal(true);
      // Devolver el item a su posición original hasta que se confirme
      newItems[source.droppableId].splice(source.index, 0, draggedItem);
    } else {
      // Para otros movimientos
      newItems[destination.droppableId].splice(destination.index, 0, draggedItem);
      
      // Si se mueve a reparando, crear un nuevo mantenimiento
      if (destination.droppableId === 'reparando' && source.droppableId === 'pendientes') {
        try {
          const response = await axiosInstance.post('/api/mantenimientos', {
            activo_id: parseInt(draggedItem.id),
            descripcion: draggedItem.observaciones,
            estado: 'En Progreso'
          });
          
          // Actualizar el ID del item con el ID del mantenimiento creado
          const index = newItems.reparando.findIndex(item => item.id === draggedItem.id);
          if (index !== -1) {
            newItems.reparando[index] = {
              ...newItems.reparando[index],
              id: response.data.id.toString(),
              activo_id: parseInt(draggedItem.id)
            };
          }
          
          // Eliminar el item de pendientes para evitar duplicados
          newItems.pendientes = newItems.pendientes.filter(
            item => item.id !== draggedItem.id
          );
          
        } catch (error) {
          console.error('Error creating maintenance:', error);
          // Revertir en caso de error
          newItems[source.droppableId].splice(source.index, 0, draggedItem);
          newItems[destination.droppableId] = newItems[destination.droppableId]
            .filter(item => item.id !== draggedItem.id);
          setItems(newItems);
          return;
        }
      }
    }

    setItems(newItems);
  };

  const handleCompletarMantenimiento = async (diagnostico, solucion) => {
    if (!dragMemory) return;

    const { draggedItem } = dragMemory;
    
    // Determinar si estamos completando un activo pendiente o un mantenimiento en progreso
    const activo_id = draggedItem.activo_id || parseInt(draggedItem.id);
    const mantenimiento_id = draggedItem.activo_id ? draggedItem.id : null;

    try {
      let response;
      
      if (mantenimiento_id) {
        // Si ya existe un mantenimiento, actualizarlo
        response = await axiosInstance.patch(`/api/mantenimientos/${mantenimiento_id}`, {
          diagnostico: diagnostico,
          solucion: solucion,
          estado: 'Completado',
          fecha_fin: new Date().toISOString()
        });
      } else {
        // Si no existe, crear uno nuevo
        response = await axiosInstance.post('/api/mantenimientos', {
          activo_id: activo_id,
          descripcion: draggedItem.observaciones,
          diagnostico: diagnostico,
          solucion: solucion,
          estado: 'Completado',
          fecha_fin: new Date().toISOString()
        });
      }

      setShowCompletarModal(false);
      setSelectedItem(null);
      setDragMemory(null);
      
      // Recargar los datos para asegurar sincronización
      fetchData();
    } catch (error) {
      console.error('Error completing maintenance:', error);
      alert('Error al completar el mantenimiento');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este mantenimiento?')) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/api/mantenimientos/${id}`);

      if (!response.ok) {
        throw new Error('Error al eliminar el mantenimiento');
      }

      // Actualizar el estado local después de eliminar
      const newItems = { ...items };
      Object.keys(newItems).forEach(columnId => {
        newItems[columnId] = newItems[columnId].filter(item => item.id !== id);
      });
      setItems(newItems);
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      alert('Error al eliminar el mantenimiento');
    }
  };

  if (loading) return <div className="loading-state">Cargando...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="main-content">
      <div className="header">
        <h2>Mantenimientos</h2>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {Object.keys(items).map(columnId => (
            <div key={columnId} className="kanban-column">
              <div className={`column-header column-header-${columnId}`}>
                {columnId.charAt(0).toUpperCase() + columnId.slice(1)}
                <div className="column-counter">
                  {items[columnId].length}
                </div>
              </div>

              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`droppable-area ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {items[columnId].map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                        isDragDisabled={item.isHistoryCard}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${item.isHistoryCard ? 'history-card' : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                              transform: snapshot.isDragging ? 
                                `${provided.draggableProps.style.transform} scale(1.02)` :
                                provided.draggableProps.style.transform,
                            }}
                          >
                            <div className="card-title">
                              <FaTools />
                              {item.equipo}
                            </div>
                            <div className={`card-badge ${item.tipo === 'Mantenimiento Preventivo' ? 'badge-preventivo' : 'badge-reparacion'}`}>
                              {item.tipo}
                            </div>
                            <div className="card-meta">
                              <strong>Serial:</strong> {item.serial || 'Sin asignar'}
                            </div>
                            {item.observaciones && (
                              <div className="card-description">
                                {item.observaciones}
                                {item.diagnostico && (
                                  <div className="diagnostico-text">
                                    <strong>Diagnóstico:</strong> {item.diagnostico}
                                  </div>
                                )}
                                {item.solucion && (
                                  <div className="solution-text">
                                    <strong>Solución:</strong> {item.solucion}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="card-date">
                              <FaCalendarAlt />
                              {new Date(item.fecha_programada).toLocaleDateString('es-ES')}
                              {item.fecha_completado && (
                                <span className="date-completed">
                                  ✓ {new Date(item.fecha_completado).toLocaleDateString('es-ES')}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <CompletarMantenimientoModal
        show={showCompletarModal}
        onClose={() => {
          setShowCompletarModal(false);
          setSelectedItem(null);
          setDragMemory(null);
        }}
        onConfirm={handleCompletarMantenimiento}
        item={selectedItem}
      />
    </div>
  );
}

export default MaintenanceView; 