from app.db.manager import dbmanager

async def get_db():
    """
    Dependency to get the database manager.
    Can be overridden in tests.
    """
    return dbmanager

async def get_llm_client():
    from app.services.llm import get_llm_singleton
    return get_llm_singleton()
