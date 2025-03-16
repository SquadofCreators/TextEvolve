import os
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from bson import ObjectId
from utils.ocr import run_ocr_model
from db_ext import mongo  # Import shared instance

document_bp = Blueprint('document', __name__)

@document_bp.route('/upload', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    # Run OCR or ML inference
    ocr_result = run_ocr_model(file_path)

    document_data = {
        "filename": filename,
        "file_path": file_path,
        "ocr_text": ocr_result,
        "upload_date": datetime.utcnow()
    }
    result = mongo.db.documents.insert_one(document_data)
    document_id = str(result.inserted_id)

    return jsonify({
        'success': True,
        'message': 'File uploaded and processed successfully',
        'document_id': document_id,
        'ocr_text': ocr_result
    }), 200

@document_bp.route('/<doc_id>', methods=['GET'])
def get_document(doc_id):
    try:
        document = mongo.db.documents.find_one({"_id": ObjectId(doc_id)})
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid document ID'}), 400

    if not document:
        return jsonify({'success': False, 'error': 'Document not found'}), 404

    return jsonify({
        'success': True,
        'id': str(document['_id']),
        'filename': document['filename'],
        'ocr_text': document.get('ocr_text', ''),
        'upload_date': document['upload_date'].isoformat()
    }), 200

@document_bp.route('/download/<doc_id>', methods=['GET'])
def download_document(doc_id):
    try:
        document = mongo.db.documents.find_one({"_id": ObjectId(doc_id)})
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid document ID'}), 400

    if not document:
        return jsonify({'success': False, 'error': 'Document not found'}), 404

    return send_from_directory(
        directory=current_app.config['UPLOAD_FOLDER'],
        path=document['filename'],  # Using 'path' as parameter
        as_attachment=True
    )
