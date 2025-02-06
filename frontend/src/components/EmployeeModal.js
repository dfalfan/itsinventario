import React from "react";
import {
  FaTimes,
  FaUser,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaLaptop,
  FaMobileAlt,
  FaSitemap,
  FaUserTie,
} from "react-icons/fa";
import "./EmployeeModal.css";

function EmployeeModal({ employee, onClose }) {
  if (!employee) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="employee-card">
          <div className="employee-avatar">
            <FaUser className="avatar-icon" />
          </div>

          <h2 className="employee-name">{employee.nombre}</h2>
          <p className="employee-title">{employee.cargo}</p>
          <p className="employee-ficha">Ficha: {employee.ficha}</p>

          <div className="employee-details">
            <div className="detail-item">
              <FaBuilding className="detail-icon" />
              <div className="detail-text">
                <strong>Sede</strong>
                <p>{employee.sede}</p>
              </div>
            </div>

            <div className="detail-item organization">
              <FaSitemap className="detail-icon" />
              <div className="detail-text">
                <strong>Organización</strong>
                <div className="organization-tree">
                  <p className="gerencia">{employee.gerencia}</p>
                  <p className="departamento">↳ {employee.departamento}</p>
                  <p className="area">↳ {employee.area}</p>
                </div>
              </div>
            </div>

            <div className="detail-item">
              <FaUserTie className="detail-icon" />
              <div className="detail-text">
                <strong>Cargo</strong>
                <p>{employee.cargo}</p>
              </div>
            </div>

            <div className="detail-item">
              <FaPhone className="detail-icon" />
              <div className="detail-text">
                <strong>Extensión</strong>
                <p className="extension-number">
                  {employee.extension || "N/A"}
                </p>
              </div>
            </div>

            <div className="detail-item">
              <FaEnvelope className="detail-icon" />
              <div className="detail-text">
                <strong>Correo</strong>
                <p>{employee.correo || "N/A"}</p>
              </div>
            </div>

            <div className="detail-item">
              <FaLaptop className="detail-icon" />
              <div className="detail-text">
                <strong>Equipo Asignado</strong>
                <p
                  className={`equipment-status ${
                    employee.equipo_asignado ? "assigned" : ""
                  }`}
                >
                  {employee.equipo_asignado || "No hay equipo asignado"}
                </p>
              </div>
            </div>

            <div className="detail-item">
              <FaMobileAlt className="detail-icon" />
              <div className="detail-text">
                <strong>Smartphone Asignado</strong>
                <p className={`equipment-status ${employee.smartphone_asignado ? 'assigned' : ''}`}>
                  {employee.smartphone_asignado || 'No hay smartphone asignado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeModal;
