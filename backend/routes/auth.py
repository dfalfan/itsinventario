from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import jwt
from functools import wraps
from models import db, Usuario

auth_bp = Blueprint('auth', __name__)

def create_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=8)
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token inválido'}), 401

        if not token:
            return jsonify({'message': 'Token no proporcionado'}), 401

        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = Usuario.query.get(data['user_id'])
            if not current_user or not current_user.is_active:
                return jsonify({'message': 'Usuario no válido'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        print("\n=== INICIO DE INTENTO DE LOGIN ===")
        print(f"Headers recibidos: {dict(request.headers)}")
        
        data = request.get_json()
        print(f"Datos recibidos: {data}")
        
        if not data or not data.get('username') or not data.get('password'):
            print("Error: Datos incompletos")
            return jsonify({'message': 'Datos incompletos'}), 400

        print(f"Buscando usuario: {data.get('username')}")
        user = Usuario.query.filter_by(username=data['username']).first()
        
        if not user:
            print(f"Usuario {data.get('username')} no encontrado en la base de datos")
            return jsonify({'message': 'Usuario o contraseña incorrectos'}), 401

        print("Verificando contraseña...")
        if not user.check_password(data['password']):
            print("Contraseña incorrecta")
            return jsonify({'message': 'Usuario o contraseña incorrectos'}), 401

        if not user.is_active:
            print("Usuario inactivo")
            return jsonify({'message': 'Usuario inactivo'}), 401

        print("Actualizando último login...")
        user.last_login = datetime.utcnow()
        db.session.commit()

        print("Generando token...")
        token = create_token(user.id)
        
        response_data = {
            'token': token,
            'user': user.to_dict()
        }
        print(f"Enviando respuesta exitosa: {response_data}")
        
        return jsonify(response_data)
    except Exception as e:
        print(f"ERROR EN LOGIN: {str(e)}")
        import traceback
        print(f"Traceback completo:\n{traceback.format_exc()}")
        return jsonify({'message': f'Error en el servidor: {str(e)}'}), 500

@auth_bp.route('/verify', methods=['GET'])
@token_required
def verify_token(current_user):
    return jsonify({
        'message': 'Token válido',
        'user': current_user.to_dict()
    }) 