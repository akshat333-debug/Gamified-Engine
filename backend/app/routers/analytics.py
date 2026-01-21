"""
Analytics Router - Provides aggregated analytics data for dashboards
"""
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models import Program, Stakeholder

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# Response schemas
class ProgressDataPoint(BaseModel):
    date: str
    programs: int
    xp: int


class StakeholderDataPoint(BaseModel):
    category: str
    high: int
    medium: int
    low: int


class ProgressTimelineResponse(BaseModel):
    data: List[ProgressDataPoint]


class StakeholderStatsResponse(BaseModel):
    data: List[StakeholderDataPoint]


@router.get("/{user_id}/progress", response_model=ProgressTimelineResponse)
async def get_progress_timeline(
    user_id: UUID,
    weeks: int = 8,
    db: AsyncSession = Depends(get_db)
):
    """
    Get weekly progress timeline showing cumulative programs created and XP earned.
    Returns data for the last N weeks.
    """
    # Calculate start date (N weeks ago)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(weeks=weeks)
    
    # Get all programs for this user ordered by creation date
    stmt = select(Program).where(
        Program.user_id == user_id,
        Program.created_at >= start_date
    ).order_by(Program.created_at)
    
    result = await db.execute(stmt)
    programs = list(result.scalars().all())
    
    # Get total programs before start date (for cumulative)
    stmt_before = select(func.count()).select_from(Program).where(
        Program.user_id == user_id,
        Program.created_at < start_date
    )
    result_before = await db.execute(stmt_before)
    programs_before = result_before.scalar() or 0
    
    # Generate weekly data points
    data_points = []
    current_date = start_date
    cumulative_programs = programs_before
    cumulative_xp = programs_before * 200  # Estimate 200 XP per program before
    
    for week_num in range(weeks):
        week_start = start_date + timedelta(weeks=week_num)
        week_end = week_start + timedelta(weeks=1)
        
        # Count programs created this week (make timezone-naive for comparison)
        week_programs = []
        for p in programs:
            # Handle timezone-aware datetimes by making them naive
            created = p.created_at.replace(tzinfo=None) if p.created_at.tzinfo else p.created_at
            if week_start <= created < week_end:
                week_programs.append(p)
        new_programs = len(week_programs)
        
        # Calculate XP (50 per step completed, estimate from current_step)
        new_xp = sum(p.current_step * 50 for p in week_programs)
        
        cumulative_programs += new_programs
        cumulative_xp += new_xp
        
        # Format week label
        week_label = f"Week {week_num + 1}"
        if week_num == weeks - 1:
            week_label = "This Week"
        elif week_num == weeks - 2:
            week_label = "Last Week"
        
        data_points.append(ProgressDataPoint(
            date=week_label,
            programs=cumulative_programs,
            xp=cumulative_xp
        ))
    
    return ProgressTimelineResponse(data=data_points)


@router.get("/{user_id}/stakeholders", response_model=StakeholderStatsResponse)
async def get_stakeholder_stats(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregated stakeholder statistics across all user's programs.
    Groups stakeholders by name and counts by priority level.
    """
    # Get all programs for this user
    stmt = select(Program.id).where(Program.user_id == user_id)
    result = await db.execute(stmt)
    program_ids = [row[0] for row in result.fetchall()]
    
    if not program_ids:
        # Return default categories with zero counts
        return StakeholderStatsResponse(data=[
            StakeholderDataPoint(category="Teachers", high=0, medium=0, low=0),
            StakeholderDataPoint(category="Parents", high=0, medium=0, low=0),
            StakeholderDataPoint(category="Officials", high=0, medium=0, low=0),
            StakeholderDataPoint(category="NGO Partners", high=0, medium=0, low=0),
            StakeholderDataPoint(category="Students", high=0, medium=0, low=0),
        ])
    
    # Get all stakeholders for these programs
    stmt = select(Stakeholder).where(Stakeholder.program_id.in_(program_ids))
    result = await db.execute(stmt)
    stakeholders = list(result.scalars().all())
    
    # Categorize stakeholders by name patterns
    categories = {
        "Teachers": {"high": 0, "medium": 0, "low": 0},
        "Parents": {"high": 0, "medium": 0, "low": 0},
        "Officials": {"high": 0, "medium": 0, "low": 0},
        "NGO Partners": {"high": 0, "medium": 0, "low": 0},
        "Students": {"high": 0, "medium": 0, "low": 0},
    }
    
    for s in stakeholders:
        name_lower = s.name.lower()
        priority = (s.priority or "medium").lower()
        
        # Categorize based on name
        if any(term in name_lower for term in ["teacher", "principal", "headmaster", "faculty"]):
            cat = "Teachers"
        elif any(term in name_lower for term in ["parent", "caregiver", "guardian", "family"]):
            cat = "Parents"
        elif any(term in name_lower for term in ["officer", "official", "beo", "crc", "government", "panchayat"]):
            cat = "Officials"
        elif any(term in name_lower for term in ["ngo", "partner", "organization", "foundation"]):
            cat = "NGO Partners"
        elif any(term in name_lower for term in ["student", "child", "learner", "youth"]):
            cat = "Students"
        else:
            cat = "NGO Partners"  # Default category
        
        # Increment count
        if priority in categories[cat]:
            categories[cat][priority] += 1
    
    # Convert to response format
    data = [
        StakeholderDataPoint(
            category=cat,
            high=counts["high"],
            medium=counts["medium"],
            low=counts["low"]
        )
        for cat, counts in categories.items()
    ]
    
    return StakeholderStatsResponse(data=data)
