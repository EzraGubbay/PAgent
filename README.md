# PAgent

A Personal Assistant application for iOS. Text an AI Agent that serves as your very own personal assistant, intelligently scheduling and prioritizing tasks based on your preferences.

- WebSockets & HTTP
- Stateless servers
- Redis for shared state
- Mongo for user and file database
  - User administration
  - User message queue (flushed on foreground)
- RAG architecture using LanceDB as a vector DB
- Docker containerization
- Kubernetes for container orchestration
- CI/CD Pipelines via GitHub Actions
  - Self-Hosted Runner
- REST API using FastAPI

- Event logging via Better Stack

- React Native for native-iOS frontend
  - TypeScript
  - Expo Framework for Mobile Development (Dev Server)

- CloudFlare Tunneling
- Firebase Cloud Messaging
