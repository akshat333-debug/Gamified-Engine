"""
Forms Router - Generate data collection forms from indicators
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

router = APIRouter(prefix="/api/forms", tags=["forms"])


class IndicatorFormField(BaseModel):
    indicator_id: str
    description: str
    type: str  # outcome or output
    measurement_method: Optional[str] = None
    target_value: Optional[str] = None
    data_source: Optional[str] = None


class FormGenerateRequest(BaseModel):
    program_id: str
    form_title: str
    indicators: List[IndicatorFormField]


class FormField(BaseModel):
    name: str
    label: str
    type: str  # text, number, select, date, etc.
    required: bool = True
    hint: Optional[str] = None
    choices: Optional[List[str]] = None


def generate_xlsform_content(title: str, indicators: List[IndicatorFormField]) -> str:
    """Generate XLSForm-compatible content for ODK/KoboToolbox."""
    
    # XLSForm is a spreadsheet format, we'll generate a simplified CSV version
    # that can be imported into ODK/KoboToolbox
    
    survey_rows = [
        "type\tname\tlabel\trequired\thint"
    ]
    
    # Add metadata fields
    survey_rows.append("start\tstart\t\t\t")
    survey_rows.append("end\tend\t\t\t")
    survey_rows.append("today\ttoday\t\t\t")
    
    # Add program info fields
    survey_rows.append("text\tschool_name\tSchool/Center Name\tyes\tEnter the name of the school or center")
    survey_rows.append("text\tdata_collector\tData Collector Name\tyes\tYour name")
    survey_rows.append("date\tcollection_date\tData Collection Date\tyes\t")
    
    # Add indicator-based fields
    for i, indicator in enumerate(indicators):
        field_name = f"indicator_{i+1}"
        hint = indicator.measurement_method or ""
        
        # Determine field type based on indicator
        if any(word in indicator.description.lower() for word in ['percentage', 'rate', 'score', 'number', 'count']):
            field_type = "integer"
        elif any(word in indicator.description.lower() for word in ['yes/no', 'completed', 'achieved']):
            field_type = "select_one yes_no"
        else:
            field_type = "text"
        
        survey_rows.append(f"{field_type}\t{field_name}\t{indicator.description}\tyes\t{hint}")
        
        if indicator.target_value:
            survey_rows.append(f"note\t{field_name}_target\tTarget: {indicator.target_value}\t\t")
    
    # Add notes/comments field
    survey_rows.append("text\tobservations\tAdditional Observations\tno\tAny other relevant information")
    
    # Create choices sheet content
    choices_rows = [
        "list_name\tname\tlabel",
        "yes_no\tyes\tYes",
        "yes_no\tno\tNo",
    ]
    
    # Create settings sheet
    settings_rows = [
        "form_title\tform_id",
        f"{title}\t{title.lower().replace(' ', '_')}"
    ]
    
    # Combine all sheets
    content = "=== SURVEY SHEET ===\n"
    content += "\n".join(survey_rows)
    content += "\n\n=== CHOICES SHEET ===\n"
    content += "\n".join(choices_rows)
    content += "\n\n=== SETTINGS SHEET ===\n"
    content += "\n".join(settings_rows)
    
    return content


@router.post("/generate")
async def generate_form(request: FormGenerateRequest):
    """Generate a data collection form from program indicators."""
    
    form_fields = []
    
    # Add standard fields
    form_fields.append({
        "name": "school_name",
        "label": "School/Center Name",
        "type": "text",
        "required": True,
    })
    form_fields.append({
        "name": "data_collector",
        "label": "Data Collector Name",
        "type": "text",
        "required": True,
    })
    form_fields.append({
        "name": "collection_date",
        "label": "Collection Date",
        "type": "date",
        "required": True,
    })
    
    # Convert indicators to form fields
    for i, indicator in enumerate(request.indicators):
        field_type = "text"
        if any(word in indicator.description.lower() for word in ['percentage', 'rate', 'score', 'number', 'count']):
            field_type = "number"
        elif any(word in indicator.description.lower() for word in ['yes/no', 'completed', 'achieved']):
            field_type = "select"
        
        form_fields.append({
            "name": f"indicator_{i+1}",
            "label": indicator.description,
            "type": field_type,
            "required": True,
            "hint": indicator.measurement_method,
            "target": indicator.target_value,
        })
    
    return {
        "form_title": request.form_title,
        "program_id": request.program_id,
        "fields": form_fields,
        "total_fields": len(form_fields),
    }


@router.post("/export-xlsform")
async def export_xlsform(request: FormGenerateRequest):
    """Export form as XLSForm format for ODK/KoboToolbox."""
    
    content = generate_xlsform_content(request.form_title, request.indicators)
    
    # Return as downloadable file
    buffer = io.BytesIO(content.encode('utf-8'))
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename={request.form_title.replace(' ', '_')}_xlsform.txt"
        }
    )


@router.get("/templates")
async def get_form_templates():
    """Get pre-built form templates for common data collection needs."""
    
    return [
        {
            "id": "fln_assessment",
            "name": "FLN Assessment Form",
            "description": "Assess reading and numeracy skills based on NIPUN Bharat standards",
            "fields": [
                {"name": "student_name", "label": "Student Name", "type": "text"},
                {"name": "grade", "label": "Grade", "type": "select", "choices": ["Grade 1", "Grade 2", "Grade 3"]},
                {"name": "oral_reading_fluency", "label": "Oral Reading Fluency (WPM)", "type": "number"},
                {"name": "reading_comprehension", "label": "Reading Comprehension Score", "type": "number"},
                {"name": "number_recognition", "label": "Number Recognition Score", "type": "number"},
                {"name": "addition_score", "label": "Addition Score", "type": "number"},
            ]
        },
        {
            "id": "attendance_tracking",
            "name": "Attendance Tracking Form",
            "description": "Daily attendance tracking for program participants",
            "fields": [
                {"name": "date", "label": "Date", "type": "date"},
                {"name": "total_enrolled", "label": "Total Enrolled", "type": "number"},
                {"name": "present_today", "label": "Present Today", "type": "number"},
                {"name": "absent_reasons", "label": "Common Absence Reasons", "type": "text"},
            ]
        },
        {
            "id": "teacher_observation",
            "name": "Teacher Observation Form",
            "description": "Classroom observation checklist for teacher training programs",
            "fields": [
                {"name": "teacher_name", "label": "Teacher Name", "type": "text"},
                {"name": "uses_tlm", "label": "Uses Teaching Learning Materials", "type": "select", "choices": ["Yes", "No", "Partially"]},
                {"name": "student_engagement", "label": "Student Engagement Level", "type": "select", "choices": ["High", "Medium", "Low"]},
                {"name": "differentiated_instruction", "label": "Uses Differentiated Instruction", "type": "select", "choices": ["Yes", "No"]},
            ]
        }
    ]
