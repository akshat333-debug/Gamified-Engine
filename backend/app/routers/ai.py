"""
AI Router - Endpoints for AI-powered features
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.ai_service import get_ai_service, AIService
from app.services.rag_service import get_rag_service, RAGService
from app.schemas import (
    RefineProblemRequest, RefineProblemResponse,
    SuggestStakeholdersRequest, SuggestStakeholdersResponse,
    GenerateIndicatorsRequest, GenerateIndicatorsResponse,
    SearchModelsRequest, ProvenModelResponse
)

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/refine-problem", response_model=RefineProblemResponse)
async def refine_problem(request: RefineProblemRequest):
    """
    Refine a vague challenge statement into a structured Root Cause Analysis.
    
    This endpoint takes a raw challenge description and uses AI to:
    1. Clarify the core problem
    2. Identify root causes
    3. Suggest an appropriate theme (FLN, Career Readiness, etc.)
    """
    try:
        ai_service = get_ai_service()
        result = await ai_service.refine_problem(request.challenge_text)
        return result
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")


@router.post("/suggest-stakeholders", response_model=SuggestStakeholdersResponse)
async def suggest_stakeholders(request: SuggestStakeholdersRequest):
    """
    Suggest relevant stakeholders based on the problem statement.
    
    Returns a list of suggested stakeholders with their roles,
    engagement strategies, and priority levels.
    """
    try:
        ai_service = get_ai_service()
        result = await ai_service.suggest_stakeholders(
            request.problem_statement,
            request.theme
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")


@router.post("/generate-indicators", response_model=GenerateIndicatorsResponse)
async def generate_indicators(request: GenerateIndicatorsRequest):
    """
    Generate SMART indicators for an outcome.
    
    Uses the SMART framework to create measurable indicators.
    Theme-specific logic:
    - FLN: Focus on NIPUN Bharat standards
    - Career Readiness: Focus on agency and decision-making skills
    - STEM: Focus on problem-solving and scientific thinking
    - Life Skills: Focus on social-emotional learning
    """
    try:
        ai_service = get_ai_service()
        result = await ai_service.generate_indicators(
            request.outcome_description,
            request.theme
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")


@router.post("/search-models", response_model=list[ProvenModelResponse])
async def search_proven_models(
    request: SearchModelsRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Search for proven models using semantic similarity.
    
    Uses vector embeddings to find models most relevant to the query.
    Falls back to keyword search if embeddings are unavailable.
    """
    try:
        rag_service = get_rag_service()
        models = await rag_service.search_models(
            db=db,
            query=request.query,
            limit=request.limit
        )
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")
