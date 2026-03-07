import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from app.core.config import JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from app.schemas.models import JWTPayload

def hash_password(password: str) -> bytes:
    password_bytes: bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))

    return hashed

def verify_password(submitted_password: str, stored_password: bytes) -> bool:

    submitted_password_bytes: bytes = submitted_password.encode('utf-8')
    return bcrypt.checkpw(submitted_password_bytes, stored_password)

def create_access_token(uid: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(uid),
        "exp": int(expire.timestamp()),
        "type": "access"
    }
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def create_refresh_token(uid: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": str(uid),
        "exp": int(expire.timestamp()),
        "type": "refresh"
    }
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token: str, expected_type: str = "access") -> JWTPayload:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Pydantic validation guarantees 'sub', 'exp', and 'type' exist
        jwt_data = JWTPayload(**payload)
        
        if jwt_data.type != expected_type:
            raise ValueError(f"Invalid token type. Expected {expected_type}")
            
        return jwt_data
        
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
