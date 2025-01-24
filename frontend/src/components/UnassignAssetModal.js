import React from 'react';
import './UnassignAssetModal.css';
import PropTypes from 'prop-types';

function UnassignAssetModal({ asset, onClose, onUnassign }) {
  const handleUnassign = async () => {
    try {
      const response = await fetch(`http://192.168.141.50:5000/api/activos/${asset.id}/desasignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al desasignar equipo');
      }
      
      onUnassign();
      onClose();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Desasignar Equipo</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <p><strong>Equipo:</strong> {asset.tipo} - {asset.nombre_equipo}</p>
          <p><strong>Asignado a:</strong> {asset.empleado}</p>
          <div className="warning-message">
            ¿Está seguro que desea desasignar este equipo?
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="unassign-button" onClick={handleUnassign}>
            Desasignar
          </button>
        </div>
      </div>
    </div>
  );
}

UnassignAssetModal.propTypes = {
  asset: PropTypes.shape({
    id: PropTypes.number.isRequired,
    tipo: PropTypes.string.isRequired,
    nombre_equipo: PropTypes.string.isRequired,
    empleado: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUnassign: PropTypes.func.isRequired,
};

export default UnassignAssetModal;