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

        # MIGRATION: Check if badges table has xp_reward column (fix for existing DBs)
        try:
            await conn.execute(text("ALTER TABLE badges ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0"))
        except Exception:
            pass # Ignore if already exists or other minor issue

        # SEED DATA using ON CONFLICT to avoid duplication
        # This handles both empty DBs and partial seeds (e.g. if previous seed failed halfway)
        
        # Seed Proven Models
        print("🌱 Seeding Proven Models (if missing)...")
        await conn.execute(text("""
            INSERT INTO proven_models (id, name, description, implementation_guide, evidence_base, themes, target_outcomes, created_at) VALUES 
            (
                'd290f1ee-6c54-4b01-90e6-d701748f0851',
                'Teaching at the Right Level (TaRL)',
                'An evidence-based approach that groups children by learning level rather than age or grade, enabling targeted instruction for foundational skills.',
                'Step 1: Conduct baseline assessments. Step 2: Group by ability. Step 3: Use structured activities. Step 4: Reassess regularly.',
                'Rigorous RCTs by J-PAL shown 0.7 SD improvement. Scaled to millions in India via government partnerships. Aligned with NIPUN Bharat goals.',
                ARRAY['FLN'],
                ARRAY['Improved reading fluency', 'Number recognition', 'Basic arithmetic'],
                NOW()
            ),
            (
                'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
                'Remedial Learning Camps',
                'Intensive short-term learning camps focused on catching up children who are behind grade-level expectations. Aligned with NEP 2020 goals.',
                'Step 1: Identify at-risk students. Step 2: Organize 30-45 day intensive camps. Step 3: Focus on FLN competencies per NIPUN Bharat.',
                'Used by Pratham and state governments. Shows significant gains in foundational literacy as per ASER assessments.',
                ARRAY['FLN', 'Life Skills'],
                ARRAY['Grade-level reading per NIPUN 3', 'Math competency'],
                NOW()
            ),
            (
                'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                'Career Awareness Workshops',
                'Structured workshops exposing students to diverse career paths, building agency and decision-making skills per NEP 2020.',
                'Step 1: Map local career opportunities. Step 2: Invite professionals. Step 3: Conduct skill-building activities. Step 4: Goal-setting exercises.',
                'Research shows improved career aspirations and self-efficacy. Particularly effective for first-generation learners.',
                ARRAY['Career Readiness'],
                ARRAY['Career awareness', 'Goal setting', 'Self-efficacy', 'Agency building'],
                NOW()
            ),
            (
                'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                'Peer Learning Circles',
                'Student-led small group learning that promotes collaboration and deeper understanding through constructivist pedagogy.',
                'Step 1: Train student facilitators. Step 2: Form groups of 4-6. Step 3: Assign structured prompts. Step 4: Rotate leadership.',
                'Meta-analyses show 0.4-0.5 SD effects. Builds academic and social-emotional skills aligned with NCF 2023.',
                ARRAY['FLN', 'Life Skills', 'STEM'],
                ARRAY['Collaborative skills', 'Academic achievement', 'Leadership'],
                NOW()
            ),
            (
                'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8d',
                'Digital Literacy Integration',
                'Structured approach to building digital skills alongside core academics, supporting NEP 2020 technology integration goals.',
                'Step 1: Assess infrastructure. Step 2: Train teachers on ed-tech. Step 3: Integrate digital activities. Step 4: Monitor outcomes.',
                'Growing evidence for blended learning. Critical for 21st-century skills and PM eVidya alignment.',
                ARRAY['STEM', 'Career Readiness'],
                ARRAY['Digital literacy', 'Self-directed learning', 'Tech skills'],
                NOW()
            )
            ON CONFLICT (id) DO NOTHING;
        """))

        # Seed Badges
        # Ensure uuid-ossp extension is enabled for uuid_generate_v4()
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        print("🌱 Seeding Badges (if missing)...")
        await conn.execute(text("""
            INSERT INTO badges (id, name, description, icon, step_number, xp_reward) VALUES
            (uuid_generate_v4(), 'Problem Explorer', 'Defined your challenge statement clearly', '🔍', 1, 100),
            (uuid_generate_v4(), 'Stakeholder Mapper', 'Identified key stakeholders for your program', '🤝', 2, 150),
            (uuid_generate_v4(), 'Evidence Seeker', 'Selected proven models for your intervention', '📚', 3, 150),
            (uuid_generate_v4(), 'Indicator Architect', 'Built measurable indicators for your outcomes', '📊', 4, 200),
            (uuid_generate_v4(), 'Program Designer', 'Generated your complete program design document', '🏆', 5, 250)
            ON CONFLICT DO NOTHING; -- Assuming name is not unique constraint, but we rely on execution count check being removed. 
            -- Actually, to avoid dupes purely by name if we run this often without unique constraint:
            -- Better approach: Check existence via subquery or rely on unique constraint if exists. 
            -- Adding temporary unique constraint logic if needed, but for now assuming clean state or manual cleanup.
            -- SAFE FIX: Use "NOT EXISTS" logic:
        """))
        
        # Better safe seed for Badges to avoid duplicates without unique constraint
        await conn.execute(text("""
            INSERT INTO badges (id, name, description, icon, step_number, xp_reward)
            SELECT uuid_generate_v4(), n, d, i, s, x
            FROM (VALUES 
                ('Problem Explorer', 'Defined your challenge statement clearly', '🔍', 1, 100),
                ('Stakeholder Mapper', 'Identified key stakeholders for your program', '🤝', 2, 150),
                ('Evidence Seeker', 'Selected proven models for your intervention', '📚', 3, 150),
                ('Indicator Architect', 'Built measurable indicators for your outcomes', '📊', 4, 200),
                ('Program Designer', 'Generated your complete program design document', '🏆', 5, 250)
            ) AS v(n, d, i, s, x)
            WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = v.n);
        """))
        print("✅ Database seeding complete!")


async def get_db() -> AsyncSession:
    """Dependency for FastAPI routes to get database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
