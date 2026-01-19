'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Program, Stakeholder, Badge, SuggestedStakeholder, Theme } from '@/types';
import { GamifiedProgress, BadgeModal, AIButton } from '@/components';
import api from '@/lib/api';

export default function Step2Page() {
    const params = useParams();
    const router = useRouter();
    const programId = params.id as string;

    const [program, setProgram] = useState<Program | null>(null);
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
    const [suggestions, setSuggestions] = useState<SuggestedStakeholder[]>([]);
    const [problemStatement, setProblemStatement] = useState('');
    const [theme, setTheme] = useState<Theme | undefined>();
    const [loading, setLoading] = useState(true);
    const [suggesting, setSuggesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showBadge, setShowBadge] = useState(false);
    const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);

    // New stakeholder form
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('');
    const [newStrategy, setNewStrategy] = useState('');
    const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');

    const loadData = useCallback(async () => {
        try {
            const prog = await api.getProgram(programId);
            setProgram(prog);

            // Check if user can access this step
            if (prog.current_step < 2) {
                router.push(`/program/${programId}/step-1`);
                return;
            }

            const existing = await api.listStakeholders(programId);
            setStakeholders(existing);

            try {
                const problem = await api.getProblemStatement(programId);
                setProblemStatement(problem.refined_text || problem.challenge_text);
                setTheme(problem.theme as Theme);
            } catch {
                // No problem statement
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, [programId, router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGetSuggestions = async () => {
        if (!problemStatement) return;

        setSuggesting(true);
        try {
            const result = await api.suggestStakeholders(problemStatement, theme);
            setSuggestions(result.stakeholders);
        } catch (error) {
            console.error('Failed to get suggestions:', error);
            alert('Failed to get AI suggestions');
        } finally {
            setSuggesting(false);
        }
    };

    const handleAddStakeholder = async () => {
        if (!newName.trim() || !newRole.trim()) return;

        try {
            const stakeholder = await api.addStakeholder(programId, {
                name: newName,
                role: newRole,
                engagement_strategy: newStrategy || undefined,
                priority: newPriority,
                is_ai_suggested: false
            });
            setStakeholders([...stakeholders, stakeholder]);
            setNewName('');
            setNewRole('');
            setNewStrategy('');
            setNewPriority('medium');
        } catch (error) {
            console.error('Failed to add stakeholder:', error);
        }
    };

    const handleAddSuggestion = async (suggestion: SuggestedStakeholder) => {
        try {
            const stakeholder = await api.addStakeholder(programId, {
                name: suggestion.name,
                role: suggestion.role,
                engagement_strategy: suggestion.engagement_strategy,
                priority: suggestion.priority,
                is_ai_suggested: true
            });
            setStakeholders([...stakeholders, stakeholder]);
            setSuggestions(suggestions.filter(s => s.name !== suggestion.name));
        } catch (error) {
            console.error('Failed to add suggested stakeholder:', error);
        }
    };

    const handleDeleteStakeholder = async (id: string) => {
        try {
            await api.deleteStakeholder(id);
            setStakeholders(stakeholders.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete stakeholder:', error);
        }
    };

    const handleContinue = async () => {
        if (stakeholders.length === 0) {
            alert('Please add at least one stakeholder');
            return;
        }

        setSaving(true);
        try {
            await api.completeStakeholderStep(programId);

            const badges = await api.listBadges();
            const step2Badge = badges.find(b => b.step_number === 2);
            if (step2Badge) {
                setEarnedBadge(step2Badge);
                setShowBadge(true);
            } else {
                router.push(`/program/${programId}/step-3`);
            }
        } catch (error) {
            console.error('Failed to complete step:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleBadgeClose = () => {
        setShowBadge(false);
        router.push(`/program/${programId}/step-3`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin text-4xl">⚡</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <GamifiedProgress
                currentStep={program?.current_step || 2}
                onStepClick={(step) => router.push(`/program/${programId}/step-${step}`)}
            />

            <motion.div
                className="text-center mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <span>Step 2 of 5</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Map Your Stakeholders</h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                    Identify the key people and groups who will be involved in or affected by your program.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Stakeholder Form */}
                <motion.div
                    className="bg-white rounded-2xl shadow-lg p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Stakeholder</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g., School Teachers"
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                            <input
                                type="text"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                placeholder="e.g., Primary implementers"
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Strategy</label>
                            <textarea
                                value={newStrategy}
                                onChange={(e) => setNewStrategy(e.target.value)}
                                placeholder="How will you engage this stakeholder?"
                                className="textarea-field"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={newPriority}
                                onChange={(e) => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
                                className="input-field"
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <button
                            onClick={handleAddStakeholder}
                            disabled={!newName.trim() || !newRole.trim()}
                            className="btn-primary w-full disabled:opacity-50"
                        >
                            Add Stakeholder
                        </button>
                    </div>

                    {/* AI Suggestions */}
                    <div className="mt-6 pt-6 border-t">
                        <AIButton
                            onClick={handleGetSuggestions}
                            loading={suggesting}
                            label="Get AI Suggestions"
                            icon="🤖"
                            className="w-full"
                        />

                        {suggestions.length > 0 && (
                            <div className="mt-4 space-y-3">
                                <p className="text-sm font-medium text-gray-700">Suggested Stakeholders:</p>
                                {suggestions.map((s, i) => (
                                    <motion.div
                                        key={i}
                                        className="p-3 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                                        onClick={() => handleAddSuggestion(s)}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <p className="font-medium text-gray-800">{s.name}</p>
                                        <p className="text-sm text-gray-600">{s.role}</p>
                                        <p className="text-xs text-indigo-600 mt-1">Click to add →</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Stakeholder List */}
                <motion.div
                    className="bg-white rounded-2xl shadow-lg p-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        Your Stakeholders ({stakeholders.length})
                    </h2>

                    {stakeholders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <span className="text-4xl mb-2 block">👥</span>
                            No stakeholders added yet
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {stakeholders.map((s, i) => (
                                <motion.div
                                    key={s.id}
                                    className="p-4 bg-gray-50 rounded-xl relative group"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-800 flex items-center gap-2">
                                                {s.name}
                                                {s.is_ai_suggested && (
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                        AI
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-600">{s.role}</p>
                                            <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${s.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                    s.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>
                                                {s.priority} priority
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteStakeholder(s.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    {s.engagement_strategy && (
                                        <p className="text-sm text-gray-500 mt-2 italic">{s.engagement_strategy}</p>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Actions */}
            <motion.div
                className="flex gap-4 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <button
                    onClick={() => router.push(`/program/${programId}/step-1`)}
                    className="btn-secondary flex-1"
                >
                    ← Back
                </button>
                <button
                    onClick={handleContinue}
                    disabled={stakeholders.length === 0 || saving}
                    className="btn-primary flex-1 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Continue to Step 3 →'}
                </button>
            </motion.div>

            <BadgeModal badge={earnedBadge} isOpen={showBadge} onClose={handleBadgeClose} />
        </div>
    );
}
