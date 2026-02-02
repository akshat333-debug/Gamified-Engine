"""
Gamification Router - API endpoints for XP, Leaderboard, and Streaks
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.services.gamification_service import get_gamification_service, GamificationService


router = APIRouter(prefix="/api/gamification", tags=["gamification"])


# Schemas
class XPAwardRequest(BaseModel):
    action: str
    program_id: Optional[UUID] = None


class XPAwardResponse(BaseModel):
    awarded: int
    action: str
    total_xp: int
    level: int
    level_title: str


class UserStatsResponse(BaseModel):
    total_xp: int
    level: int
    level_title: str
    current_streak: int
    longest_streak: int
    badges_earned: int
    programs_completed: int
    xp_to_next_level: int


class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    organization: str
    xp: int
    level: int


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    streak_bonus: int


# Endpoints
@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    user_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get user's gamification stats. Pass user_id as query param."""
    # Use provided user_id or fallback to demo user
    effective_user_id = user_id or UUID('00000000-0000-0000-0000-000000000001')
    stats = await gamification.get_user_stats(db, effective_user_id)
    return UserStatsResponse(**stats)


@router.post("/xp", response_model=XPAwardResponse)
async def award_xp(
    request: XPAwardRequest,
    db: AsyncSession = Depends(get_db),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Award XP to the current user for an action."""
    # In production, would get user_id from auth
    user_id = UUID('00000000-0000-0000-0000-000000000001')
    result = await gamification.award_xp(db, user_id, request.action, request.program_id)
    return XPAwardResponse(**result)


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    limit: int = 10,
    organization_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get the XP leaderboard."""
    entries = await gamification.get_leaderboard(db, limit, organization_id)
    return [LeaderboardEntry(**e) for e in entries]


@router.post("/streak", response_model=StreakResponse)
async def update_streak(
    db: AsyncSession = Depends(get_db),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Record daily activity and update streak."""
    # In production, would get user_id from auth
    user_id = UUID('00000000-0000-0000-0000-000000000001')
    result = await gamification.update_streak(db, user_id)
    return StreakResponse(**result)
