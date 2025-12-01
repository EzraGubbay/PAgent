# Current configuration is to limit AI chats to 100-messages long
from flask import Flask, jsonify, request
from google import genai
from llm_service import LLMClient

app = Flask(__name__)
client = LLMClient(model="gemini-2.5-flash", chat_size_limit=100)

@app.route('/sendMessage', methods=['GET', 'POST'])
def home():
    prompt = request.get_json()
    print(prompt)
    assistant_response = client.sendMessage(prompt)
    return jsonify({"reply": assistant_response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)

