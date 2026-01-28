from app.db.manager import dbmanager

async def get_db():
    """
    Dependency to get the database manager.
    Can be overridden in tests.
    """
    return dbmanager
