from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, disconnect
import socketio
from llm_service import LLMClient
from db import DBManager
from firebase import generate_notification
import threading
from data_types import MessageType
from dotenv import load_dotenv
import os

load_dotenv()
LLM_MODEL = os.getenv("LLM_MODEL")
CHAT_SIZE_LIMIT = 300
TEST_MOBILE_FCM_TOKEN = os.getenv("IPHONE_FCM_TOKEN")
APP_IDENTIFIER = os.getenv("APP_IDENTIFIER")
app = Flask(__name__)

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    message_queue='redis://127.0.0.1:6379',
    async_mode='eventlet',
    max_http_buffer_size=10 * 1024 * 1024
)

dbmanager = DBManager()
client = LLMClient(model=LLM_MODEL, chat_size_limit=CHAT_SIZE_LIMIT)

connected_users = {}

"""
API:
1. Connect
2. Identify
3. Disconnect
4. Send prompt to LLM
"""
@socketio.on('connect')
def connect(auth):
    if not auth:
        auth = request.args
        
    uid = auth.get("uid")
    print(f'Received Auth Info: {auth}')

    if uid:
        message_queue = dbmanager.dequeueMessageQueue(uid)
        print(message_queue)
        if message_queue:
            print(f"[DEBUG-CONNECT] Messages found in user {uid} message queue. Unloading to client...")
            for payload in message_queue:
                print(f"[DEBUG-CONNECT] Unloading message: {payload}")
                socketio.emit('llm_response', {'status': 'success', 'response': payload}, to=request.sid)
    else:
        print(f"[SOCKET-CONNECT] New Anonymous connection @ {request.sid} (Waiting for Login)")
        return True

    connected_users[uid] = request.sid
    print(f"[SOCKET-CONNECT] New connection from User: {uid} @ {request.sid}")

@socketio.on('disconnect')
def disconnect():
    for uid, sid, in list(connected_users.items()):
        if sid == request.sid:
            del connected_users[uid]
            print(f"[SOCKET-DISCONNECT] Application backgrounded or closed by User: {uid} @ {sid}")

@socketio.on('registerUser')
def registerUser(data):
    print("Received user registration request")

    username = data.get('username')
    passhash = data.get("passhash")
    status, response = dbmanager.create_user(username=username, passhash=passhash)

    if status:
        socketio.emit('auth_response', {'status': 'success', 'response': response}, to=request.sid)
        print("Registration successful. DB Response: ", response)
    else:
        socketio.emit('auth_response', {'status': 'error', 'response': response}, to=request.sid)
        print('Failed to register user. DB Response: ', response)

@socketio.on('login')
def login(auth):

    username = auth.get('username')
    passhash = auth.get("passhash")
    status, response = dbmanager.login(username=username, passhash=passhash)
    if status:
        socketio.emit('auth_response', {'status': 'success', 'uid': response}, to=request.sid)
    else:
        socketio.emit('auth_response', {'status': 'error', 'uid': response}, to=request.sid)

@app.route('/sendMessage', methods=['POST'])
def send_message():
    data = request.get_json()
    print("Received send message request from user")
        
    uid = data.get("uid")
    event = 'llm_response'
    notificationToken = data.get("notificationToken")

    if not uid:
        print(f"[CLIENT-ERR] No user ID provided in call to sendMessage")
        return False

    print("Starting background task to process LLM response")
    llm_result = client.sendMessage(prompt=data.get("prompt"), attachments=data.get('attachments'))
    payload = {
        'message': llm_result,
        'type': MessageType.Assistant
    }
    
    if uid in connected_users:
        print(f"[MSG-DIRECT] User {uid} is foregrounded - sending via WebSocket. ")
        print(f"Emitting to user: {uid} the following response from LLM: {llm_result}")
        socketio.emit(event, {'response': payload}, to=connected_users[uid])
    else:
        print(f"[MSG-NOTIFY] User {uid} is backgrounded - sending via Web Push. ")
        dbmanager.insertMessageQueue(uid=uid, payload=payload)

        print(data.get('notify'))
        if data.get('notify'):
            notification = {
                'title': "PAgent",
                'body': llm_result if len(llm_result) < 50 else llm_result[:50],
                'data': {
                    'app': APP_IDENTIFIER,
                    'type': payload.get('type'),
                }
            }
            generate_notification(notificationToken, notification)
    return {'status': 'success', 'response': payload}

@app.route('/loadNewChat', methods=['POST'])
def loadNewChat():
    global client
    data = request.get_json()
    uid = data.get('uid')
    print(f'[SRV-DBG] Received remoteChatErase request from user {uid}')
    if not uid:
        print(f"[CLIENT-ERR] No user ID provided in call to loadNewChat")
        return {'status': 'error', 'response': 'No valid UID provided'}
    
    elif dbmanager.isValidUserID(uid):
        client = LLMClient(model=LLM_MODEL, chat_size_limit=CHAT_SIZE_LIMIT)
        return {'status': 'success', 'response': 'Successfully loaded new chat'}
    else:
        print(f"[CLIENT-ERR] Invalid user ID provided in call to loadNewChat")
        return {'status': 'error', 'response': 'No valid UID provided'}

@socketio.on('registerNotificationToken')
def registerNotificationToken(data):
    if not data:
        data = request.args
        
    uid = data.get("uid")

    if not uid:
        print(f"[CLIENT-ERR] No user ID provided in call to registerNotificationToken")
        return False
    token = data.get('notificationToken')
    dbresult = dbmanager.addNotificationToken(uid, token)

    message_type = 'notification token registration'
    if dbresult:
        respond(
            message_type=message_type,
            uid=uid,
            sid=request.sid,
            payload={'message': "Successfully registered for PAgent notifications!", 'type': MessageType.System}
        )
    else:
        socketio.emit(message_type, {'response': "Error registering user for notifications"}, to=request.sid)


def respond(message_type, uid, sid, payload):

    message_type = 'notification token registration'
    if sid in connected_users:
        print(f"[MSG-DIRECT] User {uid} is foregrounded - sending via WebSocket. ")
        socketio.emit(message_type, {'response': payload}, to=connected_users[uid])
    else:
        print(f"[MSG-NOTIFY] User {uid} is backgrounded - sending via Web Push. ")

        notification = {
            'title': "PAgent",
            'body': payload.get('message'),
            'data': {
                'app': APP_IDENTIFIER,
                'type': payload.get('type'),
            }
        }
        generate_notification(notificationToken, notification)

# if __name__ == '__main__':
    # socketio.run(app, host='0.0.0.0', port=8000)
