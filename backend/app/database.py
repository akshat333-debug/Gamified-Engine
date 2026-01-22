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


from sqlalchemy import text

# Import models to register them with Base.metadata
# noqa: F401

async def init_db():
    """Initialize database - create tables if they don't exist."""
    # Import models here to avoid circular imports during startup
    from app import models  # noqa: F401
    
    async with engine.begin() as conn:
        # Enable pgvector extension for embedding support
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        
        # Create all tables defined in models
        await conn.run_sync(Base.metadata.create_all)

        # Check if proven_models table is empty
        result = await conn.execute(text("SELECT COUNT(*) FROM proven_models"))
        count = result.scalar()
        
        if count == 0:
            print("🌱 Seeding initial Proven Models...")
            # Insert Teaching at the Right Level (TaRL)
            await conn.execute(text("""
                INSERT INTO proven_models (id, name, description, implementation_guide, evidence_base, themes, target_outcomes, created_at)
                VALUES (
                    'd290f1ee-6c54-4b01-90e6-d701748f0851',
                    'Teaching at the Right Level (TaRL)',
                    'An evidence-based pedagogical approach that groups children by learning level rather than age or grade.',
                    'Focuses on basic reading and arithmetic skills. Conducted for 1-2 hours daily.',
                    'Proven effective by J-PAL randomized control trials in India and Africa.',
                    ARRAY['FLN', 'Education'],
                    ARRAY['Reading Fluency', 'Basic Numeracy'],
                    NOW()
                );
            """))
            # Insert Career Readiness Model
            await conn.execute(text("""
                INSERT INTO proven_models (id, name, description, implementation_guide, evidence_base, themes, target_outcomes, created_at)
                VALUES (
                    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
                    'Career Quest / Magic Bus',
                    'A mentorship-based life skills and career readiness program for adolescents.',
                    'Uses activity-based learning to build resilience, communication, and problem-solving skills.',
                    'Demonstrated impact on school retention and employability in urban slums.',
                    ARRAY['Career Readiness', 'Life Skills'],
                    ARRAY['Employability', 'Soft Skills'],
                    NOW()
                );
            """))
            print("✅ Seeding complete!")


async def get_db() -> AsyncSession:
    """Dependency for FastAPI routes to get database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
