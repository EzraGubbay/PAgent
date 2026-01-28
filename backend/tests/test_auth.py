import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_register_user_success(client, mock_db):
    """
    Tests that the register endpoint interacts correctly with the DB.
    """
    # Setup Mock
    # We use AsyncMock because the route calls await db.create_user
    mock_db.create_user = AsyncMock(return_value=(True, "new_user_id"))

    # Execute
    payload = {"username": "testuser", "passwordHash": "hashed123"}
    response = await client.post("/registerUser", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["response"] == "new_user_id"
    
    # Verify DB was called correctly
    mock_db.create_user.assert_called_once_with(username="testuser", passwordHash="hashed123")


@pytest.mark.asyncio
async def test_login_failure(client, mock_db):
    """
    Tests that login failure is handled correctly.
    """
    # Setup Mock to simulate failed login (e.g. wrong password)
    mock_db.login = AsyncMock(return_value=(False, "Invalid credentials"))

    # Execute
    payload = {"username": "testuser", "passwordHash": "wrongpass"}
    response = await client.post("/login", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "error"
    assert data["response"] == "Invalid credentials"
    
    # Verify DB call
    mock_db.login.assert_called_once_with(username="testuser", passwordHash="wrongpass")
