from .base import OAuthProvider

class TodoistProvider(OAuthProvider):

    async def exchange_code(self, code: str):
        pass

    def verify_identity(self, tokens: dict) -> str:
        pass

    async def revoke(self, refresh_token: str) -> bool:
        pass

    def provider(self) -> str:
        return "todoist"