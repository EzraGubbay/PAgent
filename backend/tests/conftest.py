import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import MagicMock

@pytest.fixture
def mock_db():
    """
    Creates a mock database manager.
    """
    db = MagicMock()
    return db

@pytest.fixture
async def client(mock_db):
    """
    Creates a FastAPI TestClient with the dependency override.
    """
    from app.api.deps import get_db
    
    # Override the get_db dependency to return our mock
    app.dependency_overrides[get_db] = lambda: mock_db
    
    # Use AsyncClient for ASGI app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    
    # Cleanup
    app.dependency_overrides.clear()
