from pydantic import BaseModel
from typing import Union
from dataclasses import dataclass, field
from fastapi import Body, Response

# ----- AUTHENTICATION -----

class AuthPayload(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    idToken: str

class AuthResponse(BaseModel):
    status: bool
    accessToken: str | None = None
    refreshToken: str | None = None
    detail: str | None = None

class JWTPayload(BaseModel):
    sub: str
    exp: int
    type: str

# ----- NOTIFICATIONS -----

class RegisterNotificationTokenRequest(BaseModel):
    notificationToken: str

# ----- AGENT CHAT -----

class SendMessageRequest(BaseModel):
    prompt: str
    notificationToken: Union[str, None] = None

# ----- INTEGRATIONS -----

class IntegrationExchangeRequest(BaseModel):
    code: str = Body(..., embed=True)