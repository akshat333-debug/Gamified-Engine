-- LogicForge Database Schema v2.0
-- PostgreSQL with pgvector extension for semantic search
-- Enhanced with: Organizations, Roles, XP System, Streaks

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- ORGANIZATIONS & ROLES
-- =====================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'program_manager', 'viewer');

-- Users table (for auth integration with Supabase)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role user_role DEFAULT 'program_manager',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- XP & GAMIFICATION
-- =====================================================

CREATE TABLE user_xp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    points INTEGER NOT NULL,
    program_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- XP points configuration
CREATE TABLE xp_config (
    action VARCHAR(100) PRIMARY KEY,
    points INTEGER NOT NULL,
    description TEXT
);

INSERT INTO xp_config (action, points, description) VALUES
('complete_step_1', 100, 'Defined problem statement'),
('complete_step_2', 150, 'Mapped stakeholders'),
('complete_step_3', 150, 'Selected proven models'),
('complete_step_4', 200, 'Built indicators'),
('complete_step_5', 250, 'Generated final document'),
('ai_refine_problem', 25, 'Used AI to refine problem'),
('ai_suggest_stakeholders', 25, 'Used AI for stakeholder suggestions'),
('ai_generate_indicators', 50, 'Used AI to generate indicators'),
('daily_login', 10, 'Daily activity bonus'),
('streak_bonus_7', 100, '7-day streak bonus'),
('streak_bonus_30', 500, '30-day streak bonus');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Programs table (main entity)
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
    current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
    is_shared BOOLEAN DEFAULT FALSE,
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
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE program_proven_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    proven_model_id UUID REFERENCES proven_models(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(program_id, proven_model_id)
);

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
-- BADGES & ACHIEVEMENTS
-- =====================================================

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    step_number INTEGER CHECK (step_number BETWEEN 1 AND 5),
    xp_reward INTEGER DEFAULT 0,
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

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_programs_user_id ON programs(user_id);
CREATE INDEX idx_programs_organization ON programs(organization_id);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_stakeholders_program_id ON stakeholders(program_id);
CREATE INDEX idx_outcomes_program_id ON outcomes(program_id);
CREATE INDEX idx_indicators_outcome_id ON indicators(outcome_id);
CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created ON xp_transactions(created_at);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Default organization
INSERT INTO organizations (id, name, description) VALUES
('00000000-0000-0000-0000-000000000001', 'LogicForge Demo', 'Demo organization for testing');

-- Proven Models
INSERT INTO proven_models (name, description, implementation_guide, evidence_base, themes, target_outcomes) VALUES
(
    'Teaching at the Right Level (TaRL)',
    'An evidence-based approach that groups children by learning level rather than age or grade, enabling targeted instruction for foundational skills.',
    'Step 1: Conduct baseline assessments. Step 2: Group by ability. Step 3: Use structured activities. Step 4: Reassess regularly.',
    'Rigorous RCTs by J-PAL shown 0.7 SD improvement. Scaled to millions in India via government partnerships. Aligned with NIPUN Bharat goals.',
    ARRAY['FLN'],
    ARRAY['Improved reading fluency', 'Number recognition', 'Basic arithmetic']
),
(
    'Remedial Learning Camps',
    'Intensive short-term learning camps focused on catching up children who are behind grade-level expectations. Aligned with NEP 2020 goals.',
    'Step 1: Identify at-risk students. Step 2: Organize 30-45 day intensive camps. Step 3: Focus on FLN competencies per NIPUN Bharat.',
    'Used by Pratham and state governments. Shows significant gains in foundational literacy as per ASER assessments.',
    ARRAY['FLN', 'Life Skills'],
    ARRAY['Grade-level reading per NIPUN 3', 'Math competency']
),
(
    'Career Awareness Workshops',
    'Structured workshops exposing students to diverse career paths, building agency and decision-making skills per NEP 2020.',
    'Step 1: Map local career opportunities. Step 2: Invite professionals. Step 3: Conduct skill-building activities. Step 4: Goal-setting exercises.',
    'Research shows improved career aspirations and self-efficacy. Particularly effective for first-generation learners.',
    ARRAY['Career Readiness'],
    ARRAY['Career awareness', 'Goal setting', 'Self-efficacy', 'Agency building']
),
(
    'Peer Learning Circles',
    'Student-led small group learning that promotes collaboration and deeper understanding through constructivist pedagogy.',
    'Step 1: Train student facilitators. Step 2: Form groups of 4-6. Step 3: Assign structured prompts. Step 4: Rotate leadership.',
    'Meta-analyses show 0.4-0.5 SD effects. Builds academic and social-emotional skills aligned with NCF 2023.',
    ARRAY['FLN', 'Life Skills', 'STEM'],
    ARRAY['Collaborative skills', 'Academic achievement', 'Leadership']
),
(
    'Digital Literacy Integration',
    'Structured approach to building digital skills alongside core academics, supporting NEP 2020 technology integration goals.',
    'Step 1: Assess infrastructure. Step 2: Train teachers on ed-tech. Step 3: Integrate digital activities. Step 4: Monitor outcomes.',
    'Growing evidence for blended learning. Critical for 21st-century skills and PM eVidya alignment.',
    ARRAY['STEM', 'Career Readiness'],
    ARRAY['Digital literacy', 'Self-directed learning', 'Tech skills']
);

-- Badges with XP rewards
INSERT INTO badges (name, description, icon, step_number, xp_reward) VALUES
('Problem Explorer', 'Defined your challenge statement clearly', '🔍', 1, 100),
('Stakeholder Mapper', 'Identified key stakeholders for your program', '🤝', 2, 150),
('Evidence Seeker', 'Selected proven models for your intervention', '📚', 3, 150),
('Indicator Architect', 'Built measurable indicators for your outcomes', '📊', 4, 200),
('Program Designer', 'Generated your complete program design document', '🏆', 5, 250);
