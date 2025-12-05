# Gemini Function Declarations Library Requirements

## Goal
Create a modular library of FunctionDeclarations for the Gemini-2.5-flash model to access and manipulate Google Calendar and Todoist.

## Features
1.  **Google Calendar Integration**:
    *   Read events.
    *   Write new events.
    *   Infer details (duration, deadlines) or ask the user.
2.  **Todoist Integration**:
    *   Read tasks.
    *   Write tasks with full tagging, prioritization, etc.
    *   Robust handling of task details.
3.  **LLM Interaction**:
    *   The LLM should be able to infer if it needs more info.
    *   The LLM should be able to decide which tool to use.
4.  **Architecture**:
    *   Modular design with internal APIs.
    *   `llm_service.py` for function declarations.
    *   Separate authentication handling (`auth_manager.py`).
    *   Test mode for auth tokens.

## Structure (in `gemini_tools_lib/`)
*   `auth_manager.py`: Handles retrieval of tokens for GCal and Todoist.
*   `calendar_service.py`: Logic for Google Calendar API.
*   `todoist_service.py`: Logic for Todoist API.
*   `llm_service.py`: Defines the `tools` list (FunctionDeclarations) and handles the tool execution logic.

## Implementation Details
*   **Auth**: Simple class to hold and retrieve tokens.
*   **Services**: Methods that map to the tool definitions.
*   **Tools**: JSON schema definitions compatible with Gemini API.

## Integration Guide

### Dependencies
The library requires the following Python packages:
*   `todoist-api-python`
*   `google-api-python-client`
*   `google-auth-oauthlib`
*   `google-auth-httplib2`

### Integrating with `server.py` and `llm_service.py`

To use this library in the main application:

1.  **Environment Variables**:
    Ensure the following are set in `.env`:
    *   `TODOIST_API_TOKEN`
    *   `GOOGLE_CALENDAR_TOKEN` (Access Token)
    *   `GOOGLE_CALENDAR_REFRESH_TOKEN` (Optional, for refresh)
    *   `GOOGLE_CLIENT_ID`
    *   `GOOGLE_CLIENT_SECRET`

2.  **Update `llm_service.py`**:
    *   Import the tools: `from gemini_tools_lib import GEMINI_TOOLS, GeminiToolHandler, AuthManager`
    *   Initialize `AuthManager` and `GeminiToolHandler`.
    *   Pass `tools=GEMINI_TOOLS` to the Gemini model configuration.
    *   In the `sendMessage` loop, check for function calls in the model's response.
    *   If a function call is present, execute it using `GeminiToolHandler.handle_tool_call`.
    *   Feed the tool output back to the model to generate the final response.

3.  **Update `server.py`**:
    *   Pass any necessary configuration to `LLMClient`.
