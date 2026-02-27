from .auth_manager import AuthManager
from .todoist_service import TodoistService
from .calendar_service import CalendarService
from app.core.logger import logger
import json
from datetime import datetime
from zoneinfo import ZoneInfo

# Function Declarations for Gemini
# These schemas define the tools available to the model.

TODOIST_ADD_TASK_DECLARATION = {
    "name": "todoist_add_task",
    "description": "Adds a new task to Todoist. Use this when the user wants to schedule a task or add a todo item. Infer details like priority and due date if possible.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "content": {
                "type": "STRING",
                "description": "The main content or title of the task."
            },
            "description": {
                "type": "STRING",
                "description": "Detailed description of the task."
            },
            "due_string": {
                "type": "STRING",
                "description": "Natural language due date string (e.g., 'tomorrow at 5pm', 'next Friday')."
            },
            "priority": {
                "type": "INTEGER",
                "description": "Priority level 1-4 (4 is highest priority in Todoist API terms, though UI reverses it. Use 4 for urgent)."
            },
            "project_id": {
                "type": "STRING",
                "description": "The ID of the project to add the task to. Optional."
            },
            "labels": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "List of label names to attach to the task."
            }
        },
        "required": ["content"]
    }
}

TODOIST_GET_TASKS_DECLARATION = {
    "name": "todoist_get_tasks",
    "description": "Retrieves tasks from Todoist. Use this to check existing tasks or find a task to modify.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "filter_str": {
                "type": "STRING",
                "description": "Filter string (e.g., 'today', 'overdue', '#Work')."
            },
            "project_id": {
                "type": "STRING",
                "description": "Filter by project ID."
            }
        }
    }
}

GCAL_CREATE_EVENT_DECLARATION = {
    "name": "gcal_create_event",
    "description": "Creates a new event in Google Calendar. Use this for scheduling meetings or time-blocking.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "summary": {
                "type": "STRING",
                "description": "Title of the event."
            },
            "start_time": {
                "type": "STRING",
                "description": "Start time in RFC3339 format (e.g., '2023-10-27T10:00:00Z')."
            },
            "end_time": {
                "type": "STRING",
                "description": "End time in RFC3339 format."
            },
            "description": {
                "type": "STRING",
                "description": "Description of the event."
            },
            "location": {
                "type": "STRING",
                "description": "Location of the event."
            }
        },
        "required": ["summary", "start_time", "end_time"]
    }
}

GCAL_LIST_EVENTS_DECLARATION = {
    "name": "gcal_list_events",
    "description": "Lists events from Google Calendar. Use this to check availability, see what's on the schedule, or search for specific events.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "calendar_id": {
                "type": "STRING",
                "description": "The ID of the calendar to list events from. Defaults to 'primary'. Use gcal_list_calendars to find other IDs."
            },
            "time_min": {
                "type": "STRING",
                "description": "Start of the time range to list events for (RFC3339). Defaults to now."
            },
            "time_max": {
                "type": "STRING",
                "description": "End of the time range to list events for (RFC3339)."
            },
            "max_results": {
                "type": "INTEGER",
                "description": "Maximum number of events to return."
            },
            "query": {
                "type": "STRING",
                "description": "Free text search terms to find events that match these terms in any field, except for extended properties."
            }
        }
    }
}

GCAL_LIST_CALENDARS_DECLARATION = {
    "name": "gcal_list_calendars",
    "description": "Lists all calendars the user has access to. Use this to find calendar IDs for specific calendars (e.g., 'Work', 'Personal').",
    "parameters": {
        "type": "OBJECT",
        "properties": {}
    }
}

GET_CURRENT_DATETIME_DECLARATION = {
    "name": "get_current_datetime",
    "description": "Returns the current date and time in ISO format. Use this when you need to know 'now' to calculate relative dates like 'tomorrow' or 'next week'.",
    "parameters": {
        "type": "OBJECT",
        "properties": {}
    }
}


TODOIST_UPDATE_TASK_DECLARATION = {
    "name": "todoist_update_task",
    "description": "Updates an existing task in Todoist. Use this to change due dates, priority, content, etc.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "task_id": {
                "type": "STRING",
                "description": "The ID of the task to update."
            },
            "content": {
                "type": "STRING",
                "description": "The new content or title of the task."
            },
            "description": {
                "type": "STRING",
                "description": "The new description of the task."
            },
            "due_string": {
                "type": "STRING",
                "description": "The new due date string."
            },
            "priority": {
                "type": "INTEGER",
                "description": "The new priority level (1-4)."
            },
            "labels": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "The new list of labels."
            }
        },
        "required": ["task_id"]
    }
}

