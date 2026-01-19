"""
SQLAlchemy ORM Models
"""
from datetime import datetime
from typing import Optional
from uuid import uuid4
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, 
    ForeignKey, CheckConstraint, ARRAY, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))
    organization = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    programs = relationship("Program", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")


class Program(Base):
    __tablename__ = "programs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="draft")
    current_step = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'in_progress', 'completed')"),
        CheckConstraint("current_step BETWEEN 1 AND 5"),
    )
    
    user = relationship("User", back_populates="programs")
    problem_statement = relationship("ProblemStatement", back_populates="program", uselist=False, cascade="all, delete-orphan")
    stakeholders = relationship("Stakeholder", back_populates="program", cascade="all, delete-orphan")
    proven_models = relationship("ProgramProvenModel", back_populates="program", cascade="all, delete-orphan")
    outcomes = relationship("Outcome", back_populates="program", cascade="all, delete-orphan")
    documents = relationship("GeneratedDocument", back_populates="program", cascade="all, delete-orphan")


class ProblemStatement(Base):
    __tablename__ = "problem_statements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="CASCADE"), unique=True)
    challenge_text = Column(Text, nullable=False)
    refined_text = Column(Text)
    root_causes = Column(JSON, default=list)
    theme = Column(String(100))
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("theme IN ('FLN', 'Career Readiness', 'STEM', 'Life Skills', 'Other')"),
    )
    
    program = relationship("Program", back_populates="problem_statement")


class Stakeholder(Base):
    __tablename__ = "stakeholders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    engagement_strategy = Column(Text)
    priority = Column(String(50), default="medium")
    is_ai_suggested = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("priority IN ('high', 'medium', 'low')"),
    )
    
    program = relationship("Program", back_populates="stakeholders")


class ProvenModel(Base):
    __tablename__ = "proven_models"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    implementation_guide = Column(Text)
    evidence_base = Column(Text)
    themes = Column(ARRAY(Text), default=list)
    target_outcomes = Column(ARRAY(Text), default=list)
    source_url = Column(String(500))
    embedding = Column(Vector(1536))  # OpenAI embedding dimension
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class ProgramProvenModel(Base):
    __tablename__ = "program_proven_models"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="CASCADE"))
    proven_model_id = Column(UUID(as_uuid=True), ForeignKey("proven_models.id", ondelete="CASCADE"))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    program = relationship("Program", back_populates="proven_models")
    proven_model = relationship("ProvenModel")


class Outcome(Base):
    __tablename__ = "outcomes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="CASCADE"))
    description = Column(Text, nullable=False)
    theme = Column(String(100))
    timeframe = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    program = relationship("Program", back_populates="outcomes")
    indicators = relationship("Indicator", back_populates="outcome", cascade="all, delete-orphan")


class Indicator(Base):
    __tablename__ = "indicators"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    outcome_id = Column(UUID(as_uuid=True), ForeignKey("outcomes.id", ondelete="CASCADE"))
    type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    measurement_method = Column(Text)
    target_value = Column(String(255))
    baseline_value = Column(String(255))
    frequency = Column(String(100))
    data_source = Column(String(255))
    is_ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("type IN ('outcome', 'output')"),
    )
    
    outcome = relationship("Outcome", back_populates="indicators")


class GeneratedDocument(Base):
    __tablename__ = "generated_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="CASCADE"))
    document_type = Column(String(50), default="pdf")
    file_path = Column(String(500))
    generated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    program = relationship("Program", back_populates="documents")


class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(100))
    step_number = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("step_number BETWEEN 1 AND 5"),
    )


class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    badge_id = Column(UUID(as_uuid=True), ForeignKey("badges.id", ondelete="CASCADE"))
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="CASCADE"))
    earned_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    user = relationship("User", back_populates="badges")
    badge = relationship("Badge")
