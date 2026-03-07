from app.db.manager import dbmanager
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_token
from app.schemas.models import JWTPayload

token_auth_scheme = HTTPBearer()

async def verify_jwt(token: HTTPAuthorizationCredentials = Depends(token_auth_scheme)) -> JWTPayload:
    try:
        return verify_token(token.credentials, expected_type="access")
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication Error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_db():
    """
    Dependency to get the database manager.
    Can be overridden in tests.
    """
    return dbmanager

async def get_llm_client():
    from app.services.llm import get_llm_singleton
    return get_llm_singleton()
