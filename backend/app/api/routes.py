import os
import shutil
from fastapi import APIRouter, Response, HTTPException, UploadFile, File, Form, BackgroundTasks, Depends, Body, Header
from app.schemas.models import AuthPayload, AuthResponse, SendMessageRequest, IntegrationExchangeRequest, JWTPayload, GoogleAuthRequest
from app.api.deps import get_db, get_llm_client, verify_jwt
from app.core.logger import logger
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.core.config import UPLOAD_DIR
from app.core.sso import verify_google_token
from app.api.logic import process_llm_request
from fastapi.concurrency import run_in_threadpool
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import httpx

from app.api.integrations import GoogleProvider, TodoistProvider

router = APIRouter()

PROVIDERS = {
    "google": GoogleProvider(),
    "todoist": TodoistProvider(),
}

@router.post('/registerUser')
async def registerUser(data: AuthPayload, response: Response, db=Depends(get_db)) -> AuthResponse:
    """
    Handles new user registration.
    """

    struct_logger = logger.bind(email=data.email)
    struct_logger.info("http_register_user_attempt")
    
    status, db_response = await db.create_user(email=data.email, password=data.password)

    if not status:
        response.status_code = 401
        struct_logger.error("http_register_user_failed", reason=db_response, provided_hash=data.password)
        return AuthResponse(status=False, detail=db_response)
    else:
        # Generate JWTs
        access_token = create_access_token(uid=db_response)
        refresh_token = create_refresh_token(uid=db_response)
        
        # Save refresh token in DB
        await db.update_refresh_token(uid=db_response, token=refresh_token)
        
        struct_logger.info("http_register_user_success", new_uid=db_response)
        response.status_code = 200
        return AuthResponse(status=True, accessToken=access_token, refreshToken=refresh_token, detail=db_response)


@router.post('/login')
async def login(data: AuthPayload, response: Response, db=Depends(get_db)) -> AuthResponse:
    """
    Handles user logins.
    """

    struct_logger = logger.bind(email=data.email)
    struct_logger.info("http_login_attempt")

    status, db_response = await db.login(email=data.email, password=data.password)

    if not status:
        struct_logger.warn("http_login_failed", reason=db_response, provided_hash=data.password)
        response.status_code = 401
        return AuthResponse(status=False, detail=db_response)
    else:
        # Generate JWTs
        access_token = create_access_token(uid=db_response)
        refresh_token = create_refresh_token(uid=db_response)
        
        # Save refresh token in DB
        await db.update_refresh_token(uid=db_response, token=refresh_token)
        
        response.status_code = 200
        struct_logger.info("http_login_success", user_id=db_response)
        return AuthResponse(status=True, accessToken=access_token, refreshToken=refresh_token, detail=db_response)

@router.post('/auth/google', response_model=AuthResponse)
async def login_with_google(req: GoogleAuthRequest, response: Response, db=Depends(get_db)):
    """
    Exchanges a Google ID Token for an application JWT session.
    Registers the user if they don't exist yet.
    """
    struct_logger = logger.bind(endpoint="auth_google")
    
    # Verify Google Token asynchronously to avoid blocking the event loop with synchronous network/cert calls
    id_info = await run_in_threadpool(verify_google_token, req.idToken)
    email = id_info.get("email")
    
    if not email:
        struct_logger.error("google_sso_missing_email")
        raise HTTPException(status_code=400, detail="Google token did not contain an email address.")
        
    status, result = await db.find_or_create_sso_user(email)
    
    if not status:
        struct_logger.error("google_sso_db_error", reason=result)
        raise HTTPException(status_code=500, detail=result)
        
    uid = result
    
    # Generate JWTs
    access_token = create_access_token(uid=uid)
    refresh_token = create_refresh_token(uid=uid)
    
    # Save refresh token in DB
    await db.update_refresh_token(uid=uid, token=refresh_token)
    
    struct_logger.info("google_sso_success", user_id=uid)
    response.status_code = 200
    return AuthResponse(status=True, accessToken=access_token, refreshToken=refresh_token, detail=uid)

