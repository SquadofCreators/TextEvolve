from werkzeug.security import generate_password_hash, check_password_hash
hashed = generate_password_hash("123456")
print("Pass", hashed)