import bcrypt

def hash_password(password: str) -> bytes:
    password_bytes: bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))

    return hashed

def verify_password(submitted_password: str, stored_password: bytes) -> bool:

    submitted_password_bytes: bytes = submitted_password.encode('utf-8')
    return bcrypt.checkpw(submitted_password_bytes, stored_password)