"""
Programs Router - CRUD operations for programs and their components
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    User, Program, ProblemStatement, Stakeholder, Outcome, Indicator,
    ProgramProvenModel, ProvenModel, Badge, UserBadge
)
from app.schemas import (
    ProgramCreate, ProgramUpdate, ProgramResponse, FullProgramResponse,
    ProblemStatementCreate, ProblemStatementUpdate, ProblemStatementResponse,
    StakeholderCreate, StakeholderUpdate, StakeholderResponse,
    OutcomeCreate, OutcomeUpdate, OutcomeResponse,
    IndicatorCreate, IndicatorUpdate, IndicatorResponse,
    ProgramProvenModelCreate, ProgramProvenModelResponse, ProvenModelResponse,
    BadgeResponse
)

router = APIRouter(prefix="/api/programs", tags=["programs"])


# =====================================================
# PROGRAM CRUD
# =====================================================

@router.post("/", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_program(
    program_data: ProgramCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new program."""
    # Ensure user exists (auto-create if first time)
    # This handles the case where Supabase Auth has the user but our local PG does not
    user = await db.get(User, program_data.user_id)
    if not user:
        print(f"👤 Creating missing user record for {program_data.user_id}")
        new_user = User(
            id=program_data.user_id,
            email=f"user_{program_data.user_id}@placeholder.com", # Placeholder until profile sync
            full_name="New User"
        )
        db.add(new_user)
        await db.commit()
    
    program = Program(**program_data.model_dump())
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return program


