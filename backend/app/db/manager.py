from dataclasses import dataclass, field, asdict
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from uuid import UUID
from typing import Dict, List
from bson.binary import UuidRepresentation
import app.core.security
from functools import wraps
from app.core.logger import logger

# Import environment variables
from app.core.config import DATABASE_URL, DB_NAME

@dataclass
class Integration:
    integration_user_id: str
    refresh_token: str
    access_token: str

@dataclass
class User:
    uid: UUID
    email: str
    passwordHash: bytes
    notificationToken: str
    refreshToken: str = ""
    messageQueue: List[Dict] = field(default_factory=list)
    integrations: Dict[str, Integration] = field(default_factory=dict)


def get_user(func):
    @wraps(func)
    async def wrapper(self, uid: UUID, *args, **kwargs):
        struct_logger = logger.bind(func_call=func.__name__, user_id=str(uid))
        response = await self.users.find_one({
            'uid': uid
        })
        if not response:
            struct_logger.error("db_user_not_found")
            return False, "User not found"
        
        return await func(self, response, *args, **kwargs)
    return wrapper

class DBManager():
    def __init__(self):
        try:
            self.client = AsyncIOMotorClient(DATABASE_URL, uuidRepresentation="standard")
            self.db = self.client[DB_NAME]
            self.users = self.db["users"]
            logger.info("db_initialized", db_name=DB_NAME)

        except Exception as e:
            logger.critical("db_init_failed", error=str(e))

    async def create_user(self, email: str, password: str) -> bool:
        struct_logger = logger.bind(email=email)
        struct_logger.info("db_create_user_attempt")

        # --- Check if user with that email already exists. ---
        try:
            exists = await self.users.find_one({
                "email": email
            })
            if exists:
                struct_logger.warn("db_create_user_email_taken")
                # If a user already exists, with that email, return False and error message
                return False, "email taken. Please choose a different email"
        except Exception as e:
            struct_logger.error("db_create_user_error", error=str(e))
            return False, "Error registering user..."

        # --- Generate a new UUID for the user. ---
        uid = str(uuid.uuid4())
        struct_logger = struct_logger.bind(user_id=uid)

        new_user: User = User(
            uid=uid,
            email=email,
            passwordHash=app.core.security.hash_password(password),
            notificationToken="",
            refreshToken="",
            messageQueue=[],
            integrations={},
        )

        try:
            # If user is successfully inserted, return True and the user's UUID
            await self.users.insert_one(asdict(new_user))
            struct_logger.info("db_create_user_success")
            return True, uid
        except Exception as e:
            struct_logger.error("db_create_user_insert_failed", error=str(e))
            return False, "Error registering user..."
    
    async def login(self, email: str, password: str) -> bool:
        struct_logger = logger.bind(email=email)
        struct_logger.info("db_login_attempt")

        query = {
            'email': email,
        }

        response = await self.users.find_one(query)
        
        if not response:
            struct_logger.warn("db_login_failed_user_not_found")
            return False, 'Invalid email or password'
            
        stored_hash = response.get('passwordHash')
        
        struct_logger.warn("debug_db_login_response", found_user=True)
        
        try:
            if app.core.security.verify_password(submitted_password=password, stored_password=stored_hash):
                struct_logger.info("db_login_success", user_id=response.get('uid'))
                return True, response.get('uid')
            else:
                struct_logger.warn("db_login_failed_password_mismatch")
        except Exception as e:
            struct_logger.error("db_login_bcrypt_error", error=str(e))
        
        return False, 'Invalid email or password'

    async def find_or_create_sso_user(self, email: str) -> bool:
        """
        Returns (success, uid or error message).
        Used for seamless SSO registrations and logins.
        """
        struct_logger = logger.bind(email=email)
        
        # Check if user exists
        try:
            response = await self.users.find_one({"email": email})
            if response:
                struct_logger.info("db_sso_login_success", user_id=response.get("uid"))
                return True, response.get("uid")
        except Exception as e:
            struct_logger.error("db_sso_find_user_error", error=str(e))
            return False, "Database error finding user"
            
        # If user does not exist, create one
        struct_logger.info("db_sso_register_new_user")
        uid = str(uuid.uuid4())
        
        new_user: User = User(
            uid=uid,
            email=email,
            passwordHash=b'', # No password since SSO
            notificationToken="",
            refreshToken="",
            messageQueue=[],
            integrations={},
        )
        
        try:
            await self.users.insert_one(asdict(new_user))
            struct_logger.info("db_sso_create_user_success", user_id=uid)
            return True, uid
        except Exception as e:
            struct_logger.error("db_sso_insert_failed", error=str(e))
            return False, "Error registering SSO user..."

    @get_user
    async def addNotificationToken(self, response: Dict, token) -> bool:
        """
        Registers a user's notification token.
        Saves the token in the user's document in the database.
        """
        
        # Note: uid is bound in the decorators wrapper
        logger.info("db_add_notification_token")
        response["notificationToken"] = token
        await self.users.update_one(filter={'uid': response.get('uid')}, update={ "$set": response })
        return True

    @get_user
    async def getNotificationToken(self, response: Dict) -> str:
        """
        Returns the user's notification token.

        If the user doesn't have a notification token stored in the system, raises an error.
        """
        
        token = response.get("notificationToken")
        if token:
            return True, token
        else:
            logger.error("db_get_notification_token_missing", user_id=response.get('uid'))
            
    async def update_refresh_token(self, uid: UUID | str, token: str) -> bool:
        """
        Updates the user's refresh token in the database.
        """
        struct_logger = logger.bind(user_id=str(uid))
        try:
            await self.users.update_one(
                filter={'uid': str(uid)},
                update={'$set': {'refreshToken': token}}
            )
            struct_logger.info("db_update_refresh_token_success")
            return True
        except Exception as e:
            struct_logger.error("db_update_refresh_token_failed", error=str(e))
            return False

    @get_user
    async def get_refresh_token(self, response: Dict) -> str:
        """
        Returns the user's refresh token.
        """
        return response.get("refreshToken")
    
    async def insertMessageQueue(self, uid: UUID, message: Dict) -> bool:
        """
        Inserts a message into the user's message queue.
        Used to cache messages to be sent to the user when they connect to the server.
        
        Returns:
            bool: True if the message was successfully inserted, False otherwise.
        """

        struct_logger = logger.bind(user_id=uid)
        struct_logger.debug("db_insert_message_queue_attempt", message=message)
        
        await self.users.update_one(filter={'uid': uid}, update={ '$push': { 'messageQueue': message } })
        
        struct_logger.info("db_message_queue_updated")
        return True
    
    @get_user
    async def dequeueMessageQueue(self, response: Dict):
        """
        Flushes user message queue and before returning it.
        
        Used for when user connects to server, to retrieve any messages
        that were sent while they were offline.
        """

        queue = response.get("messageQueue")
        count = len(queue)
        
        # Note: uid is bound in the decorator
        logger.info("db_dequeue_message_queue", message_count=count)

        response['messageQueue'] = []
        await self.users.update_one(filter={'uid': response.get('uid')}, update={ '$set': response })
        return queue

    # ----- INTEGRATIONS -----
    async def update_user_integration(self, uid: UUID, provider: str, provider_user_id: str, tokens: Dict):
        struct_logger = logger.bind(provider=provider, provider_user_id=provider_user_id)
        try:
            await self.users.update_one(
                filter={'uid': uid},
                update={
                    '$set': {
                        f'integrations.{provider}': {
                            'provider_user_id': provider_user_id,
                            'refresh_token': tokens.get('refresh_token'),
                            'access_token': tokens.get('access_token')
                        }
                    }
                }
            )
            struct_logger.info("db_integration_tokens_updated")
            return True
        except Exception as e:
            struct_logger.error("db_integration_tokens_update_failed", error=str(e))
            return False

    @get_user
    async def get_user_integration(self, response: Dict, provider: str) -> Integration:
        integration = response.get('integrations', {}).get(provider, {})

        if not integration:
            logger.error("db_integration_not_found", provider=provider)
            return None
        
        return Integration(
            integration_user_id=integration.get('provider_user_id'),
            refresh_token=integration.get('refresh_token', ''),
            access_token=integration.get('access_token', '')
        )
    
    @get_user
    async def delete_user_integration(self, response: Dict, provider: str) -> bool:
        uid = response.get('uid')
        struct_logger = logger.bind(provider=provider)
        try:
            await self.users.update_one(
                filter={'uid': uid},
                update={
                    '$unset': {
                        f'integrations.{provider}': ""
                    }
                }
            )
            struct_logger.info("db_integration_deleted")
            return True
        except Exception as e:
            struct_logger.error("db_integration_delete_failed", error=str(e))
            return False
    
    async def isValidUserID(self, uid: UUID) -> bool:
        struct_logger = logger.bind(user_id=str(uid))
        user = await self.users.find_one({
            'uid': uid
        })

        if user:
            struct_logger.debug("db_user_id_valid")
            return True
        
        struct_logger.warn("db_user_id_invalid")
        return False


dbmanager = DBManager()