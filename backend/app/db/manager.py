from dataclasses import dataclass, field
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
class User:
    uid: UUID
    username: str
    passwordHash: bytes
    notificationToken: str
    messageQueue: List[Dict] = field(default_factory=list)


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

    async def create_user(self, username: str, passwordHash: str) -> bool:
        struct_logger = logger.bind(username=username)
        struct_logger.info("db_create_user_attempt")

        # --- Check if user with that username already exists. ---
        try:
            exists = await self.users.find_one({
                "username": username
            })
            if exists:
                struct_logger.warn("db_create_user_username_taken")
                # If a user already exists, with that username, return False and error message
                return False, "Username taken. Please choose a different username"
        except Exception as e:
            struct_logger.error("db_create_user_error", error=str(e))
            return False, "Error registering user..."

        # --- Generate a new UUID for the user. ---
        uid = str(uuid.uuid4())
        struct_logger = struct_logger.bind(user_id=uid)

        new_user: User = User(
            uid=uid,
            username=username,
            passwordHash=passwordHash.encode('utf-8'),
            notificationToken="",
            messageQueue=[],
        )

        try:
            # If user is successfully inserted, return True and the user's UUID
            await self.users.insert_one({
                "uid": new_user.uid,
                "username": new_user.username,
                "passwordHash": new_user.passwordHash,
                "notificationToken": new_user.notificationToken,
                "messageQueue": new_user.messageQueue,
            })
            struct_logger.info("db_create_user_success")
            return True, uid
        except Exception as e:
            struct_logger.error("db_create_user_insert_failed", error=str(e))
            return False, "Error registering user..."
    
    async def login(self, username: str, passwordHash: str) -> bool:
        struct_logger = logger.bind(username=username)
        struct_logger.info("db_login_attempt")

        query = {
            'username': username,
        }

        response = await self.users.find_one(query)
        
        if not response:
            struct_logger.warn("db_login_failed_user_not_found")
            return False, 'Invalid username or password'
            
        stored_hash = response.get('passwordHash')
        
        struct_logger.warn("debug_db_login_response", found_user=True)
        struct_logger.warn("debug_db_login_test_password_hash", test_hash=stored_hash)
        
        try:
            if app.core.security.verify_password(submitted_password=passwordHash, stored_password=stored_hash):
                struct_logger.info("db_login_success", user_id=response.get('uid'))
                return True, response.get('uid')
            else:
                struct_logger.warn("db_login_failed_password_mismatch", provided=passwordHash, stored=stored_hash)
        except Exception as e:
            struct_logger.error("db_login_bcrypt_error", error=str(e))
        
        return False, 'Invalid username or password'
    
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