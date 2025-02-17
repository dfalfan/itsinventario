import React from 'react';

const LoadingScreen = ({ title, message }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="custom-spinner"></div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 