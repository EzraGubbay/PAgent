import os
from google.oauth2.credentials import Credentials

class AuthManager:
    """
    Handles authentication for Google Calendar and Todoist.
    Currently supports a test mode with direct token injection.
    """
    def __init__(self, todoist_token=None, gcal_token=None, gcal_refresh_token=None, client_id=None, client_secret=None):
        self._todoist_token = todoist_token or os.getenv("TODOIST_API_TOKEN")
        self._gcal_token = gcal_token or os.getenv("GOOGLE_CALENDAR_TOKEN")
        self._gcal_refresh_token = gcal_refresh_token or os.getenv("GOOGLE_CALENDAR_REFRESH_TOKEN")
        self._client_id = client_id or os.getenv("GOOGLE_CLIENT_ID")
        self._client_secret = client_secret or os.getenv("GOOGLE_CLIENT_SECRET")

    def get_todoist_token(self):
        """Returns the Todoist API token."""
        if not self._todoist_token:
            raise ValueError("Todoist token not provided. Set TODOIST_API_TOKEN env var or pass to constructor.")
        return self._todoist_token

    def get_gcal_credentials(self):
        """
        Returns Google Calendar credentials object.
        """
        #if not self._gcal_token:
        #    raise ValueError("Google Calendar token not provided. Set GOOGLE_CALENDAR_TOKEN env var or pass to constructor.")
        
        # Create a Credentials object. 
        # In a real app, you'd likely load this from a file or DB and handle refresh flows.
        # Here we assume we have at least an access token.
        
        # Determine the path to token.json. 
        # Assuming token.json is in the backend/ directory (parent of gemini_tools_lib)
        # or in the current working directory.
        token_path = os.getenv("GCAL_TOKEN_FILEPATH")
        if not os.path.exists(token_path):
            # Try looking in the parent directory if we are inside gemini_tools_lib context
            token_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "token.json")
            
        if not os.path.exists(token_path):
             # Fallback to the hardcoded relative path if logic fails, or raise error
             token_path = "../token.json"

        creds = Credentials.from_authorized_user_file(token_path)
        return creds
