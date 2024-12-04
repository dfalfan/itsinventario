import React from 'react';
import { 
  FaTimes, 
  FaLaptop, 
  FaDesktop, 
  FaBuilding, 
  FaBarcode, 
  FaMemory, 
  FaHdd, 
  FaUser,
  FaHashtag,
  FaTrademark
} from 'react-icons/fa';
import './AssetModal.css';

function AssetModal({ asset, onClose }) {
  if (!asset) return null;

  const getDeviceIcon = (tipo) => {
    switch(tipo?.toLowerCase()) {
      case 'laptop':
        return <FaLaptop className="device-icon laptop" />;
      case 'desktop':
        return <FaDesktop className="device-icon desktop" />;
      case 'aio':
        return <FaDesktop className="device-icon aio" />;
      default:
        return <FaLaptop className="device-icon" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="asset-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="asset-card">
          <div className="device-avatar">
            {getDeviceIcon(asset.tipo)}
          </div>

          <div className="asset-header">
            <div className="asset-id">
              <FaHashtag className="id-icon" />
              <span>ID: {asset.id}</span>
            </div>
            <h2 className="asset-name">{asset.nombre_equipo || 'Equipo'}</h2>
            <p className="asset-type">{asset.tipo}</p>
          </div>
          
          <div className="asset-details-grid">
            <div className="detail-item">
              <FaBuilding className="detail-icon" />
              <div className="detail-text">
                <strong>Ubicación</strong>
                <p>{asset.sede}</p>
              </div>
            </div>

            <div className="detail-item">
              <FaTrademark className="detail-icon" />
              <div className="detail-text">
                <strong>Marca y Modelo</strong>
                <p>{asset.marca || 'N/A'}</p>
                <p className="model-text">{asset.modelo || 'N/A'}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <FaBarcode className="detail-icon" />
              <div className="detail-text">
                <strong>Información de Activo</strong>
                <p>Serial: {asset.serial || 'N/A'}</p>
                <p>Activo Fijo: {asset.activo_fijo || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-item">
              <FaUser className="detail-icon" />
              <div className="detail-text">
                <strong>Asignación</strong>
                <p>{asset.empleado || 'No asignado'}</p>
                <p className="estado-badge" data-estado={asset.estado?.toLowerCase()}>
                  {asset.estado}
                </p>
              </div>
            </div>
            
            <div className="detail-item spec">
              <FaMemory className="detail-icon" />
              <div className="detail-text">
                <strong>RAM</strong>
                <p>{asset.ram || 'N/A'}</p>
              </div>
            </div>
              
            <div className="detail-item spec">
              <FaHdd className="detail-icon" />
              <div className="detail-text">
                <strong>Disco</strong>
                <p>{asset.disco || 'N/A'}</p>
              </div>
            </div>
          </div>

          {asset.notas && (
            <div className="asset-notes">
              <strong>Notas</strong>
              <p>{asset.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssetModal;