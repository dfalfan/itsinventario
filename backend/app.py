from flask import Flask, request, jsonify, send_file
from PIL import Image, ImageDraw, ImageFont
import io
import os
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch
import os
import io
from ldap3 import Server, Connection, ALL, NTLM, SUBTREE, MODIFY_REPLACE
from io import BytesIO
from dotenv import load_dotenv
from unidecode import unidecode
from google.oauth2 import service_account
from googleapiclient.discovery import build
import json
import socket
import ssl
from PIL import Image, ImageDraw, ImageFont
from pysnmp.hlapi import *
import time
import ldap3
from routes.auth import auth_bp

app = Flask(__name__)

# Configuración de CORS más permisiva para desarrollo
CORS(app, 
     resources={r"/*": {
         "origins": ["http://192.168.141.50:3000", "http://192.168.141.50", "http://localhost:3000"],
         "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 3600
     }})

# Eliminar el middleware manual de CORS ya que estamos usando flask-cors
@app.after_request
def after_request(response):
    print(f"Response Headers: {dict(response.headers)}")
    return response

# Middleware para logging de todas las peticiones
@app.before_request
def log_request_info():
    print('=' * 50)
    print(f"Headers: {dict(request.headers)}")
    print(f"Method: {request.method}")
    print(f"URL: {request.url}")
    if request.is_json:
        print(f"Data: {request.get_json()}")
    print('=' * 50)

# Clave secreta para JWT (en producción, usar variable de entorno)
app.config['JWT_SECRET_KEY'] = 'tu_clave_secreta_muy_segura'

# Registrar el blueprint de autenticación
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Configuración de la base de datos con pool de conexiones optimizado
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://its:sura@postgres:5432/itsinventario'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,  # Número máximo de conexiones permanentes
    'max_overflow': 20,  # Número máximo de conexiones adicionales
    'pool_timeout': 60,  # Tiempo de espera para obtener una conexión
    'pool_recycle': 1800,  # Reciclar conexiones después de 30 minutos
    'pool_pre_ping': True  # Verificar conexión antes de usarla
}

db = SQLAlchemy(app)

# Configuración de Google Workspace
SCOPES = [
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.reports.usage.readonly'
]
SERVICE_ACCOUNT_FILE = 'credentials.json'

# Configurar la carpeta de archivos estáticos
app.static_folder = '../frontend/public'
app.static_url_path = ''

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
    
    # Relación directa con departamentos
    departamentos = db.relationship('Departamento', back_populates='gerencia')

class Departamento(db.Model):
    __tablename__ = 'departamentos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    gerencia_id = db.Column(db.Integer, db.ForeignKey('gerencias.id'))
    
    gerencia = db.relationship('Gerencia', back_populates='departamentos')

class Area(db.Model):
    __tablename__ = 'areas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    departamento_id = db.Column(db.Integer, db.ForeignKey('departamentos.id'))
    
    # Agregar relación con Departamento
    departamento = db.relationship('Departamento', backref='areas', lazy='joined')

class CargoBase(db.Model):
    __tablename__ = 'cargos_base'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)

class CargoArea(db.Model):
    __tablename__ = 'cargos_areas'
    id = db.Column(db.Integer, primary_key=True)
    cargo_base_id = db.Column(db.Integer, db.ForeignKey('cargos_base.id'), nullable=False)
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id'), nullable=False)
    
    cargo_base = db.relationship('CargoBase', lazy='joined')
    area = db.relationship('Area', lazy='joined', backref='cargos')

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
    cargo_area_id = db.Column(db.Integer, db.ForeignKey('cargos_areas.id'))
    
    sede = db.relationship('Sede', lazy='joined')
    gerencia = db.relationship('Gerencia', lazy='joined')
    departamento = db.relationship('Departamento', lazy='joined')
    area = db.relationship('Area', lazy='joined')
    cargo_area = db.relationship('CargoArea', lazy='joined')
    smartphone = db.relationship('Smartphone', uselist=False, back_populates='empleado')

    @property
    def jerarquia_completa(self):
        return {
            'sede': self.sede.nombre if self.sede else None,
            'gerencia': self.gerencia.nombre if self.gerencia else None,
            'departamento': self.departamento.nombre if self.departamento else None,
            'area': self.area.nombre if self.area else None,
            'cargo': self.cargo_area.cargo_base.nombre if self.cargo_area else None
        }

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
    marca = db.Column(db.String(100))
    modelo = db.Column(db.String(100))
    nombre = db.Column(db.String(100))
    serial = db.Column(db.String(100))
    proveedor = db.Column(db.String(100))
    ip = db.Column(db.String(100))
    url = db.Column(db.String(100))
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

class Mantenimiento(db.Model):
    __tablename__ = 'mantenimientos'
    id = db.Column(db.Integer, primary_key=True)
    activo_id = db.Column(db.Integer, db.ForeignKey('assets.id'))
    fecha_inicio = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_fin = db.Column(db.DateTime)
    estado = db.Column(db.String(50), default='En Progreso')  # En Progreso, Completado, Cancelado
    descripcion = db.Column(db.Text)
    diagnostico = db.Column(db.Text)
    solucion = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    activo = db.relationship('Asset', backref='mantenimientos')
    tareas = db.relationship('TareaMantenimiento', backref='mantenimiento', cascade='all, delete-orphan')
    notas = db.relationship('NotaMantenimiento', backref='mantenimiento', cascade='all, delete-orphan')

class TareaMantenimiento(db.Model):
    __tablename__ = 'tareas_mantenimiento'
    id = db.Column(db.Integer, primary_key=True)
    mantenimiento_id = db.Column(db.Integer, db.ForeignKey('mantenimientos.id'))
    descripcion = db.Column(db.String(200))
    completada = db.Column(db.Boolean, default=False)
    fecha_completado = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class NotaMantenimiento(db.Model):
    __tablename__ = 'notas_mantenimiento'
    id = db.Column(db.Integer, primary_key=True)
    mantenimiento_id = db.Column(db.Integer, db.ForeignKey('mantenimientos.id'))
    contenido = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/api/empleados')
def get_empleados():
    try:
        empleados = Empleado.query.options(
            joinedload(Empleado.sede),
            joinedload(Empleado.gerencia),
            joinedload(Empleado.departamento),
            joinedload(Empleado.area),
            joinedload(Empleado.cargo_area)
        ).all()
        
        # Obtener todos los assets en un solo query para evitar N+1
        assets = {str(a.id): {'tipo': a.tipo, 'nombre': a.nombre_equipo} for a in Asset.query.all()}
        
        return jsonify([{
            'id': e.id,
            'nombre': e.nombre_completo,
            'ficha': e.ficha,
            'cedula': e.cedula,
            'extension': e.extension,
            'correo': e.correo,
            'sede': e.sede.nombre if e.sede else None,
            'gerencia': e.gerencia.nombre if e.gerencia else None,
            'departamento': e.departamento.nombre if e.departamento else None,
            'area': e.area.nombre if e.area else None,
            'cargo': e.cargo_area.cargo_base.nombre if e.cargo_area else None,
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
        # Obtener cargos asignados al área específica
        cargos_asignados = CargoArea.query.filter_by(area_id=area_id)\
            .options(joinedload(CargoArea.cargo_base))\
            .all()
        
        # Obtener todos los cargos base para mostrar disponibles
        todos_cargos = CargoBase.query.all()
        
        # Marcar cuáles están asignados
        cargos = []
        for cargo_base in todos_cargos:
            asignado = any(ca.cargo_base_id == cargo_base.id for ca in cargos_asignados)
            cargos.append({
                'id': cargo_base.id,
                'nombre': cargo_base.nombre,
                'asignado': asignado
            })
        
        return jsonify(cargos)
        
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
        # Estadísticas de equipos existentes
        total_equipos = Asset.query.count()
        empleados_sin_equipo = Empleado.query.filter(Empleado.equipo_asignado.is_(None)).count()
        equipos_reparacion = Asset.query.filter_by(estado='REPARACION').count()
        equipos_stock = Asset.query.filter_by(empleado_id=None).count()
        
        # Estadísticas de smartphones
        total_smartphones = Smartphone.query.count()
        smartphones_sin_asignar = Smartphone.query.filter_by(empleado_id=None).count()
        smartphones_asignados = total_smartphones - smartphones_sin_asignar
        lineas_activas = Smartphone.query.filter(Smartphone.linea.isnot(None)).count()
        
        # Distribución por marca de smartphone
        smartphones_por_marca = db.session.query(
            Smartphone.marca,
            db.func.count(Smartphone.id).label('cantidad')
        ).group_by(Smartphone.marca).all()
        
        # Distribución por departamento
        smartphones_por_departamento = db.session.query(
            Departamento.nombre,
            db.func.count(Smartphone.id).label('cantidad')
        ).join(Empleado, Smartphone.empleado_id == Empleado.id)\
         .join(Departamento, Empleado.departamento_id == Departamento.id)\
         .group_by(Departamento.nombre)\
         .order_by(db.func.count(Smartphone.id).desc())\
         .limit(10)\
         .all()
        
        # Asignaciones por mes
        asignaciones_por_mes = db.session.query(
            db.func.to_char(Smartphone.fecha_asignacion, 'YYYY-MM').label('mes'),
            db.func.count(Smartphone.id).label('cantidad')
        ).filter(Smartphone.fecha_asignacion.isnot(None))\
         .group_by('mes')\
         .order_by('mes')\
         .limit(12)\
         .all()
        
        # Resto de las estadísticas existentes...
        equipos_por_tipo = db.session.query(
            Asset.tipo,
            db.func.count(Asset.id).label('cantidad')
        ).group_by(Asset.tipo).all()
        
        equipos_por_sede = db.session.query(
            Sede.nombre,
            db.func.count(Asset.id).label('cantidad')
        ).join(Asset).group_by(Sede.nombre).all()

        equipos_asignados = Asset.query.filter(Asset.empleado_id.isnot(None)).count()
        tasa_utilizacion = [
            {'estado': 'Asignados', 'cantidad': equipos_asignados},
            {'estado': 'No Asignados', 'cantidad': total_equipos - equipos_asignados}
        ]

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
            ],
            # Estadísticas de smartphones
            'totalSmartphones': total_smartphones,
            'smartphonesSinAsignar': smartphones_sin_asignar,
            'smartphonesAsignados': smartphones_asignados,
            'lineasActivas': lineas_activas,
            'smartphonesPorMarca': [
                {'marca': marca, 'cantidad': cantidad}
                for marca, cantidad in smartphones_por_marca
            ],
            'smartphonesPorDepartamento': [
                {'departamento': depto, 'cantidad': cantidad}
                for depto, cantidad in smartphones_por_departamento
            ],
            'asignacionesPorMes': [
                {'mes': mes, 'cantidad': cantidad}
                for mes, cantidad in asignaciones_por_mes
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
            CargoBase.nombre.label('cargo_nombre')
        ).outerjoin(
            Sede, Empleado.sede_id == Sede.id
        ).outerjoin(
            Departamento, Empleado.departamento_id == Departamento.id
        ).outerjoin(
            CargoArea, Empleado.cargo_area_id == CargoArea.id
        ).outerjoin(
            CargoBase, CargoArea.cargo_base_id == CargoBase.id
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

def registrar_cambio_campo(categoria, item_id, campo, valor_anterior, valor_nuevo, item_info=None):
    """
    Registra un cambio en un campo específico.
    
    Args:
        categoria (str): Categoría del item (assets, smartphones, empleados)
        item_id (int): ID del elemento
        campo (str): Nombre del campo modificado
        valor_anterior: Valor anterior del campo
        valor_nuevo: Nuevo valor del campo
        item_info (dict): Información adicional del item (tipo, marca, modelo)
    """
    if categoria == 'assets':
        descripcion = f"Se cambió el {campo} del activo {item_info['tipo']} {item_info['marca']} (ID: {item_id}) de '{valor_anterior or 'No especificado'}' a '{valor_nuevo or 'No especificado'}'"
    elif categoria == 'smartphones':
        descripcion = f"Se cambió el {campo} del smartphone {item_info['marca']} {item_info['modelo']} (ID: {item_id}) de '{valor_anterior or 'No especificado'}' a '{valor_nuevo or 'No especificado'}'"
    elif categoria == 'empleados':
        descripcion = f"Se cambió el {campo} del empleado (ID: {item_id}) de '{valor_anterior or 'No especificado'}' a '{valor_nuevo or 'No especificado'}'"
    else:
        descripcion = f"Se cambió el {campo} del item (ID: {item_id}) de '{valor_anterior or 'No especificado'}' a '{valor_nuevo or 'No especificado'}'"
    
    registrar_log(categoria, 'modificacion', descripcion, item_id)

@app.route('/api/activos/<int:activo_id>', methods=['PATCH'])
def update_activo(activo_id):
    try:
        data = request.get_json()
        activo = Asset.query.get(activo_id)
        
        if not activo:
            return jsonify({"error": "Activo no encontrado"}), 404
            
        # Campos que queremos trackear (actualizados para coincidir con el modelo)
        campos_trackear = {
            'nombre_equipo': 'nombre del equipo',
            'marca': 'marca',
            'modelo': 'modelo',
            'tipo': 'tipo',
            'serial': 'serial',
            'ram': 'RAM',
            'disco': 'disco',
            'activo_fijo': 'activo fijo',
            'notas': 'notas'
        }
        
        # Registrar cambios en campos trackeados
        for campo, nombre_campo in campos_trackear.items():
            if campo in data and data[campo] != getattr(activo, campo):
                registrar_cambio_campo(
                    'assets',
                    activo_id,
                    nombre_campo,
                    getattr(activo, campo),
                    data[campo],
                    {
                        'tipo': activo.tipo,
                        'marca': activo.marca,
                        'modelo': activo.modelo
                    }
                )
                setattr(activo, campo, data[campo])
        
        activo.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({"message": "Activo actualizado exitosamente"})
        
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
        empleado = Empleado.query.options(
            joinedload(Empleado.sede),
            joinedload(Empleado.gerencia),
            joinedload(Empleado.departamento),
            joinedload(Empleado.area),
            joinedload(Empleado.cargo_area)
        ).get(empleado_id)
        
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404
            
        return jsonify({
            'id': empleado.id,
            'nombre': empleado.nombre_completo,
            'ficha': empleado.ficha,
            'cedula': empleado.cedula,
            'extension': empleado.extension,
            'correo': empleado.correo,
            'sede': empleado.sede.nombre if empleado.sede else None,
            'gerencia': empleado.gerencia.nombre if empleado.gerencia else None,
            'departamento': empleado.departamento.nombre if empleado.departamento else None,
            'area': empleado.area.nombre if empleado.area else None,
            'cargo': empleado.cargo_area.cargo_base.nombre if empleado.cargo_area else None,
            'equipo_asignado': empleado.equipo_asignado,
            'smartphone_asignado': empleado.smartphone.id if empleado.smartphone else None,
            'jerarquia': empleado.jerarquia_completa
        })
        
    except Exception as e:
        print(f"Error en get_empleado: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/empleados/actualizar-correos', methods=['POST'])
def actualizar_correos():
    try:
        data = request.get_json()
        empleado_id = data.get('empleado_id')
        correo = data.get('correo')
        
        if not empleado_id or not correo:
            return jsonify({'error': 'empleado_id y correo son requeridos'}), 400
            
        # Verificar si el empleado existe
        empleado = Empleado.query.get(empleado_id)
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404
            
        # Verificar si el correo ya existe en la base de datos
        correo_existente = Empleado.query.filter(Empleado.correo == correo).first()
        if correo_existente:
            return jsonify({
                'error': 'El correo ya existe en la base de datos',
                'message': 'already exists'
            }), 400
            
        # Separar nombre y apellido para Google Workspace
        nombre_completo = empleado.nombre_completo.split()
        if len(nombre_completo) >= 2:
            nombre = nombre_completo[-1]
            apellido = nombre_completo[0]
        else:
            return jsonify({'error': 'El formato del nombre debe ser "APELLIDOS NOMBRES"'}), 400
            
        # Verificar y crear usuario en Google Workspace
        google_result = crear_usuario_google(nombre, apellido, correo)
        
        if not google_result['success']:
            error_msg = str(google_result.get('error', ''))
            
            if 'Domain user limit reached' in error_msg:
                return jsonify({
                    'error': 'No hay licencias disponibles',
                    'google_workspace': {
                        'warning': 'No se pudo crear el correo: límite de licencias alcanzado'
                    }
                }), 400
            elif 'already exists' in error_msg.lower():
                return jsonify({
                    'error': 'El correo ya existe en Google Workspace',
                    'message': 'already exists'
                }), 400
            else:
                return jsonify({
                    'error': 'Error al crear usuario en Google Workspace',
                    'details': error_msg
                }), 500
                
        # Si todo está bien, actualizar el correo del empleado
        empleado.correo = correo
        db.session.commit()
        
        return jsonify({
            'message': 'Correo actualizado exitosamente',
            'google_workspace': {
                'success': True,
                'email': correo,
                'temp_password': google_result.get('temp_password')
            }
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
            ("Montserrat-Bold", empleado.cargo_area.cargo_base.nombre if empleado.cargo_area else ''),
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
        conn.search('dc=sura,dc=corp', '(objectClass=computer)', 
                   attributes=['cn', 'lastLogon', 'operatingSystem', 'whenChanged'])

        # Obtener los equipos de la base de datos
        equipos_db = Asset.query.with_entities(Asset.nombre_equipo).all()
        equipos_db = [equipo.nombre_equipo for equipo in equipos_db if equipo.nombre_equipo]

        # Procesar los resultados
        resultado = {}
        equipos_ad = {}

        # Primero, procesar todos los equipos del AD
        for entry in conn.entries:
            nombre = entry.cn.value
            last_logon = entry.lastLogon.value
            os = entry.operatingSystem.value if hasattr(entry, 'operatingSystem') else None
            when_changed = entry.whenChanged.value if hasattr(entry, 'whenChanged') else None

            # Calcular el estado basado en lastLogon
            estado = 'rojo'  # Por defecto, rojo
            if last_logon:
                last_logon_date = last_logon.replace(tzinfo=None)
                dias_inactivo = (datetime.now() - last_logon_date).days
                if dias_inactivo <= 30:  # Si se ha conectado en los últimos 30 días
                    estado = 'verde'

            equipos_ad[nombre] = {
                'exists': True,
                'estado': estado,
                'last_logon': last_logon.strftime('%Y-%m-%d %H:%M:%S') if last_logon else None,
                'operating_system': os,
                'last_changed': when_changed.strftime('%Y-%m-%d %H:%M:%S') if when_changed else None,
                'dias_inactivo': dias_inactivo if last_logon else None
            }

        # Luego, procesar los equipos de la base de datos
        for equipo in equipos_db:
            if equipo in equipos_ad:
                resultado[equipo] = equipos_ad[equipo]
            else:
                resultado[equipo] = {
                    'exists': False,
                    'estado': 'rojo',
                    'error': 'No encontrado en Active Directory'
                }

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
        data = request.get_json()
        smartphone = Smartphone.query.get(smartphone_id)
        
        if not smartphone:
            return jsonify({"error": "Smartphone no encontrado"}), 404
            
        # Campos que queremos trackear (actualizados para coincidir con el modelo)
        campos_trackear = {
            'marca': 'marca',
            'modelo': 'modelo',
            'serial': 'serial',
            'imei': 'IMEI',
            'imei2': 'IMEI2',
            'linea': 'línea',
            'estado': 'estado'
        }
        
        # Registrar cambios en campos trackeados
        for campo, nombre_campo in campos_trackear.items():
            if campo in data and data[campo] != getattr(smartphone, campo):
                registrar_cambio_campo(
                    'smartphones',
                    smartphone_id,
                    nombre_campo,
                    getattr(smartphone, campo),
                    data[campo],
                    {
                        'marca': smartphone.marca,
                        'modelo': smartphone.modelo
                    }
                )
                setattr(smartphone, campo, data[campo])
        
        smartphone.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({"message": "Smartphone actualizado exitosamente"})
        
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
            'marca': imp.marca,
            'modelo': imp.modelo,
            'nombre': imp.nombre,
            'serial': imp.serial,
            'proveedor': imp.proveedor,
            'ip': imp.ip,
            'url': imp.url,
            'created_at': imp.created_at.isoformat() if imp.created_at else None,
            'updated_at': imp.updated_at.isoformat() if imp.updated_at else None
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
        allowed_fields = ['marca', 'modelo', 'nombre', 'serial', 'proveedor', 'sede_id']
        
        for field in data:
            if field in allowed_fields:
                setattr(impresora, field, data[field])
        
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
            'cargo': e.cargo_area.cargo_base.nombre if e.cargo_area else None
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
            ("Montserrat-Bold", empleado.cargo_area.cargo_base.nombre if empleado.cargo_area else ''),
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
        
        # Si el estado es REPARACION, crear un nuevo mantenimiento
        if estado == 'REPARACION':
            nuevo_mantenimiento = Mantenimiento(
                activo_id=activo_id,
                descripcion=data.get('descripcion', 'Mantenimiento iniciado'),
                diagnostico=data.get('diagnostico', ''),
                estado='En Progreso'  # Cambiado de REPARACION a En Progreso
            )
            db.session.add(nuevo_mantenimiento)
        
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
            cargo_area_id=data['cargo_id']
        )

        db.session.add(new_empleado)
        db.session.flush()  # Para obtener el ID sin hacer commit

        # Registrar el log de creación
        descripcion = f"Se creó el empleado {new_empleado.nombre_completo} (Ficha: {next_ficha}, Cédula: {data['cedula']})"
        registrar_log('empleados', 'creación', descripcion, new_empleado.id)

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
                'cargo': new_empleado.cargo_area.cargo_base.nombre if new_empleado.cargo_area else None
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
        data = request.get_json()
        empleado = Empleado.query.get(empleado_id)
        
        if not empleado:
            return jsonify({"error": "Empleado no encontrado"}), 404
            
        # Campos que queremos trackear
        campos_trackear = {
            'nombre_completo': 'nombre',
            'ficha': 'ficha',
            'cedula': 'cédula',
            'extension': 'extensión',
            'correo': 'correo',
            'sede_id': 'sede',
            'gerencia_id': 'gerencia',
            'departamento_id': 'departamento',
            'area_id': 'área',
            'cargo_area_id': 'cargo'
        }
        
        # Registrar cambios en campos trackeados
        for campo, nombre_campo in campos_trackear.items():
            if campo in data and data[campo] != getattr(empleado, campo):
                # Obtener valores legibles para campos con _id
                valor_anterior = getattr(empleado, campo)
                valor_nuevo = data[campo]
                
                if campo.endswith('_id'):
                    if campo == 'sede_id':
                        sede_anterior = Sede.query.get(valor_anterior)
                        sede_nueva = Sede.query.get(valor_nuevo)
                        valor_anterior = sede_anterior.nombre if sede_anterior else 'No especificada'
                        valor_nuevo = sede_nueva.nombre if sede_nueva else 'No especificada'
                    elif campo == 'gerencia_id':
                        gerencia_anterior = Gerencia.query.get(valor_anterior)
                        gerencia_nueva = Gerencia.query.get(valor_nuevo)
                        valor_anterior = gerencia_anterior.nombre if gerencia_anterior else 'No especificada'
                        valor_nuevo = gerencia_nueva.nombre if gerencia_nueva else 'No especificada'
                    elif campo == 'departamento_id':
                        depto_anterior = Departamento.query.get(valor_anterior)
                        depto_nuevo = Departamento.query.get(valor_nuevo)
                        valor_anterior = depto_anterior.nombre if depto_anterior else 'No especificado'
                        valor_nuevo = depto_nuevo.nombre if depto_nuevo else 'No especificado'
                    elif campo == 'area_id':
                        area_anterior = Area.query.get(valor_anterior)
                        area_nueva = Area.query.get(valor_nuevo)
                        valor_anterior = area_anterior.nombre if area_anterior else 'No especificada'
                        valor_nuevo = area_nueva.nombre if area_nueva else 'No especificada'
                    elif campo == 'cargo_area_id':
                        cargo_anterior = CargoArea.query.get(valor_anterior)
                        cargo_nuevo = CargoArea.query.get(valor_nuevo)
                        valor_anterior = cargo_anterior.cargo_base.nombre if cargo_anterior else 'No especificado'
                        valor_nuevo = cargo_nuevo.cargo_base.nombre if cargo_nuevo else 'No especificado'

                registrar_cambio_campo(
                    'empleados',
                    empleado_id,
                    nombre_campo,
                    valor_anterior,
                    valor_nuevo,
                    {
                        'nombre': empleado.nombre_completo,
                        'ficha': empleado.ficha
                    }
                )
                setattr(empleado, campo, data[campo])
        
        empleado.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({"message": "Empleado actualizado exitosamente"})
        
    except Exception as e:
        db.session.rollback()
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
                'cargo': emp.cargo_area.cargo_base.nombre if emp.cargo_area else 'Sin Cargo'
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
        
        # Verificar si el usuario ya existe
        print(f"Verificando si el correo {email} ya existe...")
        try:
            existing_user = service.users().get(userKey=email).execute()
            print(f"❌ El correo {email} ya existe en Google Workspace")
            return {
                'success': False,
                'error': 'already exists',
                'message': 'El correo ya existe en Google Workspace'
            }
        except Exception as e:
            if 'Resource Not Found' not in str(e):
                print(f"❌ Error verificando usuario existente: {str(e)}")
                return {
                    'success': False,
                    'error': str(e)
                }
            print("✓ El correo está disponible")
        
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
        error_msg = str(e)
        print(f"❌ Error creando usuario en Google Workspace: {error_msg}")
        
        if 'Domain user limit reached' in error_msg:
            return {
                'success': False,
                'error': 'Domain user limit reached',
                'message': 'No hay licencias disponibles'
            }
        elif 'already exists' in error_msg.lower():
            return {
                'success': False,
                'error': 'already exists',
                'message': 'El correo ya existe en Google Workspace'
            }
        else:
            return {
                'success': False,
                'error': error_msg
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

@app.route('/api/cargos/areas', methods=['POST'])
def asignar_cargo_a_area():
    try:
        data = request.get_json()
        cargo_base_id = data.get('cargo_base_id')
        area_id = data.get('area_id')
        
        if not cargo_base_id or not area_id:
            return jsonify({'error': 'cargo_base_id y area_id son requeridos'}), 400
            
        # Verificar si ya existe la relación
        existente = CargoArea.query.filter_by(
            cargo_base_id=cargo_base_id,
            area_id=area_id
        ).first()
        
        if existente:
            return jsonify({'error': 'Esta relación ya existe'}), 400
            
        nuevo_cargo_area = CargoArea(
            cargo_base_id=cargo_base_id,
            area_id=area_id
        )
        
        db.session.add(nuevo_cargo_area)
        db.session.commit()
        
        return jsonify({
            'id': nuevo_cargo_area.id,
            'cargo_base': nuevo_cargo_area.cargo_base.nombre,
            'area': nuevo_cargo_area.area.nombre
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/cargos/<int:cargo_area_id>/jerarquia')
def get_hierarchy_for_cargo(cargo_area_id):
    try:
        cargo_area = CargoArea.query.options(
            joinedload(CargoArea.area)
            .joinedload(Area.departamento)
            .joinedload(Departamento.gerencia)
        ).get(cargo_area_id)
        
        if not cargo_area:
            return jsonify({'error': 'Cargo no encontrado'}), 404
            
        return jsonify({
            'gerencia': {
                'id': cargo_area.area.departamento.gerencia.id,
                'nombre': cargo_area.area.departamento.gerencia.nombre
            },
            'departamento': {
                'id': cargo_area.area.departamento.id,
                'nombre': cargo_area.area.departamento.nombre
            },
            'area': {
                'id': cargo_area.area.id,
                'nombre': cargo_area.area.nombre
            },
            'cargo': {
                'id': cargo_area.id,
                'nombre': cargo_area.cargo_base.nombre
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/migrar-sedes-gerencias', methods=['POST'])
def migrar_sedes_gerencias():
    try:
        # Asignar sede por defecto a todas las gerencias
        sede_por_defecto = Sede.query.filter_by(nombre='Valencia').first()
        if not sede_por_defecto:
            sede_por_defecto = Sede(nombre='Valencia', codigo='VAL')
            db.session.add(sede_por_defecto)
            db.session.commit()

        # Actualizar todas las gerencias
        Gerencia.query.update({Gerencia.sede_id: sede_por_defecto.id})
        db.session.commit()

        return jsonify({

            'message': 'Migración completada exitosamente',
            'gerencias_actualizadas': Gerencia.query.count()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/asignar-cargo', methods=['POST'])
def asignar_cargo_multiple():
    try:
        data = request.get_json()
        cargo_base_id = data['cargo_base_id']
        areas = data['areas']

        nuevos = []
        for area_id in areas:
            # Verificar si ya existe
            existente = CargoArea.query.filter_by(
                cargo_base_id=cargo_base_id,
                area_id=area_id
            ).first()
            
            if not existente:
                nuevo = CargoArea(
                    cargo_base_id=cargo_base_id,
                    area_id=area_id
                )
                db.session.add(nuevo)
                nuevos.append(nuevo)
        
        db.session.commit()
        return jsonify({
            'asignaciones_creadas': len(nuevos),
            'cargos': [{'id': c.id, 'area_id': c.area_id} for c in nuevos]
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-ad-user/<username>', methods=['GET'])
def verify_ad_user(username):
    try:
        print(f"Verificando usuario AD: {username}")
        
        # Configurar el servidor y la conexión
        server = Server('192.168.141.39', get_info=ALL)
        conn = Connection(server, user='sura\\dfalfan', password='Dief490606', auto_bind=True)
        
        # Buscar el usuario en el AD
        conn.search('dc=sura,dc=corp', 
                   f'(&(objectClass=user)(objectCategory=person)(sAMAccountName={username.replace(".sura.corp", "")}*))', 
                   attributes=['memberOf', 'lastLogon', 'userAccountControl'])
        
        if not conn.entries:
            return jsonify({
                'exists': False,
                'message': 'Usuario no encontrado en el Active Directory'
            })
        
        user = conn.entries[0]
        
        # Verificar si el usuario está activo (bit 2 = ACCOUNTDISABLE)
        is_active = not bool(user['userAccountControl'].value & 2)
        
        # Obtener grupos
        groups = []
        for group_dn in user['memberOf'].values:
            group_name = group_dn.split(',')[0].replace('CN=', '')
            groups.append(group_name)
        
        # Obtener último inicio de sesión
        last_logon = user['lastLogon'].value
        last_logon_str = last_logon.strftime('%Y-%m-%d %H:%M:%S') if last_logon else 'Nunca'
        
        return jsonify({
            'exists': True,
            'active': is_active,
            'domain': 'SURA',
            'groups': groups,
            'lastLogin': last_logon_str
        })
        
    except Exception as e:
        print(f"Error verificando usuario AD: {str(e)}")
        return jsonify({
            'error': str(e),
            'exists': False
        }), 500

@app.route('/api/ad/ous', methods=['GET'])
def get_ad_ous():
    try:
        # Configuración más segura para LDAP3
        import ssl
        tls_configuration = {'version': ssl.PROTOCOL_TLSv1_2}
        
        # Conectar al servidor LDAP usando ldap3 con configuración más segura
        server = Server('192.168.141.39', get_info=ALL, use_ssl=False, connect_timeout=5)
        
        try:
            conn = Connection(
                server,
                user='sura\\dfalfan',
                password='Dief490606',
                authentication=NTLM,
                auto_bind=True,
                read_only=True,
                auto_referrals=False,
                receive_timeout=10
            )
        except Exception as conn_error:
            print(f"Error de conexión LDAP: {str(conn_error)}")
            return jsonify({'error': f'Error de conexión: {str(conn_error)}'}), 500

        # Buscar todas las OUs
        baseDN = "DC=sura,DC=corp"
        try:
            conn.search(
                search_base=baseDN,
                search_filter='(objectClass=organizationalUnit)',
                search_scope=SUBTREE,
                attributes=['ou', 'distinguishedName']
            )
        except Exception as search_error:
            print(f"Error en búsqueda LDAP: {str(search_error)}")
            return jsonify({'error': f'Error en búsqueda: {str(search_error)}'}), 500
        
        ous = []
        for entry in conn.entries:
            if hasattr(entry, 'ou'):
                ous.append({
                    'name': str(entry.ou),
                    'path': str(entry.distinguishedName)
                })

        # Mapeo de departamentos a OUs
        dept_ou_mapping = {
            'Gestion Humana': 'OU=Gestion Humana,DC=sura,DC=corp',
            'Tecnologia': 'OU=Tecnologia,DC=sura,DC=corp',
            'Finanzas': 'OU=Finanzas,DC=sura,DC=corp',
            'Operaciones': 'OU=Operaciones,DC=sura,DC=corp'
        }

        return jsonify({
            'ous': ous,
            'mappings': dept_ou_mapping
        })

    except Exception as e:
        print(f"Error en get_ad_ous: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals() and conn.bound:
            try:
                conn.unbind()
            except:
                pass

@app.route('/api/ad/create-user', methods=['POST'])
def create_ad_user():
    try:
        data = request.get_json()
        print("Datos recibidos:", data)  # Debug para ver qué datos llegan
        
        username = data['username'].lower().strip()
        fullName = data['fullName'].strip()

        
        
        # Obtener el cargo desde la base de datos
        try:
            usuario = db.session.query(Usuario).filter_by(username=username).first()
            if usuario:
                cargo = usuario.cargo
            else:
                cargo = data.get('cargo', '').strip()
        except Exception as db_error:
            print(f"Error obteniendo cargo de la BD: {str(db_error)}")
            cargo = data.get('cargo', '').strip()

        nombres = fullName.split()
        nombre_email = nombres[-1].lower()  # último elemento (nombre)
        apellido_email = nombres[0].lower()  # primer elemento (apellido)
        email = f"{nombre_email}.{apellido_email}@sura.com.ve"
        departamento = data.get('departamento', '').strip()
        extension = data.get('extension', '').strip()
        
        # Preparar el nombre para display (solo apellido en mayúsculas inicial)
        nombres = fullName.split()
        apellido = nombres[0].capitalize()  # Primera letra mayúscula
        nombre = nombres[-1]
        display_name = f"{apellido}, {nombre} SURA.CORP"

        # Conectar al servidor LDAP
        server = Server('192.168.141.39', get_info=ALL, use_ssl=False)
        
        print(f"Intentando conectar como sura\\dfalfan...")
        conn = Connection(
            server,
            user='sura\\dfalfan',
            password='Dief490606',
            authentication=NTLM,
            auto_bind=True
        )

        # Verificar la conexión
        if not conn.bound:
            return jsonify({'error': 'No se pudo conectar al servidor AD'}), 500

        print("Conexión exitosa, verificando permisos...")
        
        # Verificar permisos listando el contenedor Users
        conn.search(
            search_base='CN=Users,DC=sura,DC=corp',
            search_filter='(objectClass=*)',
            search_scope='BASE',
            attributes=['*']
        )
        
        if not conn.entries:
            return jsonify({'error': 'No se puede acceder al contenedor Users'}), 500

        print("Acceso al contenedor Users verificado...")

        # Verificar si el usuario ya existe
        conn.search(
            search_base='DC=sura,DC=corp',
            search_filter=f'(&(objectClass=user)(sAMAccountName={username}))',
            attributes=['distinguishedName']
        )
        
        if len(conn.entries) > 0:
            return jsonify({'error': 'El usuario ya existe en Active Directory'}), 400

        # Preparar el DN
        dn = f"CN={fullName},CN=Users,DC=sura,DC=corp"

       # Atributos iniciales
        attrs = {
            'objectClass': ['top', 'person', 'organizationalPerson', 'user'],
            'cn': fullName,
            'sAMAccountName': username,
            'userPrincipalName': f"{username}@sura.corp",
            'givenName': nombre,
            'sn': apellido,
            'displayName': display_name,
            'userAccountControl': 514,
            'company': 'Sura de Venezuela',
            'mail': email,  # Usando el nuevo formato de correo
            'wWWHomePage': 'www.sura.com.ve',
            'telephoneNumber': '0241-3001900 / Ext. 1900'
        }

        print("Cargo obtenido:", cargo)  # Debug para ver el cargo

        # Agregar atributos opcionales solo si tienen valor no vacío
        if cargo and cargo.strip():
            print("Agregando cargo:", cargo)  # Debug
            attrs['title'] = cargo
            attrs['description'] = cargo

        if departamento and departamento.strip():
            attrs['department'] = departamento
            attrs['physicalDeliveryOfficeName'] = departamento

        if extension and extension.strip():
            attrs['telephoneNumber'] = extension

        print(f"Intentando crear usuario con DN: {dn}")
        print(f"Atributos: {attrs}")
        
        # Crear el usuario
        result = conn.add(dn, attributes=attrs)
        
        if not result:
            error_msg = conn.result.get('message', 'Unknown error')
            desc = conn.result.get('description', 'No description')
            print(f"Error al crear usuario: {error_msg} - {desc}")
            return jsonify({
                'error': 'Error al crear el usuario',
                'details': f"{error_msg} - {desc}",
                'dn_used': dn,
                'result': conn.result,
                'attributes_used': attrs,
                'bound_as': conn.user
            }), 500

        print("Usuario creado exitosamente, estableciendo contraseña...")

        # Establecer contraseña y habilitar cuenta
        temp_password = 'sura2025*'
        try:
            # Establecer contraseña
            conn.extend.microsoft.modify_password(dn, temp_password)
            
            # Habilitar cuenta y configurar que no expire
            changes = {
                'userAccountControl': [(ldap3.MODIFY_REPLACE, [512])]  # Solo cuenta normal habilitada
            }
            
            if not conn.modify(dn, changes):
                print(f"Error habilitando cuenta: {conn.result}")
                # No fallar si no se puede habilitar, solo registrar el error
            
            # Intentar configurar que la contraseña no expire
            changes = {
                'userAccountControl': [(ldap3.MODIFY_REPLACE, [66048])]
            }
            
            if not conn.modify(dn, changes):
                print(f"Error configurando contraseña que no expire: {conn.result}")
                # No fallar si no se puede configurar, solo registrar el error
            
        except Exception as pwd_error:
            print(f"Error estableciendo contraseña: {str(pwd_error)}")
            try:
                conn.delete(dn)
                print("Usuario eliminado después del error")
            except Exception as del_error:
                print(f"Error eliminando usuario: {str(del_error)}")
            return jsonify({
                'error': f'Error estableciendo contraseña: {str(pwd_error)}',
                'details': str(pwd_error)
            }), 500

        print("Usuario creado y configurado exitosamente")
        return jsonify({
            'message': 'Usuario creado exitosamente',
            'username': username,
            'dn': dn,
            'temp_password': temp_password,
            'status': 'created_disabled',
            'attributes': {
                'cargo': cargo if cargo else 'No especificado',
                'departamento': departamento if departamento else 'No especificado',
                'extension': extension if extension else 'No especificada',
                'email': email,
                'displayName': display_name
            }
        })

    except Exception as e:
        print(f"Error creando usuario AD: {str(e)}")
        return jsonify({
            'error': str(e),
            'type': type(e).__name__,
            'details': getattr(e, 'description', str(e))
        }), 500
    finally:
        if 'conn' in locals() and conn.bound:
            conn.unbind()

def invertir_nombre(nombre):
    words = nombre.split()
    if len(words) == 2:
        return words[1] + " " + words[0]
    else:
        particles = {"de", "del", "la", "las", "los"}
        # Si el primer elemento es una partícula, se asume que el apellido son las dos primeras palabras
        if words[0].lower() in particles:
            surname = " ".join(words[:2])
            given = " ".join(words[2:])
        # Si la segunda palabra es una partícula, se asume que el apellido son las tres primeras palabras
        elif len(words) >= 3 and words[1].lower() in particles:
            surname = " ".join(words[:3])
            given = " ".join(words[3:])
        else:
            surname = words[0]
            given = " ".join(words[1:])
        if given == "":
            return surname
        return given + " " + surname

@app.route('/api/generar-firma', methods=['POST'])
def generar_firma():
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        cargo = data.get('cargo')
        extension = data.get('extension')
        numero_celular = data.get('numero_celular')
        
        if not all([nombre, cargo]):
            return jsonify({'error': 'Nombre y cargo son requeridos'}), 400
            
        # Invertir el orden asumiendo que el primer elemento es el apellido y el resto conforma el nombre
        nombre = invertir_nombre(nombre)
        
        # Abrir la imagen template
        img = Image.open('static/firmatemplate.PNG')
        draw = ImageDraw.Draw(img)
        
        # Cargar la fuente Montserrat
        nombre_font = ImageFont.truetype('static/Montserrat-Medium.otf', 43)
        cargo_font = ImageFont.truetype('static/Montserrat-Regular.ttf', 30)
        extension_font = ImageFont.truetype('static/Montserrat-Regular.ttf', 30)
        
        # Dibujar el texto
        draw.text((45, 55),nombre, font=nombre_font, fill='rgb(35, 48, 146)')
        draw.text((45, 105), cargo, font=cargo_font, fill='black')
        if extension:
            draw.text((470, 235), extension, font=extension_font, fill='black')
        if numero_celular:
            y_cel = 235 + (35 if extension else 0)
            draw.text((175, y_cel), numero_celular, font=extension_font, fill='black')
        
        # Convertir la imagen a bytes
        img_byte_array = io.BytesIO()
        img.save(img_byte_array, format='PNG')
        img_byte_array.seek(0)
        
        return send_file(
            img_byte_array,
            mimetype='image/png',
            as_attachment=True,
            download_name=f"firma_{nombre.replace(' ', '_').lower()}.png"
        )
        
    except Exception as e:
        print(f"Error generando firma: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/impresoras/check-connection/<ip>')
def check_printer_connection(ip):
    try:
        # Usar subprocess en lugar de os.system para mejor control
        import subprocess
        
        # Ajustar el comando ping según el sistema operativo
        if os.name == 'nt':  # Windows
            ping_cmd = ['ping', '-n', '1', '-w', '1000', ip]
        else:  # Linux/Unix
            ping_cmd = ['ping', '-c', '1', '-W', '1', ip]
            
        # Ejecutar el ping y capturar la salida
        result = subprocess.run(ping_cmd, 
                              stdout=subprocess.PIPE, 
                              stderr=subprocess.PIPE,
                              timeout=2)  # Timeout de 2 segundos
        
        is_connected = result.returncode == 0
        
        # Si responde al ping, intentar SNMP
        if is_connected:
            try:
                errorIndication, errorStatus, errorIndex, varBinds = next(
                    getCmd(SnmpEngine(),
                          CommunityData('public', mpModel=0),
                          UdpTransportTarget((ip, 161), timeout=1, retries=0),
                          ContextData(),
                          ObjectType(ObjectIdentity('1.3.6.1.2.1.1.5.0')))  # sysName
                )
                
                if errorIndication or errorStatus:
                    return jsonify({
                        'isConnected': True,
                        'status': 'Responde a ping',
                        'details': 'No responde a SNMP'
                    })
                    
                return jsonify({
                    'isConnected': True,
                    'status': 'Conectada',
                    'details': 'Responde a ping y SNMP'
                })
                
            except Exception as snmp_error:
                return jsonify({
                    'isConnected': True,
                    'status': 'Responde a ping',
                    'details': f'Error SNMP: {str(snmp_error)}'
                })
        
        return jsonify({
            'isConnected': False,
            'status': 'No responde',
            'details': 'No responde a ping'
        })
        
    except subprocess.TimeoutExpired:
        return jsonify({
            'isConnected': False,
            'status': 'Timeout',
            'details': 'La solicitud excedió el tiempo de espera'
        })
    except Exception as e:
        return jsonify({
            'isConnected': False,
            'status': 'Error',
            'details': str(e)
        })

@app.route('/api/generar-bienvenida', methods=['POST'])
def generar_bienvenida():
    try:
        data = request.get_json()
        
        # Abrir la imagen template
        img = Image.open('static/templatebienvenida.png')
        draw = ImageDraw.Draw(img)
        
        # Cargar las fuentes
        font = ImageFont.truetype('static/Montserrat-Regular.ttf', 25)
        title_font = ImageFont.truetype('static/Montserrat-Bold.ttf', 28)
        bold_font = ImageFont.truetype('static/Montserrat-Bold.ttf', 25)  # Para el nombre en negrita
        
        # Obtener solo el primer nombre
        nombre_completo = data.get('nombre_empleado', '').split()
        primer_nombre = nombre_completo[-1] if nombre_completo else ''  # Tomamos el último elemento porque el formato es "APELLIDO NOMBRE"
        
        # Dibujar el texto de bienvenida en partes para poder poner el nombre en negrita
        texto_inicial = "Buen día estimado(a) "
        draw.text((150, 190), texto_inicial, font=font, fill='black')
        nombre_width = font.getlength(texto_inicial)  # Usar getlength en lugar de getsize
        draw.text((150 + nombre_width, 190), primer_nombre, font=bold_font, fill='black')
        nombre_bold_width = bold_font.getlength(primer_nombre)  # Usar getlength en lugar de getsize
        draw.text((150 + nombre_width + nombre_bold_width, 190), ", te damos la bienvenida a la familia de SURA de Venezuela,", font=font, fill='black')
        
        # Dibujar el texto de instrucciones
        instrucciones_text = "a continuación se presentan tus datos de usuario y claves de acceso a la red de SURA para iniciar"
        draw.text((150, 220), instrucciones_text, font=font, fill='black')
        aplicativos_text = "sesión en los diferentes aplicativos:"
        draw.text((150, 250), aplicativos_text, font=font, fill='black')

        # Coordenadas base para las dos columnas
        y_start = 300
        y_spacing = 30
        title_spacing = 50  # Espacio extra después de títulos
        
        # Coordenadas X para ambas columnas
        col1_x_label = 150
        col1_x_value = 350
        col2_x_label = 800
        col2_x_value = 1000
        
        # Inicializar posiciones Y para ambas columnas
        col1_y = y_start
        col2_y = y_start
        
        # Contador para cambiar de columna
        section_count = 0
        
        # Función helper para dibujar una sección
        def draw_section(title, fields, x_label, x_value, current_y):
            # Dibujar título
            draw.text((x_label, current_y), title, font=title_font, fill='black')
            current_y += title_spacing
            
            # Dibujar campos
            for label, value in fields:
                draw.text((x_label, current_y), label, font=font, fill='black')
                draw.text((x_value, current_y), value, font=font, fill='black')
                current_y += y_spacing
            
            return current_y + y_spacing  # Retornar nueva posición Y
        
        # Procesar secciones habilitadas
        sections = []
        
        if data['windows']['enabled']:
            sections.append(('Acceso Windows', [
                ('Usuario:', data['windows']['username']),
                ('Contraseña:', data['windows']['password'])
            ]))
            
        if data['email']['enabled']:
            sections.append(('Correo Electrónico', [
                ('Correo:', data['email']['username']),
                ('Contraseña:', data['email']['password'])
            ]))
            
        if data['profit']['enabled']:
            sections.append(('Sistema Profit', [
                ('Usuario:', data['profit']['username']),
                ('Contraseña:', data['profit']['password'])
            ]))
            
        if data['fuerzaMovil']['enabled']:
            sections.append(('Fuerza Móvil', [
                ('ID:', data['fuerzaMovil']['id']),
                ('Usuario:', data['fuerzaMovil']['username']),
                ('Contraseña:', data['fuerzaMovil']['password'])
            ]))
            
        if data['dispositivoMovil']['enabled']:
            sections.append(('Dispositivo Móvil', [
                ('Patrón:', 'Formato en L')
            ]))
            
        if data['pinImpresion']['enabled']:
            sections.append(('Impresión', [
                ('PIN:', data['pinImpresion']['pin'])
            ]))
        
        # Dibujar secciones en columnas
        for i, (title, fields) in enumerate(sections):
            if i < 3:  # Primera columna
                col1_y = draw_section(title, fields, col1_x_label, col1_x_value, col1_y)
            else:      # Segunda columna
                col2_y = draw_section(title, fields, col2_x_label, col2_x_value, col2_y)
        
        # Convertir la imagen a bytes
        img_byte_array = io.BytesIO()
        img.save(img_byte_array, format='PNG')
        img_byte_array.seek(0)
        
        return send_file(
            img_byte_array,
            mimetype='image/png',
            as_attachment=True,
            download_name=f"bienvenida.png"
        )
        
    except Exception as e:
        print(f"Error generando imagen de bienvenida: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/activos/hoja-vigilancia')
def generar_hoja_vigilancia():
    try:
        # Obtener todas las laptops asignadas y ordenar por nombre de empleado
        laptops = db.session.query(
            Asset, Empleado
        ).join(
            Empleado, Asset.empleado_id == Empleado.id
        ).filter(
            Asset.tipo.ilike('LAPTOP'),
            Asset.estado.ilike('ASIGNADO')
        ).order_by(Empleado.nombre_completo).all()

        if not laptops:
            return jsonify({'error': 'No hay laptops asignadas'}), 404

        # Crear el PDF
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=landscape(letter))
        width, height = landscape(letter)

        # Registrar la fuente Montserrat
        pdfmetrics.registerFont(TTFont('Montserrat', 'static/Montserrat-Regular.ttf'))
        pdfmetrics.registerFont(TTFont('Montserrat-Bold', 'static/Montserrat-Bold.ttf'))

        # Añadir logo
        p.drawImage('static/logo_sura.png', 50, height - 80, width=100, height=40)

        # Título
        p.setFont("Montserrat-Bold", 16)
        titulo = "Control de Entrada y Salida de Laptops"
        p.drawString((width - p.stringWidth(titulo, "Montserrat-Bold", 16)) / 2, height - 60, titulo)

        # Fecha
        p.setFont("Montserrat", 10)
        p.drawString(width - 150, height - 40, "Fecha: _________________")

        # Configuración de la tabla
        margin_left = 20  # Reducido de 30 a 20
        col_widths = [70, 45, 35, 35]  # Reducidos aún más los anchos de las columnas fijas
        day_width = 110  # Aumentado de 90 a 110 para dar más espacio a las firmas

        # Calcular posiciones X para las columnas
        x_positions = [margin_left]
        for width in col_widths:
            x_positions.append(x_positions[-1] + width)
        
        # Agregar posiciones X para los días
        for _ in range(5):  # 5 días
            x_positions.append(x_positions[-1] + day_width)

        # Altura de las filas
        row_height = 25  # Aumentada de 20 a 25 para dar más espacio vertical para firmar
        header_height = 25  # Altura para los encabezados (incluye entrada/salida)

        # Posición inicial Y
        y_start = height - 100
        y = y_start

        def draw_table_header(y_pos):
            # Encabezados principales
            headers = ['Nombre', 'Cédula', 'Marca', 'Activo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
            
            # Dibujar línea superior de la tabla
            p.line(margin_left, y_pos, x_positions[-1], y_pos)
            
            # Dibujar encabezados principales
            p.setFont("Montserrat-Bold", 6)
            for i, header in enumerate(headers):
                # Centrar el texto en su columna
                if i < 4:  # Columnas fijas
                    x = x_positions[i] + 2
                else:  # Días de la semana
                    x = x_positions[i] + (day_width - p.stringWidth(header, "Montserrat-Bold", 6)) / 2
                p.drawString(x, y_pos - 10, header)

            # Dibujar subencabezados para los días
            y_sub = y_pos - 18
            for i in range(5):  # 5 días
                base_x = x_positions[4 + i]
                # Entrada
                p.drawString(base_x + 10, y_sub, "Entrada")
                # Salida
                p.drawString(base_x + (day_width/2) + 10, y_sub, "Salida")

            # Línea después de los encabezados principales
            p.line(margin_left, y_pos - 12, x_positions[-1], y_pos - 12)
            # Línea después de los subencabezados
            p.line(margin_left, y_pos - header_height, x_positions[-1], y_pos - header_height)

            # Dibujar líneas verticales
            for x in x_positions:
                p.line(x, y_pos, x, y_pos - header_height)

            return y_pos - header_height

        # Dibujar encabezado inicial
        y = draw_table_header(y)

        # Dibujar datos
        p.setFont("Montserrat", 6)
        for laptop, empleado in laptops:
            # Verificar si necesitamos nueva página
            if y < 50:
                p.showPage()
                y = y_start
                y = draw_table_header(y)

            # Datos principales (eliminado Serial)
            p.drawString(x_positions[0] + 2, y - 10, empleado.nombre_completo or '')
            p.drawString(x_positions[1] + 2, y - 10, empleado.cedula or '')
            p.drawString(x_positions[2] + 2, y - 10, laptop.marca or '')
            p.drawString(x_positions[3] + 2, y - 10, laptop.activo_fijo or '')

            # Dibujar líneas para firmas (5 días)
            for i in range(5):
                base_x = x_positions[4 + i]  # Ajustado por eliminación de Serial
                mid_x = base_x + day_width/2
                # Línea vertical divisoria entre entrada/salida
                p.line(mid_x, y, mid_x, y - row_height)

            # Dibujar líneas verticales
            for x in x_positions:
                p.line(x, y, x, y - row_height)

            # Línea horizontal inferior de la fila
            p.line(margin_left, y - row_height, x_positions[-1], y - row_height)

            y -= row_height

        p.showPage()
        p.save()
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name='hoja_vigilancia.pdf',
            mimetype='application/pdf'
        )

    except Exception as e:
        print(f"Error generando hoja de vigilancia: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/smartphones/<int:smartphone_id>/cambiar-estado', methods=['POST'])
def cambiar_estado_smartphone(smartphone_id):
    try:
        data = request.get_json()
        estado = data.get('estado')
        
        if not estado:
            return jsonify({"error": "El estado es requerido"}), 400
            
        smartphone = Smartphone.query.get(smartphone_id)
        if not smartphone:
            return jsonify({"error": "Smartphone no encontrado"}), 404

        # Si el smartphone está asignado, desasignarlo primero
        if smartphone.empleado_id:
            empleado = Empleado.query.get(smartphone.empleado_id)
            if empleado:
                smartphone.empleado_id = None
                smartphone.fecha_asignacion = None

        smartphone.estado = estado
        smartphone.updated_at = datetime.utcnow()
        
        # Registrar el log
        descripcion = f"Se cambió el estado del smartphone {smartphone.marca} {smartphone.modelo} (ID: {smartphone.id}) a {estado}"
        registrar_log('smartphones', 'cambio_estado', descripcion, smartphone_id)
        
        db.session.commit()
        
        return jsonify({
            "message": "Estado del smartphone actualizado exitosamente",
            "nuevo_estado": estado
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/smartphones/<int:smartphone_id>/desincorporar', methods=['POST'])
def desincorporar_smartphone(smartphone_id):
    try:
        smartphone = Smartphone.query.get(smartphone_id)
        if not smartphone:
            return jsonify({"error": "Smartphone no encontrado"}), 404

        # Si el smartphone está asignado, desasignarlo primero
        if smartphone.empleado_id:
            empleado = Empleado.query.get(smartphone.empleado_id)
            if empleado:
                smartphone.empleado_id = None
                smartphone.fecha_asignacion = None

        # Guardar información para el log antes de eliminar
        descripcion = f"Se desincorporó el smartphone {smartphone.marca} {smartphone.modelo} (ID: {smartphone.id})"
        
        # Registrar el log antes de eliminar el smartphone
        registrar_log('smartphones', 'desincorporación', descripcion, smartphone_id)
        
        # Eliminar el smartphone
        db.session.delete(smartphone)
        db.session.commit()
        
        return jsonify({
            "message": "Smartphone desincorporado exitosamente"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/mantenimientos', methods=['GET', 'POST'])
def mantenimientos():
    if request.method == 'GET':
        try:
            mantenimientos = db.session.query(
                Mantenimiento, Asset
            ).join(
                Asset, Asset.id == Mantenimiento.activo_id
            ).order_by(
                Mantenimiento.created_at.desc()
            ).all()
            
            return jsonify([{
                'id': m.id,
                'activo': {
                    'id': a.id,
                    'tipo': a.tipo,
                    'marca': a.marca,
                    'modelo': a.modelo,
                    'serial': a.serial
                },
                'fecha_inicio': m.fecha_inicio.isoformat() if m.fecha_inicio else None,
                'fecha_fin': m.fecha_fin.isoformat() if m.fecha_fin else None,
                'estado': m.estado,
                'descripcion': m.descripcion,
                'diagnostico': m.diagnostico,
                'solucion': m.solucion,
                'created_at': m.created_at.isoformat() if m.created_at else None,
                'updated_at': m.updated_at.isoformat() if m.updated_at else None
            } for m, a in mantenimientos])
        except Exception as e:
            print(f"Error en GET mantenimientos: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # Validar campos requeridos
            if not data.get('activo_id'):
                return jsonify({'error': 'activo_id es requerido'}), 400
            
            # Crear nuevo mantenimiento
            nuevo_mantenimiento = Mantenimiento(
                activo_id=data['activo_id'],
                descripcion=data.get('descripcion'),
                diagnostico=data.get('diagnostico'),
                solucion=data.get('solucion'),
                estado=data.get('estado', 'En Progreso'),
                fecha_inicio=datetime.utcnow(),
                fecha_fin=datetime.fromisoformat(data['fecha_fin'].replace('Z', '+00:00')) if data.get('fecha_fin') else None
            )
            
            db.session.add(nuevo_mantenimiento)
            db.session.commit()
            
            return jsonify({
                'message': 'Mantenimiento creado exitosamente',
                'id': nuevo_mantenimiento.id
            }), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"Error en POST mantenimientos: {str(e)}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/mantenimientos/<int:mantenimiento_id>', methods=['GET', 'PATCH', 'DELETE'])
def mantenimiento(mantenimiento_id):
    try:
        mantenimiento = Mantenimiento.query.get(mantenimiento_id)
        if not mantenimiento:
            return jsonify({'error': 'Mantenimiento no encontrado'}), 404
            
        if request.method == 'GET':
            return jsonify({
                'id': mantenimiento.id,
                'activo_id': mantenimiento.activo_id,
                'fecha_inicio': mantenimiento.fecha_inicio.isoformat() if mantenimiento.fecha_inicio else None,
                'fecha_fin': mantenimiento.fecha_fin.isoformat() if mantenimiento.fecha_fin else None,
                'estado': mantenimiento.estado,
                'descripcion': mantenimiento.descripcion,
                'diagnostico': mantenimiento.diagnostico,
                'solucion': mantenimiento.solucion
            })
            
        elif request.method == 'PATCH':
            data = request.get_json()
            
            if 'estado' in data:
                mantenimiento.estado = data['estado']
            if 'descripcion' in data:
                mantenimiento.descripcion = data['descripcion']
            if 'diagnostico' in data:
                mantenimiento.diagnostico = data['diagnostico']
            if 'solucion' in data:
                mantenimiento.solucion = data['solucion']
            if 'fecha_fin' in data:
                mantenimiento.fecha_fin = datetime.fromisoformat(data['fecha_fin'].replace('Z', '+00:00'))
                
            mantenimiento.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({'message': 'Mantenimiento actualizado exitosamente'})
            
        elif request.method == 'DELETE':
            db.session.delete(mantenimiento)
            db.session.commit()
            return jsonify({'message': 'Mantenimiento eliminado exitosamente'})
            
    except Exception as e:
        db.session.rollback()
        print(f"Error en mantenimiento {request.method}: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)