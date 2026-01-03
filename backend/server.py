import os, shutil
import socketio
from typing import List, Union, Dict
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv
from redis import asyncio as redis

from llm_service import LLMClient
from db import DBManager
from firebase import generate_notification
from data_types import MessageType
import uuid
from asgi_correlation_id import CorrelationIdMiddleware
from logger_config import configure_logger, logger
import structlog

# ----- GLOBAL LOGGER -----

configure_logger()

# Load environment variables
load_dotenv()
LLM_MODEL = os.getenv("LLM_MODEL")
CHAT_SIZE_LIMIT = os.getenv("CHAT_SIZE_LIMIT")
APP_IDENTIFIER = os.getenv("APP_IDENTIFIER")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/temp_storage")

# ----- SETUP & INFRASTRUCTURE -----

# Async Redis Manager - multiple worker communicating to connected users via Redis
mgr = socketio.AsyncRedisManager(REDIS_URL)

# ASGI Socket.IO Server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins='*',
    client_manager=mgr,
    ping_timeout=60,
    ping_interval=25,
)

# FastAPI App
app = FastAPI()

# Combine ASGI app and FastAPI app for Gunicorn service
combined = socketio.ASGIApp(sio, app)

# Initialize DB
dbmanager = DBManager()

# Global LLM Client
llm_client = LLMClient(model=LLM_MODEL, chat_size_limit=CHAT_SIZE_LIMIT)

# ----- MIDDLEWARE -----

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid,uuid4()))
    structlog.contextvars.bind_contextvars(request_id=request_id)

    logger.info("http_request_start", path=request.url.path, method=request.method)

    try:
        response = await call_next(request)
        logger.info("http_request_end", status=response.status_code)
        return response
    except Exception as e:
        logger.error("http_request_error", error=str(e))
        raise e

async def ws_middleware(sid):
    session_id = str(uuid.uuid4())
    await sio.save_session(sid, {"correlation_id": session_id})
    structlog.contextvars.bind_contextvars(sid=sid, correlation_id=session_id)

    logger.info("websocker_connected", user_agent=environ.get("HTTP_USER_AGENT"))

# ----- DATA MODELS -----

class AuthPayload(BaseModel):
    username: str
    passwordHash: str

class SendMessageRequest(BaseModel):
    uid: str
    prompt: str
    notificationToken: Union[str, None] = None
    
class RegisterNotificationTokenRequest(BaseModel):
    uid: str
    notificationToken: str

class ResetChatRequest(BaseModel):
    uid: str

# ----- HELPER FUNCTIONS -----

async def is_user_connected(uid: str):
    """
    Checks Redis to see if user is connected to any worker.
    """

    # Check if room user:{uid} has any participants
    try:
        participants = await sio.manager.get_participants(namespace='/', room=uid)
        return True if participants else False
    except Exception as e:
        logger.warn("redis_check_failed", error=str(e), uid=uid)
        return False

def validate_socket_model(model_class):
    def decorator(func):
        async def wrapper(sid, data):
            try:
                obj = model_class(**data)
            except ValidationError as e:
                logger.error("ws_validation_error", data=data, error=str(e), sid=sid)
                response = {
                    'message': 'Validation Error 422: Invalid Request Data',
                    'type': MessageType.System
                }

                # Let client know of error. Emit to sid 
                await sio.emit('error', {'response': response}, room=sid)
                return
            return await func(sid, obj)
        return wrapper
    return decorator

async def notify(uid: str, response: str):
    """
    Sends a notification to the user.
    """

    # Get notification token from database
    notificationToken = await run_in_threadpool(dbmanager.getNotificationToken, uid)

    # Construct notification payload
    notification = {
        'title': "PAgent",
        'body': response.get("message"),
        'data': {
            'app': APP_IDENTIFIER,
            'type': response.get('type')
        }
    }

    # Send notification to Firebase
    await run_in_threadpool(generate_notification, notificationToken, notification)

# ----- SOCKET.IO EVENTS -----

@sio.event
async def connect(sid, environ, auth):
    """
    Handles new connections to the server.
    """

    # Attach correlation ID to request headers
    await ws_middleware(sid)

    uid = auth.get("uid") if auth else None
    
    struct_logger = logger.bind(sid=sid, user_id=str(uid) if uid else "anonymous")
    
    if uid:
        await sio.enter_room(sid, uid)
        struct_logger.info("ws_connected")

        message_queue = await run_in_threadpool(dbmanager.dequeueMessageQueue, uid)
        if message_queue:
            struct_logger.info("ws_flushing_queue", count=len(message_queue))
            for payload in message_queue:
                await sio.emit('llm_response', {'status': 'success', 'response': payload}, room=uid)
    else:
        struct_logger.info("ws_connected_anonymous")
    
@sio.event
async def disconnect(sid):
    """
    Notifies the server of a client disconnecting.
    Removal of user from Redis and database is handled automatically by Socket.IO.
    """

    logger.info("ws_disconnected", sid=sid)

@app.post('/registerUser')
async def registerUser(data: AuthPayload):
    """
    Handles new user registration.
    """

    struct_logger = logger.bind(username=username)
    struct_logger.info("http_register_user_attempt")
    
    status, response = await run_in_threadpool(dbmanager.create_user, username=username, password=passwordHash)
    
    if status is False:
        struct_logger.error("http_register_user_failed", error=response)

    return {'status': 'success' if status else 'error', 'response': response}

