import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import './NewEmployeeModal.css';

function NewEmployeeModal({ onClose }) {
  const [formData, setFormData] = useState({
    ficha: '',
    nombre: '',
    sede: '',
    gerencia: '',
    departamento: '',
    area: '',
    cargo: '',
    equipo_asignado: '',
    extension: '',
    correo: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos del formulario:', formData);
    // Aquí iría la lógica para guardar el empleado
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content new-employee-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>

        <h2>Nuevo Empleado</h2>
        
        <form onSubmit={handleSubmit} className="new-employee-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="ficha">Ficha</label>
              <input
                type="text"
                id="ficha"
                name="ficha"
                value={formData.ficha}
                onChange={handleChange}
                placeholder="Ej: F12345"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre y Apellidos"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sede">Sede</label>
              <input
                type="text"
                id="sede"
                name="sede"
                value={formData.sede}
                onChange={handleChange}
                placeholder="Sede"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gerencia">Gerencia</label>
              <input
                type="text"
                id="gerencia"
                name="gerencia"
                value={formData.gerencia}
                onChange={handleChange}
                placeholder="Gerencia"
              />
            </div>

            <div className="form-group">
              <label htmlFor="departamento">Departamento</label>
              <input
                type="text"
                id="departamento"
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                placeholder="Departamento"
              />
            </div>

            <div className="form-group">
              <label htmlFor="area">Área</label>
              <input
                type="text"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="Área"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cargo">Cargo</label>
              <input
                type="text"
                id="cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                placeholder="Cargo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="equipo_asignado">Equipo Asignado</label>
              <input
                type="text"
                id="equipo_asignado"
                name="equipo_asignado"
                value={formData.equipo_asignado}
                onChange={handleChange}
                placeholder="Equipo Asignado"
              />
            </div>

            <div className="form-group">
              <label htmlFor="extension">Extensión</label>
              <input
                type="text"
                id="extension"
                name="extension"
                value={formData.extension}
                onChange={handleChange}
                placeholder="Ext."
              />
            </div>

            <div className="form-group">
              <label htmlFor="correo">Correo</label>
              <input
                type="email"
                id="correo"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="save-button">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewEmployeeModal;