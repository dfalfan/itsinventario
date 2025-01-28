from flask import Flask, jsonify, request, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from sqlalchemy.orm import joinedload
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch
import os
import io

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

    sede = db.relationship('Sede', lazy='joined')
    gerencia = db.relationship('Gerencia', lazy='joined')
    departamento = db.relationship('Departamento', lazy='joined')
    area = db.relationship('Area', lazy='joined')
    cargo = db.relationship('Cargo', lazy='joined')

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
            'asset_name': assets.get(e.equipo_asignado, {}).get('nombre')
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
        return jsonify({'error': str(e)}), 500

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
        
        # Guardar solo el ID del activo
        empleado.equipo_asignado = str(asset_id)
        
        db.session.commit()
        
        return jsonify({
            "message": "Activo asignado exitosamente",
            "empleado": empleado.nombre_completo,
            "activo": asset.nombre_equipo
        })
        
    except Exception as e:
        db.session.rollback()
        print("Error en asignar_activo:", str(e))
        return jsonify({'error': str(e)}), 500

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
            'equipo_asignado': empleado.equipo_asignado
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

        # Crear un buffer para el PDF
        buffer = io.BytesIO()
        
        # Crear el PDF
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Añadir logo
        p.drawImage('static/logo_sura.png', 50, 700, width=100, height=50)
        
        # Fecha actual
        fecha_actual = datetime.now().strftime("%d/%m/%Y")
        p.drawString(400, 700, f"Valencia, {fecha_actual}")
        
        # Título
        p.setFont("Helvetica-Bold", 16)
        p.drawString(200, 650, "Constancia de Entrega")
        
        # Contenido
        p.setFont("Helvetica", 12)
        texto = f"""
        Yo, {empleado.nombre_completo}, titular de la C.I. {empleado.ficha}, actualmente
        desempeñándome en el cargo de {empleado.cargo.nombre if empleado.cargo else ''}, he
        recibido por parte del Departamento de I.T.S. de la Empresa SURA DE VENEZUELA, C.A.
        una portátil Marca {asset.marca} Modelo {asset.modelo} cuyo Serial es {asset.serial}, junto con su cable
        de alimentación, con el objetivo de ser utilizado para fines estrictamente laborales, con
        suma precaución.
        
        Hago constar que entiendo plenamente lo relacionado a los aspectos antes señalados
        y me comprometo a cumplir con las indicaciones a cabalidad en el ejercicio de mis
        labores en la empresa SURA DE VENEZUELA, C.A.
        """
        
        # Escribir el texto con formato
        y = 600
        for linea in texto.split('\n'):
            if linea.strip():
                # Envolver el texto si es muy largo
                palabras = linea.split()
                linea_actual = ''
                for palabra in palabras:
                    if len(linea_actual + ' ' + palabra) < 80:
                        linea_actual += ' ' + palabra
                    else:
                        p.drawString(50, y, linea_actual.strip())
                        y -= 20
                        linea_actual = palabra
                if linea_actual:
                    p.drawString(50, y, linea_actual.strip())
                y -= 30
        
        # Espacio para firma
        p.line(100, 200, 300, 200)
        p.drawString(180, 180, "Firma")
        
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)