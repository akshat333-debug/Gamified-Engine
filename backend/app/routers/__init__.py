"""Routers package."""
from app.routers.programs import router as programs_router
from app.routers.ai import router as ai_router
from app.routers.export import router as export_router

__all__ = ["programs_router", "ai_router", "export_router"]
