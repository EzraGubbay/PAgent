from todoist_api_python.api import TodoistAPI
from typing import List, Optional, Dict, Any

class TodoistService:
    def __init__(self, auth_manager):
        self.token = auth_manager.get_todoist_token()
        self.api = TodoistAPI(self.token)

    def add_task(self, 
                 content: str, 
                 description: Optional[str] = None, 
                 due_string: Optional[str] = None, 
                 priority: Optional[int] = None, 
                 project_id: Optional[str] = None, 
                 labels: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Creates a new task in Todoist using the SDK.
        """
        try:
            task = self.api.add_task(
                content=content,
                description=description,
                due_string=due_string,
                priority=priority,
                project_id=project_id,
                labels=labels
            )
            return task.to_dict()
        except Exception as e:
            return {"error": str(e)}

    def get_tasks(self, filter_str: Optional[str] = None, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves tasks from Todoist using the SDK.
        """
        try:
            tasks = self.api.get_tasks(
                filter=filter_str,
                project_id=project_id
            )
            return [task.to_dict() for task in tasks]
        except Exception as e:
            return [{"error": str(e)}]

    def update_task(self, task_id: str, **kwargs) -> Dict[str, Any]:
        """
        Updates an existing task using the SDK.
        """
        try:
            is_success = self.api.update_task(task_id=task_id, **kwargs)
            if is_success:
                return {"success": True, "task_id": task_id}
            return {"success": False, "error": "Update failed"}
        except Exception as e:
            return {"error": str(e)}

    def close_task(self, task_id: str) -> bool:
        """
        Completes a task using the SDK.
        """
        try:
            return self.api.close_task(task_id=task_id)
        except Exception:
            return False

    def delete_task(self, task_id: str) -> bool:
        """
        Deletes a task using the SDK.
        """
        try:
            return self.api.delete_task(task_id=task_id)
        except Exception:
            return False
