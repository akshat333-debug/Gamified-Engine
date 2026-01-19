-- LogicForge Database Schema
-- PostgreSQL with pgvector extension for semantic search

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (for auth integration with Supabase)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    organization VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Programs table (main entity)
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
    current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 1: Problem Statements
-- =====================================================

CREATE TABLE problem_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE UNIQUE,
    challenge_text TEXT NOT NULL,
    refined_text TEXT,
    root_causes JSONB DEFAULT '[]',
    theme VARCHAR(100) CHECK (theme IN ('FLN', 'Career Readiness', 'STEM', 'Life Skills', 'Other')),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Stakeholders
-- =====================================================

CREATE TABLE stakeholders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    engagement_strategy TEXT,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    is_ai_suggested BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: Proven Models (for RAG)
-- =====================================================

CREATE TABLE proven_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    implementation_guide TEXT,
    evidence_base TEXT,
    themes TEXT[] DEFAULT '{}',
    target_outcomes TEXT[] DEFAULT '{}',
    source_url VARCHAR(500),
    embedding vector(1536),  -- OpenAI ada-002 embedding dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Program-Model association (selected models for a program)
CREATE TABLE program_proven_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    proven_model_id UUID REFERENCES proven_models(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(program_id, proven_model_id)
);

-- Create index for vector similarity search
CREATE INDEX ON proven_models USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- STEP 4: Outcomes and Indicators
-- =====================================================

CREATE TABLE outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    theme VARCHAR(100),
    timeframe VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outcome_id UUID REFERENCES outcomes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('outcome', 'output')),
    description TEXT NOT NULL,
    measurement_method TEXT,
    target_value VARCHAR(255),
    baseline_value VARCHAR(255),
    frequency VARCHAR(100),
    data_source VARCHAR(255),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: Generated Documents
-- =====================================================

CREATE TABLE generated_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    document_type VARCHAR(50) DEFAULT 'pdf',
    file_path VARCHAR(500),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BADGES & GAMIFICATION
-- =====================================================

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    step_number INTEGER CHECK (step_number BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id, program_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_programs_user_id ON programs(user_id);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_stakeholders_program_id ON stakeholders(program_id);
CREATE INDEX idx_outcomes_program_id ON outcomes(program_id);
CREATE INDEX idx_indicators_outcome_id ON indicators(outcome_id);
CREATE INDEX idx_indicators_type ON indicators(type);

-- =====================================================
-- SEED DATA: Proven Models
-- =====================================================

INSERT INTO proven_models (name, description, implementation_guide, evidence_base, themes, target_outcomes) VALUES
(
    'Teaching at the Right Level (TaRL)',
    'An evidence-based approach that groups children by learning level rather than age or grade, enabling targeted instruction for foundational skills.',
    'Step 1: Conduct baseline assessments to identify learning levels. Step 2: Group students by ability, not grade. Step 3: Use structured activities focused on foundational skills. Step 4: Reassess regularly and regroup.',
    'Rigorous RCTs by J-PAL shown 0.7 SD improvement in learning outcomes. Scaled to millions in India via government partnerships.',
    ARRAY['FLN'],
    ARRAY['Improved reading fluency', 'Number recognition', 'Basic arithmetic']
),
(
    'Remedial Learning Camps',
    'Intensive short-term learning camps focused on catching up children who are behind grade-level expectations.',
    'Step 1: Identify at-risk students. Step 2: Organize 30-45 day intensive camps. Step 3: Focus on core competencies. Step 4: Track progress with weekly assessments.',
    'Used successfully by Pratham and government programs. Shows significant short-term gains in foundational literacy.',
    ARRAY['FLN', 'Life Skills'],
    ARRAY['Grade-level reading', 'Math competency']
),
(
    'Career Awareness Workshops',
    'Structured workshops that expose students to diverse career paths and build decision-making skills.',
    'Step 1: Map local career opportunities. Step 2: Invite professionals for talks. Step 3: Conduct hands-on activities. Step 4: Support goal-setting exercises.',
    'Research shows improved career aspirations and self-efficacy. Particularly effective for first-generation learners.',
    ARRAY['Career Readiness'],
    ARRAY['Career awareness', 'Goal setting', 'Self-efficacy']
),
(
    'Peer Learning Circles',
    'Student-led small group learning that promotes collaboration and deeper understanding.',
    'Step 1: Train student facilitators. Step 2: Form groups of 4-6. Step 3: Assign structured discussion prompts. Step 4: Rotate leadership roles.',
    'Meta-analyses show 0.4-0.5 SD effects. Builds both academic and social-emotional skills.',
    ARRAY['FLN', 'Life Skills', 'STEM'],
    ARRAY['Collaborative skills', 'Academic achievement', 'Leadership']
),
(
    'Digital Literacy Integration',
    'Structured approach to building digital skills alongside core academic subjects.',
    'Step 1: Assess existing infrastructure. Step 2: Train teachers on ed-tech tools. Step 3: Integrate digital activities into curriculum. Step 4: Monitor screen time and learning outcomes.',
    'Growing evidence base for blended learning approaches. Important for 21st-century skill development.',
    ARRAY['STEM', 'Career Readiness'],
    ARRAY['Digital literacy', 'Self-directed learning', 'Tech skills']
);

-- Default badges for each step
INSERT INTO badges (name, description, icon, step_number) VALUES
('Problem Explorer', 'Defined your challenge statement clearly', '🔍', 1),
('Stakeholder Mapper', 'Identified key stakeholders for your program', '🤝', 2),
('Evidence Seeker', 'Selected proven models for your intervention', '📚', 3),
('Indicator Architect', 'Built measurable indicators for your outcomes', '📊', 4),
('Program Designer', 'Generated your complete program design document', '🏆', 5);