@app.post('/login')
async def login(data: AuthPayload):
    """
    Handles user logins.
    """

    username = data.username
    passwordHash = data.passwordHash

    struct_logger = logger.bind(username=username)
    struct_logger.info("http_login_attempt")

    status, response = await run_in_threadpool(dbmanager.login, username=username, passwordHash=passwordHash)

    if status:
         struct_logger.info("http_login_success", user_id=response)
    else:
         struct_logger.warn("http_login_failed", reason=response)

    return {'status': 'success' if status else 'error', 'response': response}

# ----- API ROUTES -----

@sio.on('sendMessage')
@validate_socket_model(SendMessageRequest)
async def sendMessage(sid, req):
    """
    Handles asynchronous processing of user prompts to the llm.
    data argument is expected to carry user ID (uid), prompt, and optionally, attachments.

    Standard API method for in-app communication with user.
    """
    struct_logger = logger.bind(func_call="sendMessage_ws", sid=sid, user_id=req.uid)
    struct_logger.info("ws_message_received")
    
    sio.emit('llm_processing', {'status': 'success', 'response': 'Thinking...'}, room=req.uid)
    await process_llm_request(req)

@app.post('/sendMessage')
async def sendMessage(req: SendMessageRequest, background_tasks: BackgroundTasks):
    """
    Handles asynchronous processing of user prompts to the llm.
    data argument is expected to carry user ID (uid), prompt, and optionally, attachments.

    Used for when user replies to LLM from outside the app, e.g. through push notification.
    """
    struct_logger = logger.bind(func_call="sendMessage_http", user_id=req.uid)
    struct_logger.info("http_message_received")
    
    background_tasks.add_task(process_llm_request, req)
    return {'status': 'success'}

async def process_llm_request(req: SendMessageRequest):
    """
    Prepares user request to the LLM and calls the LLM before responding to user.

    1. Decomposes user request into user ID, prompt, and attachments.
    2. Gathers all attachments uploaded by the user (if any).
    3. Makes asynchronous call to LLMClient.
    4. Emits response to user.
    """

    uid, prompt = req.uid, req.prompt

    # Collect attachments if user uploaded any.
    attachments = []
    user_dir = os.path.join(UPLOAD_DIR, uid)
    if os.path.exists(user_dir):
        for filename in os.listdir(user_dir):
            file_path = os.path.join(user_dir, filename)
            attachments.append({
                "path": file_path,
                "name": filename
            })

    # Use asynchronous LLMClient
    struct_logger = logger.bind(user_id=uid)
    struct_logger.info("llm_processing_start")
    message = await run_in_threadpool(
        llm_client.sendMessage,
        uid,
        prompt,
        attachments
    )

    response = {
        'message': message,
        'type': MessageType.Assistant
    }

    # --- CLEANUP USER TEMP UPLOAD FILES ---
    if os.path.exists(user_dir):
        try:
            shutil.rmtree(user_dir)
            struct_logger.debug("user_upload_cleanup_success")
        except Exception as e:
            struct_logger.error("user_upload_cleanup_failed", error=str(e))

    # --- DELIVERY ---

    if await is_user_connected(uid):
        # If user is connected, emit response directly to user.
        await sio.emit('llm_response', {"response": response}, room=uid)
        struct_logger.info("llm_response_delivered_ws")
    else:
        # If user is not connected, insert response into message queue and send notification.
        status, response = await run_in_threadpool(dbmanager.insertMessageQueue, uid=uid, message=response)
        struct_logger.info("llm_response_queued")
        if not status:
            raise HTTPException(status_code=500, detail="Failed to insert message queue")
        
        # Send notification to user.
        await notify(uid, payload=response)

@app.post('/uploadFileObject')
async def upload_file_object(
    uid: str = Form(...),           # User ID (expected as form field)
    file: UploadFile = File(...),   # File (expected as file stream)
):
    """
    Handles file uploads for the user's prompt to the llm.

    These files will be processed and sent to the llm as part of the user's next prompt.
    Multipart Upload to Shared Storage (streamed and uses shared K8s volume)
    """

    # ----- SECURITY CHECKS ----- 
    
    # Ensure user exists and UID is
    if not await run_in_threadpool(dbmanager.isValidUserID, uid):
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

@app.post('/deleteFileObject')
async def delete_file_object(
    uid: str = Form(...),           # User ID (expected as form field)
    filename: str = Form(...),      # File name (expected as form field)
):
    """
    Handles file deletion for the user's prompt to the llm.
    """

    # ----- SECURITY CHECKS ----- 
    
    # Ensure user exists and UID is
    if not await run_in_threadpool(dbmanager.isValidUserID, uid):
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

@app.post('/loadNewChat')
async def load_new_chat(req: ResetChatRequest):
    """
    Deletes old user chat history and creates a new one.
    """

    uid = req.uid
    if not await run_in_threadpool(dbmanager.isValidUserID, uid):
        raise HTTPException(status_code=401, detail="Authentication Error: Invalid user ID")

    await run_in_threadpool(llm_client.clear_history, req.uid)
    return {'status': 'success'}

@sio.on('registerNotificationToken')
@validate_socket_model(RegisterNotificationTokenRequest)
async def register_notification_token(sid, req: RegisterNotificationTokenRequest):
    """
    Registers a user's notification token.
    """
    response = await run_in_threadpool(dbmanager.addNotificationToken, req.uid, req.token)
    await sio.emit(
        'notificationTokenRegistrationResponse', 
        {
            'status': 'success' if response else 'error',
            'message': f'Successfully registered notification token {req.token}'
                if response else f'Error registering notification token for user {req.uid}'
        },
        room=req.uid
    )
                