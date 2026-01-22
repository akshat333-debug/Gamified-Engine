'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Program, ProblemStatement, Badge, Theme } from '@/types';
import { GamifiedProgress, BadgeModal, AIButton } from '@/components';
import api from '@/lib/api';

const THEMES: { value: Theme; label: string }[] = [
    { value: 'FLN', label: 'Foundational Literacy & Numeracy' },
    { value: 'Career Readiness', label: 'Career Readiness' },
    { value: 'STEM', label: 'STEM Education' },
    { value: 'Life Skills', label: 'Life Skills' },
    { value: 'Other', label: 'Other' }
];

export default function Step1Page() {
    const params = useParams();
    const router = useRouter();
    const programId = params.id as string;

    const [program, setProgram] = useState<Program | null>(null);
    const [challengeText, setChallengeText] = useState('');
    const [refinedText, setRefinedText] = useState('');
    const [rootCauses, setRootCauses] = useState<string[]>([]);
    const [theme, setTheme] = useState<Theme | ''>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refining, setRefining] = useState(false);
    const [showBadge, setShowBadge] = useState(false);
    const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);
    const [existingProblem, setExistingProblem] = useState<ProblemStatement | null>(null);

    const loadData = useCallback(async () => {
        try {
            const prog = await api.getProgram(programId);
            setProgram(prog);

            try {
                const problem = await api.getProblemStatement(programId);
                setExistingProblem(problem);
                setChallengeText(problem.challenge_text);
                setRefinedText(problem.refined_text || '');
                setRootCauses(problem.root_causes || []);
                setTheme(problem.theme || '');
            } catch (error: any) {
                if (error.response?.status === 404) {
                    // This is expected for new programs step 1, ignore
                } else {
                    console.error('Failed to load problem statement:', error);
                }
            }
        } catch (error) {
            console.error('Failed to load program:', error);
        } finally {
            setLoading(false);
        }
    }, [programId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefineWithAI = async () => {
        if (!challengeText.trim()) return;

        setRefining(true);
        try {
            const result = await api.refineProblem(challengeText);
            setRefinedText(result.refined_text);
            setRootCauses(result.root_causes);
            setTheme(result.suggested_theme);
        } catch (error) {
            console.error('AI refinement failed:', error);
            alert('AI refinement failed. Please try again.');
        } finally {
            setRefining(false);
        }
    };

    const handleSaveAndContinue = async () => {
        if (!challengeText.trim()) {
            alert('Please enter a challenge statement');
            return;
        }

        setSaving(true);
        try {
            if (existingProblem) {
                await api.updateProblemStatement(programId, {
                    challenge_text: challengeText,
                    refined_text: refinedText || undefined,
                    root_causes: rootCauses,
                    theme: theme || undefined,
                    is_completed: true
                });
            } else {
                await api.createProblemStatement(programId, {
                    challenge_text: challengeText,
                    theme: theme || undefined
                });
                // Update with AI refinements if available
                if (refinedText) {
                    await api.updateProblemStatement(programId, {
                        refined_text: refinedText,
                        root_causes: rootCauses,
                        is_completed: true
                    });
                }
            }

            // Show badge
            const badges = await api.listBadges();
            const step1Badge = badges.find(b => b.step_number === 1);
            if (step1Badge) {
                setEarnedBadge(step1Badge);
                setShowBadge(true);
            } else {
                router.push(`/program/${programId}/step-2`);
            }
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleBadgeClose = () => {
        setShowBadge(false);
        router.push(`/program/${programId}/step-2`);
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
            {/* Progress Tracker */}
            <GamifiedProgress currentStep={program?.current_step || 1} />

            {/* Step Header */}
            <motion.div
                className="text-center mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <span>Step 1 of 5</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Define the Problem</h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                    Articulate the challenge you&apos;re trying to address. Our AI will help you refine it
                    into a structured Root Cause Analysis.
                </p>
            </motion.div>

            {/* Main Form */}
            <motion.div
                className="bg-white rounded-2xl shadow-lg p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* Challenge Statement Input */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Challenge Statement *
                    </label>
                    <textarea
                        value={challengeText}
                        onChange={(e) => setChallengeText(e.target.value)}
                        placeholder="e.g., Students in rural areas struggle with foundational literacy. Many Grade 3 students cannot read Grade 2 level text fluently..."
                        className="textarea-field min-h-[150px]"
                    />
                </div>

                {/* AI Refine Button */}
                <div className="flex justify-end mb-8">
                    <AIButton
                        onClick={handleRefineWithAI}
                        loading={refining}
                        label="Refine with AI"
                        icon="✨"
                    />
                </div>

                {/* AI Generated Content */}
                {refinedText && (
                    <motion.div
                        className="space-y-6 border-t pt-8"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                    >
                        {/* Refined Problem */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span>🎯</span> Refined Problem Statement
                            </h3>
                            <p className="text-gray-700">{refinedText}</p>
                        </div>

                        {/* Root Causes */}
                        {rootCauses.length > 0 && (
                            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span>🔍</span> Root Causes Identified
                                </h3>
                                <ul className="space-y-2">
                                    {rootCauses.map((cause, index) => (
                                        <li key={index} className="flex items-start gap-2 text-gray-700">
                                            <span className="text-indigo-500 mt-1">•</span>
                                            {cause}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Theme Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Theme
                            </label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value as Theme)}
                                className="input-field"
                            >
                                <option value="">Select a theme...</option>
                                {THEMES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-4 mt-8 pt-6 border-t">
                    <button
                        onClick={() => router.push('/')}
                        className="btn-secondary flex-1"
                    >
                        Save & Exit
                    </button>
                    <button
                        onClick={handleSaveAndContinue}
                        disabled={!challengeText.trim() || saving}
                        className="btn-primary flex-1 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save & Continue →'}
                    </button>
                </div>
            </motion.div>

            {/* Badge Modal */}
            <BadgeModal
                badge={earnedBadge}
                isOpen={showBadge}
                onClose={handleBadgeClose}
            />
        </div>
    );
}
