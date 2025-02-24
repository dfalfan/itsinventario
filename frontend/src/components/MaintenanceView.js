import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FaTools, FaHistory, FaFileAlt, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import './MaintenanceView.css';

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

// Datos de prueba
const datosIniciales = {
  pendientes: [
    {
      id: 1,
      equipo: 'Laptop Dell XPS 13',
      tipo: 'Mantenimiento Preventivo',
      responsable: 'Juan Pérez',
      observaciones: 'Limpieza general y actualización de software',
      fecha_programada: '2024-02-24',
      estado: 'Pendiente'
    },
    {
      id: 2,
      equipo: 'Impresora HP LaserJet',
      tipo: 'Reparación',
      responsable: 'María García',
      observaciones: 'Atasco de papel frecuente',
      fecha_programada: '2024-02-25',
      estado: 'Pendiente'
    }
  ],
  reparando: [
    {
      id: 3,
      equipo: 'Monitor LG 27"',
      tipo: 'Reparación',
      responsable: 'Carlos Ruiz',
      observaciones: 'Problemas de imagen intermitente',
      fecha_programada: '2024-02-23',
      estado: 'Reparando'
    }
  ],
  completados: [
    {
      id: 4,
      equipo: 'Desktop Lenovo ThinkCentre',
      tipo: 'Mantenimiento Preventivo',
      responsable: 'Ana Martínez',
      observaciones: 'Actualización de RAM y limpieza',
      fecha_programada: '2024-02-20',
      estado: 'Completado',
      fecha_completado: '2024-02-21'
    }
  ]
};

function MaintenanceView() {
  const [items, setItems] = useState(datosIniciales);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.141.50:5000/api/mantenimientos');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      
      // Organizar los datos en las columnas correspondientes
      const organizedData = {
        pendientes: jsonData.filter(item => item.estado === 'Pendiente'),
        reparando: jsonData.filter(item => item.estado === 'Reparando'),
        completados: jsonData.filter(item => item.estado === 'Completado'),
      };
      
      setItems(organizedData);
      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(`Error cargando datos: ${error.message}`);
      // Si hay un error, mantener los datos de prueba
      setItems(datosIniciales);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Por ahora usamos los datos de prueba
    setLoading(false);
    // Cuando el backend esté listo, descomentar:
    // fetchData();
  }, []);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Crear una copia del estado actual
    const newItems = { ...items };
    const [movedItem] = newItems[source.droppableId].splice(source.index, 1);

    // Actualizar el estado del item
    movedItem.estado = destination.droppableId.charAt(0).toUpperCase() + destination.droppableId.slice(1);
    
    // Si se mueve a completados, agregar fecha de completado
    if (destination.droppableId === 'completados' && !movedItem.fecha_completado) {
      movedItem.fecha_completado = new Date().toISOString().split('T')[0];
    }

    // Insertar el item en la columna destino
    newItems[destination.droppableId].splice(destination.index, 0, movedItem);

    // Actualizar el estado localmente primero
    setItems(newItems);

    // Actualizar en el backend
    try {
      const response = await fetch(`http://192.168.141.50:5000/api/mantenimientos/${draggableId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: movedItem.estado,
          fecha_completado: movedItem.fecha_completado
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      setItems(items); // Revertir en caso de error
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
                        key={item.id.toString()}
                        draggableId={item.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
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
                              <strong>Responsable:</strong> {item.responsable || 'Sin asignar'}
                            </div>
                            {item.observaciones && (
                              <div className="card-description">
                                {item.observaciones}
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
    </div>
  );
}

export default MaintenanceView; 