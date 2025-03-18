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
    files = request.files.getlist('file')
    # Optional: Append files to an existing batch if batch_id is provided
    batch_id = request.form.get('batch_id')

    if not files or len(files) == 0:
        return jsonify({'success': False, 'error': 'No file provided'}), 400

    if not batch_id:
        batch_id = str(ObjectId())

    documents = []
    
    for index, file in enumerate(files):
        if file.filename == '':
            continue

        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        try:
            file.save(file_path)
        except Exception as e:
            current_app.logger.error(f"Error saving file {filename}: {e}")
            continue

        try:
            ocr_result = run_ocr_model(file_path)
        except Exception as e:
            current_app.logger.error(f"OCR failed for file {filename}: {e}")
            ocr_result = ""

        file_size = round(os.path.getsize(file_path) / (1024 * 1024), 2)  # in MB

        document_data = {
            "uniqueId": f"00123{index + 1}",
            "title": file.filename,
            "description": f"Digitized document - {file.filename}",
            "language": "English",
            "docType": file.mimetype,
            "createdOn": datetime.utcnow().isoformat(),
            "lastModified": datetime.utcnow().isoformat(),
            "fileSize": f"{file_size} MB",
            "fileType": file.mimetype,
            "filename": filename,
            "file_path": file_path,
            "ocr_text": ocr_result,
            "upload_date": datetime.utcnow(),
            "batch_id": batch_id
        }

        try:
            result = mongo.db.documents.insert_one(document_data)
            document_id = str(result.inserted_id)
        except Exception as e:
            current_app.logger.error(f"DB insert failed for file {filename}: {e}")
            continue

        # Build a public preview URL (adjust if needed)
        documents.append({
            'id': document_id,
            'uniqueId': document_data['uniqueId'],
            'title': document_data['title'],
            'description': document_data['description'],
            'language': document_data['language'],
            'docType': document_data['docType'],
            'createdOn': document_data['createdOn'],
            'lastModified': document_data['lastModified'],
            'fileSize': document_data['fileSize'],
            'fileType': document_data['fileType'],
            'preview': f"{request.host_url}documents/preview/{document_id}"
        })

    if not documents:
        return jsonify({'success': False, 'error': 'No valid file uploaded'}), 400

    return jsonify({
        'success': True,
        'message': 'Files uploaded and processed successfully',
        'batch_id': batch_id,
        'documents': documents
    }), 200

@document_bp.route('/<doc_id>', methods=['GET'])
def get_document(doc_id):
    try:
        document = mongo.db.documents.find_one({"_id": ObjectId(doc_id)})
    except Exception as e:
        current_app.logger.error(f"Error retrieving document with id {doc_id}: {e}")
        return jsonify({'success': False, 'error': 'Invalid document ID'}), 400

    if not document:
        return jsonify({'success': False, 'error': 'Document not found'}), 404

    return jsonify({
        'success': True,
        'id': str(document['_id']),
        'uniqueId': document.get('uniqueId'),
        'title': document.get('title'),
        'description': document.get('description'),
        'language': document.get('language'),
        'docType': document.get('docType'),
        'createdOn': document.get('createdOn'),
        'lastModified': document.get('lastModified'),
        'fileSize': document.get('fileSize'),
        'fileType': document.get('fileType'),
        'ocr_text': document.get('ocr_text', ''),
        'upload_date': document['upload_date'].isoformat()
    }), 200

@document_bp.route('/batch/<batch_id>', methods=['GET'])
def get_documents_by_batch(batch_id):
    try:
        documents_cursor = mongo.db.documents.find({"batch_id": batch_id})
    except Exception as e:
        current_app.logger.error(f"Error querying database for batch {batch_id}: {e}")
        return jsonify({'success': False, 'error': 'Invalid batch ID'}), 400

    documents = list(documents_cursor)
    if not documents:
        return jsonify({'success': False, 'error': 'No documents found for this batch ID'}), 404

    docs = []
    for doc in documents:
        docs.append({
            'id': str(doc['_id']),
            'uniqueId': doc.get('uniqueId'),
            'title': doc.get('title'),
            'description': doc.get('description'),
            'language': doc.get('language'),
            'docType': doc.get('docType'),
            'createdOn': doc.get('createdOn'),
            'lastModified': doc.get('lastModified'),
            'fileSize': doc.get('fileSize'),
            'fileType': doc.get('fileType'),
            'ocr_text': doc.get('ocr_text', ''),
            'upload_date': doc['upload_date'].isoformat()
        })
    return jsonify({
        'success': True,
        'batch_id': batch_id,
        'documents': docs
    }), 200

@document_bp.route('/download/<doc_id>', methods=['GET'])
def download_document(doc_id):
    try:
        document = mongo.db.documents.find_one({"_id": ObjectId(doc_id)})
    except Exception as e:
        current_app.logger.error(f"Error retrieving document for download with id {doc_id}: {e}")
        return jsonify({'success': False, 'error': 'Invalid document ID'}), 400

    if not document:
        return jsonify({'success': False, 'error': 'Document not found'}), 404

    return send_from_directory(
        directory=current_app.config['UPLOAD_FOLDER'],
        path=document['filename'],
        as_attachment=True
    )

@document_bp.route('/preview/<doc_id>', methods=['GET'])
def preview_document(doc_id):
    try:
        document = mongo.db.documents.find_one({"_id": ObjectId(doc_id)})
    except Exception as e:
        current_app.logger.error(f"Error retrieving document for preview with id {doc_id}: {e}")
        return jsonify({'success': False, 'error': 'Invalid document ID'}), 400

    if not document:
        return jsonify({'success': False, 'error': 'Document not found'}), 404

    return send_from_directory(
        directory=current_app.config['UPLOAD_FOLDER'],
        path=document['filename'],
        as_attachment=False
    )
