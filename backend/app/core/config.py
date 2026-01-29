import os
from dotenv import load_dotenv

load_dotenv()

CHAT_SIZE_LIMIT = 300

LLM_MODEL = os.getenv("LLM_MODEL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TODOIST_API_KEY = os.getenv("TODOIST_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
REDIS_URL = os.getenv("REDIS_URL")
DB_NAME = os.getenv("PAGENT_DB_NAME")
DESKTOP_FCM_TOKEN = os.getenv("DESKTOP_FCM_TOKEN")
IPHONE_FCM_TOKEN = os.getenv("IPHONE_FCM_TOKEN")
FCM_SECRETS_DIR = os.getenv("FCM_SECRETS_DIR", "pagentServiceAccountKey.json")
APP_IDENTIFIER = os.getenv("APP_IDENTIFIER")
STORAGE_PATH = os.getenv("STORAGE_PATH")
VDB_DEST = os.getenv("VDB_DEST")
UPLOAD_DIR = os.getenv("UPLOAD_DIR")
GCAL_TOKEN_FILEPATH = os.getenv("GCAL_TOKEN_FILEPATH")
BETTER_STACK_TOKEN = os.getenv("BETTER_STACK_TOKEN")
BETTER_STACK_HOST = os.getenv("BETTER_STACK_HOST")
GCAL_SECRETS_FILENAME = os.getenv("GCAL_SECRETS_FILENAME")
SECRETS_DIR = os.getenv("SECRETS_DIR")
SERVICE_ACCOUNT_KEY = os.getenv("SERVICE_ACCOUNT_KEY")