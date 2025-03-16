from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
from bson import ObjectId
from datetime import datetime
import socket
from db_ext import mongo  # Import shared mongo instance

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'success': False, 'error': 'Email and password are required'}), 400

    email = data.get('email')
    password = data.get('password')
    
    current_app.logger.info(f"Login attempt for user: {email}")

    # Retrieve user from MongoDB using the shared mongo instance
    user = mongo.db.users.find_one({'email': email})
    
    if not user:
        current_app.logger.info(f"User with email {email} not found.")
        return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

    if not check_password_hash(user.get('password'), password):
        current_app.logger.info(f"Invalid password for user {email}.")
        return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

    # Update last login details
    last_login_ip = request.remote_addr or socket.gethostbyname(socket.gethostname())
    last_login_location = "Unknown"  # Optionally integrate an IP lookup service

    mongo.db.users.update_one(
        {'_id': user['_id']},
        {'$set': {
            'lastLogin': datetime.utcnow().isoformat(),
            'lastLoginIP': last_login_ip,
            'lastLoginLocation': last_login_location
        }}
    )

    user_data = {
        'id': str(user['_id']),
        'name': user.get('name'),
        'email': user.get('email'),
        'role': user.get('role'),
        'bio': user.get('bio'),
        'position': user.get('position'),
        'company': user.get('company'),
        'location': user.get('location'),
        'avatar': user.get('avatar'),
        'lastLogin': datetime.utcnow().isoformat(),
        'lastLoginIP': last_login_ip,
        'lastLoginLocation': last_login_location
    }

    return jsonify({
        'success': True,
        'message': 'Login successful',
        'user': user_data
    }), 200
