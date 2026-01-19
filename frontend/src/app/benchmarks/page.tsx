'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface StateStats {
    state: string;
    literacy_rate: number;
    fln_proficiency: number;
    enrollment_rate: number;
    dropout_rate: number;
    region: string;
}

interface NIPUNGrade {
    reading: Record<string, string>;
    numeracy: Record<string, string>;
}

export default function BenchmarksPage() {
    const [states, setStates] = useState<StateStats[]>([]);
    const [nipun, setNipun] = useState<any>(null);
    const [national, setNational] = useState<any>(null);
    const [selectedGrade, setSelectedGrade] = useState<string>('grade_1');
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [compareStates, setCompareStates] = useState<[string, string]>(['Bihar', 'Kerala']);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBenchmarks();
    }, []);

    const loadBenchmarks = async () => {
        try {
            const [statesRes, nipunRes, nationalRes] = await Promise.all([
                fetch('http://localhost:8000/api/benchmarks/states'),
                fetch('http://localhost:8000/api/benchmarks/nipun'),
                fetch('http://localhost:8000/api/benchmarks/national'),
            ]);

            setStates(await statesRes.json());
            setNipun(await nipunRes.json());
            setNational(await nationalRes.json());
        } catch (error) {
            console.error('Failed to load benchmarks:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStates = selectedRegion
        ? states.filter(s => s.region === selectedRegion)
        : states;

    const state1 = states.find(s => s.state === compareStates[0]);
    const state2 = states.find(s => s.state === compareStates[1]);

    const comparisonData = state1 && state2 ? [
        { metric: 'Literacy Rate', [compareStates[0]]: state1.literacy_rate, [compareStates[1]]: state2.literacy_rate },
        { metric: 'FLN Proficiency', [compareStates[0]]: state1.fln_proficiency, [compareStates[1]]: state2.fln_proficiency },
        { metric: 'Enrollment', [compareStates[0]]: state1.enrollment_rate, [compareStates[1]]: state2.enrollment_rate },
    ] : [];

    const radarData = state1 && state2 ? [
        { subject: 'Literacy', A: state1.literacy_rate, B: state2.literacy_rate, fullMark: 100 },
        { subject: 'FLN', A: state1.fln_proficiency, B: state2.fln_proficiency, fullMark: 100 },
        { subject: 'Enrollment', A: state1.enrollment_rate, B: state2.enrollment_rate, fullMark: 100 },
        { subject: 'Retention', A: 100 - state1.dropout_rate, B: 100 - state2.dropout_rate, fullMark: 100 },
    ] : [];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">📊</div>
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
                            <h1 className="text-2xl font-bold text-gray-900">📚 Benchmark Library</h1>
                            <p className="text-gray-500 text-sm">NIPUN Bharat standards & state-wise statistics</p>
                        </div>
                        <Link href="/" className="btn-secondary">← Back</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* National Averages */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-8"
                >
                    <h2 className="text-xl font-bold mb-4">🇮🇳 National Averages</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/20 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold">{national?.literacy_rate}%</div>
                            <div className="text-sm text-indigo-100">Literacy Rate</div>
                        </div>
                        <div className="bg-white/20 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold">{national?.fln_proficiency}%</div>
                            <div className="text-sm text-indigo-100">FLN Proficiency</div>
                        </div>
                        <div className="bg-white/20 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold">{national?.enrollment_rate}%</div>
                            <div className="text-sm text-indigo-100">Enrollment Rate</div>
                        </div>
                        <div className="bg-white/20 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold">{national?.dropout_rate}%</div>
                            <div className="text-sm text-indigo-100">Dropout Rate</div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* NIPUN Bharat Benchmarks */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-lg p-6"
                    >
                        <h2 className="text-xl font-bold text-gray-800 mb-4">📖 NIPUN Bharat Benchmarks</h2>
                        <div className="flex gap-2 mb-4">
                            {['grade_1', 'grade_2', 'grade_3'].map(grade => (
                                <button
                                    key={grade}
                                    onClick={() => setSelectedGrade(grade)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedGrade === grade
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {grade.replace('_', ' ').toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {nipun?.grades?.[selectedGrade] && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-indigo-600 mb-2">📚 Reading</h3>
                                    <div className="space-y-2">
                                        {Object.entries(nipun.grades[selectedGrade].reading || {}).map(([key, value]) => (
                                            <div key={key} className="flex justify-between bg-indigo-50 rounded-lg p-3">
                                                <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                                                <span className="font-medium text-indigo-700">{value as string}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-green-600 mb-2">🔢 Numeracy</h3>
                                    <div className="space-y-2">
                                        {Object.entries(nipun.grades[selectedGrade].numeracy || {}).map(([key, value]) => (
                                            <div key={key} className="flex justify-between bg-green-50 rounded-lg p-3">
                                                <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                                                <span className="font-medium text-green-700">{value as string}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* State Comparison */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-lg p-6"
                    >
                        <h2 className="text-xl font-bold text-gray-800 mb-4">🆚 State Comparison</h2>
                        <div className="flex gap-4 mb-4">
                            <select
                                value={compareStates[0]}
                                onChange={(e) => setCompareStates([e.target.value, compareStates[1]])}
                                className="input-field flex-1"
                            >
                                {states.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                            </select>
                            <span className="self-center text-gray-500">vs</span>
                            <select
                                value={compareStates[1]}
                                onChange={(e) => setCompareStates([compareStates[0], e.target.value])}
                                className="input-field flex-1"
                            >
                                {states.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                            </select>
                        </div>

                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <Radar name={compareStates[0]} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                                    <Radar name={compareStates[1]} dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* State Rankings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">📊 State-wise FLN Proficiency</h2>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="input-field w-40"
                        >
                            <option value="">All Regions</option>
                            <option value="North">North</option>
                            <option value="South">South</option>
                            <option value="East">East</option>
                            <option value="West">West</option>
                            <option value="Central">Central</option>
                        </select>
                    </div>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredStates.sort((a, b) => b.fln_proficiency - a.fln_proficiency)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="state" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="fln_proficiency" fill="#6366f1" name="FLN Proficiency %" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* National average line indicator */}
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-4 h-1 bg-red-500"></div>
                        <span>National Average: {national?.fln_proficiency}%</span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
