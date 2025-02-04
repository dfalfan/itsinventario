from flask import Flask, jsonify, request, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch
import os
import io
from ldap3 import Server, Connection, ALL, NTLM
from io import BytesIO
from dotenv import load_dotenv
from unidecode import unidecode
from google.oauth2 import service_account
from googleapiclient.discovery import build
import json
import socket

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://its:sura@postgres:5432/itsinventario'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Configuración de Google Workspace
SCOPES = [
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.reports.usage.readonly'
]
SERVICE_ACCOUNT_FILE = 'credentials.json'

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
    nombre_completo = db.Column(db.String(100))
    ficha = db.Column(db.String(10))
    cedula = db.Column(db.String(10))
    extension = db.Column(db.String(10))
    correo = db.Column(db.String(100))
    equipo_asignado = db.Column(db.String(100))
    sede_id = db.Column(db.Integer, db.ForeignKey('sedes.id'))
    gerencia_id = db.Column(db.Integer, db.ForeignKey('gerencias.id'))
    departamento_id = db.Column(db.Integer, db.ForeignKey('departamentos.id'))
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id'))
    cargo_id = db.Column(db.Integer, db.ForeignKey('cargos.id'))
    
    sede = db.relationship('Sede', lazy='joined')
    gerencia = db.relationship('Gerencia', lazy='joined')
    departamento = db.relationship('Departamento', lazy='joined')
    area = db.relationship('Area', lazy='joined')
    cargo = db.relationship('Cargo', lazy='joined')
    smartphone = db.relationship('Smartphone', uselist=False, back_populates='empleado')

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

class Smartphone(db.Model):
    __tablename__ = 'smartphones'
    id = db.Column(db.Integer, primary_key=True)
    marca = db.Column(db.String(100))
    modelo = db.Column(db.String(100))
    serial = db.Column(db.String(100))
    imei = db.Column(db.String(100))
    imei2 = db.Column(db.String(100))
    linea = db.Column(db.String(100))
    estado = db.Column(db.String(50))
    empleado_id = db.Column(db.Integer, db.ForeignKey('empleados.id'))
    fecha_asignacion = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    empleado = db.relationship('Empleado', back_populates='smartphone')

class Impresora(db.Model):
    __tablename__ = 'impresoras'
    id = db.Column(db.Integer, primary_key=True)
    sede_id = db.Column(db.Integer, db.ForeignKey('sedes.id'))
    impresora = db.Column(db.String(100))
    serial = db.Column(db.String(100))
    proveedor = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    sede = db.relationship('Sede', lazy='joined')

