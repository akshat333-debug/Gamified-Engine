"""
Database connection and session management
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

try:
    # Ensure Render's URL is compatible with AsyncPG
    database_url = settings.database_url
    
    # Log the original scheme for debugging
    if database_url:
        scheme = database_url.split("://")[0]
        print(f"🔌 Original Database Scheme: {scheme}")
    
    if database_url and not database_url.startswith("postgresql+asyncpg://"):
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
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


# Import models to register them with Base.metadata
# noqa: F401

async def init_db():
    """Initialize database - create tables if they don't exist."""
    # Import models here to avoid circular imports during startup
    from app import models  # noqa: F401
    
    async with engine.begin() as conn:
        # Create all tables defined in models
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncSession:
    """Dependency for FastAPI routes to get database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
