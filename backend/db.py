import pymongo
from dotenv import load_dotenv
import os
import uuid
from uuid import UUID
from typing import Dict
from bson.binary import UuidRepresentation
import auth
from functools import wraps
from logger_config import logger

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("PAGENT_DB_NAME")

from logger_config import logger

def get_user(func):
    @wraps(func)
    def wrapper(self, uid: UUID, *args, **kwargs):
        struct_logger = logger.bind(func_call=func.__name__, user_id=str(uid))
        response = self.users.find_one({
            'uid': uid
        })
        if not response:
            struct_logger.error("db_user_not_found")
        
        return func(self, response, *args, **kwargs)
    return wrapper

class DBManager():
    def __init__(self):
        try:
            self.client = pymongo.MongoClient(MONGO_URL, uuidRepresentation='standard')
            self.db = self.client[DB_NAME]
            self.users = self.db["users"]
            # self.db.drop_collection('users')
            logger.info("db_initialized", db_name=DB_NAME)

        except Exception as e:
            logger.critical("db_init_failed", error=str(e))

    def create_user(self, username: str, passwordHash: str) -> bool:
        struct_logger = logger.bind(username=username)
        struct_logger.info("db_create_user_attempt")

        # --- Check if user with that username already exists. ---
        try:
            exists = self.users.find_one({
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

        new_user = {
            "uid": uid,
            "username": username,
            "passwordHash": passwordHash,
            "notificationToken": "",
            "messageQueue": [],
        }

        try:
            # If user is successfully inserted, return True and the user's UUID
            self.users.insert_one(new_user)
            struct_logger.info("db_create_user_success")
            return True, uid
        except Exception as e:
            struct_logger.error("db_create_user_insert_failed", error=str(e))
            return False, "Error registering user..."
    
    def login(self, username: str, passwordHash: str) -> bool:
        struct_logger = logger.bind(username=username)
        struct_logger.info("db_login_attempt")

        query = {
            'username': username,
        }

        response = self.users.find_one(query)
        if response and auth.verify_password(submitted_password=passwordHash, stored_password=response.get('passwordHash')):
            struct_logger.info("db_login_success", user_id=response.get('uid'))
            return True, response.get('uid')
        
        struct_logger.warn("db_login_failed")
        return False, 'Invalid username or password'
    
    @get_user
    def addNotificationToken(self, response: Dict, token) -> bool:
        """
        Registers a user's notification token.
        Saves the token in the user's document in the database.
        """
        
        # Note: uid is bound in the decorators wrapper
        logger.info("db_add_notification_token")
        response["notificationToken"] = token
        self.users.update_one(filter={'uid': response.get('uid')}, update=response)
        return True

    @get_user
    def getNotificationToken(self, response: Dict) -> str:
        """
        Returns the user's notification token.

        If the user doesn't have a notification token stored in the system, raises an error.
        """
        
        token = response.get("notificationToken")
        if token:
            return True, token
        else:
            logger.error("db_get_notification_token_missing", user_id=response.get('uid'))
            raise Error(f"[DB-ERR] User {response.get('uid')} does not have a registered notification token")
    
    def insertMessageQueue(self, user: Dict, message: Dict) -> bool:
        """
        Inserts a message into the user's message queue.
        Used to cache messages to be sent to the user when they connect to the server.
        
        Returns:
            bool: True if the message was successfully inserted, False otherwise.
        """

        uid = user.get('uid')
        struct_logger = logger.bind(user_id=uid)
        struct_logger.debug("db_insert_message_queue_attempt", message=message)
        
        user.get("messageQueue").append(message)
        self.users.update_one(filter={'uid': uid}, update={ '$set': user })
        
        struct_logger.info("db_message_queue_updated")
        return True
    
    @get_user
    def dequeueMessageQueue(self, response: Dict):
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
        self.users.update_one(filter={'uid': response.get('uid')}, update={ '$set': response })
        return queue
    
    def isValidUserID(self, uid: UUID) -> bool:
        struct_logger = logger.bind(user_id=str(uid))
        user = self.users.find_one({
            'uid': uid
        })

        if user:
            struct_logger.debug("db_user_id_valid")
            return True
        
        struct_logger.warn("db_user_id_invalid")
        return False