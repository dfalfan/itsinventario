import React, { useState, useEffect } from 'react';
import { FaPrint, FaBarcode, FaBuilding, FaTrademark, FaTag, FaFileSignature, FaNetworkWired, FaLink } from 'react-icons/fa';
import './Modal.css';

const MARCAS_IMPRESORAS = [
  'Canon',
  'HP',
  'Kyocera',
  'Konica',
  'Lexmark',
  'Epson'
];

const PROVEEDORES = [
  'DELCOP',
  'SYSCOPY'
];

function AddPrinterModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    nombre: '',
    serial: '',
    proveedor: '',
    sede_id: '',
    ip: ''
  });
  const [sedes, setSedes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSedes();
  }, []);

  const fetchSedes = async () => {
    try {
      const response = await fetch('http://192.168.141.50:5000/api/sedes');
      if (!response.ok) throw new Error('Error al cargar sedes');
      const data = await response.json();
      setSedes(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar las sedes');
    }
  };

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
      const response = await fetch('http://192.168.141.50:5000/api/impresoras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear la impresora');
      }

      const data = await response.json();
      onAdd(data.impresora);
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
        <h2>Agregar Nueva Impresora</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
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
              <FaTrademark className="input-icon" /> Marca
            </label>
            <select
              id="marca"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione una marca</option>
              {MARCAS_IMPRESORAS.map(marca => (
                <option key={marca} value={marca}>
                  {marca}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="modelo">
              <FaTag className="input-icon" /> Modelo
            </label>
            <input
              type="text"
              id="modelo"
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              required
              placeholder="Ej: LaserJet Pro M404n"
            />
          </div>

          <div className="form-group">
            <label htmlFor="nombre">
              <FaFileSignature className="input-icon" /> Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Ej: Impresora RR.HH"
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
              placeholder="Número de serie de la impresora"
            />
          </div>

          <div className="form-group">
            <label htmlFor="proveedor">
              <FaBuilding className="input-icon" /> Proveedor
            </label>
            <select
              id="proveedor"
              name="proveedor"
              value={formData.proveedor}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un proveedor</option>
              {PROVEEDORES.map(proveedor => (
                <option key={proveedor} value={proveedor}>
                  {proveedor}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ip">
              <FaNetworkWired className="input-icon" /> Dirección IP
            </label>
            <input
              type="text"
              id="ip"
              name="ip"
              value={formData.ip}
              onChange={handleChange}
              required
              placeholder="Ej: 192.168.141.20"
              pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
              title="Ingrese una dirección IP válida (Ej: 192.168.141.20)"
            />
          </div>

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

export default AddPrinterModal; 