TODOIST_DELETE_TASK_DECLARATION = {
    "name": "todoist_delete_task",
    "description": "Deletes a task from Todoist. Use this when a user wants to remove a task permanently.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "task_id": {
                "type": "STRING",
                "description": "The ID of the task to delete."
            }
        },
        "required": ["task_id"]
    }
}

GCAL_UPDATE_EVENT_DECLARATION = {
    "name": "gcal_update_event",
    "description": "Updates an existing event in Google Calendar. Use this to change time, summary, description, or location.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "calendar_id": {
                "type": "STRING",
                "description": "The ID of the calendar the event is in. Defaults to 'primary'."
            },
            "event_id": {
                "type": "STRING",
                "description": "The ID of the event to update."
            },
            "summary": {
                "type": "STRING",
                "description": "The new title of the event."
            },
            "start_time": {
                "type": "STRING",
                "description": "The new start time in RFC3339 format."
            },
            "end_time": {
                "type": "STRING",
                "description": "The new end time in RFC3339 format."
            },
            "description": {
                "type": "STRING",
                "description": "The new description of the event."
            },
            "location": {
                "type": "STRING",
                "description": "The new location of the event."
            }
        },
        "required": ["event_id"]
    }
}

GCAL_DELETE_EVENT_DECLARATION = {
    "name": "gcal_delete_event",
    "description": "Deletes an event from Google Calendar. Use this when a user wants to cancel or remove an event.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "calendar_id": {
                "type": "STRING",
                "description": "The ID of the calendar the event is in. Defaults to 'primary'."
            },
            "event_id": {
                "type": "STRING",
                "description": "The ID of the event to delete."
            }
        },
        "required": ["event_id"]
    }
}

# The list of tools to pass to the Gemini model
GEMINI_TOOLS = [
    TODOIST_ADD_TASK_DECLARATION,
    TODOIST_GET_TASKS_DECLARATION,
    GCAL_CREATE_EVENT_DECLARATION,
    GCAL_LIST_EVENTS_DECLARATION,
    GCAL_LIST_CALENDARS_DECLARATION,
    GET_CURRENT_DATETIME_DECLARATION,
    TODOIST_UPDATE_TASK_DECLARATION,
    TODOIST_DELETE_TASK_DECLARATION,
    GCAL_UPDATE_EVENT_DECLARATION,
    GCAL_DELETE_EVENT_DECLARATION
]

class GeminiToolHandler:
    """
    Handles the execution of tools called by the Gemini model.
    """
    def __init__(self, auth_manager: AuthManager):
        self.todoist = TodoistService(auth_manager)
        self.gcal = CalendarService(auth_manager)
        self.tools_map = {
            "todoist_add_task": self.todoist.add_task,
            "todoist_get_tasks": self.todoist.get_tasks,
            "gcal_create_event": self.gcal.create_event,
            "gcal_list_events": self.gcal.list_events,
            "gcal_list_calendars": self.gcal.list_calendars,
            "get_current_datetime": self.get_current_datetime,
            "todoist_update_task": self.todoist.update_task,
            "todoist_delete_task": self.todoist.delete_task,
            "gcal_update_event": self.gcal.update_event,
            "gcal_delete_event": self.gcal.delete_event
        }

    def get_current_datetime(self):
        """
        Returns the current date and time.
        """
        tzone = ZoneInfo('Asia/Jerusalem')
        return {"current_datetime": datetime.now(tzone).isoformat()}

    def handle_tool_call(self, tool_name: str, tool_args: dict):
        """
        Executes the specified tool with the given arguments.
        """
        struct_logger = logger.bind(tool_name=tool_name)
        if tool_name not in self.tools_map:
            struct_logger.error("llm_tool_not_found")
            raise ValueError(f"Unknown tool: {tool_name}")
        
        func = self.tools_map[tool_name]
        try:
            # Call the function with unpacked arguments
            result = func(**tool_args)
            return result
        except Exception as e:
            struct_logger.error("llm_tool_execution_failed", error=str(e), tool_args=tool_args)
            return {"error": str(e)}

    def process_model_response(self, response):
        """
        Helper to process a response from the Gemini model (if using the Python SDK structure).
        This assumes 'response' is an object with 'parts' or 'function_calls'.
        Adapt based on the specific SDK version usage.
        """
        # This is a placeholder for the logic to extract function calls from the model's response object.
        # In a real implementation, you would iterate over response.parts, check for function_call,
        # and then invoke handle_tool_call.
        pass
