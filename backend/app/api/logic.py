import os
import shutil
from typing import Union
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import ValidationError
import structlog
from app.core.logger import logger
from app.core.config import UPLOAD_DIR, APP_IDENTIFIER
from app.core.socket import sio
from app.core.redis import redis_client
from app.db.manager import dbmanager
from app.services.llm import llm_client
from app.services.firebase import generate_notification
from app.schemas.enums import MessageType
from app.schemas.models import SendMessageRequest

# ----- HELPER FUNCTIONS -----

async def is_user_connected(uid: str):
    """
    Checks Redis to see if user is connected to any worker.
    """
    try:
        is_online = await redis_client.exists(f"user_online:{uid}")
        return True if is_online else False
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

async def notify(uid: str, response: dict, db=dbmanager):
    """
    Sends a notification to the user.
    """
    try:
        # Get notification token from database
        result = await db.getNotificationToken(uid)
        if result and isinstance(result, tuple) and result[0]:
            notificationToken = result[1]
            
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
        else:
            logger.warn("notification_skipped_no_token", uid=uid)

    except Exception as e:
        logger.error("notification_failed", error=str(e), uid=uid)

async def process_llm_request(req: SendMessageRequest, db=dbmanager):
    """
    Prepares user request to the LLM and calls the LLM before responding to user.
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
    
    if not llm_client:
         struct_logger.error("llm_client_not_initialized")
         return

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
        status = await db.insertMessageQueue(uid=uid, message=response)
        struct_logger.info("llm_response_queued")
        
        # Send notification to user.
        await notify(uid, response=response, db=db)
