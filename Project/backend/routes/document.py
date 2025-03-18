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
    # Retrieve all files provided under the 'file' key
    files = request.files.getlist('file')
    if not files or len(files) == 0:
        return jsonify({'success': False, 'error': 'No file provided'}), 400

    # Generate a unique batch_id for this group of uploads
    batch_id = str(ObjectId())
    documents = []
    
    for file in files:
        if file.filename == '':
            continue  # Skip files with an empty filename

        # Sanitize the filename and determine file path
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        try:
            file.save(file_path)
        except Exception as e:
            current_app.logger.error(f"Error saving file {filename}: {e}")
            continue

        # Run OCR or ML inference on the saved file
        try:
            ocr_result = run_ocr_model(file_path)
        except Exception as e:
            current_app.logger.error(f"OCR failed for file {filename}: {e}")
            ocr_result = ""

        # Prepare the document data for insertion in the database
        document_data = {
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

        documents.append({
            'document_id': document_id,
            'filename': filename,
            'ocr_text': ocr_result
        })

    if not documents:
        return jsonify({'success': False, 'error': 'No valid file selected'}), 400

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
        'filename': document['filename'],
        'ocr_text': document.get('ocr_text', ''),
        'upload_date': document['upload_date'].isoformat()
    }), 200

@document_bp.route('/batch/<batch_id>', methods=['GET'])
def get_documents_by_batch(batch_id):
    try:
        # Find all documents that belong to the provided batch_id
        documents_cursor = mongo.db.documents.find({"batch_id": batch_id})
    except Exception as e:
        current_app.logger.error(f"Error querying database for batch {batch_id}: {e}")
        return jsonify({'success': False, 'error': 'Invalid batch ID'}), 400

    documents = list(documents_cursor)
    current_app.logger.info(f"Found {len(documents)} documents for batch_id {batch_id}")

    if not documents:
        return jsonify({'success': False, 'error': 'No documents found for this batch ID'}), 404

    docs = []
    for doc in documents:
        docs.append({
            'id': str(doc['_id']),
            'filename': doc['filename'],
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
        path=document['filename'],  # If using Flask <2.2, change 'path' to 'filename'
        as_attachment=True
    )
