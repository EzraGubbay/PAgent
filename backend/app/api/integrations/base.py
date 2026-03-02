from abc import ABC, abstractmethod

class OAuthProvider(ABC):

    @abstractmethod
    async def exchange_code(self, code: str) -> dict:
        """
        Exchanges an auth code for access/refresh tokens
        """
        pass

    @abstractmethod
    def verify_identity(self, tokens: dict) -> str:
        """
        Returns the third-part User ID from the tokens
        """
        pass

    @abstractmethod
    async def revoke(self, refresh_token: str) -> bool:
        pass

    @property
    @abstractmethod
    def provider(self) -> str:
        pass