@router.post('/refreshToken')
async def refresh_token(authorization: str = Header(...), db=Depends(get_db)) -> AuthResponse:
    """
    Exchanges a valid 14-day refresh token for a fresh 15-minute access token and a new rotated refresh token.
    """
    struct_logger = logger.bind(endpoint="refreshToken")
    
    try:
        # Bearer token parsing
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid token scheme - expected Bearer")
            
        # Verify the cryptography of the refresh token
        jwt_data: JWTPayload = verify_token(token, expected_type="refresh")
        uid = jwt_data.sub
        
        # Verify against database (to ensure it hasn't been revoked/overwritten)
        db_token = await db.get_refresh_token(uid=uid)
        if db_token != token:
            struct_logger.warn("http_refresh_token_revoked", user_id=uid)
            raise HTTPException(status_code=401, detail="Token revoked or superseded")
            
        # Rotate tokens
        new_access_token = create_access_token(uid=uid)
        new_refresh_token = create_refresh_token(uid=uid)
        
        await db.update_refresh_token(uid=uid, token=new_refresh_token)
        
        struct_logger.info("http_refresh_token_success", user_id=uid)
        return AuthResponse(status=True, accessToken=new_access_token, refreshToken=new_refresh_token, detail=uid)
        
    except Exception as e:
        struct_logger.warn("http_refresh_token_failed", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post('/sendMessage')
async def sendMessage(req: SendMessageRequest, background_tasks: BackgroundTasks, db=Depends(get_db), llm_client=Depends(get_llm_client), user: JWTPayload = Depends(verify_jwt)):
    """
    Handles asynchronous processing of user prompts to the llm.
    Used for when user replies to LLM from outside the app, e.g. through push notification.
    """
    uid = user.sub
    
    struct_logger = logger.bind(func_call="sendMessage_http", user_id=uid)
    struct_logger.info("http_message_received")
    
    background_tasks.add_task(process_llm_request, req, uid=uid, db=db, llm_client=llm_client)
    return {'status': 'success'}


@router.post('/uploadFileObject')
async def upload_file_object(
    file: UploadFile = File(...),   # File (expected as file stream)
    db=Depends(get_db),
    user: JWTPayload = Depends(verify_jwt)
):
    """
    Handles file uploads for the user's prompt to the llm.
    Multipart Upload to Shared Storage (streamed and uses shared K8s volume)
    """
    uid = user.sub

    # Ensure safe filename to prevent directory traversal attacks
    safe_filename = os.path.basename(file.filename)
    user_dir = os.path.join(UPLOAD_DIR, uid)

    # Create user directory if it doesn't exist
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, safe_filename)
    
    # Stream file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    logger.info("file_upload_success", user_id=uid, filename=safe_filename)

    return {'status': 'success', 'filename': safe_filename}

@router.post('/deleteFileObject')
async def delete_file_object(
    filename: str = Form(...),      # File name (expected as form field)
    db=Depends(get_db),
    user: JWTPayload = Depends(verify_jwt)
):
    """
    Handles file deletion for the user's prompt to the llm.
    """
    uid = user.sub

    # Ensure safe filename to prevent directory traversal attacks
    safe_filename = os.path.basename(filename)
    user_dir = os.path.join(UPLOAD_DIR, uid)

    file_path = os.path.join(user_dir, safe_filename)

    # Check if file exists
    if os.path.exists(file_path):
        os.remove(file_path)
        logger.info("file_delete_success", user_id=uid, filename=safe_filename)
        return {'status': 'success', 'filename': safe_filename}
    else:
        raise HTTPException(status_code=404, detail="File not found")


@router.post('/loadNewChat')
async def load_new_chat(db=Depends(get_db), llm_client=Depends(get_llm_client), user: JWTPayload = Depends(verify_jwt)):
    """
    Deletes old user chat history and creates a new one.
    """
    uid = user.sub

    if llm_client:
        await run_in_threadpool(llm_client.clear_history, uid)
    else:
        raise HTTPException(status_code=500, detail="LLM Client not initialized")
        
    return {'status': 'success'}

# ----- INTEGRATIONS -----

@router.post('/integrations/providers/{provider}/exchange')
async def integration_exchange(provider:str, req: IntegrationExchangeRequest, db=Depends(get_db), user: JWTPayload = Depends(verify_jwt)):
    """
    Exchanges the mobile server auth code for Google tokens.
    """
    uid = user.sub

    if provider not in PROVIDERS:
        raise HTTPException(status_code=400, detail="Invalid or unsupported provider")

    # Exchange Request
    tokens = await PROVIDERS[provider].exchange_code(req.code)

    # Verify Identity
    user_info = PROVIDERS[provider].verify_identity(tokens)

    await db.update_user_integration(
        uid=uid,
        provider=provider,
        provider_user_id=user_info["sub"],
        tokens=tokens
    )

    return { 'status': True }

@router.post('/integrations/providers/{provider}/revoke')
async def revoke_integration(provider:str, db=Depends(get_db), user: JWTPayload = Depends(verify_jwt)):
    """
    Revokes the user's integration with the specified provider.
    """
    uid = user.sub

    # Get refresh token
    integration_data = await db.get_user_integration(
        uid, provider
    )
    refresh_token = getattr(integration_data, "refresh_token", None)

    # Remove integration from provider and database
    if refresh_token and PROVIDERS.get(provider):
        if await PROVIDERS[provider].revoke(refresh_token):
            await db.delete_user_integration(uid, provider)
            return { 'status': True }
        else:
            raise HTTPException(status_code=500, detail="Error revoking integration. Please revoke manually from the provider.")
    else:
        raise HTTPException(status_code=401, detail="Invalid integration revocation request.")

@router.post('/integrations/providers/{provider}/validate')
async def validate_integration(provider: str, db=Depends(get_db), user: JWTPayload = Depends(verify_jwt)):
    """
    Validates if the user currently has an active, valid connection to the provider.
    """
    uid = user.sub
    
    # In a real app, you would want to use Google's tokeninfo endpoint to verify if
    # the existing stored access token is still active and valid instead of just checking
    # if it exists, however checking existence works as a proxy for the time being.
    integration_data = await db.get_user_integration(uid, provider)
    
    if integration_data and getattr(integration_data, "access_token", None):
        return { 'status': True }
    else:
        return { 'status': False }

