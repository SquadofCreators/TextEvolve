import os
import zipfile
import base64
from io import BytesIO
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory, send_file
from werkzeug.utils import secure_filename
from bson import ObjectId
from db_ext import mongo  # shared Mongo instance

# If you plan to use OCR processing, uncomment the line below:
# from utils.ocr import run_ocr_model

# For PDF preview generation, ensure you have pdf2image installed and poppler available.
# pip install pdf2image
from pdf2image import convert_from_path

document_bp = Blueprint('document', __name__)
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpeg', 'jpg', 'doc', 'docx'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_batch_record(batch_name, documents):
    total_file_size = sum(doc['file_size'] for doc in documents)
    file_types = list(set(doc['file_type'] for doc in documents))
    now = datetime.utcnow()
    batch = {
        "name": batch_name,
        "created_on": now,
        "modified_on": now,
        "total_file_size": total_file_size,
        "total_files": len(documents),
        "file_types": file_types,
        "documents": documents
    }
    return batch

# --------------------------------------------
# API Endpoints
# --------------------------------------------

# Upload New Batch (Documents)
@document_bp.route('/upload_batch', methods=['POST'])
def upload_batch():
    if 'files' not in request.files:
        return jsonify({"error": "No files part in the request"}), 400

    files = request.files.getlist('files')
    batch_name = request.form.get('name', 'Untitled Batch')
    documents = []

    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            file_size = os.path.getsize(file_path)
            file_type = filename.rsplit('.', 1)[1].lower()
            now = datetime.utcnow()

            # Optionally, you can run OCR processing here if needed:
            # extracted_content = run_ocr_model(file_path)
            extracted_content = ""

            doc_record = {
                "id": str(ObjectId()),
                "name": filename,
                "file_size": file_size,
                "uploaded_on": now,
                "file_type": file_type,
                "title": request.form.get('title', filename),
                "extracted_content": extracted_content,
                "detected_language": "",
                "file_path": file_path  # store path for later downloads or preview
            }
            documents.append(doc_record)
        else:
            return jsonify({"error": "File type not allowed or file missing"}), 400

    batch = create_batch_record(batch_name, documents)
    result = mongo.db.batches.insert_one(batch)
    batch['_id'] = str(result.inserted_id)
    return jsonify(batch), 201

# Get Specific Batch by Batch ID
@document_bp.route('/get_batch/<batch_id>', methods=['GET'])
def get_batch(batch_id):
    batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})
    if batch:
        batch['_id'] = str(batch['_id'])
        return jsonify(batch), 200
    return jsonify({"error": "Batch not found"}), 404

# Get All Batches
@document_bp.route('/get_all_batches', methods=['GET'])
def get_all_batches():
    batches = mongo.db.batches.find()
    result = []
    for batch in batches:
        batch['_id'] = str(batch['_id'])
        result.append(batch)
    return jsonify(result), 200

# Batch Documents Preview by Batch ID (metadata for all docs)
@document_bp.route('/preview_batch_documents/<batch_id>', methods=['GET'])
def preview_batch_documents(batch_id):
    batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})
    if batch:
        docs_preview = [
            {
                "id": doc["id"],
                "name": doc["name"],
                "file_size": doc["file_size"],
                "uploaded_on": doc["uploaded_on"],
                "file_type": doc["file_type"],
                "title": doc.get("title", ""),
                "extracted_content": doc.get("extracted_content", ""),
                "detected_language": doc.get("detected_language", "")
            } for doc in batch.get("documents", [])
        ]
        return jsonify(docs_preview), 200
    return jsonify({"error": "Batch not found"}), 404

# Batch Documents Download by Batch ID (zips all files)
@document_bp.route('/download_batch_documents/<batch_id>', methods=['GET'])
def download_batch_documents(batch_id):
    batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        return jsonify({"error": "Batch not found"}), 404

    memory_file = BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for doc in batch.get("documents", []):
            file_path = doc.get("file_path")
            if file_path and os.path.exists(file_path):
                zf.write(file_path, arcname=os.path.basename(file_path))
    memory_file.seek(0)
    return send_file(memory_file, download_name=f'batch_{batch_id}.zip', as_attachment=True)

