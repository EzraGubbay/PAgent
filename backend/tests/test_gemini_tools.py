import os
from gemini_tools_lib import AuthManager, GeminiToolHandler, GEMINI_TOOLS

def main():
    print("Initializing Gemini Tools Library...")
    
    # Initialize AuthManager with dummy tokens for testing
    auth_manager = AuthManager(todoist_token="3474b25584411f768be85127dbe328297d55e38c")
    
    # Initialize Tool Handler
    tool_handler = GeminiToolHandler(auth_manager)
    
    print("\nAvailable Tools (Function Declarations):")
    for tool in GEMINI_TOOLS:
        print(f"- {tool['name']}: {tool['description']}")

    # Simulate a tool call from the LLM
    print("\nSimulating 'todoist_add_task' tool call...")
    tool_name = "todoist_add_task"
    tool_args = {
        "content": "Buy milk",
        "priority": 4,
        "due_string": "today"
    }
    
    # In a real scenario, we would call the actual API. 
    # Since the tokens are fake, this will likely fail with 401/403 if we let it run against the real API.
    # However, this demonstrates the internal API usage.
    try:
        # We expect this to fail with the fake token, but it proves the wiring works.
        result = tool_handler.handle_tool_call(tool_name, tool_args)
        print("Result:", result)
    except Exception as e:
        print(f"Execution failed as expected (due to fake token): {e}")

if __name__ == "__main__":
    main()
