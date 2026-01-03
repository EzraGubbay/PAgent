import firebase_admin
from firebase_admin import credentials
from firebase_admin import messaging
import os
from dotenv import load_dotenv

load_dotenv()
# os.chdir(os.getenv("FCM_SECRETS_DIR"))

# 1. Initialize the app (only do this once in your main script)
# Replace path with the actual location of your JSON key
cred = credentials.Certificate(os.getenv("FCM_SECRETS_DIR"))
firebase_admin.initialize_app(cred)

def generate_notification(notificationToken, notification):
    # 2. Construct the message
    # Note: For PWA on iOS, we use the 'webpush' config
    message = messaging.Message(
        token=notificationToken,
        notification=messaging.Notification(
            title=notification.get('title'),
            body=notification.get('body'),
        ),
        webpush=messaging.WebpushConfig(
            headers={
                "Urgency": "high"
            },
            fcm_options=messaging.WebpushFCMOptions(
                link="https://notification-hub.ezragubbay.com/" # Opens the app when clicked
            )
        )
    )

    # 3. Send it
    try:
        response = messaging.send(message)
        print('[FCM-OK] Successfully sent message:', response)
    except Exception as e:
        print('[FCM-ERR] Error sending message:', e)

# --- HOW TO USE IT ---
# You need the token from your React App (Step 4 below)
MY_IPHONE_TOKEN = os.getenv("IPHONE_FCM_TOKEN")
