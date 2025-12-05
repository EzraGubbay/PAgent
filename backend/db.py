import pymongo
from dotenv import load_dotenv
import os
import uuid
from uuid import UUID
from typing import Dict
from bson.binary import UuidRepresentation

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("PAGENT_DB_NAME")

class DBManager():
    def __init__(self):
        try:
            self.client = pymongo.MongoClient(MONGO_URL, uuidRepresentation='standard')
            self.db = self.client[DB_NAME]
            self.users = self.db["users"]
            # self.db.drop_collection('users')

        except Exception as e:
            print(f"[DB-ERR] Error initializing MongoDB Client:\n{e}")

    def create_user(self, username: str, passhash: str) -> bool:
        try:
            exists = self.users.find_one({
                "username": username
            })
            print(exists)
            if exists:
                return False, "Username taken. Please choose a different username"
        except Exception as e:
            print(f"[DB-ERR] Error inserting new user in database {DB_NAME}:\n{e}")
            return False, "Error registering user..."

        uid = str(uuid.uuid4())
        new_user = {
            "uid": uid,
            "username": username,
            "passhash": passhash,
            "notificationToken": "",
            "messageQueue": [],
            "userOnline": True,
        }

        try:
            self.users.insert_one(new_user)
            return True, uid
        except Exception as e:
            print(f"[DB-ERR] Error inserting new user in database {DB_NAME}:\n{e}")
            return False, "Error registering user..."
    
    def login(self, username: str, passhash: str) -> bool:
        query = {
            'username': username,
            'passhash': passhash,
        }

        response = self.users.find_one(query)
        if response:
            return True, response.get('uid')
        return False, 'User not found'
    
    def addNotificationToken(self, uid, token) -> bool:
        query = {
            'uid': uid
        }
        try:
            response = self.users.find_one(query)
            if response:
                response["notificationToken"] = token
                self.users.update_one(filter=query, update=response)
            else:
                raise Error(f"[DB-ERR] User not found in database {DB_NAME} when adding notification token (?!?!)")
            return True
        except Exception as e:
            print(e)
            return False
    
    def insertMessageQueue(self, uid: UUID, payload) -> bool:
        print(f"[DB-DEBUG] Running message queue insertion for message: \n{payload}")
        query = {
            'uid': uid
        }
        try:
            response = self.users.find_one(query)
            if response:
                response.get("messageQueue").append(payload)
                self.users.update_one(filter=query, update={ '$set': response })
                print(f"[DB-DEBUG] Message queue insertion complete.\nNew user data: {response}")
            else:
                raise Error(f"[DB-ERR] User not found in database {DB_NAME} when queueing message from server (?!?!)")
            return True
        except Exception as e:
            print(e)
            return False
    
    def dequeueMessageQueue(self, uid: UUID):
        query = {
            'uid': uid
        }
        try:
            response = self.users.find_one(query)
            if response:
                queue = response.get("messageQueue")
                response['messageQueue'] = []
                self.users.update_one(filter=query, update={ '$set': response })
                return queue
            else:
                raise Error(f"[DB-ERR] User not found in database {DB_NAME} when dequeuing message queue from server (?!?!)")
        except Exception as e:
            print(e)
            return None
    
    def isValidUserID(self, uid: UUID) -> bool:
        user = self.users.find_one({
            'uid': uid
        })

        if user:
            print(f'[DB-DBG] User ID {uid} is valid')
            return True
        return False