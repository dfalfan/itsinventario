import React, { useState, useEffect } from 'react';
import { FaTimes, FaLaptop, FaIdCard, FaUser, FaBuilding, FaSitemap, FaPhone, FaEnvelope, FaBriefcase, FaUsers, FaLayerGroup } from 'react-icons/fa';
import AssignEquipmentModal from './AssignEquipmentModal';
import './NewEmployeeModal.css';
import axios from 'axios';

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
    nombres: '',
    apellidos: '',
    cedula: '',
    ficha: '',
    correo: '',
    sede_id: '',
    gerencia_id: '',
    departamento_id: '',
    area_id: '',
    cargo_id: '',
    nacionalidad: 'V'
  });

  const [incluirCorreo, setIncluirCorreo] = useState(true);
  const [warning, setWarning] = useState(null);

  const [sedes, setSedes] = useState([]);
  const [gerencias, setGerencias] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSedes = async () => {
    try {
      const response = await axios.get('http://192.168.141.50:5000/api/sedes');
      setSedes(response.data);
    } catch (error) {
      console.error('Error al cargar sedes:', error);
      setError('Error al cargar sedes');
    }
  };

  const fetchGerencias = async () => {
    try {
      const response = await axios.get('http://192.168.141.50:5000/api/gerencias');
      setGerencias(response.data);
    } catch (error) {
      console.error('Error al cargar gerencias:', error);
      setError('Error al cargar gerencias');
    }
  };

  const fetchDepartamentos = async (gerenciaId) => {
    try {
      const response = await axios.get(`http://192.168.141.50:5000/api/departamentos/${gerenciaId}`);
      const uniqueDepartamentos = removeDuplicates(response.data, 'nombre');
      setDepartamentos(uniqueDepartamentos);
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
      setError('Error al cargar departamentos');
    }
  };

  const fetchAreas = async (departamentoId) => {
    try {
      const response = await axios.get(`http://192.168.141.50:5000/api/areas/${departamentoId}`);
      const uniqueAreas = removeDuplicates(response.data, 'nombre');
      setAreas(uniqueAreas);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      setError('Error al cargar áreas');
    }
  };

  const fetchCargos = async (areaId) => {
    try {
      const response = await axios.get(`http://192.168.141.50:5000/api/cargos/${areaId}`);
      const uniqueCargos = removeDuplicates(response.data, 'nombre');
      setCargos(uniqueCargos);
    } catch (error) {
      console.error('Error al cargar cargos:', error);
      setError('Error al cargar cargos');
    }
  };

  useEffect(() => {
    fetchSedes();
    fetchGerencias();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cedula') {
      // Solo permitir números y formatear con puntos
      const numbersOnly = value.replace(/\D/g, '');
      const formattedValue = numbersOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      setFormData(prev => ({
        ...prev,
        cedula: formattedValue
      }));
    } else if (name === 'nombres' || name === 'apellidos') {
      // Capitalizar cada palabra
      const formattedValue = value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: formattedValue
        };
        
        // Generar correo automáticamente si ambos campos están llenos
        if (newData.nombres && newData.apellidos) {
          const primerNombre = newData.nombres.split(' ')[0].toLowerCase();
          const primerApellido = newData.apellidos.split(' ')[0].toLowerCase();
          newData.correo = `${primerNombre}.${primerApellido}`;
        }
        
        return newData;
      });
    } else if (name === 'ficha') {
      // Solo permitir números
      const numbersOnly = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        ficha: numbersOnly
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      // Limpiar campos dependientes cuando cambia una selección
      if (name === 'gerencia_id') {
        setFormData(prev => ({
          ...prev,
          departamento_id: '',
          area_id: '',
          cargo_id: ''
        }));
        if (value) fetchDepartamentos(value);
      }
      if (name === 'departamento_id') {
        setFormData(prev => ({
          ...prev,
          area_id: '',
          cargo_id: ''
        }));
        if (value) fetchAreas(value);
      }
      if (name === 'area_id') {
        setFormData(prev => ({
          ...prev,
          cargo_id: ''
        }));
        if (value) fetchCargos(value);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      // Construir el nombre completo
      const nombre_completo = `${formData.apellidos} ${formData.nombres}`;
      
      // Preparar los datos para enviar
      const empleadoData = {
        nombre_completo,
        ficha: formData.ficha,
        cedula: formData.cedula,
        nacionalidad: formData.nacionalidad,
        correo: incluirCorreo ? `${formData.correo}@sura.com.ve` : null,
        sede_id: parseInt(formData.sede_id),
        gerencia_id: parseInt(formData.gerencia_id),
        departamento_id: parseInt(formData.departamento_id),
        area_id: parseInt(formData.area_id),
        cargo_id: parseInt(formData.cargo_id),
        extension: null,
        equipo_asignado: null
      };

      console.log('Datos a enviar:', empleadoData);

      const response = await axios.post('http://192.168.141.50:5000/api/empleados', empleadoData);
      
      // Verificar si hay advertencias sobre el correo
      if (response.data.google_workspace?.warning) {
        setWarning(response.data.google_workspace.warning);
      }

      if (response.data) {
        onEmployeeAdded(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error completo:', error);
      setError(error.response?.data?.error || 'Error al crear el empleado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content new-employee-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>

        <h2>Nuevo Empleado</h2>
        
        {error && <div className="error-message">{error}</div>}
        {warning && <div className="warning-message">{warning}</div>}
        
        <form onSubmit={handleSubmit} className="new-employee-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="apellidos">
                <FaUser className="input-icon" /> Apellidos
              </label>
              <input
                type="text"
                id="apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleInputChange}
                placeholder="Apellidos"
                required
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
                onChange={handleInputChange}
                placeholder="Nombres"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cedula">
                <FaIdCard className="input-icon" /> Cédula
              </label>
              <div className="cedula-input-container">
                <select
                  id="nacionalidad"
                  name="nacionalidad"
                  value={formData.nacionalidad}
                  onChange={handleInputChange}
                  required
                  className="nacionalidad-select"
                >
                  <option value="V">V</option>
                  <option value="E">E</option>
                </select>
                <input
                  type="text"
                  id="cedula"
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleInputChange}
                  placeholder="Cédula"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ficha">
                <FaIdCard className="input-icon" /> Ficha
              </label>
              <input
                type="text"
                id="ficha"
                name="ficha"
                value={formData.ficha}
                onChange={handleInputChange}
                placeholder="Número de ficha"
                required
                maxLength="4"
              />
            </div>

            <div className="form-group">
              <label>
                <FaEnvelope className="input-icon" /> Correo
              </label>
              <div className="email-input-group">
                <input
                  type="text"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  placeholder="nombre.apellido"
                  disabled={!incluirCorreo}
                />
                <span className="email-domain">@sura.com.ve</span>
              </div>
              <div className="email-checkbox">
                <div className="email-opt-container">
                  <input
                    type="checkbox"
                    id="incluirCorreo"
                    checked={incluirCorreo}
                    onChange={(e) => setIncluirCorreo(e.target.checked)}
                  />
                  <label htmlFor="incluirCorreo" className="email-opt-label">Crear cuenta de correo</label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sede_id">
                <FaBuilding className="input-icon" /> Sede
              </label>
              <select
                id="sede_id"
                name="sede_id"
                value={formData.sede_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione una sede</option>
                {sedes.map(sede => (
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
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione una gerencia</option>
                {gerencias.map(gerencia => (
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
                onChange={handleInputChange}
                required
                disabled={!formData.gerencia_id}
              >
                <option value="">Seleccione un departamento</option>
                {departamentos.map(departamento => (
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
                onChange={handleInputChange}
                required
                disabled={!formData.departamento_id}
              >
                <option value="">Seleccione un área</option>
                {areas.map(area => (
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
                onChange={handleInputChange}
                required
                disabled={!formData.area_id}
              >
                <option value="">Seleccione un cargo</option>
                {cargos.map(cargo => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <div className="main-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="save-button" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewEmployeeModal;