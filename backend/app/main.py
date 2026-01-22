"""
LogicForge Backend - FastAPI Application
A gamified, AI-assisted programme design tool for Education NGOs
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import programs_router, ai_router, export_router, gamification_router, benchmarks_router, activities_router, forms_router, templates_router, collaboration_router, analytics_router
from app.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("🚀 LogicForge Backend starting...")
    print(f"✅ Loaded CORS Origins: {settings.cors_origins_list}")
    await init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("👋 LogicForge Backend shutting down...")


app = FastAPI(
    title="LogicForge API",
    description="AI-assisted programme design tool for Education NGOs",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(programs_router)
app.include_router(ai_router)
app.include_router(export_router)
app.include_router(gamification_router)
app.include_router(benchmarks_router)
app.include_router(activities_router)
app.include_router(forms_router)
app.include_router(templates_router)
app.include_router(collaboration_router)
app.include_router(analytics_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "LogicForge API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/api/info")
async def api_info():
    """API information endpoint."""
    return {
        "name": "LogicForge API",
        "description": "AI-assisted programme design tool for Education NGOs",
        "version": "1.0.0",
        "endpoints": {
            "programs": "/api/programs",
            "ai": "/api/ai",
            "export": "/api/export",
            "gamification": "/api/gamification"
        }
    }
