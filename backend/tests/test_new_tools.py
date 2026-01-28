import os
import sys
from gemini_tools_lib.auth_manager import AuthManager
from gemini_tools_lib.todoist_service import TodoistService
from gemini_tools_lib.calendar_service import CalendarService
from datetime import datetime, timedelta

def test_todoist():
    print("Testing Todoist Service...")
    auth_manager = AuthManager()
    todoist = TodoistService(auth_manager)

    # 1. Create a task
    print("Creating task...")
    task = todoist.add_task(content="Test Task for Update/Delete", description="Initial description")
    if "error" in task:
        print(f"Error creating task: {task['error']}")
        return
    task_id = task['id']
    print(f"Task created with ID: {task_id}")

    # 2. Update the task
    print("Updating task...")
    update_result = todoist.update_task(task_id=task_id, content="Updated Test Task", priority=4)
    if "error" in update_result:
        print(f"Error updating task: {update_result['error']}")
    else:
        print("Task updated successfully.")

    # 3. Delete the task
    print("Deleting task...")
    delete_result = todoist.delete_task(task_id=task_id)
    if delete_result:
        print("Task deleted successfully.")
    else:
        print("Error deleting task.")

def test_gcal():
    print("\nTesting Google Calendar Service...")
    auth_manager = AuthManager()
    gcal = CalendarService(auth_manager)

    # 1. Create an event
    print("Creating event...")
    start_time = (datetime.utcnow() + timedelta(hours=1)).isoformat() + 'Z'
    end_time = (datetime.utcnow() + timedelta(hours=2)).isoformat() + 'Z'
    event = gcal.create_event(summary="Test Event for Update/Delete", start_time=start_time, end_time=end_time)
    if "error" in event:
        print(f"Error creating event: {event['error']}")
        return
    event_id = event['id']
    print(f"Event created with ID: {event_id}")

    # 2. Update the event
    print("Updating event...")
    update_result = gcal.update_event(event_id=event_id, summary="Updated Test Event", description="Updated description")
    if "error" in update_result:
        print(f"Error updating event: {update_result['error']}")
    else:
        print("Event updated successfully.")

    # 3. Delete the event
    print("Deleting event...")
    delete_result = gcal.delete_event(event_id=event_id)
    if delete_result:
        print("Event deleted successfully.")
    else:
        print("Error deleting event.")

if __name__ == "__main__":
    test_todoist()
    test_gcal()
