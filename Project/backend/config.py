import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default_secret_key')
    API_KEY = os.environ.get('API_KEY', 'default_api_key')
    PORT = int(os.environ.get('PORT', 5000))
    
    # Build the Mongo URI dynamically if needed:
    username = os.environ.get('MONGO_USERNAME')
    password = os.environ.get('MONGO_PASSWORD')
    host = os.environ.get('MONGO_HOST', 'localhost')
    db = os.environ.get('MONGO_DB', 'textevolve')
    
    if username and password:
        # Ensure username and password are URL-encoded
        username = quote_plus(username)
        password = quote_plus(password)
        MONGO_URI = f"mongodb+srv://{username}:{password}@{host}/{db}?retryWrites=true&w=majority"
    else:
        MONGO_URI = os.environ.get('MONGO_URI', f"mongodb://{host}:27017/{db}")
    
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
