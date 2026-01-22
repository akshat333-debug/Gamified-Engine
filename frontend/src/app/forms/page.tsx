'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Program, Outcome, Indicator } from '@/types';
import api from '@/lib/api';

interface FormField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    hint?: string;
    target?: string;
    choices?: string[];
}

interface FormTemplate {
    id: string;
    name: string;
    description: string;
    fields: FormField[];
}

export default function FormsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [outcomes, setOutcomes] = useState<Outcome[]>([]);
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [generatedForm, setGeneratedForm] = useState<{ form_title: string; fields: FormField[] } | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showMobilePreview, setShowMobilePreview] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            loadData();
        }
    }, [authLoading, user]);

    useEffect(() => {
        if (selectedProgram) {
            loadProgramData(selectedProgram);
        }
    }, [selectedProgram]);

    const loadData = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const [userPrograms, templateData] = await Promise.all([
                api.listPrograms(user?.id),
                fetch(`${API_URL}/api/forms/templates`).then(r => r.json()),
            ]);
            setPrograms(userPrograms);
            setTemplates(templateData);
            if (userPrograms.length > 0) {
                setSelectedProgram(userPrograms[0].id);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProgramData = async (programId: string) => {
        try {
            const outcomesList = await api.listOutcomes(programId);
            setOutcomes(outcomesList);

            const allIndicators: Indicator[] = [];
            for (const outcome of outcomesList) {
                const outcomeIndicators = await api.listIndicators(outcome.id);
                allIndicators.push(...outcomeIndicators);
            }
            setIndicators(allIndicators);
        } catch (error) {
            console.error('Failed to load program data:', error);
        }
    };

    const generateForm = async () => {
        if (!formTitle || indicators.length === 0) return;

        setGenerating(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/api/forms/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    program_id: selectedProgram,
                    form_title: formTitle,
                    indicators: indicators.map(ind => ({
                        indicator_id: ind.id,
                        description: ind.description,
                        type: ind.type,
                        measurement_method: ind.measurement_method,
                        target_value: ind.target_value,
                        data_source: ind.data_source,
                    })),
                }),
            });

            if (res.ok) {
                const form = await res.json();
                setGeneratedForm(form);
                setShowMobilePreview(true);
            }
        } catch (error) {
            console.error('Failed to generate form:', error);
        } finally {
            setGenerating(false);
        }
    };

    const exportXLSForm = async () => {
        if (!formTitle || indicators.length === 0) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/api/forms/export-xlsform`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    program_id: selectedProgram,
                    form_title: formTitle,
                    indicators: indicators.map(ind => ({
                        indicator_id: ind.id,
                        description: ind.description,
                        type: ind.type,
                        measurement_method: ind.measurement_method,
                        target_value: ind.target_value,
                        data_source: ind.data_source,
                    })),
                }),
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${formTitle.replace(/\s+/g, '_')}_xlsform.txt`;
                link.click();
            }
        } catch (error) {
            console.error('Failed to export:', error);
        }
    };

    const handleUseTemplate = (template: FormTemplate) => {
        setGeneratedForm({
            form_title: template.name,
            fields: template.fields,
        });
        setFormTitle(template.name);
        setShowMobilePreview(true);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">📝</div>
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
                            <h1 className="text-2xl font-bold text-gray-900">📝 Data Collection Forms</h1>
                            <p className="text-gray-500 text-sm">Generate mobile-friendly forms from your indicators</p>
                        </div>
                        <Link href="/" className="btn-secondary">← Back</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Panel - Form Builder */}
                    <div className="space-y-6">
                        {/* Program Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg p-6"
                        >
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Select Program</h2>
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="input-field"
                            >
                                {programs.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="e.g., Monthly Assessment Form"
                                    className="input-field"
                                />
                            </div>

                            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                                <p className="text-sm text-indigo-700">
                                    <strong>{indicators.length}</strong> indicators found from <strong>{outcomes.length}</strong> outcomes
                                </p>
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={generateForm}
                                    disabled={!formTitle || indicators.length === 0 || generating}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {generating ? 'Generating...' : '✨ Generate Form'}
                                </button>
                                <button
                                    onClick={exportXLSForm}
                                    disabled={!formTitle || indicators.length === 0}
                                    className="btn-secondary disabled:opacity-50"
                                >
                                    📥 Export XLSForm
                                </button>
                            </div>
                        </motion.div>

                        {/* Templates */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl shadow-lg p-6"
                        >
                            <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Pre-built Templates</h2>
                            <div className="space-y-3">
                                {templates.map(template => (
                                    <div
                                        key={template.id}
                                        className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => handleUseTemplate(template)}
                                    >
                                        <h3 className="font-semibold text-gray-800">{template.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                                        <p className="text-xs text-indigo-600 mt-2">{template.fields?.length || 0} fields</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Panel - Mobile Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-lg p-6"
                    >
                        <h2 className="text-lg font-bold text-gray-800 mb-4">📱 Mobile Preview</h2>

                        {/* Phone Frame */}
                        <div className="mx-auto w-72 h-[600px] bg-gray-900 rounded-[3rem] p-4 shadow-2xl">
                            <div className="bg-white w-full h-full rounded-[2rem] overflow-hidden">
                                {generatedForm ? (
                                    <div className="h-full overflow-y-auto p-4">
                                        <h3 className="text-lg font-bold text-center text-indigo-600 mb-4">
                                            {generatedForm.form_title}
                                        </h3>
                                        <div className="space-y-4">
                                            {generatedForm.fields.map((field, i) => (
                                                <div key={i} className="space-y-1">
                                                    <label className="block text-xs font-medium text-gray-700">
                                                        {field.label}
                                                        {field.required && <span className="text-red-500">*</span>}
                                                    </label>
                                                    {field.type === 'select' ? (
                                                        <select className="w-full p-2 text-sm border rounded-lg bg-gray-50">
                                                            <option>Select...</option>
                                                            {(field.choices || ['Yes', 'No']).map(c => (
                                                                <option key={c}>{c}</option>
                                                            ))}
                                                        </select>
                                                    ) : field.type === 'date' ? (
                                                        <input type="date" className="w-full p-2 text-sm border rounded-lg bg-gray-50" />
                                                    ) : field.type === 'number' ? (
                                                        <input type="number" className="w-full p-2 text-sm border rounded-lg bg-gray-50" placeholder="Enter number" />
                                                    ) : (
                                                        <input type="text" className="w-full p-2 text-sm border rounded-lg bg-gray-50" placeholder="Enter text" />
                                                    )}
                                                    {field.hint && (
                                                        <p className="text-xs text-gray-500">{field.hint}</p>
                                                    )}
                                                    {field.target && (
                                                        <p className="text-xs text-indigo-600">Target: {field.target}</p>
                                                    )}
                                                </div>
                                            ))}
                                            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium mt-4">
                                                Submit
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 p-4 text-center">
                                        <div>
                                            <span className="text-4xl">📝</span>
                                            <p className="mt-2 text-sm">Generate a form or select a template to preview</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ODK/Kobo Integration Info */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                            <h4 className="font-semibold text-gray-800 mb-2">📲 ODK/KoboToolbox Integration</h4>
                            <p className="text-sm text-gray-600">
                                Export as XLSForm and import directly into ODK Collect or KoboToolbox for offline data collection.
                            </p>
                            <div className="flex gap-2 mt-3">
                                <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-600">ODK Collect</span>
                                <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-600">KoboToolbox</span>
                                <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-600">SurveyCTO</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
