from pydantic import BaseModel

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