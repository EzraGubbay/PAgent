import os
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks, Depends
from app.schemas.models import AuthPayload, SendMessageRequest, ResetChatRequest
from app.api.deps import get_db, get_llm_client
from app.core.logger import logger
from app.core.config import UPLOAD_DIR
from app.api.logic import process_llm_request
from fastapi.concurrency import run_in_threadpool

router = APIRouter()

@router.post('/registerUser')
async def registerUser(data: AuthPayload, db=Depends(get_db)):
    """
    Handles new user registration.
    """
    struct_logger = logger.bind(username=data.username)
    struct_logger.info("http_register_user_attempt")
    
    status, response = await db.create_user(username=data.username, passwordHash=data.passwordHash)
    
    if status is False:
        struct_logger.error("http_register_user_failed", error=response)

    return {'status': 'success' if status else 'error', 'response': response}


@router.post('/login')
async def login(data: AuthPayload, db=Depends(get_db)):
    """
    Handles user logins.
    """
    username = data.username
    passwordHash = data.passwordHash

    struct_logger = logger.bind(username=username)
    struct_logger.info("http_login_attempt")

    status, response = await db.login(username=username, passwordHash=passwordHash)

    if status:
         struct_logger.info("http_login_success", user_id=response)
    else:
         struct_logger.warn("http_login_failed", reason=response)

    return {'status': 'success' if status else 'error', 'response': response}


@router.post('/sendMessage')
async def sendMessage(req: SendMessageRequest, background_tasks: BackgroundTasks, db=Depends(get_db), llm_client=Depends(get_llm_client)):
    """
    Handles asynchronous processing of user prompts to the llm.
    Used for when user replies to LLM from outside the app, e.g. through push notification.
    """
    struct_logger = logger.bind(func_call="sendMessage_http", user_id=req.uid)
    struct_logger.info("http_message_received")
    
    background_tasks.add_task(process_llm_request, req, db=db, llm_client=llm_client)
    return {'status': 'success'}


@router.post('/uploadFileObject')
async def upload_file_object(
    uid: str = Form(...),           # User ID (expected as form field)
    file: UploadFile = File(...),   # File (expected as file stream)
    db=Depends(get_db)
):
    """
    Handles file uploads for the user's prompt to the llm.
    Multipart Upload to Shared Storage (streamed and uses shared K8s volume)
    """
    # Ensure user exists and UID is valid
    if not await db.isValidUserID(uid):
        raise HTTPException(status_code=400, detail="Invalid user ID")

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
    uid: str = Form(...),           # User ID (expected as form field)
    filename: str = Form(...),      # File name (expected as form field)
    db=Depends(get_db)
):
    """
    Handles file deletion for the user's prompt to the llm.
    """
    # Ensure user exists and UID is valid
    if not await db.isValidUserID(uid):
        raise HTTPException(status_code=401, detail="Authentication Error: Invalid user ID")

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
async def load_new_chat(req: ResetChatRequest, db=Depends(get_db), llm_client=Depends(get_llm_client)):
    """
    Deletes old user chat history and creates a new one.
    """
    uid = req.uid
    if not await db.isValidUserID(uid):
        raise HTTPException(status_code=401, detail="Authentication Error: Invalid user ID")

    if llm_client:
        await run_in_threadpool(llm_client.clear_history, req.uid)
    else:
        raise HTTPException(status_code=500, detail="LLM Client not initialized")
        
    return {'status': 'success'}