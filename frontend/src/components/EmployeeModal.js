import React from 'react';
import { FaTimes, FaUser, FaBuilding, FaPhone, FaEnvelope } from 'react-icons/fa';
import './EmployeeModal.css';

function EmployeeModal({ employee, onClose }) {
  if (!employee) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="employee-card">
          <div className="employee-avatar">
            <FaUser className="avatar-icon" />
          </div>
          
          <h2 className="employee-name">{employee.nombre}</h2>
          <p className="employee-title">{employee.cargo}</p>
          
          <div className="employee-details">
            <div className="detail-item">
              <FaBuilding className="detail-icon" />
              <div className="detail-text">
                <strong>Ubicación</strong>
                <p>{employee.sede}</p>
                <p>{employee.gerencia} - {employee.departamento}</p>
                <p>{employee.area}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <FaPhone className="detail-icon" />
              <div className="detail-text">
                <strong>Contacto</strong>
                <p>Ext: {employee.extension || 'N/A'}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <FaEnvelope className="detail-icon" />
              <div className="detail-text">
                <strong>Correo</strong>
                <p>{employee.correo || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="employee-equipment">
            <strong>Equipo Asignado</strong>
            <p>{employee.equipo_asignado || 'No hay equipo asignado'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeModal;