# ----- SOCKET.IO EVENTS -----

from app.core.socket import sio
from app.core.logger import logger
from app.core.redis import redis_client
from app.db.manager import dbmanager
from app.schemas.models import SendMessageRequest, RegisterNotificationTokenRequest
from app.api.logic import validate_socket_model, process_llm_request
from app.services.llm import get_llm_singleton
import uuid
import structlog

async def ws_middleware(sid, environ):
    session_id = str(uuid.uuid4())
    await sio.save_session(sid, {"correlation_id": session_id})
    structlog.contextvars.bind_contextvars(sid=sid, correlation_id=session_id)

    logger.info("websocket_connected", user_agent=environ.get("HTTP_USER_AGENT"))

@sio.event
async def connect(sid, environ, auth):
    """
    Handles new connections to the server.
    """

    # Attach correlation ID to request headers
    await ws_middleware(sid, environ)

    uid = auth.get("uid") if auth else None
    
    if not uid:
        await redis_client.set(f"ws_session:{sid}", "anonymous")
        struct_logger = logger.bind(sid=sid, user_id="anonymous")
        struct_logger.info("ws_connected_anonymous")
        return
    
    struct_logger = logger.bind(sid=sid, user_id=str(uid))
    
    if await dbmanager.isValidUserID(uid):
        # Store session mapping and online status
        await redis_client.set(f"ws_session:{sid}", str(uid))
        await redis_client.set(f"user_online:{uid}", "true")
        await sio.enter_room(sid, uid)
        struct_logger.info("ws_connected")

        # Tell the client connection was successful
        await sio.emit("connectSuccess", { "token": uid }, room=sid)

        message_queue = await dbmanager.dequeueMessageQueue(uid)
        if message_queue:
            struct_logger.info("ws_flushing_queue", count=len(message_queue))
            for payload in message_queue:
                await sio.emit('llm_response', {'status': 'success', 'response': payload}, room=uid)
        struct_logger.info("ws_flushed_message_queue");
        await sio.emit("messageQueueFlushed", room=uid)
    else:
        # In this case, the user provided a UID that does not exist.
        # Do not connect client. Tell client there was an error connecting.
        await sio.emit("connectError", "Invalid User Credentials Provided", room=sid)
        struct_logger.info("ws_connected_nonexistent_user")
        await sio.disconnect(sid)
    
    
@sio.event
async def disconnect(sid):
    """
    Notifies the server of a client disconnecting.
    Removal of user from Redis and database is handled automatically by Socket.IO.
    """

    logger.info("ws_disconnected", sid=sid)

    # Retrieve UID from session mapping
    uid = await redis_client.get(f"ws_session:{sid}")
    
    if uid and uid != "anonymous":
        await redis_client.delete(f"user_online:{uid}")
    
    # Always clean up session
    await redis_client.delete(f"ws_session:{sid}")
    
    logger.info("ws_disconnected_cleanup_complete", sid=sid, user_id=uid)


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
    
    await sio.emit('llm_processing', {'status': 'success', 'response': 'Thinking...'}, room=req.uid)
    await process_llm_request(req, llm_client=get_llm_singleton())


@sio.on('registerNotificationToken')
@validate_socket_model(RegisterNotificationTokenRequest)
async def register_notification_token(sid, req: RegisterNotificationTokenRequest):
    """
    Registers a user's notification token.
    """
    response = await dbmanager.addNotificationToken(req.uid, req.token)
    await sio.emit(
        'notificationTokenRegistrationResponse', 
        {
            'status': 'success' if response else 'error',
            'message': f'Successfully registered notification token {req.token}'
                if response else f'Error registering notification token for user {req.uid}'
        },
        room=req.uid
    )