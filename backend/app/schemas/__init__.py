"""
Pydantic Schemas for API validation
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


# =====================================================
# User Schemas
# =====================================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    organization: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================
# Program Schemas
# =====================================================

class ProgramBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProgramCreate(ProgramBase):
    user_id: Optional[UUID] = None


class ProgramUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    current_step: Optional[int] = Field(None, ge=1, le=5)


class ProgramResponse(ProgramBase):
    id: UUID
    user_id: Optional[UUID]
    status: str
    current_step: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================
# Problem Statement Schemas
# =====================================================

class ProblemStatementBase(BaseModel):
    challenge_text: str = Field(..., min_length=10)
    theme: Optional[str] = Field(None, pattern="^(FLN|Career Readiness|STEM|Life Skills|Other)$")


class ProblemStatementCreate(ProblemStatementBase):
    program_id: Optional[UUID] = None


class ProblemStatementUpdate(BaseModel):
    challenge_text: Optional[str] = None
    refined_text: Optional[str] = None
    root_causes: Optional[List[str]] = None
    theme: Optional[str] = None
    is_completed: Optional[bool] = None


class ProblemStatementResponse(ProblemStatementBase):
    id: UUID
    program_id: UUID
    refined_text: Optional[str]
    root_causes: List[str]
    is_completed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================
# Stakeholder Schemas
# =====================================================

class StakeholderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., min_length=1, max_length=255)
    engagement_strategy: Optional[str] = None
    priority: str = Field(default="medium", pattern="^(high|medium|low)$")


class StakeholderCreate(StakeholderBase):
    program_id: Optional[UUID] = None
    is_ai_suggested: bool = False


class StakeholderUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    engagement_strategy: Optional[str] = None
    priority: Optional[str] = None


class StakeholderResponse(StakeholderBase):
    id: UUID
    program_id: UUID
    is_ai_suggested: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================
# Proven Model Schemas
# =====================================================

class ProvenModelBase(BaseModel):
    name: str
    description: str
    implementation_guide: Optional[str] = None
    evidence_base: Optional[str] = None
    themes: List[str] = []
    target_outcomes: List[str] = []
    source_url: Optional[str] = None


class ProvenModelResponse(ProvenModelBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProgramProvenModelCreate(BaseModel):
    program_id: UUID
    proven_model_id: UUID
    notes: Optional[str] = None


class ProgramProvenModelResponse(BaseModel):
    id: UUID
    program_id: UUID
    proven_model: ProvenModelResponse
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================
# Outcome Schemas
# =====================================================

class OutcomeBase(BaseModel):
    description: str = Field(..., min_length=10)
    theme: Optional[str] = None
    timeframe: Optional[str] = None


class OutcomeCreate(OutcomeBase):
    program_id: Optional[UUID] = None


class OutcomeUpdate(BaseModel):
    description: Optional[str] = None
    theme: Optional[str] = None
    timeframe: Optional[str] = None


class OutcomeResponse(OutcomeBase):
    id: UUID
    program_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================
# Indicator Schemas
# =====================================================

class IndicatorBase(BaseModel):
    type: str = Field(..., pattern="^(outcome|output)$")
    description: str = Field(..., min_length=10)
    measurement_method: Optional[str] = None
    target_value: Optional[str] = None
    baseline_value: Optional[str] = None
    frequency: Optional[str] = None
    data_source: Optional[str] = None


class IndicatorCreate(IndicatorBase):
    outcome_id: Optional[UUID] = None
    is_ai_generated: bool = False


class IndicatorUpdate(BaseModel):
    description: Optional[str] = None
    measurement_method: Optional[str] = None
    target_value: Optional[str] = None
    baseline_value: Optional[str] = None
    frequency: Optional[str] = None
    data_source: Optional[str] = None


class IndicatorResponse(IndicatorBase):
    id: UUID
    outcome_id: UUID
    is_ai_generated: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================
# Badge Schemas
# =====================================================

class BadgeResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    icon: Optional[str]
    step_number: Optional[int]
    
    class Config:
        from_attributes = True


class UserBadgeResponse(BaseModel):
    id: UUID
    badge: BadgeResponse
    program_id: UUID
    earned_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================
# AI Request/Response Schemas
# =====================================================

class RefineProblemRequest(BaseModel):
    challenge_text: str = Field(..., min_length=10)


class RefineProblemResponse(BaseModel):
    refined_text: str
    root_causes: List[str]
    suggested_theme: str


class SuggestStakeholdersRequest(BaseModel):
    problem_statement: str
    theme: Optional[str] = None


class SuggestedStakeholder(BaseModel):
    name: str
    role: str
    engagement_strategy: str
    priority: str


class SuggestStakeholdersResponse(BaseModel):
    stakeholders: List[SuggestedStakeholder]


class GenerateIndicatorsRequest(BaseModel):
    outcome_description: str
    theme: str = Field(..., pattern="^(FLN|Career Readiness|STEM|Life Skills|Other)$")


class GeneratedIndicator(BaseModel):
    type: str
    description: str
    measurement_method: str
    target_value: str
    frequency: str
    data_source: str


class GenerateIndicatorsResponse(BaseModel):
    indicators: List[GeneratedIndicator]


class SearchModelsRequest(BaseModel):
    query: str
    limit: int = Field(default=5, ge=1, le=20)


# =====================================================
# Full Program Response (for export)
# =====================================================

class FullProgramResponse(BaseModel):
    program: ProgramResponse
    problem_statement: Optional[ProblemStatementResponse]
    stakeholders: List[StakeholderResponse]
    proven_models: List[ProvenModelResponse]
    outcomes: List[OutcomeResponse]
    indicators: List[IndicatorResponse]
    
    class Config:
        from_attributes = True
