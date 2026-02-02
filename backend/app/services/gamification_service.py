"""
Gamification Service - Handles XP, Streaks, and Leaderboard logic
"""
from datetime import date, timedelta
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession


# XP Points for different actions
XP_REWARDS = {
    'complete_step_1': 100,
    'complete_step_2': 150,
    'complete_step_3': 150,
    'complete_step_4': 200,
    'complete_step_5': 250,
    'ai_refine_problem': 25,
    'ai_suggest_stakeholders': 25,
    'ai_generate_indicators': 50,
    'daily_login': 10,
    'streak_bonus_7': 100,
    'streak_bonus_30': 500,
}

# Level thresholds
LEVEL_THRESHOLDS = [
    (1, 0, 'Rookie'),
    (2, 200, 'Explorer'),
    (3, 500, 'Strategist'),
    (4, 1000, 'Architect'),
    (5, 2000, 'Master'),
    (6, 4000, 'Legend'),
    (7, 7000, 'Champion'),
    (8, 10000, 'Grandmaster'),
]


def calculate_level(total_xp: int) -> tuple[int, str]:
    """Calculate user level based on total XP."""
    level = 1
    title = 'Rookie'
    for lvl, threshold, lvl_title in LEVEL_THRESHOLDS:
        if total_xp >= threshold:
            level = lvl
            title = lvl_title
    return level, title


class GamificationService:
    """Service for gamification features."""
    
    async def award_xp(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        action: str, 
        program_id: Optional[UUID] = None
    ) -> dict:
        """Award XP to a user for an action."""
        points = XP_REWARDS.get(action, 0)
        if points == 0:
            return {'awarded': 0, 'total_xp': 0, 'level': 1}
        
        # In production, this would update the database
        # For now, return mock response
        return {
            'awarded': points,
            'action': action,
            'total_xp': 850 + points,  # Mock: add to demo XP
            'level': 2,
            'level_title': 'Explorer',
        }
    
    async def update_streak(self, db: AsyncSession, user_id: UUID) -> dict:
        """Update user's streak based on activity."""
        today = date.today()
        
        # In production, this would check last activity and update streak
        # For now, return mock response
        return {
            'current_streak': 5,
            'longest_streak': 12,
            'streak_bonus': 0,
        }
    
    async def get_leaderboard(
        self, 
        db: AsyncSession, 
        limit: int = 10,
        organization_id: Optional[UUID] = None
    ) -> List[dict]:
        """Get top users by XP."""
        # In production, this would query the database
        # For now, return mock data
        return [
            {'rank': 1, 'name': 'Priya Sharma', 'organization': 'Pratham', 'xp': 4850, 'level': 5},
            {'rank': 2, 'name': 'Rahul Verma', 'organization': 'Teach For India', 'xp': 3720, 'level': 4},
            {'rank': 3, 'name': 'Anjali Patel', 'organization': 'Akshara Foundation', 'xp': 3100, 'level': 4},
            {'rank': 4, 'name': 'Vikram Singh', 'organization': 'Room to Read', 'xp': 2890, 'level': 3},
            {'rank': 5, 'name': 'Meera Krishnan', 'organization': 'Azim Premji', 'xp': 2450, 'level': 3},
        ][:limit]
    
    async def get_user_stats(self, db: AsyncSession, user_id: UUID) -> dict:
        """Get gamification stats for a user from their actual programs."""
        from app.models import Program, UserBadge
        
        # Get user's programs
        stmt = select(Program).where(Program.user_id == user_id)
        result = await db.execute(stmt)
        programs = list(result.scalars().all())
        
        # Calculate XP based on program steps completed
        # Each step gives XP: step 1 = 100, step 2 = 150, step 3 = 150, step 4 = 200, step 5 = 250
        step_xp = {1: 100, 2: 150, 3: 150, 4: 200, 5: 250}
        total_xp = 0
        programs_completed = 0
        
        for program in programs:
            # XP for each completed step (steps before current_step)
            for step in range(1, program.current_step):
                total_xp += step_xp.get(step, 100)
            
            if program.status == 'completed':
                programs_completed += 1
                # Bonus XP for completion
                total_xp += 100
        
        # Get badges earned
        badges_stmt = select(func.count()).select_from(UserBadge).where(UserBadge.user_id == user_id)
        badges_result = await db.execute(badges_stmt)
        badges_earned = badges_result.scalar() or 0
        
        # Calculate level
        level, level_title = calculate_level(total_xp)
        
        # Calculate XP to next level
        next_level_threshold = 0
        for lvl, threshold, _ in LEVEL_THRESHOLDS:
            if lvl == level + 1:
                next_level_threshold = threshold
                break
        xp_to_next_level = max(0, next_level_threshold - total_xp)
        
        return {
            'total_xp': total_xp,
            'level': level,
            'level_title': level_title,
            'current_streak': 0,  # Would need activity tracking table
            'longest_streak': 0,
            'badges_earned': badges_earned,
            'programs_completed': programs_completed,
            'xp_to_next_level': xp_to_next_level,
        }


# Singleton instance
gamification_service = GamificationService()


def get_gamification_service() -> GamificationService:
    """Dependency for FastAPI routes."""
    return gamification_service
