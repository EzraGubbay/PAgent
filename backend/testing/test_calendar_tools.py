import unittest
from unittest.mock import MagicMock
from gemini_tools_lib import GeminiToolHandler, GEMINI_TOOLS
from datetime import datetime

class TestGeminiCalendarTools(unittest.TestCase):
    def setUp(self):
        # Mock AuthManager since we don't need real auth for unit testing the handler logic
        self.mock_auth_manager = MagicMock()
        self.handler = GeminiToolHandler(self.mock_auth_manager)
        
        # Mock the internal services to verify routing
        self.handler.gcal = MagicMock()
        self.handler.todoist = MagicMock()
        
        # Re-map the tools to use the mocks (since __init__ binds them to the real instances)
        self.handler.tools_map["gcal_create_event"] = self.handler.gcal.create_event
        self.handler.tools_map["gcal_list_events"] = self.handler.gcal.list_events
        self.handler.tools_map["gcal_list_calendars"] = self.handler.gcal.list_calendars

    def test_tool_definitions(self):
        tool_names = [t["name"] for t in GEMINI_TOOLS]
        self.assertIn("gcal_list_calendars", tool_names)
        self.assertIn("get_current_datetime", tool_names)
        self.assertIn("gcal_list_events", tool_names)
        
        # Verify gcal_list_events has the new parameters
        list_events_tool = next(t for t in GEMINI_TOOLS if t["name"] == "gcal_list_events")
        props = list_events_tool["parameters"]["properties"]
        self.assertIn("calendar_id", props)
        self.assertIn("query", props)

    def test_get_current_datetime(self):
        result = self.handler.handle_tool_call("get_current_datetime", {})
        self.assertIn("current_datetime", result)
        # Verify it's a valid ISO format
        dt = datetime.fromisoformat(result["current_datetime"])
        self.assertIsInstance(dt, datetime)

    def test_list_calendars_routing(self):
        self.handler.gcal.list_calendars.return_value = [{"id": "primary", "summary": "Main"}]
        result = self.handler.handle_tool_call("gcal_list_calendars", {})
        
        self.handler.gcal.list_calendars.assert_called_once()
        self.assertEqual(result, [{"id": "primary", "summary": "Main"}])

    def test_list_events_routing_with_query(self):
        self.handler.gcal.list_events.return_value = []
        args = {"query": "meeting", "calendar_id": "work"}
        self.handler.handle_tool_call("gcal_list_events", args)
        
        self.handler.gcal.list_events.assert_called_once_with(query="meeting", calendar_id="work")

if __name__ == "__main__":
    unittest.main()
