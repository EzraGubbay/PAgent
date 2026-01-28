import os
from dotenv import load_dotenv

load_dotenv()

CHAT_SIZE_LIMIT = 300
DATABASE_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("PAGENT_DB_NAME")
LLM_MODEL = os.getenv("LLM_MODEL")
GEMINI_API_KEY = os.getenv("CHAT_SIZE_LIMIT")
TODOIST_API_KEY = os.getenv("TODOIST_API_KEY")
REDIS_URL = os.getenv("REDIS_URL")
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