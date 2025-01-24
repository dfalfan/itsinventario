import React, { useState, useEffect } from 'react';
import './NewAssetModal.css';
import { FaTimes, FaLaptop, FaBuilding, FaBarcode, FaMemory, FaHdd } from 'react-icons/fa';
import PropTypes from 'prop-types';

function NewAssetModal({ onClose, onAssetAdded }) {
  const [formData, setFormData] = useState({
    tipo: '',
    nombre_equipo: '',
    sede_id: '',
    marca: '',
    modelo: '',
    serial: '',
    ram: '',
    disco: '',
    activo_fijo: '',
    notas: ''
  });

  const [sedes, setSedes] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [rams, setRams] = useState([]);
  const [discos, setDiscos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cargar sedes
    fetch('http://192.168.141.50:5000/api/sedes')
      .then(res => res.json())
      .then(data => setSedes(data))
      .catch(err => setError('Error al cargar sedes'));

    // Cargar marcas
    fetch('http://192.168.141.50:5000/api/marcas')
      .then(res => res.json())
      .then(data => setMarcas(data))
      .catch(err => setError('Error al cargar marcas'));

    // Cargar tipos de RAM
    fetch('http://192.168.141.50:5000/api/rams')
      .then(res => res.json())
      .then(data => setRams(data))
      .catch(err => setError('Error al cargar tipos de RAM'));

    // Cargar tipos de disco
    fetch('http://192.168.141.50:5000/api/discos')
      .then(res => res.json())
      .then(data => setDiscos(data))
      .catch(err => setError('Error al cargar tipos de disco'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://192.168.141.50:5000/api/activos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear activo');
      }

      const data = await response.json();
      onAssetAdded(data.asset);
      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content new-asset-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>

        <h2>Nuevo Activo</h2>
        
        <form onSubmit={handleSubmit} className="new-asset-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="tipo">
                <FaLaptop className="input-icon" /> Tipo
              </label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un tipo</option>
                <option value="AIO">AIO</option>
                <option value="LAPTOP">Laptop</option>
                <option value="DESKTOP">Desktop</option>
              </select>
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
              <label htmlFor="marca">
                <FaBarcode className="input-icon" /> Marca
              </label>
              <select
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una marca</option>
                {marcas.map(marca => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="modelo">
                <FaBarcode className="input-icon" /> Modelo
              </label>
              <input
                type="text"
                id="modelo"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="serial">
                <FaBarcode className="input-icon" /> Serial
              </label>
              <input
                type="text"
                id="serial"
                name="serial"
                value={formData.serial}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="activo_fijo">
                <FaBarcode className="input-icon" /> Activo Fijo
              </label>
              <input
                type="text"
                id="activo_fijo"
                name="activo_fijo"
                value={formData.activo_fijo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ram">
                <FaMemory className="input-icon" /> RAM
              </label>
              <select
                id="ram"
                name="ram"
                value={formData.ram}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione tipo de RAM</option>
                {rams.map(ram => (
                  <option key={ram} value={ram}>
                    {ram}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="disco">
                <FaHdd className="input-icon" /> Disco
              </label>
              <select
                id="disco"
                name="disco"
                value={formData.disco}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione tipo de Disco</option>
                {discos.map(disco => (
                  <option key={disco} value={disco}>
                    {disco}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="nombre_equipo">
                <FaLaptop className="input-icon" /> Nombre Equipo
              </label>
              <input
                type="text"
                id="nombre_equipo"
                name="nombre_equipo"
                value={formData.nombre_equipo}
                onChange={handleChange}
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

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

NewAssetModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onAssetAdded: PropTypes.func.isRequired,
};

export default NewAssetModal; 