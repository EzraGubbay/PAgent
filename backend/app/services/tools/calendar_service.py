from googleapiclient.discovery import build
from typing import List, Optional, Dict, Any
from datetime import datetime

class CalendarService:
    def __init__(self, auth_manager):
        self.creds = auth_manager.get_gcal_credentials()
        self.service = build('calendar', 'v3', credentials=self.creds)

    def list_calendars(self) -> List[Dict[str, Any]]:
        """
        Lists all calendars the user has access to.
        """
        try:
            calendar_list = self.service.calendarList().list().execute()
            return calendar_list.get('items', [])
        except Exception as e:
            return [{"error": str(e)}]

    def list_events(self, 
                    calendar_id: str = 'primary', 
                    time_min: Optional[str] = None, 
                    time_max: Optional[str] = None, 
                    max_results: int = 20,
                    query: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Lists events from the specified calendar using the SDK.
        """
        if not time_min:
            time_min = datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time

        try:
            events_result = self.service.events().list(
                calendarId=calendar_id, 
                timeMin=time_min,
                timeMax=time_max,
                maxResults=max_results, 
                singleEvents=True,
                orderBy='startTime',
                q=query
            ).execute()
            return events_result.get('items', [])
        except Exception as e:
            return [{"error": str(e)}]

    def create_event(self, 
                     summary: str, 
                     start_time: str, 
                     end_time: str, 
                     calendar_id: str = 'primary', 
                     description: Optional[str] = None, 
                     location: Optional[str] = None) -> Dict[str, Any]:
        """
        Creates a new event in the specified calendar using the SDK.
        """
        # tzone = datetime.now('Asia/Jerusalem').tzinfo
        event_body = {
            'summary': summary,
            'start': {
                'dateTime': start_time,
                'timeZone': 'Asia/Jerusalem',
            },
            'end': {
                'dateTime': end_time,
                'timeZone': 'Asia/Jerusalem',
            },
        }
        if description:
            event_body['description'] = description
        if location:
            event_body['location'] = location

        event = self.service.events().insert(calendarId=calendar_id, body=event_body).execute()
        return event
        # except Exception as e:
        #     return {"error": str(e)}

    def update_event(self, 
                     event_id: str, 
                     calendar_id: str = 'primary', 
                     summary: Optional[str] = None, 
                     start_time: Optional[str] = None, 
                     end_time: Optional[str] = None, 
                     description: Optional[str] = None, 
                     location: Optional[str] = None) -> Dict[str, Any]:
        """
        Updates an existing event in the specified calendar.
        """
        try:
            # First, retrieve the event to get its current state
            event = self.service.events().get(calendarId=calendar_id, eventId=event_id).execute()

            if summary:
                event['summary'] = summary
            if description:
                event['description'] = description
            if location:
                event['location'] = location
            if start_time:
                event['start']['dateTime'] = start_time
                event['start']['timeZone'] = 'UTC' # Assuming UTC for simplicity, or preserve existing
            if end_time:
                event['end']['dateTime'] = end_time
                event['end']['timeZone'] = 'UTC'

            updated_event = self.service.events().update(calendarId=calendar_id, eventId=event_id, body=event).execute()
            return updated_event
        except Exception as e:
            return {"error": str(e)}

    def delete_event(self, event_id: str, calendar_id: str = 'primary') -> bool:
        """
        Deletes an event from the specified calendar.
        """
        try:
            self.service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
            return True
        except Exception:
            return False
