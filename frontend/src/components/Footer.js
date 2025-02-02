import React from 'react';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        {currentYear}. 
        <span className="sura-brand">
          <img src="/favicon-100x100.png" alt="SURA" className="footer-logo" />
          SURA
        </span> 
        de Venezuela. ITS.
      </div>
    </footer>
  );
}

export default Footer; 