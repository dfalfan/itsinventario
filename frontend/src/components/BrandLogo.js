import React, { useState } from 'react';
import './BrandLogo.css';

const BRAND_LOGOS = {
  'HP': '/brand-logos/hp.png',
  'SIRAGON': '/brand-logos/siragon.png',
  'DELL': '/brand-logos/dell.png',
  'ASUS': '/brand-logos/asus.png',
  'LENOVO': '/brand-logos/lenovo.png',
  'ACER': '/brand-logos/acer.png'
};

function BrandLogo({ brand, onSave, isEditable = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(brand);
  const normalizedBrand = brand?.toUpperCase();
  const logoUrl = BRAND_LOGOS[normalizedBrand];

  const handleDoubleClick = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setCurrentValue(newValue);
    onSave?.(newValue);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      onSave?.(newValue);
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentValue(brand);
    }
  };

  if (isEditing) {
    return (
      <select
        value={currentValue || ''}
        onChange={handleChange}
        onBlur={() => setIsEditing(false)}
        onKeyDown={handleKeyPress}
        autoFocus
        className="brand-select"
      >
        <option value="">Seleccionar...</option>
        {Object.keys(BRAND_LOGOS).map((brandName) => (
          <option key={brandName} value={brandName}>
            {brandName}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="brand-container" onDoubleClick={handleDoubleClick}>
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={`${brand} logo`} 
          className="brand-logo"
          title={brand}
        />
      ) : (
        <span className="brand-name">{brand}</span>
      )}
    </div>
  );
}

export default BrandLogo; 