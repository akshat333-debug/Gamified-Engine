"""
Database connection and session management
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

try:
    # Ensure Render's postgres:// URL is compatible with AsyncPG
    database_url = settings.database_url
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    
    # Debug print to verify URL (mask password)
    if database_url:
        safe_url = database_url.split("@")[-1] if "@" in database_url else "UNKNOWN"
        print(f"🔌 Connecting to database at: ...@{safe_url}")
    else:
        print("❌ DATABASE_URL is missing or empty!")

    engine = create_async_engine(
        database_url,
        echo=settings.app_env == "development",
        future=True
    )
except Exception as e:
    print(f"❌ Error creating database engine: {str(e)}")
    raise e

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def init_db():
    """Initialize database - tables created via SQL schema in Supabase."""
    # Tables are created manually via database/schema.sql in Supabase SQL Editor
    pass


async def get_db() -> AsyncSession:
    """Dependency for FastAPI routes to get database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
