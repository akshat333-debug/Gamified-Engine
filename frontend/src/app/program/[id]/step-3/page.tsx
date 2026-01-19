'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Program, ProvenModel, Badge } from '@/types';
import { GamifiedProgress, BadgeModal, AIButton } from '@/components';
import api from '@/lib/api';

export default function Step3Page() {
    const params = useParams();
    const router = useRouter();
    const programId = params.id as string;

    const [program, setProgram] = useState<Program | null>(null);
    const [models, setModels] = useState<ProvenModel[]>([]);
    const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ProvenModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showBadge, setShowBadge] = useState(false);
    const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);
    const [selectedFilter, setSelectedFilter] = useState('');

    const loadData = useCallback(async () => {
        try {
            const prog = await api.getProgram(programId);
            setProgram(prog);

            if (prog.current_step < 3) {
                router.push(`/program/${programId}/step-${prog.current_step}`);
                return;
            }

            const allModels = await api.listProvenModels();
            setModels(allModels);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, [programId, router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const results = await api.searchModels(searchQuery, 10);
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearching(false);
        }
    };

    const toggleModel = (modelId: string) => {
        const newSelected = new Set(selectedModels);
        if (newSelected.has(modelId)) {
            newSelected.delete(modelId);
        } else {
            newSelected.add(modelId);
        }
        setSelectedModels(newSelected);
    };

    const handleContinue = async () => {
        setSaving(true);
        try {
            // Add selected models to program
            for (const modelId of selectedModels) {
                try {
                    await api.addProvenModelToProgram(programId, modelId);
                } catch {
                    // Model might already be added
                }
            }

            await api.completeModelsStep(programId);

            const badges = await api.listBadges();
            const step3Badge = badges.find(b => b.step_number === 3);
            if (step3Badge) {
                setEarnedBadge(step3Badge);
                setShowBadge(true);
            } else {
                router.push(`/program/${programId}/step-4`);
            }
        } catch (error) {
            console.error('Failed to complete step:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleBadgeClose = () => {
        setShowBadge(false);
        router.push(`/program/${programId}/step-4`);
    };

    const displayModels = searchResults.length > 0 ? searchResults :
        selectedFilter ? models.filter(m => m.themes.includes(selectedFilter)) : models;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin text-4xl">⚡</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <GamifiedProgress
                currentStep={program?.current_step || 3}
                onStepClick={(step) => step <= (program?.current_step || 3) && router.push(`/program/${programId}/step-${step}`)}
            />

            <motion.div
                className="text-center mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <span>Step 3 of 5</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Explore Proven Models</h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                    Browse evidence-based interventions that have worked for similar challenges.
                    Select models that align with your program goals.
                </p>
            </motion.div>

            {/* Search & Filter */}
            <motion.div
                className="bg-white rounded-2xl shadow-lg p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for interventions (e.g., reading, numeracy, careers)..."
                            className="input-field flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <AIButton
                            onClick={handleSearch}
                            loading={searching}
                            label="Search"
                            icon="🔍"
                        />
                    </div>
                    <select
                        value={selectedFilter}
                        onChange={(e) => {
                            setSelectedFilter(e.target.value);
                            setSearchResults([]);
                        }}
                        className="input-field md:w-48"
                    >
                        <option value="">All Themes</option>
                        <option value="FLN">FLN</option>
                        <option value="Career Readiness">Career Readiness</option>
                        <option value="STEM">STEM</option>
                        <option value="Life Skills">Life Skills</option>
                    </select>
                </div>
                {selectedModels.size > 0 && (
                    <p className="text-sm text-indigo-600 mt-3">
                        {selectedModels.size} model{selectedModels.size > 1 ? 's' : ''} selected
                    </p>
                )}
            </motion.div>

            {/* Model Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {displayModels.map((model, i) => (
                    <motion.div
                        key={model.id}
                        className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all ${selectedModels.has(model.id)
                                ? 'ring-2 ring-indigo-500 bg-indigo-50'
                                : 'hover:shadow-xl'
                            }`}
                        onClick={() => toggleModel(model.id)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4 }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{model.name}</h3>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedModels.has(model.id)
                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                    : 'border-gray-300'
                                }`}>
                                {selectedModels.has(model.id) && '✓'}
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4">{model.description}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {model.themes.map((theme) => (
                                <span
                                    key={theme}
                                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                                >
                                    {theme}
                                </span>
                            ))}
                        </div>

                        {model.evidence_base && (
                            <div className="text-xs text-gray-500 border-t pt-3 mt-3">
                                <span className="font-medium">Evidence:</span> {model.evidence_base.substring(0, 100)}...
                            </div>
                        )}

                        {model.target_outcomes.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs font-medium text-gray-700 mb-1">Target Outcomes:</p>
                                <div className="flex flex-wrap gap-1">
                                    {model.target_outcomes.slice(0, 3).map((outcome) => (
                                        <span
                                            key={outcome}
                                            className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
                                        >
                                            {outcome}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {displayModels.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl mb-2 block">📚</span>
                    No models found. Try a different search or filter.
                </div>
            )}

            {/* Actions */}
            <motion.div
                className="flex gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <button
                    onClick={() => router.push(`/program/${programId}/step-2`)}
                    className="btn-secondary flex-1"
                >
                    ← Back
                </button>
                <button
                    onClick={handleContinue}
                    disabled={saving}
                    className="btn-primary flex-1 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Continue to Step 4 →'}
                </button>
            </motion.div>

            <BadgeModal badge={earnedBadge} isOpen={showBadge} onClose={handleBadgeClose} />
        </div>
    );
}
