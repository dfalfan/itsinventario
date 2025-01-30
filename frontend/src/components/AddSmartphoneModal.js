import React, { useState } from 'react';
import { FaMobileAlt, FaBarcode, FaSimCard, FaPhoneSquare, FaMobile } from 'react-icons/fa';
import './Modal.css';

const MARCAS_SMARTPHONES = [
  'Xiaomi',
  'Samsung',
  'iPhone',
  'Tecno',
  'Infinix',
  'Honor'
];

function AddSmartphoneModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    serial: '',
    imei: '',
    imei2: '',
    linea: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://192.168.141.50:5000/api/smartphones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear el smartphone');
      }

      const data = await response.json();
      onAdd(data.smartphone);
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Agregar Nuevo Smartphone</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="marca">
                <FaMobileAlt className="input-icon" />
                Marca: *
              </label>
              <select
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
                className="form-control"
              >
                <option value="">Seleccione una marca</option>
                {MARCAS_SMARTPHONES.map(marca => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="modelo">
                <FaMobile className="input-icon" />
                Modelo: *
              </label>
              <input
                type="text"
                id="modelo"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Ej: Redmi Note 12"
              />
            </div>

            <div className="form-group">
              <label htmlFor="serial">
                <FaBarcode className="input-icon" />
                Serial: *
              </label>
              <input
                type="text"
                id="serial"
                name="serial"
                value={formData.serial}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Ingrese el serial del equipo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="imei">
                <FaSimCard className="input-icon" />
                IMEI: *
              </label>
              <input
                type="text"
                id="imei"
                name="imei"
                value={formData.imei}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Ingrese el IMEI principal"
                maxLength="15"
                pattern="[0-9]{15}"
                title="El IMEI debe contener 15 dígitos numéricos"
              />
            </div>

            <div className="form-group">
              <label htmlFor="imei2">
                <FaSimCard className="input-icon" />
                IMEI 2:
              </label>
              <input
                type="text"
                id="imei2"
                name="imei2"
                value={formData.imei2}
                onChange={handleChange}
                className="form-control"
                placeholder="Ingrese el IMEI secundario (opcional)"
                maxLength="15"
                pattern="[0-9]{15}"
                title="El IMEI debe contener 15 dígitos numéricos"
              />
            </div>

            <div className="form-group">
              <label htmlFor="linea">
                <FaPhoneSquare className="input-icon" />
                Línea:
              </label>
              <input
                type="text"
                id="linea"
                name="linea"
                value={formData.linea}
                onChange={handleChange}
                className="form-control"
                placeholder="Número de línea (opcional)"
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="button secondary">
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSmartphoneModal; 