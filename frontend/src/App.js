import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/empleados')
      .then(response => response.json())
      .then(data => setEmpleados(data));
  }, []);

  return (
    <div className="App">
      <h1>Lista de Empleados</h1>
      <table>
        <thead>
          <tr>
            <th>Ficha</th>
            <th>Nombre</th>
            <th>Sede</th>
            <th>Gerencia</th>
            <th>Departamento</th>
            <th>Área</th>
            <th>Cargo</th>
          </tr>
        </thead>
        <tbody>
          {empleados.map((empleado, index) => (
            <tr key={index}>
              <td>{empleado.ficha}</td>
              <td>{empleado.nombre}</td>
              <td>{empleado.sede}</td>
              <td>{empleado.gerencia}</td>
              <td>{empleado.departamento}</td>
              <td>{empleado.area}</td>
              <td>{empleado.cargo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;