import React, { useState, useEffect } from 'react';
import { FaTimes, FaLaptop, FaIdCard, FaUser, FaBuilding, FaSitemap, FaPhone, FaEnvelope, FaBriefcase, FaUsers, FaLayerGroup } from 'react-icons/fa';
import AssignEquipmentModal from './AssignEquipmentModal';
import './NewEmployeeModal.css';

// Agregar esta función de utilidad al inicio del componente
const removeDuplicates = (array, key) => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

function NewEmployeeModal({ onClose, onEmployeeAdded }) {
  const [formData, setFormData] = useState({
    ficha: '',
    nombres: '',
    apellidos: '',
    sede_id: '',
    gerencia_id: '',
    departamento_id: '',
    area_id: '',
    cargo_id: '',
    extension: '',
    correo: ''
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [savedEmployee, setSavedEmployee] = useState(null);
  const [error, setError] = useState(null);

  const [options, setOptions] = useState({
    sedes: [],
    gerencias: [],
    departamentos: [],
    areas: [],
    cargos: []
  });

  // Cargar sedes y gerencias al montar el componente
  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/api/sedes').then(res => res.json()),
      fetch('http://localhost:5000/api/gerencias').then(res => res.json())
    ])
      .then(([sedesData, gerenciasData]) => {
        setOptions(prev => ({
          ...prev,
          sedes: sedesData,
          gerencias: gerenciasData
        }));
      })
      .catch(error => console.error('Error cargando datos iniciales:', error));
  }, []);

  // Cargar departamentos cuando cambia la gerencia
  useEffect(() => {
    if (formData.gerencia_id) {
      fetch(`http://localhost:5000/api/departamentos/${formData.gerencia_id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Error al cargar departamentos');
          }
          return res.json();
        })
        .then(data => {
          if (!Array.isArray(data)) {
            console.error('Datos de departamentos no válidos:', data);
            setOptions(prev => ({ ...prev, departamentos: [] }));
            return;
          }
          const uniqueDepartamentos = removeDuplicates(data, 'nombre');
          setOptions(prev => ({ ...prev, departamentos: uniqueDepartamentos }));
          setFormData(prev => ({
            ...prev,
            departamento_id: '',
            area_id: '',
            cargo_id: ''
          }));
        })
        .catch(error => {
          console.error('Error:', error);
          setOptions(prev => ({ ...prev, departamentos: [] }));
        });
    }
  }, [formData.gerencia_id]);

  // Cargar áreas cuando cambia el departamento
  useEffect(() => {
    if (formData.departamento_id) {
      fetch(`http://localhost:5000/api/areas/${formData.departamento_id}`)
        .then(res => res.json())
        .then(data => {
          const uniqueAreas = removeDuplicates(data, 'nombre');
          setOptions(prev => ({ ...prev, areas: uniqueAreas }));
          setFormData(prev => ({
            ...prev,
            area_id: '',
            cargo_id: ''
          }));
        })
        .catch(error => console.error('Error cargando áreas:', error));
    }
  }, [formData.departamento_id]);

  // Cargar cargos cuando cambia el área
  useEffect(() => {
    if (formData.area_id) {
      fetch(`http://localhost:5000/api/cargos/${formData.area_id}`)
        .then(res => res.json())
        .then(data => {
          const uniqueCargos = removeDuplicates(data, 'nombre');
          setOptions(prev => ({ ...prev, cargos: uniqueCargos }));
          setFormData(prev => ({
            ...prev,
            cargo_id: ''
          }));
        })
        .catch(error => console.error('Error cargando cargos:', error));
    }
  }, [formData.area_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/empleados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          nombre_completo: `${formData.nombres} ${formData.apellidos}`.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar empleado');
      }

      const savedData = await response.json();
      setSavedEmployee(savedData);
      setShowAssignModal(true);
      if (onEmployeeAdded) onEmployeeAdded(savedData);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const handleAssignSuccess = () => {
    setShowAssignModal(false);
    onClose();
  };

  const handleAssignEquipment = () => {
    if (savedEmployee) {
      setShowAssignModal(true);
    } else {
      setError("Por favor, guarde el empleado antes de asignar un equipo.");
    }
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
              <label htmlFor="ficha">
                <FaIdCard className="input-icon" /> Ficha
              </label>
              <input
                type="text"
                id="ficha"
                name="ficha"
                value={formData.ficha}
                onChange={handleChange}
                placeholder="####"
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellidos">
                 <FaUser className="input-icon" />Apellidos
              </label>
              <input
                type="text"
                id="apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Apellidos"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nombres">
                <FaUser className="input-icon" /> Nombres
              </label>
              <input
                type="text"
                id="nombres"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Nombres"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sede_id">
                <FaBuilding className="input-icon" /> Sede
              </label>
              <select
                id="sede_id"
                name="sede_id"
                value={formData.sede_id}
                onChange={handleChange}
              >
                <option value="">Seleccione una sede</option>
                {options.sedes.map(sede => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="gerencia_id">
                <FaSitemap className="input-icon" /> Gerencia
              </label>
              <select
                id="gerencia_id"
                name="gerencia_id"
                value={formData.gerencia_id}
                onChange={handleChange}
              >
                <option value="">Seleccione una gerencia</option>
                {options.gerencias.map(gerencia => (
                  <option key={gerencia.id} value={gerencia.id}>
                    {gerencia.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="departamento_id">
                <FaUsers className="input-icon" /> Departamento
              </label>
              <select
                id="departamento_id"
                name="departamento_id"
                value={formData.departamento_id}
                onChange={handleChange}
                disabled={!formData.gerencia_id}
              >
                <option value="">Seleccione un departamento</option>
                {options.departamentos.map(departamento => (
                  <option key={departamento.id} value={departamento.id}>
                    {departamento.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="area_id">
                <FaLayerGroup className="input-icon" /> Área
              </label>
              <select
                id="area_id"
                name="area_id"
                value={formData.area_id}
                onChange={handleChange}
                disabled={!formData.departamento_id}
              >
                <option value="">Seleccione un área</option>
                {options.areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cargo_id">
                <FaBriefcase className="input-icon" /> Cargo
              </label>
              <select
                id="cargo_id"
                name="cargo_id"
                value={formData.cargo_id}
                onChange={handleChange}
                disabled={!formData.area_id}
              >
                <option value="">Seleccione un cargo</option>
                {options.cargos.map(cargo => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="extension">
                <FaPhone className="input-icon" /> Extensión
              </label>
              <input
                type="text"
                id="extension"
                name="extension"
                value={formData.extension}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormData(prev => ({ ...prev, extension: value }));
                }}
                placeholder="####"
                maxLength="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="correo">
                <FaEnvelope className="input-icon" /> Correo
              </label>
              <div className="email-input-container">
                <input
                  type="text"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '');
                    setFormData(prev => ({ ...prev, correo: value }));
                  }}
                  placeholder="usuario"
                />
                <span className="email-domain">@sura.com.ve</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <div className="main-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="save-button">
                Guardar
              </button>
            </div>
          </div>
        </form>

        {showAssignModal && savedEmployee && (
          <AssignEquipmentModal
            employee={savedEmployee}
            onClose={() => setShowAssignModal(false)}
            onAssign={handleAssignSuccess}
          />
        )}
      </div>
    </div>
  );
}

export default NewEmployeeModal;