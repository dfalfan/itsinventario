import React, { useState, useEffect } from 'react';
import './AssignEquipmentModal.css';
import PropTypes from 'prop-types';

function AssignEquipmentModal({ employee, onClose, onAssign }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    const fetchAvailableAssets = async () => {
      try {
        setLoading(true);
        console.log('Iniciando fetch de activos disponibles');
        
        const response = await fetch('http://localhost:5000/api/activos/disponibles');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.error || 'Error al cargar equipos disponibles');
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        setAssets(data);
        setError(null);
      } catch (error) {
        console.error('Error completo:', error);
        setError(error.message || 'Error al cargar los equipos disponibles');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableAssets();
  }, []);

  const handleAssign = async () => {
    if (!selectedAsset || !employee.id) {
      setError('Seleccione un equipo para asignar');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/activos/${selectedAsset.id}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ empleado_id: employee.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al asignar equipo');
      }
      
      onAssign();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al asignar el equipo');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Asignar Equipo a {employee.nombre}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        {loading && <div className="loading">Cargando...</div>}
        {error && <div className="error">{error}</div>}
        
        {!loading && !error && (
          <>
            <div className="assets-list">
              {assets.length === 0 ? (
                <p>No hay equipos disponibles</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Nombre</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr 
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={selectedAsset?.id === asset.id ? 'selected' : ''}
                      >
                        <td>{asset.tipo}</td>
                        <td>{asset.nombre_equipo}</td>
                        <td>{asset.marca}</td>
                        <td>{asset.modelo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="assign-button"
                disabled={!selectedAsset}
                onClick={handleAssign}
              >
                Asignar Equipo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

AssignEquipmentModal.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nombre: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
};

export default AssignEquipmentModal;