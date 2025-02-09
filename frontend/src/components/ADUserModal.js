import React from 'react';
import './Modal.css';

const ADUserModal = ({ isOpen, onClose, userInfo }) => {
  if (!isOpen) return null;

  const getStatusColor = (exists, active) => {
    if (!exists) return '#dc3545';
    return active ? '#28a745' : '#ffc107';
  };

  const getStatusText = (exists, active) => {
    if (!exists) return 'No existe';
    return active ? 'Activo' : 'Inactivo';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Verificación de Usuario AD</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {userInfo ? (
            userInfo.loading ? (
              <div className="loading">Verificando usuario en Active Directory...</div>
            ) : (
              <div className="ad-user-info">
                <div className="info-row">
                  <strong>Usuario esperado:</strong>
                  <span>{userInfo.expectedUsername}</span>
                </div>
                <div className="info-row">
                  <strong>Estado:</strong>
                  <span style={{ color: getStatusColor(userInfo.exists, userInfo.active) }}>
                    {getStatusText(userInfo.exists, userInfo.active)}
                  </span>
                </div>
                {userInfo.exists && (
                  <>
                    <div className="info-row">
                      <strong>Dominio:</strong>
                      <span>{userInfo.domain}</span>
                    </div>
                    <div className="info-row">
                      <strong>Grupos:</strong>
                      <div className="groups-list">
                        {userInfo.groups?.map((group, index) => (
                          <span key={index} className="group-tag">{group}</span>
                        ))}
                      </div>
                    </div>
                    <div className="info-row">
                      <strong>Último acceso:</strong>
                      <span>{userInfo.lastLogin}</span>
                    </div>
                  </>
                )}
                {(userInfo.message || userInfo.error) && (
                  <div className="info-row error-message">
                    <strong>Mensaje:</strong>
                    <span>{userInfo.message || userInfo.error}</span>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="loading">Cargando información...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ADUserModal; 