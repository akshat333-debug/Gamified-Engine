/**
 * API Client for LogicForge Backend
 */
import axios, { AxiosInstance } from 'axios';
import {
    Program,
    ProgramCreate,
    ProgramUpdate,
    ProblemStatement,
    ProblemStatementCreate,
    ProblemStatementUpdate,
    Stakeholder,
    StakeholderCreate,
    StakeholderUpdate,
    ProvenModel,
    Outcome,
    OutcomeCreate,
    Indicator,
    IndicatorCreate,
    Badge,
    FullProgram,
    RefineProblemResponse,
    SuggestStakeholdersResponse,
    GenerateIndicatorsResponse,
    Theme
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('[API Client] Base URL:', API_BASE_URL);

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        console.log('[API Client] Creating axios instance with baseURL:', API_BASE_URL);
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    // =====================================================
    // Programs
    // =====================================================

    async createProgram(data: ProgramCreate): Promise<Program> {
        const response = await this.client.post('/api/programs/', data);
        return response.data;
    }

    async listPrograms(userId?: string): Promise<Program[]> {
        const params = userId ? { user_id: userId } : {};
        const response = await this.client.get('/api/programs/', { params });
        return response.data;
    }

    async getProgram(programId: string): Promise<Program> {
        const response = await this.client.get(`/api/programs/${programId}`);
        return response.data;
    }

    async updateProgram(programId: string, data: ProgramUpdate): Promise<Program> {
        const response = await this.client.patch(`/api/programs/${programId}`, data);
        return response.data;
    }

    async deleteProgram(programId: string): Promise<void> {
        await this.client.delete(`/api/programs/${programId}`);
    }

    async getFullProgram(programId: string): Promise<FullProgram> {
        const response = await this.client.get(`/api/programs/${programId}/full`);
        return response.data;
    }

    // =====================================================
    // Problem Statements (Step 1)
    // =====================================================

    async createProblemStatement(programId: string, data: ProblemStatementCreate): Promise<ProblemStatement> {
        const response = await this.client.post(`/api/programs/${programId}/problem`, data);
        return response.data;
    }

    async getProblemStatement(programId: string): Promise<ProblemStatement> {
        const response = await this.client.get(`/api/programs/${programId}/problem`);
        return response.data;
    }

    async updateProblemStatement(programId: string, data: ProblemStatementUpdate): Promise<ProblemStatement> {
        const response = await this.client.patch(`/api/programs/${programId}/problem`, data);
        return response.data;
    }

    // =====================================================
    // Stakeholders (Step 2)
    // =====================================================

    async addStakeholder(programId: string, data: StakeholderCreate): Promise<Stakeholder> {
        const response = await this.client.post(`/api/programs/${programId}/stakeholders`, data);
        return response.data;
    }

    async listStakeholders(programId: string): Promise<Stakeholder[]> {
        const response = await this.client.get(`/api/programs/${programId}/stakeholders`);
        return response.data;
    }

    async updateStakeholder(stakeholderId: string, data: StakeholderUpdate): Promise<Stakeholder> {
        const response = await this.client.patch(`/api/programs/stakeholders/${stakeholderId}`, data);
        return response.data;
    }

    async deleteStakeholder(stakeholderId: string): Promise<void> {
        await this.client.delete(`/api/programs/stakeholders/${stakeholderId}`);
    }

    async completeStakeholderStep(programId: string): Promise<Program> {
        const response = await this.client.post(`/api/programs/${programId}/stakeholders/complete`);
        return response.data;
    }

    // =====================================================
    // Proven Models (Step 3)
    // =====================================================

    async listProvenModels(theme?: string): Promise<ProvenModel[]> {
        const params = theme ? { theme } : {};
        const response = await this.client.get('/api/programs/models', { params });
        return response.data;
    }

    async addProvenModelToProgram(programId: string, provenModelId: string, notes?: string): Promise<void> {
        await this.client.post(`/api/programs/${programId}/models`, {
            program_id: programId,
            proven_model_id: provenModelId,
            notes
        });
    }

    async completeModelsStep(programId: string): Promise<Program> {
        const response = await this.client.post(`/api/programs/${programId}/models/complete`);
        return response.data;
    }

    // =====================================================
    // Outcomes & Indicators (Step 4)
    // =====================================================

    async createOutcome(programId: string, data: OutcomeCreate): Promise<Outcome> {
        const response = await this.client.post(`/api/programs/${programId}/outcomes`, data);
        return response.data;
    }

    async listOutcomes(programId: string): Promise<Outcome[]> {
        const response = await this.client.get(`/api/programs/${programId}/outcomes`);
        return response.data;
    }

    async createIndicator(outcomeId: string, data: IndicatorCreate): Promise<Indicator> {
        const response = await this.client.post(`/api/programs/outcomes/${outcomeId}/indicators`, data);
        return response.data;
    }

    async listIndicators(outcomeId: string): Promise<Indicator[]> {
        const response = await this.client.get(`/api/programs/outcomes/${outcomeId}/indicators`);
        return response.data;
    }

    async completeIndicatorsStep(programId: string): Promise<Program> {
        const response = await this.client.post(`/api/programs/${programId}/indicators/complete`);
        return response.data;
    }

    // =====================================================
    // Badges
    // =====================================================

    async listBadges(): Promise<Badge[]> {
        const response = await this.client.get('/api/programs/badges');
        return response.data;
    }

    // =====================================================
    // AI Features
    // =====================================================

    async refineProblem(challengeText: string): Promise<RefineProblemResponse> {
        const response = await this.client.post('/api/ai/refine-problem', {
            challenge_text: challengeText
        });
        return response.data;
    }

    async suggestStakeholders(problemStatement: string, theme?: Theme): Promise<SuggestStakeholdersResponse> {
        const response = await this.client.post('/api/ai/suggest-stakeholders', {
            problem_statement: problemStatement,
            theme
        });
        return response.data;
    }

    async generateIndicators(outcomeDescription: string, theme: Theme): Promise<GenerateIndicatorsResponse> {
        const response = await this.client.post('/api/ai/generate-indicators', {
            outcome_description: outcomeDescription,
            theme
        });
        return response.data;
    }

    async searchModels(query: string, limit: number = 5): Promise<ProvenModel[]> {
        const response = await this.client.post('/api/ai/search-models', { query, limit });
        return response.data;
    }

    // =====================================================
    // Export
    // =====================================================

    async downloadPdf(programId: string): Promise<Blob> {
        const response = await this.client.get(`/api/export/${programId}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    }

    // =====================================================
    // Analytics
    // =====================================================

    async getProgressTimeline(userId: string): Promise<{ data: { date: string; programs: number; xp: number }[] }> {
        const response = await this.client.get(`/api/analytics/${userId}/progress`);
        return response.data;
    }

    async getStakeholderStats(userId: string): Promise<{ data: { category: string; high: number; medium: number; low: number }[] }> {
        const response = await this.client.get(`/api/analytics/${userId}/stakeholders`);
        return response.data;
    }

    // =====================================================
    // Gamification
    // =====================================================

    async getUserStats(userId?: string): Promise<{
        total_xp: number;
        level: number;
        level_title: string;
        current_streak: number;
        longest_streak: number;
        badges_earned: number;
        programs_completed: number;
        xp_to_next_level: number;
    }> {
        const params = userId ? { user_id: userId } : {};
        const response = await this.client.get('/api/gamification/stats', { params });
        return response.data;
    }
}

export const api = new ApiClient();
export default api;