class Log(db.Model):
    __tablename__ = 'logs'
    id = db.Column(db.Integer, primary_key=True)
    categoria = db.Column(db.String(50))  # 'smartphones', 'assets', 'impresoras'
    accion = db.Column(db.String(100))    # 'asignación', 'desasignación', 'modificación', etc.
    descripcion = db.Column(db.Text)      # Descripción detallada de la acción
    item_id = db.Column(db.Integer)       # ID del elemento afectado
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/api/empleados')
def get_empleados():
    try:
        empleados = Empleado.query.all()
        
        # Obtener todos los assets en un solo query para evitar N+1
        assets = {str(a.id): {'tipo': a.tipo, 'nombre': a.nombre_equipo} for a in Asset.query.all()}
        
        return jsonify([{
            'id': e.id,
            'nombre': e.nombre_completo,
            'ficha': e.ficha,
            'extension': e.extension,
            'correo': e.correo,
            'sede': e.sede.nombre if e.sede else None,
            'gerencia': e.gerencia.nombre if e.gerencia else None,
            'departamento': e.departamento.nombre if e.departamento else None,
            'area': e.area.nombre if e.area else None,
            'cargo': e.cargo.nombre if e.cargo else None,
            'equipo_asignado': e.equipo_asignado,
            'asset_type': assets.get(e.equipo_asignado, {}).get('tipo'),
            'asset_name': assets.get(e.equipo_asignado, {}).get('nombre'),
            'sp_asignado': {
                'id': e.smartphone.id,
                'marca': e.smartphone.marca,
                'modelo': e.smartphone.modelo,
                'linea': e.smartphone.linea
            } if e.smartphone else None
        } for e in empleados])
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

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
        return jsonify({'error': 'Error obteniendo sedes'}), 500

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
        return jsonify({'error': str(e)}), 500

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
        return jsonify({'error': str(e)}), 500

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
        return jsonify({'error': str(e)}), 500

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
        return jsonify({'error': str(e)}), 500

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
            'sede': sede.nombre if sede else '',
            'tipo': asset.tipo,
            'estado': asset.estado,
            'empleado': empleado.nombre_completo if empleado else '',
            'empleado_id': empleado.id if empleado else None,
            'nombre_equipo': asset.nombre_equipo,
            'marca': asset.marca,
            'modelo': asset.modelo,
            'serial': asset.serial,
            'activo_fijo': asset.activo_fijo,
            'ram': asset.ram,
            'disco': asset.disco,
            'notas': asset.notas
        } for asset, empleado, sede in activos])
    except Exception as e:
        print(f"Error en get_activos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/stats')
def get_dashboard_stats():
    try:
        # Total de equipos
        total_equipos = Asset.query.count()
        
        # Empleados sin equipo
        empleados_sin_equipo = Empleado.query.filter(
            Empleado.equipo_asignado.is_(None)
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

        # Tasa de utilización
        equipos_asignados = Asset.query.filter(Asset.empleado_id.isnot(None)).count()
        tasa_utilizacion = [
            {'estado': 'Asignados', 'cantidad': equipos_asignados},
            {'estado': 'No Asignados', 'cantidad': total_equipos - equipos_asignados}
        ]

        # Distribución por departamento
        equipos_por_departamento = db.session.query(
            Departamento.nombre,
            db.func.count(Asset.id).label('cantidad')
        ).join(Empleado, Asset.empleado_id == Empleado.id)\
         .join(Departamento, Empleado.departamento_id == Departamento.id)\
         .group_by(Departamento.nombre)\
         .order_by(db.func.count(Asset.id).desc())\
         .limit(10)\
         .all()
        
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
            ],
            'tasaUtilizacion': tasa_utilizacion,
            'equiposPorDepartamento': [
                {'departamento': depto, 'cantidad': cantidad}
                for depto, cantidad in equipos_por_departamento
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
        return jsonify({'error': str(e)}), 500

@app.route('/api/activos/<int:activo_id>/asignar', methods=['POST'])
def asignar_activo(activo_id):
    try:
        data = request.get_json()
        empleado_id = data.get('empleado_id')
        nombre_equipo = data.get('nombre_equipo')
        
        if not empleado_id or not nombre_equipo:
            return jsonify({"error": "empleado_id y nombre_equipo son requeridos"}), 400
            
        activo = Asset.query.get(activo_id)
        if not activo:
            return jsonify({"error": "Activo no encontrado"}), 404
            
        empleado = Empleado.query.get(empleado_id)
        if not empleado:
            return jsonify({"error": "Empleado no encontrado"}), 404

        # Actualizar el activo
        activo.empleado_id = empleado_id
        activo.nombre_equipo = nombre_equipo
        activo.estado = 'Asignado'
        activo.updated_at = datetime.utcnow()
        
        # Actualizar el empleado
        empleado.equipo_asignado = str(activo_id)
        
        # Registrar el log
        descripcion = f"Se asignó el activo {activo.tipo} {activo.marca} {activo.modelo} (ID: {activo.id}) al empleado {empleado.nombre_completo}"
        registrar_log('assets', 'asignación', descripcion, activo_id)
        
        db.session.commit()
        
        return jsonify({
            "message": "Activo asignado exitosamente",
            "empleado": empleado.nombre_completo
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/activos/<int:activo_id>/desasignar', methods=['POST'])
def desasignar_activo(activo_id):
    try:
        activo = Asset.query.get(activo_id)
        if not activo:
            return jsonify({'error': 'Activo no encontrado'}), 404
            
        empleado = Empleado.query.get(activo.empleado_id)
        empleado_nombre = empleado.nombre_completo if empleado else "desconocido"
        
        if empleado:
            empleado.equipo_asignado = None
            
        activo.empleado_id = None
        activo.estado = 'Disponible'
        activo.updated_at = datetime.utcnow()
        
        # Registrar el log
        descripcion = f"Se desasignó el activo {activo.tipo} {activo.marca} {activo.modelo} (ID: {activo.id}) del empleado {empleado_nombre}"
        registrar_log('assets', 'desasignación', descripcion, activo_id)
        
        db.session.commit()
        return jsonify({'message': 'Activo desasignado correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
        return jsonify({'error': str(e)}), 500

@app.route('/api/activos/<int:asset_id>', methods=['PATCH'])
def update_asset(asset_id):
    try:
        asset = Asset.query.get(asset_id)
        if not asset:
            return jsonify({'error': 'Activo no encontrado'}), 404

        data = request.get_json()
        
        # Lista actualizada de campos permitidos para editar
        allowed_fields = ['nombre_equipo', 'modelo', 'serial', 'activo_fijo', 'tipo', 'marca', 'ram', 'disco', 'sede', 'estado']
        
        for field in data:
            if field in allowed_fields:
                if field == 'sede':
                    # Buscar la sede por nombre y actualizar sede_id
                    sede = Sede.query.filter_by(nombre=data[field]).first()
                    if sede:
                        asset.sede_id = sede.id
                else:
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

@app.route('/api/modelos')
def get_modelos():
    try:
        modelos = db.session.query(Asset.modelo).distinct().all()
        return jsonify([modelo[0] for modelo in modelos if modelo[0]])
    except Exception as e:
        print(f"Error en get_modelos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tipos')
def get_tipos():
    try:
        # Obtener tipos únicos de la base de datos
        tipos = db.session.query(Asset.tipo).distinct().all()
        return jsonify([tipo[0] for tipo in tipos if tipo[0]])
    except Exception as e:
        print(f"Error en get_tipos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/marcas')
def get_marcas():
    try:
        marcas = db.session.query(Asset.marca).distinct().all()
        return jsonify([marca[0] for marca in marcas if marca[0]])
    except Exception as e:
        print(f"Error en get_marcas: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/rams')
def get_rams():
    try:
        rams = db.session.query(Asset.ram).distinct().all()
        return jsonify([ram[0] for ram in rams if ram[0]])
    except Exception as e:
        print(f"Error en get_rams: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/discos')
def get_discos():
    try:
        discos = db.session.query(Asset.disco).distinct().all()
        return jsonify([disco[0] for disco in discos if disco[0]])
    except Exception as e:
        print(f"Error en get_discos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/activos/<int:asset_id>/estado', methods=['PATCH'])
def update_asset_state(asset_id):
    try:
        asset = Asset.query.get(asset_id)
        if not asset:
            return jsonify({'error': 'Activo no encontrado'}), 404

        data = request.get_json()
        new_state = data.get('estado')
        
        if new_state not in ['REPARACION', 'DESINCORPORADO']:
            return jsonify({'error': 'Estado no válido'}), 400

        # Si el activo está asignado, desasignarlo primero
        if asset.empleado_id:
            empleado = Empleado.query.get(asset.empleado_id)
            if empleado:
                empleado.equipo_asignado = None
            asset.empleado_id = None

        asset.estado = new_state
        asset.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Estado del activo actualizado exitosamente',
            'nuevo_estado': new_state
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/activos', methods=['POST'])
def create_asset():
    try:
        data = request.get_json()
        
        # Validar campos requeridos - removemos nombre_equipo
        required_fields = ['tipo', 'sede_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        new_asset = Asset(
            sede_id=data['sede_id'],
            tipo=data['tipo'],
            nombre_equipo=data.get('nombre_equipo', ''),  # Ahora es opcional
            modelo=data.get('modelo', ''),
            marca=data.get('marca', ''),
            serial=data.get('serial', ''),
            ram=data.get('ram', ''),
            disco=data.get('disco', ''),
            estado='Disponible',  # Estado inicial
            activo_fijo=data.get('activo_fijo', ''),
            notas=data.get('notas', '')
        )

        db.session.add(new_asset)
        db.session.commit()

        # Obtener la sede para incluirla en la respuesta
        sede = Sede.query.get(data['sede_id'])

        return jsonify({
            'message': 'Activo creado exitosamente',
            'asset': {
                'id': new_asset.id,
                'tipo': new_asset.tipo,
                'nombre_equipo': new_asset.nombre_equipo,
                'estado': new_asset.estado,
                'marca': new_asset.marca,
                'modelo': new_asset.modelo,
                'serial': new_asset.serial,
                'activo_fijo': new_asset.activo_fijo,
                'ram': new_asset.ram,
                'disco': new_asset.disco,
                'notas': new_asset.notas,
                'sede': sede.nombre if sede else '',
                'empleado': ''  # Nuevo activo, sin empleado asignado
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Error en create_asset:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/activos/buscar')
def buscar_activo():
    try:
        tipo = request.args.get('tipo')
        nombre = request.args.get('nombre')
        
        print(f"Buscando activo - ID: {nombre}")
        
        if not nombre:
            return jsonify({'error': 'El ID del equipo es requerido'}), 400
            
        # Intentar convertir el nombre a ID
        try:
            asset_id = int(nombre)
        except ValueError:
            return jsonify({'error': 'ID de activo inválido'}), 400
            
        # Buscar por ID
        asset = Asset.query.get(asset_id)
        
        print(f"Resultado de la búsqueda: {asset}")
        
        if not asset:
            return jsonify({'error': f'No se encontró activo con ID {asset_id}'}), 404
            
        # Obtener el empleado si está asignado
        empleado = Empleado.query.get(asset.empleado_id) if asset.empleado_id else None
        # Obtener la sede
        sede = Sede.query.get(asset.sede_id)
        
        resultado = {
            'id': asset.id,
            'tipo': asset.tipo,
            'nombre_equipo': asset.nombre_equipo,
            'marca': asset.marca,
            'modelo': asset.modelo,
            'serial': asset.serial,
            'ram': asset.ram,
            'disco': asset.disco,
            'estado': asset.estado,
            'activo_fijo': asset.activo_fijo,
            'notas': asset.notas,
            'sede': sede.nombre if sede else None,
            'empleado': empleado.nombre_completo if empleado else None
        }
        
        print(f"Enviando respuesta: {resultado}")
        return jsonify(resultado)
        
    except Exception as e:
        print(f"Error en buscar_activo: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/empleados/<int:empleado_id>')
def get_empleado(empleado_id):
    try:
        empleado = Empleado.query.get(empleado_id)
        
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404

        return jsonify({
            'id': empleado.id,
            'nombre': empleado.nombre_completo,
            'ficha': empleado.ficha,
            'extension': empleado.extension,
            'correo': empleado.correo,
            'sede': empleado.sede.nombre if empleado.sede else None,
            'gerencia': empleado.gerencia.nombre if empleado.gerencia else None,
            'departamento': empleado.departamento.nombre if empleado.departamento else None,
            'area': empleado.area.nombre if empleado.area else None,
            'cargo': empleado.cargo.nombre if empleado.cargo else None,
            'equipo_asignado': empleado.equipo_asignado,
            'smartphone_asignado': empleado.smartphone.id if empleado.smartphone else None
        })
        
    except Exception as e:
        print(f"Error en get_empleado: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/empleados/actualizar-correos', methods=['POST'])
def actualizar_correos():
    try:
        # Crear función para generar correo
        db.session.execute("""
            CREATE OR REPLACE FUNCTION generar_correo(nombre_completo TEXT)
            RETURNS TEXT AS $$
            DECLARE
                nombres TEXT;
                apellidos TEXT;
                primer_apellido TEXT;
                primer_nombre TEXT;
            BEGIN
                -- Dividir el nombre completo en partes
                apellidos := split_part(nombre_completo, ' ', 1);
                nombres := substring(nombre_completo FROM position(' ' IN nombre_completo) + 1);
                
                -- Obtener primer nombre
                primer_nombre := split_part(nombres, ' ', 1);
                
                -- Generar correo en minúsculas
                RETURN lower(primer_nombre || '.' || apellidos || '@sura.com.ve');
            END;
            $$ LANGUAGE plpgsql;
        """)
        
        # Actualizar todos los correos
        db.session.execute("""
            UPDATE empleados 
            SET correo = generar_correo(nombre_completo)
            WHERE correo IS NULL OR correo = '';
        """)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Correos actualizados exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error actualizando correos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/activos/<int:asset_id>/constancia', methods=['GET'])
def generar_constancia(asset_id):
    try:
        # Obtener la información del activo y empleado
        asset = Asset.query.get(asset_id)
        if not asset or not asset.empleado_id:
            return jsonify({'error': 'Activo no encontrado o no está asignado'}), 404
            
        empleado = Empleado.query.get(asset.empleado_id)
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404

        # Registrar la fuente Montserrat
        pdfmetrics.registerFont(TTFont('Montserrat', 'static/Montserrat-Regular.ttf'))
        pdfmetrics.registerFont(TTFont('Montserrat-Bold', 'static/Montserrat-Bold.ttf'))

        # Crear un buffer para el PDF
        buffer = io.BytesIO()
        
        # Crear el PDF
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Añadir logo (más ancho)
        p.drawImage('static/logo_sura.png', 50, height - 100, width=120, height=50)
        
        # Fecha actual
        fecha_actual = datetime.now().strftime("%d/%m/%Y")
        p.setFont("Montserrat", 12)
        p.drawString(width - 200, height - 100, f"Valencia, {fecha_actual}")
        
        # Título
        p.setFont("Montserrat-Bold", 16)
        titulo = "Constancia de Entrega"
        titulo_width = p.stringWidth(titulo, "Montserrat-Bold", 16)
        p.drawString((width - titulo_width) / 2, height - 150, titulo)
        
        # Función para justificar texto con formato mixto
        def justify_mixed_text(text_parts, width, start_y, line_height=25):
            words = []
            current_font = None
            
            # Convertir el texto mixto en palabras con su formato
            for font, content in text_parts:
                for word in content.split():
                    words.append((font, word))
            
            lines = []
            current_line = []
            current_width = 0
            space_width = p.stringWidth(' ', 'Montserrat', 12)
            
            for word_tuple in words:
                font, word = word_tuple
                p.setFont(font, 12)
                word_width = p.stringWidth(word, font, 12)
                
                if current_width + word_width <= width:
                    current_line.append(word_tuple)
                    current_width += word_width + space_width
                else:
                    if current_line:
                        lines.append(current_line)
                    current_line = [word_tuple]
                    current_width = word_width + space_width
            
            if current_line:
                lines.append(current_line)
            
            # Dibujar las líneas justificadas
            y = start_y
            margin = 72
            
            for line in lines:
                if len(line) > 1:
                    x = margin
                    total_width = sum(p.stringWidth(word, font, 12) for font, word in line)
                    space_width = (width - total_width) / (len(line) - 1)
                    
                    for font, word in line[:-1]:
                        p.setFont(font, 12)
                        p.drawString(x, y, word)
                        x += p.stringWidth(word, font, 12) + space_width
                    
                    # Última palabra de la línea
                    font, word = line[-1]
                    p.setFont(font, 12)
                    p.drawString(x, y, word)
                else:
                    # Si solo hay una palabra en la línea
                    font, word = line[0]
                    p.setFont(font, 12)
                    p.drawString(margin, y, word)
                
                y -= line_height
            
            return y

        # Escribir el primer párrafo con formato mixto y justificado
        margin = 72
        y = height - 200
        text_width = width - 2 * margin
        
        # Primer párrafo con formato mixto
        text_parts = [
            ("Montserrat", "Yo, "),
            ("Montserrat-Bold", empleado.nombre_completo),
            ("Montserrat", ", titular de la C.I. "),
            ("Montserrat-Bold", empleado.cedula),
            ("Montserrat", ", actualmente desempeñándome en el cargo de "),
            ("Montserrat-Bold", empleado.cargo.nombre if empleado.cargo else ''),
            ("Montserrat", ", he recibido por parte del Departamento de I.T.S. de la Empresa "),
            ("Montserrat-Bold", "SURA DE VENEZUELA, C.A."),
            ("Montserrat", " una portátil Marca "),
            ("Montserrat-Bold", asset.marca),
            ("Montserrat", " Modelo "),
            ("Montserrat-Bold", asset.modelo),
            ("Montserrat", " cuyo Serial es "),
            ("Montserrat-Bold", asset.serial),
            ("Montserrat", ", junto con su cable de alimentación, con el objetivo de ser utilizado para fines estrictamente laborales, con suma precaución.")
        ]
        
        y = justify_mixed_text(text_parts, text_width, y)
        
        # Espacio entre párrafos
        y -= 15
        
        # Segundo párrafo
        segundo_parrafo = [
            ("Montserrat", "Hago constar que entiendo plenamente lo relacionado a los aspectos antes señalados y me comprometo a cumplir con las indicaciones a cabalidad en el ejercicio de mis labores en la empresa "),
            ("Montserrat-Bold", "SURA DE VENEZUELA, C.A.")
        ]
        
        y = justify_mixed_text(segundo_parrafo, text_width, y)
        
        # Espacio para firma
        p.setFont("Montserrat", 12)
        firma_y = 200
        p.line((width - 200) / 2, firma_y, (width + 200) / 2, firma_y)
        p.drawString((width - p.stringWidth("Firma", "Montserrat", 12)) / 2, firma_y - 20, "Firma")
        
        # Finalizar el PDF
        p.showPage()
        p.save()
        
        # Mover el cursor al inicio del buffer
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f'constancia_entrega_{empleado.nombre_completo}_{fecha_actual}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Error generando constancia: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/verificar_equipos')
def verificar_equipos():
    try:
        # Configurar el servidor y la conexión usando IP en lugar de nombre DNS
        server = Server('192.168.141.39', get_info=ALL)
        conn = Connection(server, user='sura\\dfalfan', password='Dief490606', auto_bind=True)

        # Realizar la búsqueda en el AD
        conn.search('dc=sura,dc=corp', '(objectClass=computer)', attributes=['cn'])

        # Obtener los nombres de los equipos
        equipos_ad = [entry.cn.value for entry in conn.entries]

        # Obtener los equipos de la base de datos
        equipos_db = Asset.query.with_entities(Asset.nombre_equipo).all()
        equipos_db = [equipo.nombre_equipo for equipo in equipos_db]

        # Comparar y marcar los equipos
        resultado = {}
        for equipo in equipos_db:
            resultado[equipo] = 'verde' if equipo in equipos_ad else 'rojo'

        return jsonify(resultado)
    except Exception as e:
        print(f"Error en verificar_equipos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/smartphones')
def get_smartphones():
    try:
        smartphones = db.session.query(
            Smartphone, Empleado
        ).outerjoin(
            Empleado, Smartphone.empleado_id == Empleado.id
        ).all()
        
        return jsonify([{
            'id': phone.id,
            'marca': phone.marca,
            'modelo': phone.modelo,
            'serial': phone.serial,
            'imei': phone.imei,
            'imei2': phone.imei2,
            'linea': phone.linea,
            'estado': phone.estado,
            'empleado': empleado.nombre_completo if empleado else None,
            'empleado_id': empleado.id if empleado else None,
            'fecha_asignacion': phone.fecha_asignacion.isoformat() if phone.fecha_asignacion else None
        } for phone, empleado in smartphones])
    except Exception as e:
        print(f"Error en get_smartphones: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/smartphones/<int:smartphone_id>', methods=['PATCH'])
def update_smartphone(smartphone_id):
    try:
        smartphone = Smartphone.query.get(smartphone_id)
        if not smartphone:
            return jsonify({'error': 'Smartphone no encontrado'}), 404

        data = request.get_json()
        
        # Lista de campos permitidos para editar
        allowed_fields = ['marca', 'modelo', 'serial', 'imei', 'imei2', 'linea', 'estado']
        
        for field in data:
            if field in allowed_fields:
                setattr(smartphone, field, data[field])
        
        smartphone.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Smartphone actualizado exitosamente',
            'updated_fields': list(data.keys())
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/smartphones/<int:smartphone_id>/asignar', methods=['POST'])
def asignar_smartphone(smartphone_id):
    try:
        data = request.get_json()
        empleado_id = data.get('empleado_id')
        
        if not empleado_id:
            return jsonify({"error": "empleado_id es requerido"}), 400
            
        smartphone = Smartphone.query.get(smartphone_id)
        if not smartphone:
            return jsonify({"error": "Smartphone no encontrado"}), 404
            
        empleado = Empleado.query.get(empleado_id)
        if not empleado:
            return jsonify({"error": "Empleado no encontrado"}), 404

        if Smartphone.query.filter_by(empleado_id=empleado_id).first():
            return jsonify({"error": "El empleado ya tiene un smartphone asignado"}), 400
            
        smartphone.empleado_id = empleado_id
        smartphone.estado = 'Asignado'
        smartphone.fecha_asignacion = datetime.utcnow()
        smartphone.updated_at = datetime.utcnow()
        
        # Registrar el log
        descripcion = f"Se asignó el smartphone {smartphone.marca} {smartphone.modelo} (ID: {smartphone.id}) al empleado {empleado.nombre_completo}"
        registrar_log('smartphones', 'asignación', descripcion, smartphone_id)
        
        db.session.commit()
        
        return jsonify({
            "message": "Smartphone asignado exitosamente",
            "empleado": empleado.nombre_completo
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/smartphones/<int:smartphone_id>/desasignar', methods=['POST'])
def desasignar_smartphone(smartphone_id):
    try:
        smartphone = Smartphone.query.get(smartphone_id)
        if not smartphone:
            return jsonify({'error': 'Smartphone no encontrado'}), 404
            
        empleado = Empleado.query.get(smartphone.empleado_id)
        empleado_nombre = empleado.nombre_completo if empleado else "desconocido"
            
        smartphone.empleado_id = None
        smartphone.estado = 'Disponible'
        smartphone.fecha_asignacion = None
        smartphone.updated_at = datetime.utcnow()
        
        # Registrar el log
        descripcion = f"Se desasignó el smartphone {smartphone.marca} {smartphone.modelo} (ID: {smartphone.id}) del empleado {empleado_nombre}"
        registrar_log('smartphones', 'desasignación', descripcion, smartphone_id)
        
        db.session.commit()
        return jsonify({'message': 'Smartphone desasignado correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/impresoras')
def get_impresoras():
    try:
        impresoras = db.session.query(
            Impresora, Sede
        ).outerjoin(
            Sede, Impresora.sede_id == Sede.id
        ).all()
        
        return jsonify([{
            'id': imp.id,
            'sede': sede.nombre if sede else None,
            'sede_id': imp.sede_id,
            'impresora': imp.impresora,
            'serial': imp.serial,
            'proveedor': imp.proveedor
        } for imp, sede in impresoras])
    except Exception as e:
        print(f"Error en get_impresoras: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impresoras/<int:impresora_id>', methods=['PATCH'])
def update_impresora(impresora_id):
    try:
        impresora = Impresora.query.get(impresora_id)
        if not impresora:
            return jsonify({'error': 'Impresora no encontrada'}), 404

        data = request.get_json()
        
        # Lista de campos permitidos para editar
        allowed_fields = ['impresora', 'serial', 'proveedor']
        
        for field in data:
            if field in allowed_fields:
                setattr(impresora, field, data[field])
            elif field == 'sede':
                # Buscar la sede por nombre y actualizar sede_id
                sede = Sede.query.filter_by(nombre=data[field]).first()
                if sede:
                    impresora.sede_id = sede.id
        
        impresora.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Impresora actualizada exitosamente',
            'updated_fields': list(data.keys())
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/empleados/sin-smartphone')
def get_empleados_sin_smartphone():
    try:
        # Subconsulta para obtener los IDs de empleados que ya tienen smartphone
        empleados_con_smartphone = db.session.query(Smartphone.empleado_id).filter(Smartphone.empleado_id.isnot(None))
        
        # Consulta principal: empleados que no están en la subconsulta
        empleados = Empleado.query.filter(~Empleado.id.in_(empleados_con_smartphone)).order_by(Empleado.nombre_completo).all()
        
        return jsonify([{
            'id': e.id,
            'nombre': e.nombre_completo,
            'ficha': e.ficha,
            'sede': e.sede.nombre if e.sede else None,
            'departamento': e.departamento.nombre if e.departamento else None,
            'cargo': e.cargo.nombre if e.cargo else None
        } for e in empleados])
        
    except Exception as e:
        print("Error en get_empleados_sin_smartphone:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/smartphones/<int:smartphone_id>/constancia', methods=['GET'])
def generar_constancia_smartphone(smartphone_id):
    try:
        # Obtener la información del smartphone y empleado
        smartphone = Smartphone.query.get(smartphone_id)
        if not smartphone or not smartphone.empleado_id:
            return jsonify({'error': 'Smartphone no encontrado o no está asignado'}), 404
            
        empleado = Empleado.query.get(smartphone.empleado_id)
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404

        # Registrar la fuente Montserrat
        pdfmetrics.registerFont(TTFont('Montserrat', 'static/Montserrat-Regular.ttf'))
        pdfmetrics.registerFont(TTFont('Montserrat-Bold', 'static/Montserrat-Bold.ttf'))

        # Crear un buffer para el PDF
        buffer = io.BytesIO()
        
        # Crear el PDF
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Añadir logo (más ancho)
        p.drawImage('static/logo_sura.png', 50, height - 100, width=120, height=50)
        
        # Fecha actual
        fecha_actual = datetime.now().strftime("%d/%m/%Y")
        p.setFont("Montserrat", 12)
        p.drawString(width - 200, height - 100, f"Valencia, {fecha_actual}")
        
        # Título
        p.setFont("Montserrat-Bold", 16)
        titulo = "Constancia de Entrega"
        titulo_width = p.stringWidth(titulo, "Montserrat-Bold", 16)
        p.drawString((width - titulo_width) / 2, height - 150, titulo)

        # Función para justificar texto con formato mixto
        def justify_mixed_text(text_parts, width, start_y, line_height=25):
            words = []
            current_font = None
            
            # Convertir el texto mixto en palabras con su formato
            for font, content in text_parts:
                for word in content.split():
                    words.append((font, word))
            
            lines = []
            current_line = []
            current_width = 0
            space_width = p.stringWidth(' ', 'Montserrat', 12)
            
            for word_tuple in words:
                font, word = word_tuple
                p.setFont(font, 12)
                word_width = p.stringWidth(word, font, 12)
                
                if current_width + word_width <= width:
                    current_line.append(word_tuple)
                    current_width += word_width + space_width
                else:
                    if current_line:
                        lines.append(current_line)
                    current_line = [word_tuple]
                    current_width = word_width + space_width
            
            if current_line:
                lines.append(current_line)
            
            # Dibujar las líneas justificadas
            y = start_y
            margin = 72
            
            for line in lines:
                if len(line) > 1:
                    x = margin
                    total_width = sum(p.stringWidth(word, font, 12) for font, word in line)
                    space_width = (width - total_width) / (len(line) - 1)
                    
                    for font, word in line[:-1]:
                        p.setFont(font, 12)
                        p.drawString(x, y, word)
                        x += p.stringWidth(word, font, 12) + space_width
                    
                    # Última palabra de la línea
                    font, word = line[-1]
                    p.setFont(font, 12)
                    p.drawString(x, y, word)
                else:
                    # Si solo hay una palabra en la línea
                    font, word = line[0]
                    p.setFont(font, 12)
                    p.drawString(margin, y, word)
                
                y -= line_height
            
            return y

        # Escribir el primer párrafo con formato mixto y justificado
        margin = 72
        y = height - 200
        text_width = width - 2 * margin
        
        # Primer párrafo con formato mixto
        text_parts = [
            ("Montserrat", "Yo, "),
            ("Montserrat-Bold", empleado.nombre_completo),
            ("Montserrat", ", titular de la C.I. "),
            ("Montserrat-Bold", empleado.cedula),
            ("Montserrat", ", actualmente desempeñándome en el cargo de "),
            ("Montserrat-Bold", empleado.cargo.nombre if empleado.cargo else ''),
            ("Montserrat", ", he recibido por parte del Departamento de I.T.S. de la Empresa "),
            ("Montserrat-Bold", "SURA DE VENEZUELA, C.A."),
            ("Montserrat", " un teléfono celular marca "),
            ("Montserrat-Bold", smartphone.marca),
            ("Montserrat", " Modelo "),
            ("Montserrat-Bold", smartphone.modelo),
            ("Montserrat", " cuyo Serial es "),
            ("Montserrat-Bold", smartphone.serial),
            ("Montserrat", " IMEI1: "),
            ("Montserrat-Bold", smartphone.imei),
            ("Montserrat", " IMEI2: "),
            ("Montserrat-Bold", smartphone.imei2 if smartphone.imei2 else 'N/A'),
            ("Montserrat", ", junto con su cargador y forro protector, con el objetivo de ser utilizado para fines estrictamente laborales, con suma precaución.")
        ]
        
        y = justify_mixed_text(text_parts, text_width, y)
        
        # Espacio entre párrafos
        y -= 15
        
        # Segundo párrafo
        segundo_parrafo = [
            ("Montserrat", "Hago constar que entiendo plenamente lo relacionado a los aspectos antes señalados y me comprometo a cumplir con las indicaciones a cabalidad en el ejercicio de mis labores en la empresa "),
            ("Montserrat-Bold", "SURA DE VENEZUELA, C.A.")
        ]
        
        y = justify_mixed_text(segundo_parrafo, text_width, y)
        
        # Espacio para firma
        p.setFont("Montserrat", 12)
        firma_y = 200
        p.line((width - 200) / 2, firma_y, (width + 200) / 2, firma_y)
        p.drawString((width - p.stringWidth("Firma", "Montserrat", 12)) / 2, firma_y - 20, "Firma")
        
        # Finalizar el PDF
        p.showPage()
        p.save()
        
        # Mover el cursor al inicio del buffer
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f'constancia_entrega_{empleado.nombre_completo}_{fecha_actual}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Error generando constancia: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/smartphones', methods=['POST'])
def create_smartphone():
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['marca', 'modelo', 'serial', 'imei']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        new_smartphone = Smartphone(
            marca=data['marca'],
            modelo=data['modelo'],
            serial=data['serial'],
            imei=data['imei'],
            imei2=data.get('imei2', ''),
            linea=data.get('linea', ''),
            estado='Disponible'  # Estado inicial
        )

        db.session.add(new_smartphone)
        db.session.commit()

        return jsonify({
            'message': 'Smartphone creado exitosamente',
            'smartphone': {
                'id': new_smartphone.id,
                'marca': new_smartphone.marca,
                'modelo': new_smartphone.modelo,
                'serial': new_smartphone.serial,
                'imei': new_smartphone.imei,
                'imei2': new_smartphone.imei2,
                'linea': new_smartphone.linea,
                'estado': new_smartphone.estado,
                'empleado': None,
                'empleado_id': None,
                'fecha_asignacion': None
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print("Error en create_smartphone:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs/<categoria>')
def get_logs(categoria):
    try:
        logs = Log.query.filter_by(categoria=categoria)\
            .order_by(Log.created_at.desc())\
            .all()
        
        return jsonify([{
            'id': log.id,
            'accion': log.accion,
            'descripcion': log.descripcion,
            'item_id': log.item_id,
            'fecha': log.created_at.isoformat()
        } for log in logs])
    except Exception as e:
        print(f"Error obteniendo logs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/activos/<int:activo_id>/cambiar-estado', methods=['POST'])
def cambiar_estado_activo(activo_id):
    try:
        data = request.get_json()
        estado = data.get('estado')
        
        if not estado:
            return jsonify({"error": "El estado es requerido"}), 400
            
        activo = Asset.query.get(activo_id)
        if not activo:
            return jsonify({"error": "Activo no encontrado"}), 404

        # Si el activo está asignado, desasignarlo primero
        if activo.empleado_id:
            empleado = Empleado.query.get(activo.empleado_id)
            if empleado:
                empleado.equipo_asignado = None
            activo.empleado_id = None

        activo.estado = estado
        activo.updated_at = datetime.utcnow()
        
        # Registrar el log
        descripcion = f"Se cambió el estado del activo {activo.tipo} {activo.marca} {activo.modelo} (ID: {activo.id}) a {estado}"
        registrar_log('assets', 'cambio_estado', descripcion, activo_id)
        
        db.session.commit()
        
        return jsonify({
            "message": "Estado del activo actualizado exitosamente",
            "nuevo_estado": estado
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/activos/<int:activo_id>/desincorporar', methods=['POST'])
def desincorporar_activo(activo_id):
    try:
        activo = Asset.query.get(activo_id)
        if not activo:
            return jsonify({"error": "Activo no encontrado"}), 404

        # Si el activo está asignado, desasignarlo primero
        if activo.empleado_id:
            empleado = Empleado.query.get(activo.empleado_id)
            if empleado:
                empleado.equipo_asignado = None

        # Guardar información para el log antes de eliminar
        descripcion = f"Se desincorporó el activo {activo.tipo} {activo.marca} {activo.modelo} (ID: {activo.id})"
        
        # Registrar el log antes de eliminar el activo
        registrar_log('assets', 'desincorporación', descripcion, activo_id)
        
        # Eliminar el activo
        db.session.delete(activo)
        db.session.commit()
        
        return jsonify({
            "message": "Activo desincorporado exitosamente"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/empleados', methods=['POST'])
def create_empleado():
    try:
        print("=== Iniciando creación de empleado ===")
        data = request.get_json()
        print(f"Datos recibidos: {json.dumps(data, indent=2)}")
        
        # Validar campos requeridos
        required_fields = ['nombre_completo', 'cedula', 'sede_id', 'gerencia_id', 'departamento_id', 'area_id', 'cargo_id']
        for field in required_fields:
            if not data.get(field):
                print(f"❌ Campo requerido faltante: {field}")
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        # Generar ficha automáticamente
        last_empleado = Empleado.query.order_by(Empleado.ficha.desc()).first()
        if last_empleado and last_empleado.ficha and last_empleado.ficha.isdigit():
            next_ficha = str(int(last_empleado.ficha) + 1).zfill(4)
        else:
            next_ficha = '1000'
        print(f"Ficha generada: {next_ficha}")

        # Separar nombre y apellido
        nombre_completo = data['nombre_completo'].split()
        print(f"Procesando nombre completo: {nombre_completo}")
        if len(nombre_completo) >= 2:
            nombre = nombre_completo[0]
            apellido = ' '.join(nombre_completo[1:])
        else:
            nombre = data['nombre_completo']
            apellido = ''
        print(f"Nombre separado - Nombre: {nombre}, Apellido: {apellido}")

        # Inicializar variables para el correo
        email = None
        google_result = {'success': True}

        # Solo intentar crear correo si se proporciona uno
        if data.get('correo'):
            email = data['correo']
            print(f"Correo proporcionado: {email}")

            print("=== Iniciando creación en Google Workspace ===")
            google_result = crear_usuario_google(nombre, apellido, email)
            print(f"Resultado de Google Workspace: {json.dumps(google_result, indent=2)}")
            
            if not google_result['success'] and 'Domain user limit reached' in str(google_result.get('error', '')):
                print("⚠️ Límite de usuarios alcanzado en Google Workspace")
                google_result = {
                    'success': False,
                    'warning': 'No se pudo crear el correo: límite de licencias alcanzado',
                    'error': 'Domain user limit reached'
                }
            elif not google_result['success']:
                print("❌ Error en la creación de Google Workspace")
                return jsonify({
                    'error': 'Error creando usuario en Google Workspace',
                    'details': google_result['error']
                }), 500

        print("=== Creando empleado en base de datos local ===")
        new_empleado = Empleado(
            nombre_completo=data['nombre_completo'],
            ficha=next_ficha,
            cedula=data['cedula'],
            correo=email if google_result['success'] else None,
            sede_id=data['sede_id'],
            gerencia_id=data['gerencia_id'],
            departamento_id=data['departamento_id'],
            area_id=data['area_id'],
            cargo_id=data['cargo_id']
        )

        db.session.add(new_empleado)
        db.session.commit()
        print("✓ Empleado creado exitosamente en la base de datos")

        response_data = {
            'message': 'Empleado creado exitosamente',
            'empleado': {
                'id': new_empleado.id,
                'nombre': new_empleado.nombre_completo,
                'ficha': new_empleado.ficha,
                'cedula': new_empleado.cedula,
                'correo': new_empleado.correo,
                'sede': new_empleado.sede.nombre if new_empleado.sede else None,
                'gerencia': new_empleado.gerencia.nombre if new_empleado.gerencia else None,
                'departamento': new_empleado.departamento.nombre if new_empleado.departamento else None,
                'area': new_empleado.area.nombre if new_empleado.area else None,
                'cargo': new_empleado.cargo.nombre if new_empleado.cargo else None
            }
        }

        # Solo incluir información de Google Workspace si se intentó crear el correo
        if data.get('correo'):
            response_data['google_workspace'] = {
                'success': google_result['success'],
                'email': email if google_result['success'] else None,
                'temp_password': google_result.get('temp_password'),
                'warning': google_result.get('warning')
            }

        print(f"Respuesta final: {json.dumps(response_data, indent=2)}")
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en create_empleado: {str(e)}")
        print(f"Tipo de error: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/empleados/<int:empleado_id>', methods=['DELETE'])
def delete_empleado(empleado_id):
    try:
        empleado = Empleado.query.get(empleado_id)
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404

        # Liberar activo asignado si existe
        if empleado.equipo_asignado:
            activo = Asset.query.get(int(empleado.equipo_asignado))
            if activo:
                activo.empleado_id = None
                activo.estado = 'Disponible'
                activo.updated_at = datetime.utcnow()
                descripcion = f"Se liberó el activo {activo.tipo} {activo.marca} {activo.modelo} (ID: {activo.id}) por eliminación del empleado {empleado.nombre_completo}"
                registrar_log('assets', 'desasignación', descripcion, activo.id)

        # Liberar smartphone asignado si existe
        if empleado.smartphone:
            smartphone = empleado.smartphone
            smartphone.empleado_id = None
            smartphone.estado = 'Disponible'
            smartphone.fecha_asignacion = None
            smartphone.updated_at = datetime.utcnow()
            descripcion = f"Se liberó el smartphone {smartphone.marca} {smartphone.modelo} (ID: {smartphone.id}) por eliminación del empleado {empleado.nombre_completo}"
            registrar_log('smartphones', 'desasignación', descripcion, smartphone.id)

        # Registrar log de eliminación del empleado
        descripcion = f"Se eliminó al empleado {empleado.nombre_completo} (Ficha: {empleado.ficha})"
        registrar_log('empleados', 'eliminación', descripcion, empleado_id)

        # Eliminar el empleado
        db.session.delete(empleado)
        db.session.commit()

        return jsonify({
            'message': f'Empleado {empleado.nombre_completo} eliminado exitosamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        print("Error en delete_empleado:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/empleados/<int:empleado_id>', methods=['PATCH'])
def update_empleado(empleado_id):
    try:
        empleado = Empleado.query.get(empleado_id)
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404

        data = request.get_json()
        
        # Lista de campos permitidos para editar
        allowed_fields = ['extension', 'nombre_completo', 'ficha', 'cedula', 'correo', 'sede_id', 'gerencia_id', 'departamento_id', 'area_id', 'cargo_id']
        
        for field in data:
            if field in allowed_fields:
                setattr(empleado, field, data[field])
                
                # Si se actualizó la extensión, actualizar el PDF
                if field == 'extension':
                    update_extensions_pdf()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Empleado actualizado exitosamente',
            'updated_fields': list(data.keys())
        })
        
    except Exception as e:
        db.session.rollback()
        print("Error en update_empleado:", str(e))
        return jsonify({'error': str(e)}), 500

def update_extensions_pdf():
    try:
        # Obtener todos los empleados con extensiones
        empleados = Empleado.query.filter(Empleado.extension.isnot(None)).order_by(Empleado.extension).all()
        
        # Agrupar por sede
        empleados_por_sede = {}
        for emp in empleados:
            sede = emp.sede.nombre if emp.sede else 'Sin Sede'
            if sede not in empleados_por_sede:
                empleados_por_sede[sede] = []
            empleados_por_sede[sede].append({
                'nombre': emp.nombre_completo,
                'extension': emp.extension,
                'departamento': emp.departamento.nombre if emp.departamento else 'Sin Departamento',
                'cargo': emp.cargo.nombre if emp.cargo else 'Sin Cargo'
            })
        
        # Registrar la fuente Montserrat
        pdfmetrics.registerFont(TTFont('Montserrat', 'static/Montserrat-Regular.ttf'))
        pdfmetrics.registerFont(TTFont('Montserrat-Bold', 'static/Montserrat-Bold.ttf'))
        
        # Crear el PDF
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Añadir logo
        p.drawImage('static/logo_sura.png', 50, height - 100, width=120, height=50)
        
        # Título
        p.setFont("Montserrat-Bold", 18)
        p.drawString(width/2 - 100, height - 100, "Directorio de Extensiones")
        
        # Fecha de actualización
        p.setFont("Montserrat", 10)
        fecha_actual = datetime.now().strftime("%d/%m/%Y %H:%M")
        p.drawString(width - 200, height - 50, f"Actualizado: {fecha_actual}")
        
        y = height - 150
        
        # Por cada sede
        for sede, empleados in empleados_por_sede.items():
            if y < 100:  # Nueva página si no hay espacio
                p.showPage()
                y = height - 50
            
            # Título de la sede
            p.setFont("Montserrat-Bold", 14)
            p.drawString(50, y, sede)
            y -= 30
            
            # Encabezados
            p.setFont("Montserrat-Bold", 10)
            p.drawString(50, y, "Extensión")
            p.drawString(150, y, "Nombre")
            p.drawString(350, y, "Departamento")
            p.drawString(500, y, "Cargo")
            y -= 20
            
            # Línea separadora
            p.line(50, y, width-50, y)
            y -= 15
            
            # Datos de empleados
            p.setFont("Montserrat", 10)
            for emp in empleados:
                if y < 50:  # Nueva página si no hay espacio
                    p.showPage()
                    y = height - 50
                    
                    # Repetir encabezados en nueva página
                    p.setFont("Montserrat-Bold", 10)
                    p.drawString(50, y, "Extensión")
                    p.drawString(150, y, "Nombre")
                    p.drawString(350, y, "Departamento")
                    p.drawString(500, y, "Cargo")
                    y -= 20
                    p.line(50, y, width-50, y)
                    y -= 15
                    p.setFont("Montserrat", 10)
                
                p.drawString(50, y, emp['extension'])
                p.drawString(150, y, emp['nombre'])
                p.drawString(350, y, emp['departamento'])
                p.drawString(500, y, emp['cargo'])
                y -= 20
            
            y -= 30  # Espacio entre sedes
        
        p.save()
        
        # Guardar el PDF en la carpeta pública del frontend
        pdf_path = '../frontend/public/EXTENSIONES.pdf'
        with open(pdf_path, 'wb') as f:
            f.write(buffer.getvalue())
            
    except Exception as e:
        print("Error generando PDF de extensiones:", str(e))
        raise e

def registrar_log(categoria, accion, descripcion, item_id):
    """
    Registra una acción en el log del sistema.
    
    Args:
        categoria (str): Categoría del log (smartphones, assets, impresoras, etc.)
        accion (str): Tipo de acción realizada (asignación, desasignación, etc.)
        descripcion (str): Descripción detallada de la acción
        item_id (int): ID del elemento afectado
    """
    try:
        nuevo_log = Log(
            categoria=categoria,
            accion=accion,
            descripcion=descripcion,
            item_id=item_id
        )
        db.session.add(nuevo_log)
        db.session.flush()  # Para obtener el ID sin hacer commit
    except Exception as e:
        print(f"Error registrando log: {str(e)}")
        raise

@app.route('/api/test-google-connection')
def test_google_connection():
    try:
        print("Iniciando prueba de conexión con Google Workspace...")
        
        # Cargar las credenciales del servicio
        print(f"Intentando cargar credenciales desde: {SERVICE_ACCOUNT_FILE}")
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=['https://www.googleapis.com/auth/admin.directory.user'],  # Usar solo el scope básico primero
            subject='daniel.falfan@sura.com.ve'
        )
        print("✓ Credenciales cargadas exitosamente")
        
        # Intentar construir el servicio
        print("Intentando construir el servicio de Directory API...")
        service = build('admin', 'directory_v1', credentials=credentials)
        print("✓ Servicio construido exitosamente")
        
        # Intentar hacer una llamada simple a la API
        print("Intentando hacer una llamada de prueba a la API...")
        result = service.users().list(domain='sura.com.ve', maxResults=1).execute()
        print("✓ Llamada a la API exitosa")
        
        return jsonify({
            'success': True,
            'message': 'Conexión exitosa con Google Workspace',
            'details': {
                'credentials_loaded': True,
                'service_built': True,
                'api_call_successful': True,
                'users_found': len(result.get('users', []))
            }
        })
        
    except Exception as e:
        print(f"❌ Error durante la prueba de conexión: {str(e)}")
        import traceback
        print(f"Traceback completo: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e),
            'details': {
                'error_type': type(e).__name__,
                'error_message': str(e),
                'traceback': traceback.format_exc()
            }
        }), 500

def crear_usuario_google(nombre, apellido, email):
    try:
        print(f"Iniciando creación de usuario en Google Workspace para: {email}")
        
        print("Cargando credenciales...")
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=SCOPES,
            subject='daniel.falfan@sura.com.ve'
        )
        print("✓ Credenciales cargadas")
        
        print("Construyendo servicio...")
        service = build('admin', 'directory_v1', credentials=credentials)
        print("✓ Servicio construido")
        
        # Generar contraseña temporal
        import random
        import string
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        
        user_data = {
            'primaryEmail': email,
            'name': {
                'givenName': nombre,
                'familyName': apellido
            },
            'password': temp_password,
            'changePasswordAtNextLogin': True
        }
        
        print(f"Intentando crear usuario con datos: {json.dumps(user_data, indent=2)}")
        result = service.users().insert(body=user_data).execute()
        print("✓ Usuario creado exitosamente")
        
        return {
            'success': True,
            'email': email,
            'temp_password': temp_password
        }
        
    except Exception as e:
        print(f"❌ Error creando usuario en Google Workspace: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/api/workspace/stats')
def get_workspace_stats():
    try:
        print("Iniciando obtención de estadísticas de Workspace...")
        
        print("Cargando credenciales...")
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=SCOPES,
            subject='daniel.falfan@sura.com.ve'
        )
        print("✓ Credenciales cargadas")
        
        # Construir servicios necesarios
        directory_service = build('admin', 'directory_v1', credentials=credentials)
        reports_service = build('admin', 'reports_v1', credentials=credentials)
        
        # Obtener lista de usuarios
        print("Obteniendo lista de usuarios...")
        results = directory_service.users().list(
            domain='sura.com.ve',
            maxResults=500,
            orderBy='email'
        ).execute()
        
        users = results.get('users', [])
        active_users = [user for user in users if user.get('suspended') is False]
        
        # Obtener uso de almacenamiento total y por usuario
        print("Obteniendo datos de almacenamiento...")
        total_storage_used = 2479.09  # Valor base
        storage_by_user = []
        
        try:
            # Obtener fecha de ayer para los datos de almacenamiento
            from datetime import datetime, timedelta
            yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
            print(f"Obteniendo datos de almacenamiento para la fecha: {yesterday}")
            
            storage_report = reports_service.userUsageReport().get(
                userKey='all',
                date=yesterday,
                parameters='accounts:used_quota_in_mb'  # Cambiado para obtener el total usado
            ).execute()
            
            if 'usageReports' in storage_report:
                print(f"Encontrados {len(storage_report['usageReports'])} reportes de usuario")
                for report in storage_report['usageReports']:
                    email = report.get('entity', {}).get('userEmail', '')
                    storage_mb = 0
                    
                    for param in report.get('parameters', []):
                        if param.get('name') == 'accounts:used_quota_in_mb':
                            try:
                                storage_mb = float(param.get('intValue', 0))
                            except (ValueError, TypeError) as e:
                                print(f"Error convirtiendo valor para {email}: {e}")
                                continue
                    
                    storage_gb = storage_mb / 1024  # Convertir a GB
                    if storage_gb > 0:
                        storage_by_user.append({
                            'email': email,
                            'storage': round(storage_gb, 2)
                        })
                        print(f"Usuario {email}: {round(storage_gb, 2)} GB")
            
            # Ordenar por uso de almacenamiento
            top_by_storage = sorted(
                storage_by_user,
                key=lambda x: x['storage'],
                reverse=True
            )[:5]
            
            print(f"Top usuarios por almacenamiento encontrados: {len(top_by_storage)}")
            for user in top_by_storage:
                print(f"- {user['email']}: {user['storage']} GB")
        
        except Exception as e:
            print(f"Error obteniendo datos de almacenamiento: {str(e)}")
            top_by_storage = []
        
        # Obtener estadísticas de correo
        print("Obteniendo estadísticas de correo...")
        total_emails_sent = 0
        total_emails_received = 0
        user_email_stats = []
        
        try:
            # Obtener fecha de hace 2 días para asegurar que los datos estén disponibles
            end_date = datetime.now() - timedelta(days=2)  # Cambiado a 2 días atrás
            start_date = end_date - timedelta(days=5)  # Total 7 días
            
            print(f"Periodo de análisis de correos: {start_date.strftime('%Y-%m-%d')} a {end_date.strftime('%Y-%m-%d')}")
            
            # Resto del código para estadísticas de correo...
            current_date = start_date
            while current_date <= end_date:
                date_str = current_date.strftime('%Y-%m-%d')
                print(f"Obteniendo datos para: {date_str}")
                
                try:
                    email_report = reports_service.userUsageReport().get(
                        userKey='all',
                        date=date_str,
                        parameters='gmail:num_emails_sent,gmail:num_emails_received'
                    ).execute()
                    
                    if 'usageReports' in email_report:
                        for report in email_report['usageReports']:
                            email = report.get('entity', {}).get('userEmail', '')
                            user_data = next((item for item in user_email_stats if item['email'] == email), None)
                            
                            if user_data is None:
                                user_data = {
                                    'email': email,
                                    'sent': 0,
                                    'received': 0,
                                    'total': 0
                                }
                                user_email_stats.append(user_data)
                            
                            for param in report.get('parameters', []):
                                if param.get('name') == 'gmail:num_emails_sent':
                                    emails_sent = int(param.get('intValue', 0))
                                    user_data['sent'] += emails_sent
                                    total_emails_sent += emails_sent
                                elif param.get('name') == 'gmail:num_emails_received':
                                    emails_received = int(param.get('intValue', 0))
                                    user_data['received'] += emails_received
                                    total_emails_received += emails_received
                            
                            user_data['total'] = user_data['sent'] + user_data['received']
                    
                except Exception as e:
                    print(f"Error obteniendo datos para {date_str}: {str(e)}")
                    if 'not yet available' in str(e):
                        print("Omitiendo fecha futura...")
                        break
                    elif 'Data for dates earlier than' in str(e):
                        print("Omitiendo fecha muy antigua...")
                        current_date += timedelta(days=1)
                        continue
                    else:
                        print(f"Error inesperado: {str(e)}")
                
                current_date += timedelta(days=1)
            
            # Ordenar usuarios por total de correos
            top_by_emails = sorted(
                user_email_stats,
                key=lambda x: x['total'],
                reverse=True
            )[:5]
            
        except Exception as e:
            print(f"Error obteniendo estadísticas de correo: {str(e)}")
            top_by_emails = []
            total_emails_sent = 0
            total_emails_received = 0
        
        # Calcular promedios
        num_active_users = len(active_users)
        avg_storage_per_user = total_storage_used / num_active_users if num_active_users > 0 else 0
        avg_emails_per_user = (total_emails_sent + total_emails_received) / num_active_users if num_active_users > 0 else 0
        
        response_data = {
            'totalStorage': len(active_users) * 15,  # 15GB por usuario activo
            'usedStorage': total_storage_used,
            'activeAccounts': len(active_users),
            'storageAlerts': [],  # Por ahora no nos enfocamos en alertas de almacenamiento
            'topUsersByStorage': top_by_storage,  # Ahora incluimos el top por almacenamiento
            'topUsersByEmails': top_by_emails,
            'totalLicenses': len(users),
            'assignedLicenses': len(active_users),
            'availableLicenses': 0,
            'emailStats': {
                'totalSent': total_emails_sent,
                'totalReceived': total_emails_received,
                'averagePerUser': round(avg_emails_per_user, 2)
            },
            'storageStats': {
                'averagePerUser': round(avg_storage_per_user, 2),
                'utilizationPercentage': round((total_storage_used / (len(active_users) * 15)) * 100, 2)
            }
        }
        
        print("Estadísticas obtenidas exitosamente")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error al obtener estadísticas de Workspace: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': str(e),
            'details': traceback.format_exc()
        }), 500

@app.route('/api/domain/stats')
def get_domain_stats():
    try:
        print("Iniciando obtención de estadísticas del dominio...")
        
        # Configurar el servidor y la conexión
        server = Server('192.168.141.39', get_info=ALL)
        conn = Connection(server, user='sura\\dfalfan', password='Dief490606', auto_bind=True)
        
        # Estadísticas de usuarios
        print("Obteniendo estadísticas de usuarios...")
        conn.search('dc=sura,dc=corp', '(&(objectClass=user)(objectCategory=person))', 
                   attributes=['mail', 'userAccountControl'])
        total_users = len(conn.entries)
        active_users = sum(1 for entry in conn.entries if entry['userAccountControl'].value & 2 == 0)
        disabled_users = total_users - active_users

        # Estadísticas de equipos
        print("\n=== INICIO BÚSQUEDA DE EQUIPOS ===")
        print("Obteniendo estadísticas de equipos...")
        conn.search('dc=sura,dc=corp', '(objectClass=computer)', 
                   attributes=['lastLogon', 'name', 'distinguishedName', 'whenChanged', 'operatingSystem'])
        total_computers = len(conn.entries)

        # Inicializar contadores
        os_distribution = {
            'Windows 10': 0,
            'Windows 11': 0,
            'Otros': 0
        }
        inactive_computers = []
        all_inactive_computers = 0  # Contador para todos los equipos inactivos
        computers_without_timestamp = 0
        computers_with_error = 0

        # Procesar cada equipo
        for entry in conn.entries:
            try:
                # Procesar Sistema Operativo
                os_name = entry['operatingSystem'].value if entry['operatingSystem'] else 'Desconocido'
                
                # Clasificar SO
                if os_name and isinstance(os_name, str):
                    os_name = os_name.lower()
                    if 'windows 10' in os_name:
                        os_distribution['Windows 10'] += 1
                    elif 'windows 11' in os_name:
                        os_distribution['Windows 11'] += 1
                    else:
                        os_distribution['Otros'] += 1
                else:
                    os_distribution['Otros'] += 1
                
                # Procesar tiempo de inactividad
                last_logon = entry['lastLogon'].value
                when_changed = entry['whenChanged'].value
                
                if last_logon:
                    try:
                        last_logon_date = last_logon.replace(tzinfo=None)
                        days_inactive = (datetime.now() - last_logon_date).days
                        
                        if days_inactive > 30:
                            all_inactive_computers += 1  # Incrementar contador total
                            computer_info = {
                                'name': entry['name'].value,
                                'daysInactive': days_inactive,
                                'lastLogon': last_logon_date.strftime('%Y-%m-%d')
                            }
                            inactive_computers.append(computer_info)
                    except Exception as e:
                        try:
                            when_changed_date = when_changed.replace(tzinfo=None)
                            days_inactive = (datetime.now() - when_changed_date).days
                            
                            if days_inactive > 30:
                                computer_info = {
                                    'name': entry['name'].value,
                                    'daysInactive': days_inactive,
                                    'lastLogon': when_changed_date.strftime('%Y-%m-%d')
                                }
                                inactive_computers.append(computer_info)
                        except Exception as e:
                            computers_with_error += 1
                else:
                    computers_without_timestamp += 1
            except Exception as e:
                computers_with_error += 1
                continue

        # Ordenar por días de inactividad y tomar los 5 más inactivos
        inactive_computers = sorted(
            inactive_computers,
            key=lambda x: x['daysInactive'],
            reverse=True
        )[:5]

        # Estadísticas de seguridad de equipos
        security_stats = [
            {
                'name': 'Total Equipos Inactivos',
                'description': 'Equipos sin actividad por más de 30 días',
                'count': all_inactive_computers,
                'critical': all_inactive_computers > 10
            }
        ]

        # Buscar usuarios con contraseñas por expirar
        print("Verificando contraseñas por expirar...")
        conn.search('dc=sura,dc=corp', '(&(objectClass=user)(objectCategory=person))', 
                   attributes=['mail', 'pwdLastSet', 'userAccountControl'])
        
        passwords_to_expire = []
        for entry in conn.entries:
            try:
                pwd_last_set = entry['pwdLastSet'].value
                user_account_control = entry['userAccountControl'].value
                
                # Verificar si la contraseña está configurada para nunca expirar (0x10000)
                password_never_expires = bool(user_account_control & 0x10000)
                
                if not password_never_expires and pwd_last_set and pwd_last_set != 0 and entry['mail'].value:
                    # Si ya es datetime, solo remover timezone
                    if isinstance(pwd_last_set, datetime):
                        pwd_date = pwd_last_set.replace(tzinfo=None)
                    else:
                        # Si es un timestamp de Windows, convertirlo
                        pwd_date = datetime(1601, 1, 1) + timedelta(seconds=int(pwd_last_set)/10000000)
                    
                    days_since_set = (datetime.now() - pwd_date).days
                    days_until_expire = 90 - days_since_set  # 90 días es el límite
                    
                    # Solo incluir si faltan 30 días o menos para expirar
                    if 0 < days_until_expire <= 30:
                        email = entry['mail'].value
                        if '@' not in email:
                            email = f"{email}@sura.corp"
                        passwords_to_expire.append({
                            'name': email,
                            'daysUntilExpire': days_until_expire,
                            'lastSet': pwd_date.strftime('%Y-%m-%d')
                        })
            except Exception as e:
                print(f"Error procesando pwdLastSet para {entry['mail'].value if entry['mail'] else 'usuario desconocido'}: {str(e)}")
                continue

        # Ordenar por días restantes (ascendente)
        passwords_to_expire = sorted(
            passwords_to_expire,
            key=lambda x: x['daysUntilExpire']
        )

        # Agregar estadística de contraseñas
        if passwords_to_expire:
            security_stats.append({
                'name': 'Contraseñas por Expirar',
                'description': 'Usuarios que deben cambiar su contraseña en los próximos 30 días',
                'count': len(passwords_to_expire),
                'critical': any(p['daysUntilExpire'] <= 15 for p in passwords_to_expire)
            })

        # Estadísticas de grupos
        print("Obteniendo estadísticas de grupos...")
        conn.search('dc=sura,dc=corp', '(objectClass=group)', attributes=['name', 'member'])
        total_groups = len(conn.entries)
        
        # Grupos con más miembros
        groups_by_members = sorted(
            [{'name': entry['name'].value, 'members': len(entry['member'])} for entry in conn.entries],
            key=lambda x: x['members'],
            reverse=True
        )[:5]

        # Obtener últimos cambios en el dominio
        print("Obteniendo últimos cambios en el dominio...")
        
        recent_changes = []
        
        # 1. Cambios en usuarios
        conn.search('dc=sura,dc=corp', '(&(objectClass=user)(objectCategory=person))', 
                   attributes=['mail', 'whenCreated', 'whenChanged', 'displayName', 
                             'pwdLastSet', 'userAccountControl', 'sAMAccountName',
                             'distinguishedName', 'name', 'lastLogon'])
        
        for entry in conn.entries:
            try:
                when_created = entry['whenCreated'].value
                when_changed = entry['whenChanged'].value
                last_logon = entry['lastLogon'].value
                display_name = entry['displayName'].value if entry['displayName'] else entry['sAMAccountName'].value
                distinguished_name = entry['distinguishedName'].value
                
                # Nuevas cuentas (7 días)
                if when_created:
                    created_date = when_created.replace(tzinfo=None)
                    days_since_created = (datetime.now() - created_date).days
                    if days_since_created <= 7:
                        recent_changes.append({
                            'type': 'Nueva Cuenta',
                            'name': display_name,
                            'date': created_date.strftime('%Y-%m-%d'),
                            'timestamp': created_date,  # Guardamos el timestamp completo para ordenar
                            'description': 'Usuario creado'
                        })
                
                # Cambios de contraseña (3 días)
                pwd_last_set = entry['pwdLastSet'].value
                if pwd_last_set:
                    if isinstance(pwd_last_set, datetime):
                        pwd_date = pwd_last_set.replace(tzinfo=None)
                    else:
                        pwd_date = datetime(1601, 1, 1) + timedelta(seconds=int(pwd_last_set)/10000000)
                    
                    days_since_pwd = (datetime.now() - pwd_date).days
                    if days_since_pwd <= 3:
                        recent_changes.append({
                            'type': 'Contraseña',
                            'name': display_name,
                            'date': pwd_date.strftime('%Y-%m-%d %H:%M'),  # Incluimos la hora
                            'timestamp': pwd_date,
                            'description': 'Cambio de contraseña'
                        })
                
                # Cambios de OU o nombre (1 día)
                if when_changed and last_logon:
                    changed_date = when_changed.replace(tzinfo=None)
                    last_logon_date = last_logon.replace(tzinfo=None) if isinstance(last_logon, datetime) else None
                    
                    if (datetime.now() - changed_date).days <= 1 and last_logon_date:
                        if changed_date > last_logon_date:
                            if 'OU=' in distinguished_name:
                                ou_name = distinguished_name.split(",")[1].replace("OU=", "")
                                if any(dept in ou_name.lower() for dept in [
                                    'comercializacion', 'planificacion', 'compras', 'cuentas', 
                                    'finanzas', 'tecnologia', 'rrhh', 'operaciones'
                                ]):
                                    recent_changes.append({
                                        'type': 'Ubicación',
                                        'name': display_name,
                                        'date': changed_date.strftime('%Y-%m-%d %H:%M'),  # Incluimos la hora
                                        'timestamp': changed_date,
                                        'description': f'Movido a {ou_name}'
                                    })
            except Exception as e:
                print(f"Error procesando cambios de usuario: {str(e)}")
                continue

        # 2. Cambios en equipos (omitir cambios de ubicación por replicación)
        conn.search('dc=sura,dc=corp', '(objectClass=computer)', 
                   attributes=['name', 'whenCreated', 'whenChanged', 'distinguishedName', 'operatingSystem'])
        
        for entry in conn.entries:
            try:
                when_created = entry['whenCreated'].value
                when_changed = entry['whenChanged'].value
                computer_name = entry['name'].value
                
                # Nuevos equipos (7 días)
                if when_created:
                    created_date = when_created.replace(tzinfo=None)
                    days_since_created = (datetime.now() - created_date).days
                    if days_since_created <= 7:
                        recent_changes.append({
                            'type': 'Nuevo Equipo',
                            'name': computer_name,
                            'date': created_date.strftime('%Y-%m-%d %H:%M'),  # Incluimos la hora
                            'timestamp': created_date,
                            'description': f'Equipo agregado al dominio'
                        })
                
                # Cambios en equipos (3 días)
                if when_changed:
                    changed_date = when_changed.replace(tzinfo=None)
                    days_since_changed = (datetime.now() - changed_date).days
                    if days_since_changed <= 3:
                        distinguished_name = entry['distinguishedName'].value
                        if 'OU=' in distinguished_name:
                            recent_changes.append({
                                'type': 'Equipo',
                                'name': computer_name,
                                'date': changed_date.strftime('%Y-%m-%d %H:%M'),  # Incluimos la hora
                                'timestamp': changed_date,
                                'description': f'Movido a {distinguished_name.split(",")[1].replace("OU=", "")}'
                            })
            except Exception as e:
                print(f"Error procesando cambios de equipo: {str(e)}")
                continue

        # 3. Cambios en grupos
        conn.search('dc=sura,dc=corp', '(objectClass=group)', 
                   attributes=['name', 'whenCreated', 'whenChanged', 'member', 'memberOf', 'distinguishedName'])
        
        for entry in conn.entries:
            try:
                when_created = entry['whenCreated'].value
                when_changed = entry['whenChanged'].value
                group_name = entry['name'].value
                
                # Nuevos grupos (7 días)
                if when_created:
                    created_date = when_created.replace(tzinfo=None)
                    days_since_created = (datetime.now() - created_date).days
                    if days_since_created <= 7:
                        recent_changes.append({
                            'type': 'Nuevo Grupo',
                            'name': group_name,
                            'date': created_date.strftime('%Y-%m-%d %H:%M'),  # Incluimos la hora
                            'timestamp': created_date,
                            'description': 'Grupo creado'
                        })
                
                # Cambios en grupos (3 días)
                if when_changed:
                    changed_date = when_changed.replace(tzinfo=None)
                    days_since_changed = (datetime.now() - changed_date).days
                    if days_since_changed <= 3:
                        # Solo registrar cambios en grupos importantes
                        if any(important in group_name.lower() 
                              for important in ['admin', 'it', 'seguridad', 'vpn', 'remoto']):
                            recent_changes.append({
                                'type': 'Grupo',
                                'name': group_name,
                                'date': changed_date.strftime('%Y-%m-%d %H:%M'),  # Incluimos la hora
                                'timestamp': changed_date,
                                'description': 'Cambios en membresía del grupo'
                            })
                            
                        # Verificar cambios de OU
                        distinguished_name = entry['distinguishedName'].value
                        if 'OU=' in distinguished_name:
                            recent_changes.append({
                                'type': 'Grupo',
                                'name': group_name,
                                'date': changed_date.strftime('%Y-%m-%d'),
                                'description': f'Movido a {distinguished_name.split(",")[1].replace("OU=", "")}'
                            })
            except Exception as e:
                print(f"Error procesando cambios en grupos: {str(e)}")
                continue

        # Ordenar cambios por fecha más reciente
        recent_changes = sorted(
            [change for change in recent_changes if 'timestamp' in change],  # Filtrar solo los que tienen timestamp
            key=lambda x: x['timestamp'],
            reverse=True
        )[:5]

        # Formatear las fechas después de ordenar
        for change in recent_changes:
            try:
                # Convertir el timestamp a string con formato consistente
                if 'timestamp' in change:
                    change['date'] = change['timestamp'].strftime('%Y-%m-%d')
                    del change['timestamp']
            except Exception as e:
                print(f"Error formateando fecha para cambio: {str(e)}")
                # Si hay error, usar fecha actual como fallback
                change['date'] = datetime.now().strftime('%Y-%m-%d')

        # Asegurarnos de que todos los cambios tengan los campos requeridos
        recent_changes = [
            {
                'type': change.get('type', 'Cambio'),
                'name': change.get('name', 'Desconocido'),
                'date': change.get('date', datetime.now().strftime('%Y-%m-%d')),
                'description': change.get('description', 'Actualización')
            }
            for change in recent_changes
        ]

        # Obtener estado de servicios críticos
        print("Obteniendo estado de servicios críticos...")
        
        services_status = []
        critical_services = [
            'NTDS',           # Active Directory Domain Services
            'DNS',            # DNS Server
            'Netlogon',       # Net Logon
            'DFSR',           # DFS Replication
            'KDC',            # Kerberos Key Distribution Center
            'W32Time',        # Windows Time
            'ADWS',           # Active Directory Web Services
            'DHCPServer'      # DHCP Server
        ]
        
        try:
            # Consultar estado de servicios en ambos DCs
            dcs = [
                {'ip': '192.168.141.39', 'name': 'SRVVAL-AD01'},
                {'ip': '192.168.140.39', 'name': 'SRVCDN-AD01'}
            ]
            
            for dc in dcs:
                try:
                    # Intentar conexión LDAP
                    dc_conn = Connection(
                        Server(dc['ip'], get_info=ALL),
                        user='sura\\dfalfan',
                        password='Dief490606',
                        auto_bind=True
                    )
                    
                    # Si llegamos aquí, el DC está respondiendo
                    dc_status = {
                        'name': 'Controlador de Dominio',
                        'server': dc['name'],
                        'status': 'Activo',
                        'details': 'Servicios funcionando correctamente',
                        'is_critical': True
                    }
                    services_status.append(dc_status)
                    
                    # Verificar DNS
                    try:
                        dns_query = socket.gethostbyname_ex(dc['ip'])
                        dns_status = {
                            'name': 'Servicios de Red',
                            'server': dc['name'],
                            'status': 'Activo',
                            'details': 'DNS y red funcionando',
                            'is_critical': True
                        }
                    except:
                        dns_status = {
                            'name': 'Servicios de Red',
                            'server': dc['name'],
                            'status': 'Error',
                            'details': 'Problemas con DNS',
                            'is_critical': True
                        }
                    services_status.append(dns_status)
                    
                    # Verificar replicación
                    try:
                        dc_conn.search('dc=sura,dc=corp',
                                     '(objectClass=computer)',
                                     attributes=['whenChanged'])
                        last_change = max(entry.whenChanged.value for entry in dc_conn.entries)
                        
                        # Calcular tiempo desde último cambio
                        time_since_change = datetime.now() - last_change.replace(tzinfo=None)
                        if time_since_change.total_seconds() < 3600:  # Menos de 1 hora
                            repl_details = "Replicación activa"
                        else:
                            repl_details = f"Último cambio hace {time_since_change.days} días"
                            
                        replication_status = {
                            'name': 'Estado de Replicación',
                            'server': dc['name'],
                            'status': 'Activo',
                            'details': repl_details,
                            'is_critical': True
                        }
                    except Exception as e:
                        replication_status = {
                            'name': 'Estado de Replicación',
                            'server': dc['name'],
                            'status': 'Error',
                            'details': 'Problemas de replicación',
                            'is_critical': True
                        }
                    services_status.append(replication_status)
                    
                    dc_conn.unbind()
                    
                except Exception as e:
                    error_msg = str(e)
                    if "connection refused" in error_msg.lower():
                        details = "Servidor no responde"
                    elif "authentication failed" in error_msg.lower():
                        details = "Error de autenticación"
                    else:
                        details = "Error de conexión"
                        
                    services_status.append({
                        'name': 'Controlador de Dominio',
                        'server': dc['name'],
                        'status': 'Error',
                        'details': details,
                        'is_critical': True
                    })
        
        except Exception as e:
            print(f"Error obteniendo estado de servicios: {str(e)}")
            services_status = []

        # Preparar respuesta
        response_data = {
            'users': {
                'total': total_users,
                'active': active_users,
                'disabled': disabled_users,
                'activePercentage': round((active_users / total_users * 100), 2) if total_users > 0 else 0,
                'passwordsToExpire': passwords_to_expire
            },
            'computers': {
                'total': total_computers,
                'byOperatingSystem': os_distribution,
                'inactive': inactive_computers,
                'security': security_stats
            },
            'groups': {
                'total': total_groups,
                'topByMembers': groups_by_members
            },
            'recentChanges': recent_changes,
            'services': services_status  # Nuevo campo para estado de servicios
        }
        
        print("Estadísticas del dominio obtenidas exitosamente")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error al obtener estadísticas del dominio: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/smartphones/<int:smartphone_id>', methods=['GET'])
def get_smartphone(smartphone_id):
    try:
        smartphone = Smartphone.query.get(smartphone_id)
        if not smartphone:
            return jsonify({'error': 'Smartphone no encontrado'}), 404

        empleado = Empleado.query.get(smartphone.empleado_id) if smartphone.empleado_id else None
        
        return jsonify({
            'id': smartphone.id,
            'marca': smartphone.marca,
            'modelo': smartphone.modelo,
            'serial': smartphone.serial,
            'imei': smartphone.imei,
            'imei2': smartphone.imei2,
            'linea': smartphone.linea,
            'estado': smartphone.estado,
            'empleado': empleado.nombre_completo if empleado else None,
            'empleado_id': empleado.id if empleado else None,
            'fecha_asignacion': smartphone.fecha_asignacion.isoformat() if smartphone.fecha_asignacion else None
        })
    except Exception as e:
        print(f"Error en get_smartphone: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
    app.run(host='0.0.0.0', port=5000, debug=True)