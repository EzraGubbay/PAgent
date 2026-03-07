import os
import json
from uuid import UUID

from app.core.logger import logger
from app.core.config import SECRETS_DIR, GCAL_SECRETS_FILENAME
from .base import OAuthProvider

from google.auth.transport import requests as google_requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2 import id_token

import httpx

GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
]

class GoogleProvider(OAuthProvider):

    async def exchange_code(self, code: str):

        google_secrets = get_google_secrets()
        client_config = google_secrets.get("web") or google_secrets.get("installed", {})
        google_client_id = client_config.get("client_id")
        google_client_secret = client_config.get("client_secret")

        token_data = {
            "code": code,
            "client_id": google_client_id,
            "client_secret": google_client_secret,
            "grant_type": "authorization_code",
            "redirect_uri": "",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=token_data
            )

        if response.status_code != 200:

            print(f"Google Exchange Failed: {response.text}")
            raise HTTPException(status_code=401, detail="Invalid Google auth code.")

        return response.json()
    
    def verify_identity(self, tokens: dict) -> str:
        struct_logger = logger.bind(provider="google")
        try:
            user_info = id_token.verify_oauth2_token(
                tokens["id_token"],
                google_requests.Request(),
                (get_google_secrets().get("web") or get_google_secrets().get("installed", {})).get("client_id")
            )
            struct_logger.info("google_identity_verified", provider_user_id=user_info.get("sub"))
            return user_info
        except ValueError as e:
            struct_logger.error("google_identity_verification_failed", error=str(e))
            raise HTTPException(status_code=401, detail="Invalid Google auth token.")

    async def revoke(self, refresh_token: str) -> bool:
        async with httpx.AsyncClient() as client:
            response: Response = await client.post(
                "https://oauth2.googleapis.com/revoke",
                params={"token": refresh_token}
            )

            if response.status_code != 200:
                return False
        return True

    def provider(self) -> str:
        return "google"
        

def get_google_secrets() -> dict:
    from app.core.config import GCAL_SECRETS_FILENAME
    
    # Check docker path first since that's where the volume is mounted, fall back to local relative path
    secrets_path = os.path.join('/app/secrets', GCAL_SECRETS_FILENAME)
    if not os.path.exists(secrets_path):
        secrets_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "secrets", GCAL_SECRETS_FILENAME)
        
    with open(secrets_path, 'r') as f:
        return json.loads(f.read())

async def get_gcal_creds(uid: UUID):
    from app.db.manager import dbmanager
    struct_logger = logger.bind(provider="google", user_id=str(uid))
    
    integration = await dbmanager.get_user_integration(uid=uid, provider="google")
    if not integration or not integration.access_token:
        print(integration.refresh_token)
        struct_logger.warn("google_credentials_not_found_in_db")
        return None

    struct_logger.info("google_credentials_fetched_from_db")
    secrets = get_google_secrets()
    client_config = secrets.get("web") or secrets.get("installed", {})
    
    return Credentials(
        token=integration.access_token,
        refresh_token=integration.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_config.get("client_id"),
        client_secret=client_config.get("client_secret"),
        scopes=GOOGLE_SCOPES
    )