from pydantic import BaseModel
from typing import Union

# ----- DATA MODELS -----

class AuthPayload(BaseModel):
    username: str
    passwordHash: str

class SendMessageRequest(BaseModel):
    uid: str
    prompt: str
    notificationToken: Union[str, None] = None
    
class RegisterNotificationTokenRequest(BaseModel):
    uid: str
    notificationToken: str

class ResetChatRequest(BaseModel):
    uid: str