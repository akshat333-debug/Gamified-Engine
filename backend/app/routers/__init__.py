"""Routers package."""
from app.routers.programs import router as programs_router
from app.routers.ai import router as ai_router
from app.routers.export import router as export_router
from app.routers.gamification import router as gamification_router
from app.routers.benchmarks import router as benchmarks_router
from app.routers.activities import router as activities_router
from app.routers.forms import router as forms_router
from app.routers.templates import router as templates_router
from app.routers.collaboration import router as collaboration_router
from app.routers.analytics import router as analytics_router

__all__ = [
    "programs_router", "ai_router", "export_router", 
    "gamification_router", "benchmarks_router", "activities_router", 
    "forms_router", "templates_router", "collaboration_router", "analytics_router"
]

