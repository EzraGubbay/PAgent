import os
import json
from uuid import UUID

from .base import OAuthProvider

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

        google_secrets = integrations.get_google_secrets()
        google_client_id = google_secrets.client_id
        google_client_secret = google_secrets.client_secret

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

        try:
            return id_token.verify_oauth2_token(
                tokens["id_token"],
                google_requests.Request(),
                google_client_id
            )

        except ValueError:
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
        

def get_google_secrets() -> Credentials:
    with open(GCAL_SECRETS_FILENAME, 'r') as f:
        return json.load(f)

def get_gcal_creds(uid: UUID, integration: str):
    return Credentials(
        token=None,
        refresh_token=db.get_user_refresh_token(uid, "google"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=get_google_secrets().client_id,
        client_secret=get_google_secrets().client_secret,
        scopes=GOOGLE_SCOPES
    )