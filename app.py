from flask import request, jsonify
from flask_restful import Resource
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from ldap3 import Server, Connection, MODIFY_REPLACE

app = Flask(__name__)
db = SQLAlchemy(app)

class Empleado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(100))
    equipo_asignado = db.Column(db.Integer)
    smartphone_asignado = db.Column(db.Integer)

class Equipo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    empleado_asignado = db.Column(db.Integer)
    estado = db.Column(db.String(50))

class Smartphone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    empleado_asignado = db.Column(db.Integer)
    estado = db.Column(db.String(50))

class Log(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    accion = db.Column(db.String(100))
    detalles = db.Column(db.Text)
    fecha = db.Column(db.DateTime)

@app.route('/api/empleados/<int:empleado_id>', methods=['DELETE'])
def eliminar_empleado(empleado_id):
    try:
        options = request.json
        empleado = Empleado.query.get(empleado_id)
        
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404

        # Procesar las opciones seleccionadas
        if options.get('unassignAsset') and empleado.equipo_asignado:
            equipo = Equipo.query.get(empleado.equipo_asignado)
            if equipo:
                equipo.empleado_asignado = None
                equipo.estado = 'DISPONIBLE'
                db.session.add(equipo)

        if options.get('unassignSmartphone') and empleado.smartphone_asignado:
            smartphone = Smartphone.query.get(empleado.smartphone_asignado)
            if smartphone:
                smartphone.empleado_asignado = None
                smartphone.estado = 'DISPONIBLE'
                db.session.add(smartphone)

        # Registrar las acciones en el log
        log_entry = Log(
            accion='ELIMINACION_EMPLEADO',
            detalles=f'Empleado eliminado: {empleado.nombre_completo}. Acciones: {json.dumps(options)}',
            fecha=datetime.now()
        )
        db.session.add(log_entry)

        # Eliminar el empleado
        db.session.delete(empleado)
        db.session.commit()

        return jsonify({'message': 'Empleado eliminado exitosamente'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 