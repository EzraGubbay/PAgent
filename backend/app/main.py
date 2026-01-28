
from fastapi import FastAPI, Request
from app.core.logger import configure_logger, logger
from app.core.socket import sio
import socketio
import sys
import uuid
import structlog

# Import initialized singletons to ensure they are set up
from app.services.llm import init_llm_client
from app.api.routes import router as api_router
import app.api.sockets # Registers the socket events

# ----- GLOBAL LOGGER -----

configure_logger()

# ----- GLOBAL EXCEPTION HANDLER -----

def global_exception_handler(exc_type, exc_value, exc_traceback):
    """
    Catch-all for any exceptions that escape the FastAPI application (e.g. startup errors).
    """
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return

    logger.error("system_crash", exc_info=(exc_type, exc_value, exc_traceback))

sys.excepthook = global_exception_handler

# FastAPI App
app = FastAPI()

# Include Routes
app.include_router(api_router)

# Combine ASGI app and FastAPI app for Gunicorn service
combined = socketio.ASGIApp(sio, app)

# ----- APP STARTUP -----

@app.on_event("startup")
async def startup():
    # Initialize the LLM Client
    init_llm_client()
    logger.info("app_startup_complete")

# ----- MIDDLEWARE -----

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    structlog.contextvars.bind_contextvars(request_id=request_id)

    logger.info("http_request_start", path=request.url.path, method=request.method)

    try:
        response = await call_next(request)
        logger.info("http_request_end", status=response.status_code)
        return response
    except Exception:
        logger.exception("http_request_error")
        raise