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


@router.get("/{program_id}/csv")
async def export_csv(
    program_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Export program data as CSV for data analysis."""
    import csv
    import io
    
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Get all program data
    stmt = select(Outcome).where(Outcome.program_id == program_id)
    result = await db.execute(stmt)
    outcomes = list(result.scalars().all())
    
    outcome_ids = [o.id for o in outcomes]
    indicators = []
    if outcome_ids:
        stmt = select(Indicator).where(Indicator.outcome_id.in_(outcome_ids))
        result = await db.execute(stmt)
        indicators = list(result.scalars().all())
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    writer.writerow(['Type', 'Description', 'Target Value', 'Measurement Method', 'Frequency'])
    
    # Write outcomes and indicators
    for outcome in outcomes:
        writer.writerow(['Outcome', outcome.description, '', '', ''])
        for ind in [i for i in indicators if str(i.outcome_id) == str(outcome.id)]:
            writer.writerow([
                f'  {ind.type.capitalize()} Indicator',
                ind.description,
                ind.target_value or '',
                ind.measurement_method or '',
                ind.frequency or ''
            ])
    
    csv_content = output.getvalue()
    filename = f"{program.title.replace(' ', '_')}_Indicators.csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.get("/{program_id}/json")
async def export_json(
    program_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Export complete program data as JSON."""
    import json
    
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Get all data
    stmt = select(ProblemStatement).where(ProblemStatement.program_id == program_id)
    result = await db.execute(stmt)
    problem = result.scalar_one_or_none()
    
    stmt = select(Stakeholder).where(Stakeholder.program_id == program_id)
    result = await db.execute(stmt)
    stakeholders = list(result.scalars().all())
    
    stmt = select(Outcome).where(Outcome.program_id == program_id)
    result = await db.execute(stmt)
    outcomes = list(result.scalars().all())
    
    outcome_ids = [o.id for o in outcomes]
    indicators = []
    if outcome_ids:
        stmt = select(Indicator).where(Indicator.outcome_id.in_(outcome_ids))
        result = await db.execute(stmt)
        indicators = list(result.scalars().all())
    
    data = {
        "program": {
            "id": str(program.id),
            "title": program.title,
            "description": program.description,
            "status": program.status,
            "created_at": program.created_at.isoformat() if program.created_at else None,
        },
        "problem_statement": {
            "challenge": problem.challenge_text if problem else None,
            "refined": problem.refined_text if problem else None,
            "root_causes": problem.root_causes if problem else [],
            "theme": problem.theme if problem else None,
        } if problem else None,
        "stakeholders": [
            {"name": s.name, "role": s.role, "priority": s.priority}
            for s in stakeholders
        ],
        "outcomes": [
            {
                "description": o.description,
                "theme": o.theme,
                "indicators": [
                    {
                        "type": i.type,
                        "description": i.description,
                        "target": i.target_value,
                        "method": i.measurement_method,
                    }
                    for i in indicators if str(i.outcome_id) == str(o.id)
                ]
            }
            for o in outcomes
        ],
    }
    
    filename = f"{program.title.replace(' ', '_')}_Data.json"
    return Response(
        content=json.dumps(data, indent=2),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.get("/{program_id}/donor/{donor_type}")
async def export_donor_format(
    program_id: UUID,
    donor_type: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Export in donor-specific format.
    
    Supported donor types:
    - usaid: USAID Program Description format
    - gates: Gates Foundation Results Framework
    - dfid: DFID/FCDO Logframe format
    """
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Get all data
    stmt = select(ProblemStatement).where(ProblemStatement.program_id == program_id)
    result = await db.execute(stmt)
    problem = result.scalar_one_or_none()
    
    stmt = select(Stakeholder).where(Stakeholder.program_id == program_id)
    result = await db.execute(stmt)
    stakeholders = list(result.scalars().all())
    
    stmt = select(Outcome).where(Outcome.program_id == program_id)
    result = await db.execute(stmt)
    outcomes = list(result.scalars().all())
    
    outcome_ids = [o.id for o in outcomes]
    indicators = []
    if outcome_ids:
        stmt = select(Indicator).where(Indicator.outcome_id.in_(outcome_ids))
        result = await db.execute(stmt)
        indicators = list(result.scalars().all())
    
    # Generate donor-specific format
    if donor_type.lower() == "usaid":
        content = generate_usaid_format(program, problem, stakeholders, outcomes, indicators)
        filename = f"{program.title}_USAID_Format.txt"
    elif donor_type.lower() == "gates":
        content = generate_gates_format(program, problem, stakeholders, outcomes, indicators)
        filename = f"{program.title}_Gates_Results_Framework.txt"
    elif donor_type.lower() == "dfid":
        content = generate_dfid_format(program, problem, stakeholders, outcomes, indicators)
        filename = f"{program.title}_DFID_Logframe.txt"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown donor type: {donor_type}")
    
    return Response(
        content=content,
        media_type="text/plain",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


def generate_usaid_format(program, problem, stakeholders, outcomes, indicators):
    """Generate USAID Program Description format."""
    lines = [
        "=" * 60,
        "USAID PROGRAM DESCRIPTION",
        "=" * 60,
        "",
        f"Program Title: {program.title}",
        f"Prepared: {program.created_at.strftime('%B %d, %Y') if program.created_at else 'N/A'}",
        "",
        "-" * 40,
        "1. DEVELOPMENT HYPOTHESIS",
        "-" * 40,
        "",
    ]
    
    if problem:
        lines.append(f"Problem Statement: {problem.challenge_text}")
        lines.append("")
        if problem.root_causes:
            lines.append("Root Causes:")
            for i, cause in enumerate(problem.root_causes, 1):
                lines.append(f"  {i}. {cause}")
        lines.append("")
    
    lines.extend([
        "-" * 40,
        "2. RESULTS FRAMEWORK",
        "-" * 40,
        "",
    ])
    
    for i, outcome in enumerate(outcomes, 1):
        lines.append(f"Intermediate Result {i}: {outcome.description}")
        outcome_indicators = [ind for ind in indicators if str(ind.outcome_id) == str(outcome.id)]
        if outcome_indicators:
            lines.append("  Indicators:")
            for ind in outcome_indicators:
                lines.append(f"    - {ind.description} (Target: {ind.target_value or 'TBD'})")
        lines.append("")
    
    lines.extend([
        "-" * 40,
        "3. KEY STAKEHOLDERS",
        "-" * 40,
        "",
    ])
    
    for s in stakeholders:
        lines.append(f"  • {s.name} ({s.role}) - Priority: {s.priority}")
    
    return "\n".join(lines)


def generate_gates_format(program, problem, stakeholders, outcomes, indicators):
    """Generate Gates Foundation Results Framework format."""
    lines = [
        "=" * 60,
        "GATES FOUNDATION RESULTS FRAMEWORK",
        "=" * 60,
        "",
        f"Initiative: {program.title}",
        "",
        "GOAL:",
        f"  {problem.refined_text or problem.challenge_text if problem else 'Not defined'}",
        "",
        "OUTCOMES & INDICATORS:",
        "",
    ]
    
    for outcome in outcomes:
        lines.append(f"■ {outcome.description}")
        outcome_indicators = [ind for ind in indicators if str(ind.outcome_id) == str(outcome.id)]
        for ind in outcome_indicators:
            ind_type = "🎯" if ind.type == "outcome" else "📦"
            lines.append(f"  {ind_type} {ind.description}")
            if ind.target_value:
                lines.append(f"     Target: {ind.target_value}")
        lines.append("")
    
    return "\n".join(lines)


def generate_dfid_format(program, problem, stakeholders, outcomes, indicators):
    """Generate DFID/FCDO Logframe format."""
    lines = [
        "=" * 80,
        "LOGICAL FRAMEWORK (LOGFRAME)",
        "=" * 80,
        "",
        f"Project Title: {program.title}",
        "",
        "-" * 80,
        f"{'NARRATIVE':40} | {'INDICATORS':40}",
        "-" * 80,
        "",
        "IMPACT:",
        f"  {problem.refined_text if problem else 'Not defined'}",
        "",
        "OUTCOMES:",
    ]
    
    for i, outcome in enumerate(outcomes, 1):
        lines.append(f"  {i}. {outcome.description}")
        outcome_indicators = [ind for ind in indicators if str(ind.outcome_id) == str(outcome.id) and ind.type == "outcome"]
        for ind in outcome_indicators:
            lines.append(f"     → {ind.description} [{ind.target_value or 'TBD'}]")
    
    lines.extend(["", "OUTPUTS:"])
    for outcome in outcomes:
        output_indicators = [ind for ind in indicators if str(ind.outcome_id) == str(outcome.id) and ind.type == "output"]
        for ind in output_indicators:
            lines.append(f"  • {ind.description} [{ind.target_value or 'TBD'}]")
    
    return "\n".join(lines)
