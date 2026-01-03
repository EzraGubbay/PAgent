import os
import structlog
import logging
from logtail import LogtailHandler

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
    better_stack_token = os.getenv("BETTER_STACK_TOKEN")
    handlers = []

    if better_stack_token:
        # For production: Send JSON logs to the Cloud
        logtail_handler = LogtailHandler(source_token=better_stack_token)
        logtail_handler.setFormatter(logging.Formatter("%(message)s"))
        handlers.append(logtail_handler)
        processors.append(structlog.processors.JSONRenderer())
    else:
        # For local development: Print pretty console logs
        handles.append(logging.StreamHandler())
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