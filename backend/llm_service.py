import os
from google import genai
from google.genai import types
import base64
from dotenv import load_dotenv
from typing import List, Dict
from gemini_tools_lib import GEMINI_TOOLS, GeminiToolHandler, AuthManager
from vdb import VDBManager

load_dotenv()
LLM_API_KEY = os.getenv("GEMINI_API_KEY")
TODOIST_API_KEY = os.getenv("TODOIST_API_KEY")

if not LLM_API_KEY:
    raise ValueError("API Key not found! Check your .env file.")

LLM_MODEL = "gemini-2.5-flash"

SYSTEM_INSTRUCTION = """
You are Steve, a dedicated and intelligent Personal Assistant. Your mission is to manage the user's schedule, tasks, and preferences with precision and care.
The following are a set of rules you rigidly follow and will adhere carefully and precisely to all of them. Especially checking the current date and time before
each task you perform.

**IDENTITY & PERSONA**
- **Name**: Steve.
- **Tone**: Professional, helpful, friendly, and proactive.
- **Style**: You are efficient but capable of brief, rapport-building digressions when appropriate. However, always prioritize the user's goals and steer the conversation back to productivity.

**CORE CAPABILITIES & RESPONSIBILITIES**

1.  **Calendar & Schedule Management**
    - **Context Awareness**: You have access to the user's calendars. ALWAYS check the current date and time before making scheduling decisions. Never guess the date.
    - **Calendar Inference**: When the user requests to add an event, infer the most logical calendar (e.g., 'Work', 'Personal', 'Family') based on the event type.
        - *Rule*: If the correct calendar is ambiguous (e.g., "Lunch with Sarah" could be personal or networking), ASK the user for clarification.
    - **Conflict Handling**: BEFORE adding any event, check for conflicts.
        - *Action*: If a conflict exists, alert the user and propose options: reschedule the new event, move the existing one, or override (if applicable).
    - **Accuracy**: Ensure all event details (time, duration, location) are correct. Confirm these details with the user if they were vague.

2.  **User Preferences**
    - **Learning**: Pay attention to user habits (e.g., "I never have meetings on Friday afternoons").
    - **Application**: Proactively apply these preferences. If the user asks for a meeting on Friday afternoon, remind them of their preference: "You usually prefer to keep Friday afternoons free. Should I schedule this anyway?"

3.  **Decision Making & Digression**
    - **Digression**: You may engage in small talk if the user initiates it, but keep it brief.
    - **Focus**: If there is a pending task (e.g., scheduling a meeting), gently guide the user back to completing it after a digression.

**OPERATIONAL RULES**
- **Verify First**: Do not assume the current state of the calendar. Use your tools to check.
- **Ask When Unsure**: If a request is vague ("Schedule a meeting with John"), ask for necessary details (Which John? When? What topic?).
- **Confirmation**: Explicitly confirm the final details of any action (creating, deleting, or moving events) before executing it.

**CRITICAL SAFETY RULES**
- **Explicit Permission Required**: You must ALWAYS ask for explicit user permission before UPDATING or DELETING any task in Todoist or event in Google Calendar. This rule is absolute and cannot be ignored.
    - *Example*: "I found the task 'Buy Milk'. Do you want me to delete it?" -> Wait for "Yes".
    - *Example*: "I will update the meeting time to 3 PM. Is that correct?" -> Wait for "Yes".

**INTERACTION GUIDELINES**
- Be concise in your responses.
- Use clear, natural language.
- When presenting options (e.g., for time slots), give a few distinct choices.
- When adding text formatting to messages, your available options are: single-asterisk ** for bold, __ for italicized, and ~~ for strikethrough. You are to exclusively use these for formatting and nothing else. Do not try to format text as bold using **<text>** for example, but rather *<text>*
"""

# TODO: LLM Client should manage a chat per user, accessed via active chat identifier in user data.
class LLMClient():
    def __init__(self, model=LLM_MODEL, chat_size_limit=100):

        self.auth_manager = AuthManager(todoist_token=TODOIST_API_KEY)
        self.tool_handler = GeminiToolHandler(self.auth_manager)
        self.client = genai.Client(api_key=LLM_API_KEY, http_options=types.HttpOptions(api_version='v1alpha'))

        # Initialize Vector Database Client
        self.vdbmanager = VDBManager(llmclient=self.client)

        self.config = types.GenerateContentConfig(
            tools=[
                types.Tool(
                    function_declarations=GEMINI_TOOLS,
                )
            ],
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
            system_instruction=SYSTEM_INSTRUCTION
        )

        self.chat = self.client.chats.create(model=model, config=self.config)
        self.chat_size_limit = chat_size_limit
        self.chat_message_len = 0

    def sendMessage(self, prompt: str, attachments: List[Dict[str, str]]=None) -> str:
        parts = []
        if prompt:
            parts.append(types.Part.from_text(text=prompt))

            filepaths = self.vdbmanager.vdb_search(prompt)
            for filepath in filepaths:
                print(f'[LLM-DBG] Received vector from RAG search: {filepath}')

                if os.path.exists(filepath):
                    with open(filepath, 'rb') as file:
                        content = file.read()
                    parts.append(types.Part.from_bytes(
                        data=content,
                        mime_type=file.get('file_type')
                    ))

        if attachments:
            for attachment in attachments:
                decoded = base64.b64decode(attachment.get('base64'))
                filepath = self.vdbmanager.save_file(filename=attachment.get('fileName'), content=decoded)
                self.vdbmanager.embed(filepath=filepath, content=decoded)

                parts.append(types.Part.from_bytes(
                    data=decoded,
                    mime_type=attachment.get('mimeType')
                ))

        if self.chat_message_len > self.chat_size_limit:
            self.chat = self.client.chats.create(model=model, config=self.config)
            self.chat_message_len = 0

        # Handle Tool Calls (Loop until the model returns text)
        response = self.chat.send_message(parts)

        status = {
            'status_code': True,
            'errors': []
        }

        while response.function_calls:
            print(f"🤖 Model requested {len(response.function_calls)} tool(s)")
            
            # We must collect ALL responses for this turn into a list of parts
            response_parts = []

            for tool_call in response.function_calls:
                print(f"  > Executing: {tool_call.name}")
                
                # Execute the tool
                result = self.tool_handler.handle_tool_call(
                    tool_call.name, 
                    tool_call.args
                )

                # if "error" in result:
                #     status['status_code'] = False
                #     status['errors'].append(result['error'])
                print(result)

                # CHANGE 3: Create correct SDK Objects (Part -> FunctionResponse)
                # We wrap the result in a strongly typed FunctionResponse
                fn_response = types.FunctionResponse(
                    name=tool_call.name,
                    response={"result": result}
                )
                
                # Add to our list of parts to send back
                response_parts.append(types.Part(function_response=fn_response))

            # CHANGE 4: Send ALL tool results back in a single message
            # This satisfies the model's need to see results for all tools it requested
            response = self.chat.send_message(response_parts)
        
        if status:
            print(f"[LLM-SUCCESS] LLM reported successful task completion for user")
        else:
            print(f"[LLM-FAIL] LLM reported successful task completion for user")
            print("Received Errors:")
            for error in status["errors"]:
                print(error, "\n")

        self.chat_message_len += 1
        return response.text
