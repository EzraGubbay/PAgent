
import os
import sys
import uuid
import logging
from unittest.mock import MagicMock

# Mock env vars
os.environ["MONGO_URL"] = "mongodb+srv://mock_url"
os.environ["PAGENT_DB_NAME"] = "mock_db"
os.environ["BETTER_STACK_TOKEN"] = "" # Empty to force console logging

# Add backend to path
sys.path.append(os.getcwd())

try:
    from backend.app.core.logger import configure_logger, logger
    from backend.app.db.manager import DBManager
except ImportError as e:
    # Try adjusting path if run from root
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from backend.app.core.logger import configure_logger, logger
    from backend.app.db.manager import DBManager

# Configure logger
configure_logger()

# Mock Mongo client to avoid actual network calls
import pymongo
pymongo.MongoClient = MagicMock()

def test_logging():
    print("--- Starting Logging Test ---")
    try:
        db = DBManager()
        # Should log "db_initialized"
        
        # Test 1: create_user (mocked)
        db.users.find_one.return_value = None # No existing user
        db.users.insert_one.return_value = True
        
        success, uid = db.create_user("testuser", "hashedpw")
        print(f"Create User: Success={success}, UID={uid}")
        # Should log "db_create_user_attempt" -> "db_create_user_success"

        # Test 2: isValidUserID
        db.users.find_one.return_value = {'uid': uid}
        valid = db.isValidUserID(uid)
        print(f"Is Valid User: {valid}")
        # Should log "db_user_id_valid"

        # Test 3: get_user decorator failure
        db.users.find_one.return_value = None
        try:
            # We need to simulate the call signature expected by the wrapper
            # wrapper(self, uid, *args)
            # The method signature is (self, response, token) for addNotificationToken
            # But we call it as db.addNotificationToken(uid=..., token=...) usually if adapted?
            # Wait, the decorator does: wrapper(self, uid, ...)
            # So we call db.addNotificationToken(uid, token)
            db.addNotificationToken(uid, "some_token")
        except Exception as e:
            print(f"Caught expected error: {id(e)} - {str(e)}")
            # Should log "db_user_not_found"

    except Exception as e:
        print(f"TEST FAILED with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_logging()
