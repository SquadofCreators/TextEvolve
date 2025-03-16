from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
from bson import ObjectId
from db_ext import mongo  # Import shared mongo instance

user_bp = Blueprint('user', __name__)

# GET ALL USERS
@user_bp.route('/', methods=['GET'])
def get_all_users():
    users_cursor = mongo.db.users.find()
    user_list = []
    for user in users_cursor:
        user_list.append({
            'id': str(user['_id']),
            'name': user.get('name'),
            'email': user.get('email'),
            'role': user.get('role'),
            'bio': user.get('bio'),
            'position': user.get('position'),
            'company': user.get('company'),
            'location': user.get('location'),
            'avatar': user.get('avatar'),
            'lastLogin': user.get('lastLogin'),
            'lastLoginIP': user.get('lastLoginIP'),
            'lastLoginLocation': user.get('lastLoginLocation')
        })
    return jsonify({'success': True, 'users': user_list}), 200

# GET USER BY ID
@user_bp.route('/<id>', methods=['GET'])
def get_user_by_id(id):
    try:
        user = mongo.db.users.find_one({'_id': ObjectId(id)})
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid user ID'}), 400

    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

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
        'lastLogin': user.get('lastLogin'),
        'lastLoginIP': user.get('lastLoginIP'),
        'lastLoginLocation': user.get('lastLoginLocation')
    }
    return jsonify({'success': True, 'user': user_data}), 200

# UPDATE USER
@user_bp.route('/<id>', methods=['PUT'])
def update_user(id):
    data = request.get_json()
    try:
        user = mongo.db.users.find_one({'_id': ObjectId(id)})
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid user ID'}), 400

    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    update_fields = {
        'name': data.get('name'),
        'email': data.get('email'),
        'bio': data.get('bio'),
        'position': data.get('position'),
        'company': data.get('company'),
        'location': data.get('location'),
        'avatar': data.get('avatar')
    }

    if data.get('password'):
        update_fields['password'] = generate_password_hash(data['password'])

    update_fields = {k: v for k, v in update_fields.items() if v is not None}

    mongo.db.users.update_one({'_id': ObjectId(id)}, {'$set': update_fields})

    updated_user = mongo.db.users.find_one({'_id': ObjectId(id)})
    updated_user_data = {
        'id': str(updated_user['_id']),
        'name': updated_user.get('name'),
        'email': updated_user.get('email'),
        'role': updated_user.get('role'),
        'bio': updated_user.get('bio'),
        'position': updated_user.get('position'),
        'company': updated_user.get('company'),
        'location': updated_user.get('location'),
        'avatar': updated_user.get('avatar'),
        'lastLogin': updated_user.get('lastLogin'),
        'lastLoginIP': updated_user.get('lastLoginIP'),
        'lastLoginLocation': updated_user.get('lastLoginLocation')
    }
    return jsonify({
        'success': True,
        'message': 'User updated successfully',
        'user': updated_user_data
    }), 200

# DELETE USER
@user_bp.route('/<id>', methods=['DELETE'])
def delete_user(id):
    result = mongo.db.users.delete_one({'_id': ObjectId(id)})
    if result.deleted_count == 0:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    return jsonify({'success': True, 'message': 'User deleted successfully'}), 200


@user_bp.route('/profile', methods=['GET'])
def get_profile():
    # Assume the token or session identifies the current user.
    # For this example, we'll assume the user ID is passed as a query parameter,
    # but in a real application you'd extract this from your token or session.
    user_id = request.args.get('id')
    if not user_id:
        return jsonify({'success': False, 'error': 'User ID is required'}), 400

    try:
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid user ID'}), 400

    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

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
        'lastLogin': user.get('lastLogin'),
        'lastLoginIP': user.get('lastLoginIP'),
        'lastLoginLocation': user.get('lastLoginLocation')
    }
    return jsonify({'success': True, 'user': user_data}), 200
