from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://its:sura@postgres:5432/itsinventario'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Sede(db.Model):
    __tablename__ = 'sedes'
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(10), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)

class Gerencia(db.Model):
    __tablename__ = 'gerencias'
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(10))
    nombre = db.Column(db.String(100), nullable=False)

class Departamento(db.Model):
    __tablename__ = 'departamentos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    gerencia_id = db.Column(db.Integer, db.ForeignKey('gerencias.id'))

class Area(db.Model):
    __tablename__ = 'areas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    departamento_id = db.Column(db.Integer, db.ForeignKey('departamentos.id'))

class Cargo(db.Model):
    __tablename__ = 'cargos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id'))

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
    equipo_asignado = db.Column(db.String(200), nullable=True)
    extension = db.Column(db.String(10), nullable=True)
    correo = db.Column(db.String(200), nullable=True)

    sede = db.relationship('Sede')
    gerencia = db.relationship('Gerencia')
    departamento = db.relationship('Departamento')
    area = db.relationship('Area')
    cargo = db.relationship('Cargo')

class Asset(db.Model):
    __tablename__ = 'assets'
    id = db.Column(db.Integer, primary_key=True)
    sede_id = db.Column(db.Integer, db.ForeignKey('sedes.id'))
    tipo = db.Column(db.String(20))
    nombre_equipo = db.Column(db.String(50))
    modelo = db.Column(db.String(50))
    marca = db.Column(db.String(50))
    serial = db.Column(db.String(100))
    ram = db.Column(db.String(20))
    disco = db.Column(db.String(50))
    estado = db.Column(db.String(20))
    activo_fijo = db.Column(db.String(20))
    empleado_id = db.Column(db.Integer, db.ForeignKey('empleados.id'))
    notas = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

@app.route('/api/empleados')
def get_empleados():
    try:
        empleados = db.session.query(
            Empleado, Asset
        ).outerjoin(
            Asset, Empleado.id == Asset.empleado_id
        ).all()
        
        return jsonify([{
            'ficha': emp.ficha,
            'nombre': emp.nombre_completo,
            'sede': emp.sede.nombre if emp.sede else '',
            'gerencia': emp.gerencia.nombre if emp.gerencia else '',
            'departamento': emp.departamento.nombre if emp.departamento else '',
            'area': emp.area.nombre if emp.area else '',
            'cargo': emp.cargo.nombre if emp.cargo else '',
            'equipo_asignado': asset.tipo if asset else '',
            'extension': emp.extension or '',
            'correo': emp.correo or ''
        } for emp, asset in empleados])
    except Exception as e:
        print(f"Error en get_empleados: {str(e)}")
        return jsonify([])

@app.route('/api/sedes')
def get_sedes():
    try:
        sedes = Sede.query.all()
        return jsonify([{
            'id': sede.id,
            'nombre': sede.nombre,
            'codigo': sede.codigo
        } for sede in sedes])
    except Exception as e:
        print(f"Error en get_sedes: {str(e)}")
        return jsonify([])

@app.route('/api/gerencias')
def get_gerencias():
    try:
        gerencias = Gerencia.query.all()
        return jsonify([{
            'id': gerencia.id,
            'nombre': gerencia.nombre,
            'codigo': gerencia.codigo
        } for gerencia in gerencias])
    except Exception as e:
        print(f"Error en get_gerencias: {str(e)}")
        return jsonify([])

@app.route('/api/departamentos/<int:gerencia_id>')
def get_departamentos(gerencia_id):
    try:
        departamentos = db.session.query(Departamento)\
            .filter_by(gerencia_id=gerencia_id)\
            .distinct(Departamento.nombre)\
            .order_by(Departamento.nombre)\
            .all()
            
        return jsonify([{
            'id': dep.id,
            'nombre': dep.nombre
        } for dep in departamentos])
    except Exception as e:
        print(f"Error en get_departamentos: {str(e)}")
        return jsonify([])

@app.route('/api/areas/<int:departamento_id>')
def get_areas(departamento_id):
    try:
        areas = db.session.query(Area)\
            .filter_by(departamento_id=departamento_id)\
            .distinct(Area.nombre)\
            .order_by(Area.nombre)\
            .all()
            
        return jsonify([{
            'id': area.id,
            'nombre': area.nombre
        } for area in areas])
    except Exception as e:
        print(f"Error en get_areas: {str(e)}")
        return jsonify([])

@app.route('/api/cargos/<int:area_id>')
def get_cargos(area_id):
    try:
        cargos = db.session.query(Cargo)\
            .filter_by(area_id=area_id)\
            .distinct(Cargo.nombre)\
            .order_by(Cargo.nombre)\
            .all()
            
        return jsonify([{
            'id': cargo.id,
            'nombre': cargo.nombre
        } for cargo in cargos])
    except Exception as e:
        print(f"Error en get_cargos: {str(e)}")
        return jsonify([])

@app.route('/api/activos')
def get_activos():
    try:
        activos = db.session.query(
            Asset, Empleado, Sede
        ).outerjoin(
            Empleado, Asset.empleado_id == Empleado.id
        ).outerjoin(
            Sede, Asset.sede_id == Sede.id
        ).all()
        
        return jsonify([{
            'id': asset.id,
            'tipo': asset.tipo,
            'nombre_equipo': asset.nombre_equipo,
            'modelo': asset.modelo,
            'marca': asset.marca,
            'serial': asset.serial,
            'ram': asset.ram,
            'disco': asset.disco,
            'estado': asset.estado,
            'activo_fijo': asset.activo_fijo,
            'sede': sede.nombre if sede else '',
            'empleado': empleado.nombre_completo if empleado else '',
            'notas': asset.notas
        } for asset, empleado, sede in activos])
    except Exception as e:
        print(f"Error en get_activos: {str(e)}")
        return jsonify([])

@app.route('/api/dashboard/stats')
def get_dashboard_stats():
    try:
        # Total de equipos
        total_equipos = Asset.query.count()
        
        # Empleados sin equipo
        empleados_con_equipo = db.session.query(Asset.empleado_id).distinct()
        empleados_sin_equipo = Empleado.query.filter(
            ~Empleado.id.in_(empleados_con_equipo)
        ).count()
        
        # Equipos en reparación
        equipos_reparacion = Asset.query.filter_by(estado='REPARACION').count()
        
        # Equipos en stock (sin asignar)
        equipos_stock = Asset.query.filter_by(empleado_id=None).count()
        
        # Distribución por tipo de equipo
        equipos_por_tipo = db.session.query(
            Asset.tipo,
            db.func.count(Asset.id).label('cantidad')
        ).group_by(Asset.tipo).all()
        
        # Distribución por sede
        equipos_por_sede = db.session.query(
            Sede.nombre,
            db.func.count(Asset.id).label('cantidad')
        ).join(Asset).group_by(Sede.nombre).all()
        
        return jsonify({
            'totalEquipos': total_equipos,
            'empleadosSinEquipo': empleados_sin_equipo,
            'equiposEnReparacion': equipos_reparacion,
            'equiposEnStock': equipos_stock,
            'equiposPorTipo': [
                {'tipo': tipo, 'cantidad': cantidad}
                for tipo, cantidad in equipos_por_tipo
            ],
            'equiposPorSede': [
                {'sede': sede, 'cantidad': cantidad}
                for sede, cantidad in equipos_por_sede
            ]
        })
    except Exception as e:
        print(f"Error en get_dashboard_stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)