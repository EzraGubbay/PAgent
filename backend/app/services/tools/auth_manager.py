import os
from google.oauth2.credentials import Credentials
from app.core.config import TODOIST_API_KEY, GCAL_TOKEN_FILEPATH

class AuthManager:
    """
    Handles authentication for Google Calendar and Todoist.
    Currently supports a test mode with direct token injection.
    """
    def __init__(self, uid: str, todoist_token=None, gcal_token=None, gcal_refresh_token=None, client_id=None, client_secret=None):
        self._uid = uid
        self._todoist_token = TODOIST_API_KEY
        self._gcal_token = gcal_token or os.getenv("GOOGLE_CALENDAR_TOKEN")
        self._gcal_refresh_token = gcal_refresh_token or os.getenv("GOOGLE_CALENDAR_REFRESH_TOKEN")
        self._client_id = client_id or os.getenv("GOOGLE_CLIENT_ID")
        self._client_secret = client_secret or os.getenv("GOOGLE_CLIENT_SECRET")

    def get_todoist_token(self):
        """Returns the Todoist API token."""
        if not self._todoist_token:
            raise ValueError("Todoist token not provided. Set TODOIST_API_TOKEN env var or pass to constructor.")
        return self._todoist_token

    async def get_gcal_credentials_async(self):
        """
        Returns Google Calendar credentials object asynchronously.
        """
        from app.api.integrations.google import get_gcal_creds
        from app.core.logger import logger
        
        struct_logger = logger.bind(func_call="AuthManager.get_gcal_credentials_async", user_id=self._uid)
        struct_logger.info("auth_manager_fetching_google_creds_from_db")
        creds = await get_gcal_creds(self._uid)
        
        if not creds:
             struct_logger.warn("auth_manager_no_google_creds_returned")
        
        return creds
