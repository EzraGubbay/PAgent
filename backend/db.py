import pymongo
from dotenv import load_dotenv
import os
import uuid
from uuid import UUID
from typing import Dict
from bson.binary import UuidRepresentation
import auth

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("PAGENT_DB_NAME")

def get_user(func):
    def wrapper(self, uid: UUID, *args, **kwargs):
        try:
            response = self.users.find_one({
                'uid': uid
            })
            if not response:
                raise Error(f"[DB-ERR] User ID {uid} not found in database {DB_NAME} in call to {func.__name__}")
        except Exception as e:
            print(e)
            return False, e
        
        return True, func(response, *args, **kwargs)

class DBManager():
    def __init__(self):
        try:
            self.client = pymongo.MongoClient(MONGO_URL, uuidRepresentation='standard')
            self.db = self.client[DB_NAME]
            self.users = self.db["users"]
            # self.db.drop_collection('users')

        except Exception as e:
            print(f"[DB-ERR] Error initializing MongoDB Client:\n{e}")

    def create_user(self, username: str, passwordHash: str) -> bool:

        # --- Check if user with that username already exists. ---
        try:
            exists = self.users.find_one({
                "username": username
            })
            print(exists)
            if exists:
                # If a user already exists, with that username, return False and error message
                return False, "Username taken. Please choose a different username"
        except Exception as e:
            print(f"[DB-ERR] Error inserting new user in database {DB_NAME}:\n{e}")
            return False, "Error registering user..."

        # --- Generate a new UUID for the user. ---
        uid = str(uuid.uuid4())

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
            return True, uid
        except Exception as e:
            print(f"[DB-ERR] Error inserting new user in database {DB_NAME}:\n{e}")
            return False, "Error registering user..."
    
    def login(self, username: str, passwordHash: str) -> bool:
        query = {
            'username': username,
        }

        response = self.users.find_one(query)
        if response and auth.verify_password(submitted_password=passwordHash, stored_password=response.get('passwordHash')):
            return True, response.get('uid')
        return False, 'Invalid username or password'
    
    @get_user
    def addNotificationToken(self, response: Dict, token) -> bool:
        """
        Registers a user's notification token.
        Saves the token in the user's document in the database.
        """
        
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
            raise Error(f"[DB-ERR] User {response.get('uid')} does not have a registered notification token")
    
    def insertMessageQueue(self, user: Dict, message: Dict) -> bool:
        """
        Inserts a message into the user's message queue.
        Used to cache messages to be sent to the user when they connect to the server.
        
        Returns:
            bool: True if the message was successfully inserted, False otherwise.
        """

        print(f"[DB-DEBUG] Running message queue insertion for message: \n{message}")
        response.get("messageQueue").append(message)
        self.users.update_one(filter={'uid': uid}, update={ '$set': response })
        print(f"[DB-DEBUG] Message queue insertion complete.\nNew user data: {response}")
        return True
    
    @get_user
    def dequeueMessageQueue(self, response: Dict):
        """
        Flushes user message queue and before returning it.
        
        Used for when user connects to server, to retrieve any messages
        that were sent while they were offline.
        """

        queue = response.get("messageQueue")
        response['messageQueue'] = []
        self.users.update_one(filter={'uid': response.get('uid')}, update={ '$set': response })
        return queue
    
    def isValidUserID(self, uid: UUID) -> bool:
        user = self.users.find_one({
            'uid': uid
        })

        if user:
            print(f'[DB-DBG] User ID {uid} is valid')
            return True
        return False