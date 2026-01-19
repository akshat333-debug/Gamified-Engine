"""
Activities Router - Activity tracking and timeline management
"""
from typing import List, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.database import get_db

router = APIRouter(prefix="/api/activities", tags=["activities"])


# Pydantic schemas
class ActivityCreate(BaseModel):
    program_id: UUID
    outcome_id: Optional[UUID] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: date
    end_date: date
    status: str = "planned"  # planned, in_progress, completed, delayed
    responsible_person: Optional[str] = None
    resources_needed: Optional[str] = None


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    responsible_person: Optional[str] = None
    resources_needed: Optional[str] = None
    progress_percentage: Optional[int] = None


class ActivityResponse(BaseModel):
    id: UUID
    program_id: UUID
    outcome_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    status: str
    responsible_person: Optional[str] = None
    resources_needed: Optional[str] = None
    progress_percentage: int = 0
    
    class Config:
        from_attributes = True


# In-memory storage (would be database in production)
# Using simple dict for now since we need to add Activity model to database
activities_store: dict = {}


@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(activity_data: ActivityCreate):
    """Create a new activity."""
    import uuid
    activity_id = uuid.uuid4()
    
    activity = {
        "id": activity_id,
        "program_id": activity_data.program_id,
        "outcome_id": activity_data.outcome_id,
        "title": activity_data.title,
        "description": activity_data.description,
        "start_date": activity_data.start_date,
        "end_date": activity_data.end_date,
        "status": activity_data.status,
        "responsible_person": activity_data.responsible_person,
        "resources_needed": activity_data.resources_needed,
        "progress_percentage": 0,
    }
    
    activities_store[str(activity_id)] = activity
    return activity


@router.get("/program/{program_id}", response_model=List[ActivityResponse])
async def list_program_activities(program_id: UUID):
    """List all activities for a program."""
    return [a for a in activities_store.values() if str(a["program_id"]) == str(program_id)]


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(activity_id: UUID):
    """Get a specific activity."""
    activity = activities_store.get(str(activity_id))
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.patch("/{activity_id}", response_model=ActivityResponse)
async def update_activity(activity_id: UUID, update_data: ActivityUpdate):
    """Update an activity."""
    activity = activities_store.get(str(activity_id))
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        activity[field] = value
    
    activities_store[str(activity_id)] = activity
    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(activity_id: UUID):
    """Delete an activity."""
    if str(activity_id) not in activities_store:
        raise HTTPException(status_code=404, detail="Activity not found")
    del activities_store[str(activity_id)]


@router.get("/timeline/{program_id}")
async def get_program_timeline(program_id: UUID):
    """Get activities formatted for Gantt chart display."""
    program_activities = [a for a in activities_store.values() if str(a["program_id"]) == str(program_id)]
    
    # Format for Gantt chart
    timeline_data = []
    for activity in program_activities:
        timeline_data.append({
            "id": str(activity["id"]),
            "name": activity["title"],
            "start": activity["start_date"].isoformat() if isinstance(activity["start_date"], date) else activity["start_date"],
            "end": activity["end_date"].isoformat() if isinstance(activity["end_date"], date) else activity["end_date"],
            "progress": activity["progress_percentage"],
            "status": activity["status"],
            "dependencies": [],  # Would link to other activities
        })
    
    return timeline_data
