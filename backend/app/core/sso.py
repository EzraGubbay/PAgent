from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException
from app.core.logger import logger
from app.api.integrations.google import get_google_secrets

def verify_google_token(token: str) -> dict:
    struct_logger = logger.bind(func_call="verify_google_token")
    try:
        secrets = get_google_secrets()
        client_config = secrets.get("web") or secrets.get("installed", {})
        client_id = client_config.get("client_id")

        if not client_id:
            struct_logger.error("google_client_id_missing")
            raise Exception("Google Client ID is missing from configuration.")

        id_info = id_token.verify_oauth2_token(token, requests.Request(), client_id)
        
        struct_logger.info("google_sso_token_verified", email=id_info.get("email"))
        return id_info
    except ValueError as e:
        struct_logger.error("google_sso_verification_failed", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid Google authentication token.")
    except Exception as e:
        struct_logger.error("google_sso_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error verifying Google token.")
