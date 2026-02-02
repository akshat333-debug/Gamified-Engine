'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Template {
    id: string;
    name: string;
    description: string;
    theme: string;
    difficulty: string;
    duration: string;
    target_beneficiaries: string;
}

const THEME_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    'FLN': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📖' },
    'Career Readiness': { bg: 'bg-purple-100', text: 'text-purple-700', icon: '💼' },
    'Life Skills': { bg: 'bg-green-100', text: 'text-green-700', icon: '🌱' },
    'STEM': { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🔬' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
    'beginner': 'bg-green-500',
    'intermediate': 'bg-yellow-500',
    'advanced': 'bg-red-500',
};

export default function TemplatesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTheme, setSelectedTheme] = useState<string>('');
    const [creatingFrom, setCreatingFrom] = useState<string | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/api/templates/`);
            if (!res.ok) {
                console.error('Failed to load templates: HTTP', res.status);
                setTemplates([]);
                return;
            }
            const data = await res.json();
            // Defensive check: ensure data is an array
            setTemplates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load templates:', error);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const createFromTemplate = async (templateId: string) => {
        if (!user) {
            router.push('/login');
            return;
        }

        setCreatingFrom(templateId);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/api/templates/${templateId}/create-program`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/program/${data.program_id}/step-1`);
            } else {
                alert('Failed to create program from template');
            }
        } catch (error) {
            console.error('Failed to create from template:', error);
        } finally {
            setCreatingFrom(null);
        }
    };

    const filteredTemplates = selectedTheme
        ? templates.filter(t => t.theme === selectedTheme)
        : templates;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">📋</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">📋 Template Library</h1>
                            <p className="text-gray-500 text-sm">Start quickly with proven program designs</p>
                        </div>
                        <Link href="/" className="btn-secondary">← Back</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Theme Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-3 mb-8"
                >
                    <button
                        onClick={() => setSelectedTheme('')}
                        className={`px-4 py-2 rounded-full font-medium transition-all ${selectedTheme === ''
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        All Themes
                    </button>
                    {Object.entries(THEME_COLORS).map(([theme, colors]) => (
                        <button
                            key={theme}
                            onClick={() => setSelectedTheme(theme)}
                            className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${selectedTheme === theme
                                ? 'bg-indigo-600 text-white'
                                : `${colors.bg} ${colors.text} hover:opacity-80`
                                }`}
                        >
                            <span>{colors.icon}</span>
                            {theme}
                        </button>
                    ))}
                </motion.div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTemplates.map((template, i) => {
                        const themeStyle = THEME_COLORS[template.theme] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📄' };

                        return (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                {/* Header */}
                                <div className={`p-6 ${themeStyle.bg}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">{themeStyle.icon}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${themeStyle.text} bg-white/50`}>
                                                    {template.theme}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800">{template.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className={`w-2 h-2 rounded-full ${DIFFICULTY_COLORS[template.difficulty]}`}></div>
                                            <span className="text-xs text-gray-600 capitalize">{template.difficulty}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <p className="text-gray-600 mb-4">{template.description}</p>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-xs text-gray-500">Duration</div>
                                            <div className="font-semibold text-gray-800">⏱️ {template.duration}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-xs text-gray-500">Target</div>
                                            <div className="font-semibold text-gray-800">👥 {template.target_beneficiaries}</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => createFromTemplate(template.id)}
                                        disabled={creatingFrom === template.id}
                                        className="w-full btn-primary disabled:opacity-50"
                                    >
                                        {creatingFrom === template.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="animate-spin">⏳</span> Creating...
                                            </span>
                                        ) : (
                                            '🚀 Use This Template'
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {filteredTemplates.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <span className="text-4xl block mb-4">📋</span>
                        <p>No templates found for this theme</p>
                    </div>
                )}

                {/* Benefits Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white"
                >
                    <h2 className="text-2xl font-bold mb-6 text-center">Why Use Templates?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-4xl mb-3">⚡</div>
                            <h3 className="font-semibold mb-2">Save Time</h3>
                            <p className="text-sm text-indigo-100">Start with pre-defined structure instead of from scratch</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-3">✅</div>
                            <h3 className="font-semibold mb-2">Proven Designs</h3>
                            <p className="text-sm text-indigo-100">Based on successful education programs in India</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-3">🎯</div>
                            <h3 className="font-semibold mb-2">Best Practices</h3>
                            <p className="text-sm text-indigo-100">Includes NIPUN Bharat aligned outcomes and indicators</p>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
