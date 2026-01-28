import os
import structlog
import logging
from logtail import LogtailHandler
from app.core.config import BETTER_STACK_HOST, BETTER_STACK_TOKEN

def configure_logger():
    """
    Configures logger for the application: Grabbing Correlation ID from request headers, setting up Cloud Handler, etc.
    """

    processors = [
        structlog.contextvars.merge_contextvars, # Grab Correlation ID from request headers
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info, # Capture crash tracebacks
    ]

    # Setup Cloud Handler (with Better Stack)
    handlers = []
    
    handlers.append(logging.StreamHandler())

    if BETTER_STACK_TOKEN:
        # For production: Send JSON logs to the Cloud
        logtail_handler = LogtailHandler(source_token=BETTER_STACK_TOKEN, host=BETTER_STACK_HOST)
        logtail_handler.setFormatter(logging.Formatter("%(message)s"))
        handlers.append(logtail_handler)
        processors.append(structlog.stdlib.render_to_log_kwargs)
    else:
        # For local development: Print pretty console logs
        processors.append(structlog.dev.ConsoleRenderer())

    logging.basicConfig(handlers=handlers, level=logging.INFO, format="%(message)s")
    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

# Create global logger
logger = structlog.get_logger()