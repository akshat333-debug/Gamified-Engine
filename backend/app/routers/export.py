"""
Export Router - PDF generation and document export
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    Program, ProblemStatement, Stakeholder, Outcome, Indicator,
    ProgramProvenModel, GeneratedDocument
)
from app.services.pdf_service import get_pdf_service

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/{program_id}/pdf")
async def generate_pdf(
    program_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a PDF Program Design Document for a program.
    
    Compiles all program data into a professional PDF report:
    - Challenge Statement & Root Cause Analysis
    - Stakeholder Mapping
    - Evidence-Based Interventions
    - Outcomes & Indicators
    """
    # Get program
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Get problem statement
    stmt = select(ProblemStatement).where(ProblemStatement.program_id == program_id)
    result = await db.execute(stmt)
    problem_statement = result.scalar_one_or_none()
    
    # Get stakeholders
    stmt = select(Stakeholder).where(Stakeholder.program_id == program_id)
    result = await db.execute(stmt)
    stakeholders = list(result.scalars().all())
    
    # Get proven models
    stmt = select(ProgramProvenModel).where(
        ProgramProvenModel.program_id == program_id
    ).options(selectinload(ProgramProvenModel.proven_model))
    result = await db.execute(stmt)
    program_models = list(result.scalars().all())
    proven_models = [pm.proven_model for pm in program_models]
    
    # Get outcomes
    stmt = select(Outcome).where(Outcome.program_id == program_id)
    result = await db.execute(stmt)
    outcomes = list(result.scalars().all())
    
    # Get indicators
    outcome_ids = [o.id for o in outcomes]
    indicators = []
    if outcome_ids:
        stmt = select(Indicator).where(Indicator.outcome_id.in_(outcome_ids))
        result = await db.execute(stmt)
        indicators = list(result.scalars().all())
    
    # Convert to dicts for PDF service
    problem_dict = None
    if problem_statement:
        problem_dict = {
            'challenge_text': problem_statement.challenge_text,
            'refined_text': problem_statement.refined_text,
            'root_causes': problem_statement.root_causes or [],
            'theme': problem_statement.theme
        }
    
    stakeholder_dicts = [
        {
            'name': s.name,
            'role': s.role,
            'engagement_strategy': s.engagement_strategy,
            'priority': s.priority
        }
        for s in stakeholders
    ]
    
    model_dicts = [
        {
            'name': m.name,
            'description': m.description,
            'evidence_base': m.evidence_base
        }
        for m in proven_models
    ]
    
    outcome_dicts = [
        {
            'id': str(o.id),
            'description': o.description,
            'theme': o.theme,
            'timeframe': o.timeframe
        }
        for o in outcomes
    ]
    
    indicator_dicts = [
        {
            'outcome_id': str(i.outcome_id),
            'type': i.type,
            'description': i.description,
            'target_value': i.target_value,
            'frequency': i.frequency
        }
        for i in indicators
    ]
    
    # Generate PDF
    pdf_service = get_pdf_service()
    pdf_bytes = pdf_service.generate_program_document(
        program_title=program.title,
        problem_statement=problem_dict,
        stakeholders=stakeholder_dicts,
        proven_models=model_dicts,
        outcomes=outcome_dicts,
        indicators=indicator_dicts
    )
    
    # Record the generation
    doc = GeneratedDocument(
        program_id=program_id,
        document_type="pdf",
        file_path=f"generated/{program_id}.pdf"
    )
    db.add(doc)
    await db.commit()
    
    # Mark program as completed if on step 5
    if program.current_step == 5:
        program.status = "completed"
        await db.commit()
    
    # Return PDF
    filename = f"{program.title.replace(' ', '_')}_Program_Design.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
