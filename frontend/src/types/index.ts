/**
 * LogicForge TypeScript Type Definitions
 * Matches the backend API schemas
 */

// =====================================================
// Core Types
// =====================================================

export interface User {
    id: string;
    email: string;
    full_name?: string;
    organization?: string;
    created_at: string;
}

export type ProgramStatus = 'draft' | 'in_progress' | 'completed';
export type Theme = 'FLN' | 'Career Readiness' | 'STEM' | 'Life Skills' | 'Other';
export type Priority = 'high' | 'medium' | 'low';
export type IndicatorType = 'outcome' | 'output';

export interface Program {
    id: string;
    user_id?: string;
    title: string;
    description?: string;
    status: ProgramStatus;
    current_step: number;
    created_at: string;
    updated_at: string;
}

export interface ProgramCreate {
    title: string;
    description?: string;
    user_id?: string;
}

export interface ProgramUpdate {
    title?: string;
    description?: string;
    status?: ProgramStatus;
    current_step?: number;
}

// =====================================================
// Step 1: Problem Statement
// =====================================================

export interface ProblemStatement {
    id: string;
    program_id: string;
    challenge_text: string;
    refined_text?: string;
    root_causes: string[];
    theme?: Theme;
    is_completed: boolean;
    created_at: string;
}

export interface ProblemStatementCreate {
    challenge_text: string;
    theme?: Theme;
}

export interface ProblemStatementUpdate {
    challenge_text?: string;
    refined_text?: string;
    root_causes?: string[];
    theme?: Theme;
    is_completed?: boolean;
}

// =====================================================
// Step 2: Stakeholders
// =====================================================

export interface Stakeholder {
    id: string;
    program_id: string;
    name: string;
    role: string;
    engagement_strategy?: string;
    priority: Priority;
    is_ai_suggested: boolean;
    created_at: string;
}

export interface StakeholderCreate {
    name: string;
    role: string;
    engagement_strategy?: string;
    priority?: Priority;
    is_ai_suggested?: boolean;
}

export interface StakeholderUpdate {
    name?: string;
    role?: string;
    engagement_strategy?: string;
    priority?: Priority;
}

// =====================================================
// Step 3: Proven Models
// =====================================================

export interface ProvenModel {
    id: string;
    name: string;
    description: string;
    implementation_guide?: string;
    evidence_base?: string;
    themes: string[];
    target_outcomes: string[];
    source_url?: string;
    created_at: string;
}

export interface ProgramProvenModel {
    id: string;
    program_id: string;
    proven_model: ProvenModel;
    notes?: string;
    created_at: string;
}

// =====================================================
// Step 4: Outcomes & Indicators
// =====================================================

export interface Outcome {
    id: string;
    program_id: string;
    description: string;
    theme?: string;
    timeframe?: string;
    created_at: string;
}

export interface OutcomeCreate {
    description: string;
    theme?: string;
    timeframe?: string;
}

export interface Indicator {
    id: string;
    outcome_id: string;
    type: IndicatorType;
    description: string;
    measurement_method?: string;
    target_value?: string;
    baseline_value?: string;
    frequency?: string;
    data_source?: string;
    is_ai_generated: boolean;
    created_at: string;
}

export interface IndicatorCreate {
    type: IndicatorType;
    description: string;
    measurement_method?: string;
    target_value?: string;
    baseline_value?: string;
    frequency?: string;
    data_source?: string;
    is_ai_generated?: boolean;
}

// =====================================================
// Badges & Gamification
// =====================================================

export interface Badge {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    step_number?: number;
}

export interface UserBadge {
    id: string;
    badge: Badge;
    program_id: string;
    earned_at: string;
}

// =====================================================
// AI Response Types
// =====================================================

export interface RefineProblemResponse {
    refined_text: string;
    root_causes: string[];
    suggested_theme: Theme;
}

export interface SuggestedStakeholder {
    name: string;
    role: string;
    engagement_strategy: string;
    priority: Priority;
}

export interface SuggestStakeholdersResponse {
    stakeholders: SuggestedStakeholder[];
}

export interface GeneratedIndicator {
    type: IndicatorType;
    description: string;
    measurement_method: string;
    target_value: string;
    frequency: string;
    data_source: string;
}

export interface GenerateIndicatorsResponse {
    indicators: GeneratedIndicator[];
}

// =====================================================
// Full Program (for export)
// =====================================================

export interface FullProgram {
    program: Program;
    problem_statement?: ProblemStatement;
    stakeholders: Stakeholder[];
    proven_models: ProvenModel[];
    outcomes: Outcome[];
    indicators: Indicator[];
}

// =====================================================
// Step Configuration
// =====================================================

export interface StepConfig {
    number: number;
    title: string;
    description: string;
    icon: string;
    path: string;
}

export const STEPS: StepConfig[] = [
    {
        number: 1,
        title: 'Define Problem',
        description: 'Articulate your challenge statement',
        icon: '🔍',
        path: 'step-1'
    },
    {
        number: 2,
        title: 'Map Stakeholders',
        description: 'Identify key people in your program',
        icon: '🤝',
        path: 'step-2'
    },
    {
        number: 3,
        title: 'Proven Models',
        description: 'Browse evidence-based interventions',
        icon: '📚',
        path: 'step-3'
    },
    {
        number: 4,
        title: 'Build Indicators',
        description: 'Create measurable outcomes',
        icon: '📊',
        path: 'step-4'
    },
    {
        number: 5,
        title: 'Generate Report',
        description: 'Export your program design',
        icon: '🏆',
        path: 'step-5'
    }
];
