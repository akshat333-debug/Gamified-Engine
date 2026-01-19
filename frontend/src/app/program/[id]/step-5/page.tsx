'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FullProgram, Badge } from '@/types';
import { GamifiedProgress, BadgeModal } from '@/components';
import api from '@/lib/api';

export default function Step5Page() {
    const params = useParams();
    const router = useRouter();
    const programId = params.id as string;

    const [program, setProgram] = useState<FullProgram | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [showBadge, setShowBadge] = useState(false);
    const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);

    const loadData = useCallback(async () => {
        try {
            const prog = await api.getProgram(programId);
            if (prog.current_step < 5) {
                router.push(`/program/${programId}/step-${prog.current_step}`);
                return;
            }
            const fullProgram = await api.getFullProgram(programId);
            setProgram(fullProgram);
        } catch (error) {
            console.error('Failed to load:', error);
        } finally {
            setLoading(false);
        }
    }, [programId, router]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDownloadPdf = async () => {
        setDownloading(true);
        try {
            const blob = await api.downloadPdf(programId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${program?.program.title || 'Program'}_Design.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Show final badge
            const badges = await api.listBadges();
            const badge = badges.find(b => b.step_number === 5);
            if (badge) { setEarnedBadge(badge); setShowBadge(true); }
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to generate PDF. Make sure the backend is running.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin text-4xl">⚡</div></div>;
    if (!program) return <div className="flex items-center justify-center min-h-screen">Program not found</div>;

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <GamifiedProgress currentStep={5} onStepClick={(step) => router.push(`/program/${programId}/step-${step}`)} />

            <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">🎉 Final Step!</div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Generate Your Report</h1>
                <p className="text-gray-600">Review your program design and export it as a professional PDF document.</p>
            </motion.div>

            {/* Summary Preview */}
            <motion.div className="bg-white rounded-2xl shadow-lg p-8 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{program.program.title}</h2>

                {/* Problem Statement */}
                {program.problem_statement && (
                    <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
                        <h3 className="font-semibold text-indigo-800 mb-2">📋 Challenge Statement</h3>
                        <p className="text-gray-700">{program.problem_statement.refined_text || program.problem_statement.challenge_text}</p>
                        {program.problem_statement.theme && <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded text-xs">{program.problem_statement.theme}</span>}
                    </div>
                )}

                {/* Stakeholders */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">👥 Stakeholders ({program.stakeholders.length})</h3>
                    <div className="flex flex-wrap gap-2">
                        {program.stakeholders.map(s => (
                            <span key={s.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{s.name}</span>
                        ))}
                    </div>
                </div>

                {/* Proven Models */}
                {program.proven_models.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3">📚 Selected Models ({program.proven_models.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {program.proven_models.map(m => (
                                <span key={m.id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{m.name}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Outcomes */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">🎯 Outcomes ({program.outcomes.length})</h3>
                    {program.outcomes.map(o => (
                        <div key={o.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                            <p className="font-medium text-gray-800">{o.description}</p>
                            <p className="text-sm text-gray-500 mt-1">{program.indicators.filter(i => i.outcome_id === o.id).length} indicators</p>
                        </div>
                    ))}
                </div>

                {/* Indicators Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{program.indicators.filter(i => i.type === 'outcome').length}</div>
                        <div className="text-sm text-gray-600">Outcome Indicators</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600">{program.indicators.filter(i => i.type === 'output').length}</div>
                        <div className="text-sm text-gray-600">Output Indicators</div>
                    </div>
                </div>
            </motion.div>

            {/* Download Button */}
            <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <motion.button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl disabled:opacity-70"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {downloading ? '⏳ Generating PDF...' : '📄 Download Program Design Document'}
                </motion.button>
                <p className="text-sm text-gray-500 mt-4">Your PDF will include all sections: problem analysis, stakeholders, interventions, and indicators.</p>
            </motion.div>

            {/* Back to Dashboard */}
            <div className="flex justify-center mt-8">
                <button onClick={() => router.push('/')} className="btn-secondary">← Back to Dashboard</button>
            </div>

            <BadgeModal badge={earnedBadge} isOpen={showBadge} onClose={() => { setShowBadge(false); router.push('/'); }} />
        </div>
    );
}
