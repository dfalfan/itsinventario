import React from 'react';
import { 
  FaTimes, 
  FaMobileAlt, 
  FaBuilding, 
  FaBarcode, 
  FaUser,
  FaHashtag,
  FaTrademark,
  FaSimCard,
  FaPhoneSquare
} from 'react-icons/fa';
import './AssetModal.css';

function SmartphoneModal({ smartphone, onClose }) {
  if (!smartphone) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="asset-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="asset-card">
          <div className="device-avatar">
            <FaMobileAlt className="device-icon smartphone" />
          </div>

          <div className="asset-header">
            <div className="asset-id">
              <FaHashtag className="id-icon" />
              <span>ID: {smartphone.id}</span>
            </div>
            <h2 className="asset-name">{smartphone.marca} {smartphone.modelo}</h2>
            <p className="asset-type">Smartphone</p>
          </div>
          
          <div className="asset-details-grid">
            <div className="detail-item">
              <FaTrademark className="detail-icon" />
              <div className="detail-text">
                <strong>Marca y Modelo</strong>
                <p>{smartphone.marca || 'N/A'}</p>
                <p className="model-text">{smartphone.modelo || 'N/A'}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <FaBarcode className="detail-icon" />
              <div className="detail-text">
                <strong>Serial</strong>
                <p>{smartphone.serial || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-item">
              <FaSimCard className="detail-icon" />
              <div className="detail-text">
                <strong>IMEI</strong>
                <p>Principal: {smartphone.imei || 'N/A'}</p>
                {smartphone.imei2 && <p>Secundario: {smartphone.imei2}</p>}
              </div>
            </div>

            <div className="detail-item">
              <FaPhoneSquare className="detail-icon" />
              <div className="detail-text">
                <strong>Línea</strong>
                <p>{smartphone.linea || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-item">
              <FaUser className="detail-icon" />
              <div className="detail-text">
                <strong>Asignación</strong>
                <p>{smartphone.empleado || 'No asignado'}</p>
                <p className="estado-badge" data-estado={smartphone.estado?.toLowerCase()}>
                  {smartphone.estado}
                </p>
              </div>
            </div>

            {smartphone.fecha_asignacion && (
              <div className="detail-item">
                <FaBuilding className="detail-icon" />
                <div className="detail-text">
                  <strong>Fecha de Asignación</strong>
                  <p>{new Date(smartphone.fecha_asignacion).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SmartphoneModal; 