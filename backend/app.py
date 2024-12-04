from flask import Flask, jsonify, request
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
            'id': emp.id,
            'ficha': emp.ficha,
            'nombre': emp.nombre_completo,
            'sede': emp.sede.nombre if emp.sede else '',
            'gerencia': emp.gerencia.nombre if emp.gerencia else '',
            'departamento': emp.departamento.nombre if emp.departamento else '',
            'area': emp.area.nombre if emp.area else '',
            'cargo': emp.cargo.nombre if emp.cargo else '',
            'equipo_asignado': f"{asset.tipo} - {asset.nombre_equipo}" if asset else None,
            'asset_id': asset.id if asset else None,
            'extension': emp.extension or '',
            'correo': emp.correo or ''
        } for emp, asset in empleados])
    except Exception as e:
        print(f"Error en get_empleados: {str(e)}")
        return jsonify({'error': str(e)}), 500

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

@app.route('/api/empleados/sin-equipo', methods=['GET'])
def get_empleados_sin_equipo():
    try:
        empleados = db.session.query(
            Empleado.id,
            Empleado.ficha,
            Empleado.nombre_completo,
            Sede.nombre.label('sede_nombre'),
            Departamento.nombre.label('departamento_nombre'),
            Cargo.nombre.label('cargo_nombre')
        ).outerjoin(
            Sede, Empleado.sede_id == Sede.id
        ).outerjoin(
            Departamento, Empleado.departamento_id == Departamento.id
        ).outerjoin(
            Cargo, Empleado.cargo_id == Cargo.id
        ).filter(
            Empleado.equipo_asignado.is_(None)
        ).order_by(Empleado.nombre_completo).all()
        
        return jsonify([{
            'id': id,
            'ficha': ficha,
            'sede': sede_nombre,
            'nombre': nombre_completo,
            'departamento': departamento_nombre,
            'cargo': cargo_nombre
        } for id, ficha, nombre_completo, sede_nombre, departamento_nombre, cargo_nombre in empleados])
        
    except Exception as e:
        print("Error en get_empleados_sin_equipo:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/activos/<int:asset_id>/asignar', methods=['POST'])
def asignar_activo(asset_id):
    try:
        data = request.get_json()
        empleado_id = data.get('empleado_id')
        
        if not empleado_id:
            return jsonify({"error": "empleado_id es requerido"}), 400
            
        asset = Asset.query.get(asset_id)
        if not asset:
            return jsonify({"error": "Activo no encontrado"}), 404
            
        empleado = Empleado.query.get(empleado_id)
        if not empleado:
            return jsonify({"error": "Empleado no encontrado"}), 404
            
        asset.empleado_id = empleado_id
        asset.estado = 'Asignado'
        asset.updated_at = datetime.utcnow()
        
        empleado.equipo_asignado = f"{asset.tipo} - {asset.nombre_equipo}"
        
        db.session.commit()
        
        return jsonify({
            "message": "Activo asignado exitosamente",
            "empleado": empleado.nombre_completo,
            "activo": asset.nombre_equipo
        })
        
    except Exception as e:
        db.session.rollback()
        print("Error en asignar_activo:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/activos/<int:asset_id>/desasignar', methods=['POST'])
def desasignar_activo(asset_id):
    try:
        asset = Asset.query.get(asset_id)
        if not asset:
            return jsonify({"error": "Activo no encontrado"}), 404
            
        empleado = Empleado.query.get(asset.empleado_id)
        if empleado:
            empleado.equipo_asignado = None
            
        asset.empleado_id = None
        asset.estado = 'Disponible'
        asset.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Activo desasignado exitosamente",
            "activo": asset.nombre_equipo
        })
        
    except Exception as e:
        db.session.rollback()
        print("Error en desasignar_activo:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/activos/disponibles', methods=['GET'])
def get_activos_disponibles():
    try:
        activos = Asset.query.filter(
            Asset.empleado_id.is_(None),
            Asset.estado == 'Disponible'
        ).order_by(Asset.tipo, Asset.nombre_equipo).all()

        resultado = [{
            'id': asset.id,
            'tipo': asset.tipo,
            'nombre_equipo': asset.nombre_equipo,
            'marca': asset.marca,
            'modelo': asset.modelo,
            'serial': asset.serial,
            'ram': asset.ram,
            'disco': asset.disco,
            'activo_fijo': asset.activo_fijo
        } for asset in activos]

        return jsonify(resultado)

    except Exception as e:
        print("Error en get_activos_disponibles:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/activos/<int:asset_id>', methods=['PATCH'])
def update_asset(asset_id):
    try:
        asset = Asset.query.get(asset_id)
        if not asset:
            return jsonify({'error': 'Activo no encontrado'}), 404

        data = request.get_json()
        
        # Lista actualizada de campos permitidos para editar
        allowed_fields = ['nombre_equipo', 'modelo', 'serial', 'activo_fijo', 'tipo', 'marca', 'ram', 'disco']
        
        for field in data:
            if field in allowed_fields:
                setattr(asset, field, data[field])
        
        asset.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Activo actualizado exitosamente',
            'updated_fields': list(data.keys())
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tipos')
def get_tipos():
    try:
        # Obtener tipos únicos de la base de datos
        tipos = db.session.query(Asset.tipo).distinct().all()
        return jsonify([tipo[0] for tipo in tipos if tipo[0]])
    except Exception as e:
        print(f"Error en get_tipos: {str(e)}")
        return jsonify([])

@app.route('/api/marcas')
def get_marcas():
    try:
        marcas = db.session.query(Asset.marca).distinct().all()
        return jsonify([marca[0] for marca in marcas if marca[0]])
    except Exception as e:
        print(f"Error en get_marcas: {str(e)}")
        return jsonify([])

@app.route('/api/rams')
def get_rams():
    try:
        rams = db.session.query(Asset.ram).distinct().all()
        return jsonify([ram[0] for ram in rams if ram[0]])
    except Exception as e:
        print(f"Error en get_rams: {str(e)}")
        return jsonify([])

@app.route('/api/discos')
def get_discos():
    try:
        discos = db.session.query(Asset.disco).distinct().all()
        return jsonify([disco[0] for disco in discos if disco[0]])
    except Exception as e:
        print(f"Error en get_discos: {str(e)}")
        return jsonify([])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)