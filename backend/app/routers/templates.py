"""
Templates Router - Program templates for quick-start
"""
import json
from pathlib import Path
from typing import Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Program, ProblemStatement, Stakeholder, Outcome, Indicator

router = APIRouter(prefix="/api/templates", tags=["templates"])

# Load template data
DATA_PATH = Path(__file__).parent.parent / "data" / "program_templates.json"

def load_templates():
    """Load template data from JSON file."""
    try:
        with open(DATA_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"templates": []}


@router.get("/")
async def list_templates(theme: Optional[str] = None):
    """List all available program templates."""
    data = load_templates()
    templates = data.get("templates", [])
    
    if theme:
        templates = [t for t in templates if t.get("theme", "").lower() == theme.lower()]
    
    # Return summary info (not full details)
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "description": t["description"],
            "theme": t["theme"],
            "difficulty": t["difficulty"],
            "duration": t["duration"],
            "target_beneficiaries": t["target_beneficiaries"],
        }
        for t in templates
    ]


@router.get("/{template_id}")
async def get_template(template_id: str):
    """Get full details of a specific template."""
    data = load_templates()
    templates = data.get("templates", [])
    
    template = next((t for t in templates if t["id"] == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template


@router.post("/{template_id}/create-program")
async def create_program_from_template(
    template_id: str,
    user_id: Optional[str] = None,
    custom_title: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a new program from a template."""
    data = load_templates()
    templates = data.get("templates", [])
    
    template = next((t for t in templates if t["id"] == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    try:
        # Create program
        program = Program(
            id=uuid4(),
            user_id=UUID(user_id) if user_id else None,
            title=custom_title or template["name"],
            description=template["description"],
            status="draft",
            current_step=1,
        )
        db.add(program)
        await db.flush()
        
        # Create problem statement
        ps_data = template.get("problem_statement", {})
        problem_statement = ProblemStatement(
            id=uuid4(),
            program_id=program.id,
            challenge_text=ps_data.get("challenge_text", ""),
            root_causes=ps_data.get("root_causes", []),
            theme=ps_data.get("theme", "Other"),
            is_completed=True,
        )
        db.add(problem_statement)
        
        # Create stakeholders
        for s_data in template.get("stakeholders", []):
            stakeholder = Stakeholder(
                id=uuid4(),
                program_id=program.id,
                name=s_data["name"],
                role=s_data["role"],
                priority=s_data.get("priority", "medium"),
                is_ai_suggested=False,
            )
            db.add(stakeholder)
        
        # Create outcomes and indicators
        for o_data in template.get("outcomes", []):
            outcome = Outcome(
                id=uuid4(),
                program_id=program.id,
                description=o_data["description"],
                theme=template.get("theme"),
            )
            db.add(outcome)
            await db.flush()
            
            for i_data in o_data.get("indicators", []):
                indicator = Indicator(
                    id=uuid4(),
                    outcome_id=outcome.id,
                    type=i_data["type"],
                    description=i_data["description"],
                    target_value=i_data.get("target_value"),
                    is_ai_generated=False,
                )
                db.add(indicator)
        
        await db.commit()
        
        return {
            "message": "Program created from template",
            "program_id": str(program.id),
            "title": program.title,
            "template_used": template["name"],
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create program: {str(e)}")
