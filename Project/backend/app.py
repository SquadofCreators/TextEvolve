import os
from flask import Flask
from config import Config
from flask_cors import CORS
from db_ext import mongo  # Import the shared instance

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS if needed
    CORS(app)

    # Initialize PyMongo with the app
    mongo.init_app(app)

    # Enable CORS for your React frontend
    CORS(app, origins=["http://localhost:5173"])

    # Live Site
    CORS(app, origins=["https://squadofcreators.github.io/TextEvolve"])

    # Ensure the uploads folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register Blueprints
    from routes.auth import auth_bp
    from routes.document import document_bp
    from routes.user import user_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(document_bp, url_prefix='/documents')
    app.register_blueprint(user_bp, url_prefix='/user')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=app.config.get('PORT', 5000), debug=True)
