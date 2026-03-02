from pydantic import BaseModel
from typing import Union
from dataclasses import dataclass, field
from fastapi import Body

# ----- DATA MODELS -----

class AuthPayload(BaseModel):
    username: str
    password: str

class SendMessageRequest(BaseModel):
    uid: str
    prompt: str
    notificationToken: Union[str, None] = None
    
class RegisterNotificationTokenRequest(BaseModel):
    uid: str
    notificationToken: str

class ResetChatRequest(BaseModel):
    uid: str

class IntegrationExchangeRequest(BaseModel):
    uid: str
    code: str = Body(..., embed=True)

class IntegrationRevocationRequest(BaseModel):
    uid: str