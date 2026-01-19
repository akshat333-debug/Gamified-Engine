'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Program, Outcome, Indicator, Badge, GeneratedIndicator, Theme } from '@/types';
import { GamifiedProgress, BadgeModal, AIButton } from '@/components';
import api from '@/lib/api';

const THEMES: Theme[] = ['FLN', 'Career Readiness', 'STEM', 'Life Skills', 'Other'];

export default function Step4Page() {
    const params = useParams();
    const router = useRouter();
    const programId = params.id as string;

    const [program, setProgram] = useState<Program | null>(null);
    const [outcomes, setOutcomes] = useState<Outcome[]>([]);
    const [indicators, setIndicators] = useState<Record<string, Indicator[]>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showBadge, setShowBadge] = useState(false);
    const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);
    const [newOutcome, setNewOutcome] = useState('');
    const [newTheme, setNewTheme] = useState<Theme>('FLN');
    const [generating, setGenerating] = useState<string | null>(null);
    const [generatedIndicators, setGeneratedIndicators] = useState<Record<string, GeneratedIndicator[]>>({});

    const loadData = useCallback(async () => {
        try {
            const prog = await api.getProgram(programId);
            setProgram(prog);
            if (prog.current_step < 4) {
                router.push(`/program/${programId}/step-${prog.current_step}`);
                return;
            }
            const existingOutcomes = await api.listOutcomes(programId);
            setOutcomes(existingOutcomes);
            const indicatorMap: Record<string, Indicator[]> = {};
            for (const o of existingOutcomes) {
                indicatorMap[o.id] = await api.listIndicators(o.id);
            }
            setIndicators(indicatorMap);
        } catch (error) {
            console.error('Failed to load:', error);
        } finally {
            setLoading(false);
        }
    }, [programId, router]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAddOutcome = async () => {
        if (!newOutcome.trim()) return;
        try {
            const outcome = await api.createOutcome(programId, { description: newOutcome, theme: newTheme });
            setOutcomes([...outcomes, outcome]);
            setIndicators({ ...indicators, [outcome.id]: [] });
            setNewOutcome('');
        } catch (error) { console.error('Failed:', error); }
    };

    const handleGenerateIndicators = async (outcome: Outcome) => {
        setGenerating(outcome.id);
        try {
            const result = await api.generateIndicators(outcome.description, (outcome.theme as Theme) || 'FLN');
            setGeneratedIndicators({ ...generatedIndicators, [outcome.id]: result.indicators });
        } catch (error) { alert('Failed to generate indicators'); }
        finally { setGenerating(null); }
    };

    const handleAddIndicator = async (outcomeId: string, ind: GeneratedIndicator) => {
        try {
            const created = await api.createIndicator(outcomeId, { ...ind, is_ai_generated: true });
            setIndicators({ ...indicators, [outcomeId]: [...(indicators[outcomeId] || []), created] });
            setGeneratedIndicators({ ...generatedIndicators, [outcomeId]: generatedIndicators[outcomeId]?.filter(i => i.description !== ind.description) || [] });
        } catch (error) { console.error('Failed:', error); }
    };

    const handleContinue = async () => {
        if (outcomes.length === 0) { alert('Add at least one outcome'); return; }
        setSaving(true);
        try {
            await api.completeIndicatorsStep(programId);
            const badges = await api.listBadges();
            const badge = badges.find(b => b.step_number === 4);
            if (badge) { setEarnedBadge(badge); setShowBadge(true); }
            else router.push(`/program/${programId}/step-5`);
        } catch (error) { console.error('Failed:', error); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin text-4xl">⚡</div></div>;

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <GamifiedProgress currentStep={program?.current_step || 4} onStepClick={(step) => step <= (program?.current_step || 4) && router.push(`/program/${programId}/step-${step}`)} />

            <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">Step 4 of 5</div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Build Your Indicators</h1>
                <p className="text-gray-600">Define outcomes and generate SMART indicators with AI.</p>
            </motion.div>

            <motion.div className="bg-white rounded-2xl shadow-lg p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Add an Outcome</h2>
                <div className="flex gap-4">
                    <input type="text" value={newOutcome} onChange={(e) => setNewOutcome(e.target.value)} placeholder="e.g., Improved reading fluency" className="input-field flex-1" />
                    <select value={newTheme} onChange={(e) => setNewTheme(e.target.value as Theme)} className="input-field w-48">
                        {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={handleAddOutcome} disabled={!newOutcome.trim()} className="btn-primary disabled:opacity-50">Add</button>
                </div>
            </motion.div>

            <div className="space-y-6 mb-8">
                {outcomes.map((outcome) => (
                    <motion.div key={outcome.id} className="bg-white rounded-2xl shadow-lg overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between">
                            <div><h3 className="text-lg font-semibold">{outcome.description}</h3><span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block">{outcome.theme}</span></div>
                            <AIButton onClick={() => handleGenerateIndicators(outcome)} loading={generating === outcome.id} label="Generate" icon="🎯" />
                        </div>
                        <div className="p-6">
                            {(indicators[outcome.id] || []).map((ind) => (
                                <div key={ind.id} className="p-4 bg-gray-50 rounded-lg mb-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium mr-2 ${ind.type === 'outcome' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{ind.type}</span>
                                    <p className="text-gray-800 font-medium inline">{ind.description}</p>
                                    {ind.target_value && <p className="text-sm text-gray-600 mt-1">Target: {ind.target_value}</p>}
                                </div>
                            ))}
                            {(generatedIndicators[outcome.id] || []).map((ind, j) => (
                                <div key={j} className="p-4 bg-indigo-50 rounded-lg mb-3 cursor-pointer hover:bg-indigo-100" onClick={() => handleAddIndicator(outcome.id, ind)}>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium mr-2 ${ind.type === 'outcome' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{ind.type}</span>
                                    <span className="text-xs text-indigo-600">Click to add →</span>
                                    <p className="text-gray-800 font-medium mt-1">{ind.description}</p>
                                    <p className="text-sm text-gray-600">Target: {ind.target_value}</p>
                                </div>
                            ))}
                            {(indicators[outcome.id] || []).length === 0 && (generatedIndicators[outcome.id] || []).length === 0 && <p className="text-gray-500 text-center py-4">Click Generate to get AI suggestions</p>}
                        </div>
                    </motion.div>
                ))}
            </div>

            {outcomes.length === 0 && <div className="text-center py-12 bg-white rounded-2xl shadow text-gray-500"><span className="text-4xl mb-2 block">📊</span>No outcomes yet</div>}

            <div className="flex gap-4">
                <button onClick={() => router.push(`/program/${programId}/step-3`)} className="btn-secondary flex-1">← Back</button>
                <button onClick={handleContinue} disabled={outcomes.length === 0 || saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? 'Saving...' : 'Continue →'}</button>
            </div>

            <BadgeModal badge={earnedBadge} isOpen={showBadge} onClose={() => { setShowBadge(false); router.push(`/program/${programId}/step-5`); }} />
        </div>
    );
}