# Delete Single Batch by Batch ID
@document_bp.route('/delete_batch/<batch_id>', methods=['DELETE'])
def delete_batch(batch_id):
    batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        return jsonify({"error": "Batch not found"}), 404

    # Remove files from disk
    for doc in batch.get("documents", []):
        file_path = doc.get("file_path")
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

    mongo.db.batches.delete_one({"_id": ObjectId(batch_id)})
    return jsonify({"message": "Batch deleted"}), 200

# Delete All Batches
@document_bp.route('/delete_all_batches', methods=['DELETE'])
def delete_all_batches():
    batches = mongo.db.batches.find()
    for batch in batches:
        for doc in batch.get("documents", []):
            file_path = doc.get("file_path")
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
    mongo.db.batches.delete_many({})
    return jsonify({"message": "All batches deleted"}), 200

# Delete Single Document by Batch ID and Document ID
@document_bp.route('/delete_document/<batch_id>/<doc_id>', methods=['DELETE'])
def delete_document(batch_id, doc_id):
    batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        return jsonify({"error": "Batch not found"}), 404

    updated_docs = []
    doc_found = False
    for doc in batch.get("documents", []):
        if doc["id"] == doc_id:
            file_path = doc.get("file_path")
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
            doc_found = True
        else:
            updated_docs.append(doc)

    if not doc_found:
        return jsonify({"error": "Document not found in batch"}), 404

    # Update the batch with the remaining documents and update modified_on timestamp.
    mongo.db.batches.update_one(
        {"_id": ObjectId(batch_id)},
        {"$set": {"documents": updated_docs, "modified_on": datetime.utcnow()}}
    )
    return jsonify({"message": "Document deleted successfully"}), 200


# Get Single Document from Specific Batch by Document ID
@document_bp.route('/get_document/<batch_id>/<doc_id>', methods=['GET'])
def get_document(batch_id, doc_id):
    batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})
    if batch:
        for doc in batch.get("documents", []):
            if doc["id"] == doc_id:
                return jsonify(doc), 200
        return jsonify({"error": "Document not found in batch"}), 404
    return jsonify({"error": "Batch not found"}), 404

# Document Preview from Specific Batch by Document ID – now using uploaded document for preview
@document_bp.route('/preview_document/<batch_id>/<doc_id>', methods=['GET'])
def preview_document(batch_id, doc_id):
    batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})
    if not batch:
        return jsonify({"error": "Batch not found"}), 404
    for doc in batch.get("documents", []):
        if doc["id"] == doc_id:
            file_path = doc.get("file_path")
            if not file_path or not os.path.exists(file_path):
                return jsonify({"error": "File not found on disk"}), 404
            directory = os.path.dirname(file_path)
            filename = os.path.basename(file_path)
            # Serve file inline (so browser can preview)
            return send_from_directory(directory, filename, as_attachment=False)
    return jsonify({"error": "Document not found in batch"}), 404


# Document Download from Specific Batch by Document ID
@document_bp.route('/download_document/<batch_id>/<doc_id>', methods=['GET'])
def download_document(batch_id, doc_id):
    batch = mongo.db.batches.find_one({"_id": ObjectId(batch_id)})
    if batch:
        for doc in batch.get("documents", []):
            if doc["id"] == doc_id:
                file_path = doc.get("file_path")
                if file_path and os.path.exists(file_path):
                    directory = os.path.dirname(file_path)
                    filename = os.path.basename(file_path)
                    # Check for query parameter "inline". If inline=true, serve file inline.
                    inline = request.args.get("inline", "false").lower() == "true"
                    return send_from_directory(directory, filename, as_attachment=not inline)
                else:
                    return jsonify({"error": "File not found on disk"}), 404
        return jsonify({"error": "Document not found in batch"}), 404
    return jsonify({"error": "Batch not found"}), 404
