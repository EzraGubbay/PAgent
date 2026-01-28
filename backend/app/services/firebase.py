import firebase_admin
from firebase_admin import credentials
from firebase_admin import messaging
from app.core.config import FCM_SECRETS_DIR, SERVICE_ACCOUNT_KEY, IPHONE_FCM_TOKEN

# 1. Initialize the app (only do this once in your main script)
# Replace path with the actual location of your JSON key
cred = credentials.Certificate(SERVICE_ACCOUNT_KEY)
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
