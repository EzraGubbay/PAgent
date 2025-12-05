# Data Models
- Task
    - id
    - title
    - description
    - status
    - priority
    - dueDate
    - estimatedDuration
    - createdAt
    - updatedAt
    - subtasks
- TimeBlock
    - id
    - start
    - end
    - createdAt
    - updatedAt
    - tasks

# UI
- Agent Chat
- Settings Menu

# Backend
- Push notifications management
- GPT API Integration
- Cloud storage
- Cloudflare tunnel API Service
- Custom API Keys
- Task Parsing
- Conflict Resolution
- Time Block Allocation
- Scheduling: integration with Google Calendar API
- Task Creation: integration with Todoist API

# Dev Todo - CI / CD:
- Create pipeline to deploy backend to Raspberry Pi and restart service.

# Dev Todo - Backend:
- Queue responses per user that need to reach user. Send queued responses in batches upon AppSync request.
- Implement robust error handling to log and understand various error cases (Is it API? Which API? What was the error?)
- Create per user API key and authentication system to identify to which user the reponses and queued messages belong.

# Notification Hub:
- Create lightweight PWA and connect to GitHub Pages or Firebase Hosting to display empty page. [DONE]
- (deferred) Create robust notification settings control in the app for app collection.
- Receive push notifications info, apply correct notification icon, title and text based on app identifier, user, content, etc., and push notification.
- Implement deep links to correctly redirect user to the app in question upon tapping the notification.

# Dev Todo - Frontend:
- AppSync network request on app foreground / user activation. [DONE]
- Display loading wheel in good location while waiting for response from AppSync. [DONE]

# Coding Agent-Enabled Implementations
- [AGENT-DONE] Make sure thumbnail that is currently showing of attachment in sending area, will be removed from sending area after user sends, the loaded attachment section unrenders, and the attachment thumbnail should now appear in the chat, perhaps slightly bigger but maintain same aspect ratio as what we currently have for thumbnail.
If you need to make any major changes in data types, for example in how the message bubble is constructed or in ChatMessages, ask me for confirmation first.
- [AGENT-DONE] Make message bubbles long-pressable: they should pop-out slightly, and offer a menu below them with potential actions, for now only to copy the text in the message bubble. Make sure to add an appropriate feather to the menu item.

- [AGENT-DONE] Provide full and detailed report of implementation logic when you are done. Be prepared to revert changes if needed.
- [AGENT-DONE] Examine codebase and project structure and contrast with .gitignore to find any potentially leaked API keys, sensitive information etc. in both frontend and backend folders. This project is meant to eventually go public and be packageable. No changes here, just reporting. Make sure to give your opinion on what is superfluous or missing from how we are pushing to a public github repo, to enable packaged or easy downloads of the program.

- [AGENT-DONE] Fix long-press on message bubbles: they should slightly-expand animation while long pressing, like whatsapp for example. and then grow up to some specific size, retaining aspect ratio, upon which the menu will appear, and during this time, the surrounding area blurs in the background (everything except the message and its menu). Additionally remove the 'blinking' TouchableOpacity-like effect when pressing them that causes them to become dim.

- [AGENT-DONE] Fix bug where doc input isn't erased from the 'to-send' attachments area, and that area isn't closing either.

- [AGENT-DONE] Add feature to attachment area where pressing the main x button on the right side of it, clears all attachments from the attachment area and visually closes it (the visual closing already happens)

* FYI: the doc thumbnail move to the chat itself works nicely.
