from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://its:sura@postgres:5432/itsinventario'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Sede(db.Model):
    __tablename__ = 'sedes'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))

class Gerencia(db.Model):
    __tablename__ = 'gerencias'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))

class Departamento(db.Model):
    __tablename__ = 'departamentos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))

class Area(db.Model):
    __tablename__ = 'areas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))

class Cargo(db.Model):
    __tablename__ = 'cargos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))

class Empleado(db.Model):
    __tablename__ = 'empleados'
    id = db.Column(db.Integer, primary_key=True)
    ficha = db.Column(db.String(10))
    nombre_completo = db.Column(db.String(200))
    sede_id = db.Column(db.Integer, db.ForeignKey('sedes.id'))
    gerencia_id = db.Column(db.Integer, db.ForeignKey('gerencias.id'))
    departamento_id = db.Column(db.Integer, db.ForeignKey('departamentos.id'))
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id'))
    cargo_id = db.Column(db.Integer, db.ForeignKey('cargos.id'))

    sede = db.relationship('Sede')
    gerencia = db.relationship('Gerencia')
    departamento = db.relationship('Departamento')
    area = db.relationship('Area')
    cargo = db.relationship('Cargo')

@app.route('/api/empleados')
def get_empleados():
    empleados = db.session.query(
        Empleado, Sede, Gerencia, Departamento, Area, Cargo
    ).join(Sede).join(Gerencia).join(Departamento).join(Area).join(Cargo).all()
    
    return jsonify([{
        'id': emp.id,
        'ficha': emp.ficha,
        'nombre': emp.nombre_completo,
        'sede': sede.nombre,
        'gerencia': ger.nombre,
        'departamento': dep.nombre,
        'area': area.nombre,
        'cargo': cargo.nombre
    } for emp, sede, ger, dep, area, cargo in empleados])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)