@router.get("/", response_model=List[ProgramResponse])
async def list_programs(
    user_id: Optional[UUID] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all programs, optionally filtered by user or status."""
    stmt = select(Program)
    if user_id:
        stmt = stmt.where(Program.user_id == user_id)
    if status_filter:
        stmt = stmt.where(Program.status == status_filter)
    stmt = stmt.order_by(Program.updated_at.desc())
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


# STATIC ROUTES - Must be defined BEFORE /{program_id} to avoid route conflicts

@router.get("/badges", response_model=List[BadgeResponse])
async def list_badges(db: AsyncSession = Depends(get_db)):
    """List all available badges."""
    stmt = select(Badge).order_by(Badge.step_number)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/models", response_model=List[ProvenModelResponse])
async def list_proven_models(
    theme: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all proven models, optionally filtered by theme."""
    stmt = select(ProvenModel)
    if theme:
        stmt = stmt.where(ProvenModel.themes.any(theme))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{program_id}", response_model=ProgramResponse)
async def get_program(program_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific program by ID."""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.patch("/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: UUID,
    program_data: ProgramUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a program."""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    update_data = program_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(program, key, value)
    
    await db.commit()
    await db.refresh(program)
    return program


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(program_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a program."""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    await db.delete(program)
    await db.commit()


@router.get("/{program_id}/full", response_model=FullProgramResponse)
async def get_full_program(program_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a program with all related data for export."""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Get all related data
    stmt = select(ProblemStatement).where(ProblemStatement.program_id == program_id)
    result = await db.execute(stmt)
    problem_statement = result.scalar_one_or_none()
    
    stmt = select(Stakeholder).where(Stakeholder.program_id == program_id)
    result = await db.execute(stmt)
    stakeholders = list(result.scalars().all())
    
    stmt = select(ProgramProvenModel).where(
        ProgramProvenModel.program_id == program_id
    ).options(selectinload(ProgramProvenModel.proven_model))
    result = await db.execute(stmt)
    program_models = list(result.scalars().all())
    proven_models = [pm.proven_model for pm in program_models]
    
    stmt = select(Outcome).where(Outcome.program_id == program_id)
    result = await db.execute(stmt)
    outcomes = list(result.scalars().all())
    
    outcome_ids = [o.id for o in outcomes]
    stmt = select(Indicator).where(Indicator.outcome_id.in_(outcome_ids))
    result = await db.execute(stmt)
    indicators = list(result.scalars().all())
    
    return FullProgramResponse(
        program=program,
        problem_statement=problem_statement,
        stakeholders=stakeholders,
        proven_models=proven_models,
        outcomes=outcomes,
        indicators=indicators
    )


# =====================================================
# PROBLEM STATEMENT CRUD
# =====================================================

@router.post("/{program_id}/problem", response_model=ProblemStatementResponse, status_code=status.HTTP_201_CREATED)
async def create_problem_statement(
    program_id: UUID,
    data: ProblemStatementCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create problem statement for a program (Step 1)."""
    # Verify program exists
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Check if problem statement already exists
    stmt = select(ProblemStatement).where(ProblemStatement.program_id == program_id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Problem statement already exists for this program")
    
    problem = ProblemStatement(program_id=program_id, **data.model_dump(exclude={'program_id'}))
    db.add(problem)
    await db.commit()
    await db.refresh(problem)
    return problem


@router.get("/{program_id}/problem", response_model=ProblemStatementResponse)
async def get_problem_statement(program_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get problem statement for a program."""
    stmt = select(ProblemStatement).where(ProblemStatement.program_id == program_id)
    result = await db.execute(stmt)
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem statement not found")
    return problem


@router.patch("/{program_id}/problem", response_model=ProblemStatementResponse)
async def update_problem_statement(
    program_id: UUID,
    data: ProblemStatementUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update problem statement and optionally advance program step."""
    stmt = select(ProblemStatement).where(ProblemStatement.program_id == program_id)
    result = await db.execute(stmt)
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem statement not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(problem, key, value)
    
    # If marked as completed, advance program step
    if data.is_completed and problem.is_completed:
        program = await db.get(Program, program_id)
        if program and program.current_step == 1:
            program.current_step = 2
            program.status = "in_progress"
    
    await db.commit()
    await db.refresh(problem)
    return problem


# =====================================================
# STAKEHOLDER CRUD
# =====================================================

@router.post("/{program_id}/stakeholders", response_model=StakeholderResponse, status_code=status.HTTP_201_CREATED)
async def add_stakeholder(
    program_id: UUID,
    data: StakeholderCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a stakeholder to a program (Step 2)."""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    stakeholder = Stakeholder(program_id=program_id, **data.model_dump(exclude={'program_id'}))
    db.add(stakeholder)
    await db.commit()
    await db.refresh(stakeholder)
    return stakeholder


@router.get("/{program_id}/stakeholders", response_model=List[StakeholderResponse])
async def list_stakeholders(program_id: UUID, db: AsyncSession = Depends(get_db)):
    """List all stakeholders for a program."""
    stmt = select(Stakeholder).where(Stakeholder.program_id == program_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.patch("/stakeholders/{stakeholder_id}", response_model=StakeholderResponse)
async def update_stakeholder(
    stakeholder_id: UUID,
    data: StakeholderUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a stakeholder."""
    stakeholder = await db.get(Stakeholder, stakeholder_id)
    if not stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(stakeholder, key, value)
    
    await db.commit()
    await db.refresh(stakeholder)
    return stakeholder


@router.delete("/stakeholders/{stakeholder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stakeholder(stakeholder_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a stakeholder."""
    stakeholder = await db.get(Stakeholder, stakeholder_id)
    if not stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    await db.delete(stakeholder)
    await db.commit()


@router.post("/{program_id}/stakeholders/complete", response_model=ProgramResponse)
async def complete_stakeholder_step(program_id: UUID, db: AsyncSession = Depends(get_db)):
    """Mark stakeholder step as complete and advance to step 3."""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Verify at least one stakeholder exists
    stmt = select(Stakeholder).where(Stakeholder.program_id == program_id)
    result = await db.execute(stmt)
    if not result.scalars().first():
        raise HTTPException(status_code=400, detail="Add at least one stakeholder before completing this step")
    
    if program.current_step == 2:
        program.current_step = 3
    
    await db.commit()
    await db.refresh(program)
    return program



@router.post("/{program_id}/models", response_model=ProgramProvenModelResponse, status_code=status.HTTP_201_CREATED)
async def add_proven_model_to_program(
    program_id: UUID,
    data: ProgramProvenModelCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a proven model to a program (Step 3)."""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    model = await db.get(ProvenModel, data.proven_model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Proven model not found")
    
    program_model = ProgramProvenModel(
        program_id=program_id,
        proven_model_id=data.proven_model_id,
        notes=data.notes
    )
    db.add(program_model)
    await db.commit()
    
    # Reload with relationship
    stmt = select(ProgramProvenModel).where(
        ProgramProvenModel.id == program_model.id
    ).options(selectinload(ProgramProvenModel.proven_model))
    result = await db.execute(stmt)
    program_model = result.scalar_one()
    
    return program_model


@router.post("/{program_id}/models/complete", response_model=ProgramResponse)
async def complete_models_step(program_id: UUID, db: AsyncSession = Depends(get_db)):
    """Mark proven models step as complete and advance to step 4."""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    if program.current_step == 3:
        program.current_step = 4
    
    await db.commit()
    await db.refresh(program)
    return program


# =====================================================
# OUTCOMES & INDICATORS
# =====================================================

@router.post("/{program_id}/outcomes", response_model=OutcomeResponse, status_code=status.HTTP_201_CREATED)
async def create_outcome(
    program_id: UUID,
    data: OutcomeCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create an outcome for a program (Step 4)."""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    outcome = Outcome(program_id=program_id, **data.model_dump(exclude={'program_id'}))
    db.add(outcome)
    await db.commit()
    await db.refresh(outcome)
    return outcome


@router.get("/{program_id}/outcomes", response_model=List[OutcomeResponse])
async def list_outcomes(program_id: UUID, db: AsyncSession = Depends(get_db)):
    """List all outcomes for a program."""
    stmt = select(Outcome).where(Outcome.program_id == program_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/outcomes/{outcome_id}/indicators", response_model=IndicatorResponse, status_code=status.HTTP_201_CREATED)
async def create_indicator(
    outcome_id: UUID,
    data: IndicatorCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add an indicator to an outcome."""
    outcome = await db.get(Outcome, outcome_id)
    if not outcome:
        raise HTTPException(status_code=404, detail="Outcome not found")
    
    indicator = Indicator(outcome_id=outcome_id, **data.model_dump(exclude={'outcome_id'}))
    db.add(indicator)
    await db.commit()
    await db.refresh(indicator)
    return indicator


@router.get("/outcomes/{outcome_id}/indicators", response_model=List[IndicatorResponse])
async def list_indicators(outcome_id: UUID, db: AsyncSession = Depends(get_db)):
    """List all indicators for an outcome."""
    stmt = select(Indicator).where(Indicator.outcome_id == outcome_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/{program_id}/indicators/complete", response_model=ProgramResponse)
async def complete_indicators_step(program_id: UUID, db: AsyncSession = Depends(get_db)):
    """Mark indicators step as complete and advance to step 5."""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Verify at least one outcome with indicators exists
    stmt = select(Outcome).where(Outcome.program_id == program_id)
    result = await db.execute(stmt)
    outcomes = list(result.scalars().all())
    
    if not outcomes:
        raise HTTPException(status_code=400, detail="Add at least one outcome before completing this step")
    
    if program.current_step == 4:
        program.current_step = 5
    
    await db.commit()
    await db.refresh(program)
    return program


