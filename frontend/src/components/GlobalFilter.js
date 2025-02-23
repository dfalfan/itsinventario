import React from 'react';
import { FaSearch } from 'react-icons/fa';
import './GlobalFilter.css';

const GlobalFilter = ({ filter, setFilter }) => {
  return (
    <div className="global-filter">
      <FaSearch className="search-icon" />
      <input
        value={filter || ''}
        onChange={e => setFilter(e.target.value)}
        placeholder="Buscar..."
        className="search-input"
      />
    </div>
  );
};

export default GlobalFilter; 