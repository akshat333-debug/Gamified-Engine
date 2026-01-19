'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Program } from '@/types';
import api from '@/lib/api';
import XPBar from '@/components/XPBar';
import Leaderboard from '@/components/Leaderboard';
import StreakDisplay from '@/components/StreakDisplay';
import ProgramStatusChart from '@/components/charts/ProgramStatusChart';
import ProgressTimeline from '@/components/charts/ProgressTimeline';
import StakeholderChart from '@/components/charts/StakeholderChart';

export default function DashboardPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                // Redirect to login if not authenticated
                router.push('/login');
                return;
            }
            loadUserData();
        }
    }, [authLoading, user]);

    const loadUserData = async () => {
        try {
            // Load user's programs
            const userPrograms = await api.listPrograms(user?.id);
            setPrograms(userPrograms);
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate user-specific stats from their programs
    const userStats = {
        xp: profile?.total_xp || 0,
        level: profile?.level || 1,
        streak: profile?.current_streak || 0,
        longestStreak: 0, // Would come from backend
        programsCompleted: programs.filter(p => p.status === 'completed').length,
        programsInProgress: programs.filter(p => p.status === 'in_progress').length,
        programsDraft: programs.filter(p => p.status === 'draft').length,
    };

    // Generate chart data from user's programs
    const programStatusData = [
        { name: 'Completed', value: userStats.programsCompleted, color: '#10b981' },
        { name: 'In Progress', value: userStats.programsInProgress, color: '#6366f1' },
        { name: 'Draft', value: userStats.programsDraft, color: '#9ca3af' },
    ].filter(item => item.value > 0);

    // Show loading while auth is checking
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // Redirect if not logged in
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                📊 {profile?.full_name || 'Your'} Analytics
                            </h1>
                            <p className="text-gray-500 text-sm">Track your personal progress and achievements</p>
                        </div>
                        <Link
                            href="/"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            ← Back to Programs
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Top Stats Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* XP Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <XPBar currentXP={userStats.xp} level={userStats.level} />
                    </motion.div>

                    {/* Streak */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <StreakDisplay
                            currentStreak={userStats.streak}
                            longestStreak={userStats.longestStreak}
                        />
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-4 shadow-lg border border-gray-100"
                    >
                        <h3 className="text-gray-500 text-sm mb-3">Your Programs</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-3xl font-bold text-green-600">
                                    {userStats.programsCompleted}
                                </div>
                                <div className="text-sm text-gray-500">Completed</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-indigo-600">
                                    {userStats.programsInProgress}
                                </div>
                                <div className="text-sm text-gray-500">Active</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-400">
                                    {userStats.programsDraft}
                                </div>
                                <div className="text-sm text-gray-500">Drafts</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* No programs message */}
                {programs.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200"
                    >
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No analytics yet</h3>
                        <p className="text-gray-500 mb-6">Create your first program to start tracking progress!</p>
                        <Link href="/" className="btn-primary">
                            Create Your First Program
                        </Link>
                    </motion.div>
                ) : (
                    <>
                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <ProgramStatusChart data={programStatusData.length > 0 ? programStatusData : undefined} />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <ProgressTimeline />
                            </motion.div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <StakeholderChart />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <Leaderboard entries={[]} />
                            </motion.div>
                        </div>
                    </>
                )}

                {/* Achievement Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white"
                >
                    <h3 className="text-xl font-bold mb-4">🏆 Your Badges</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {[
                            { icon: '🔍', name: 'Problem Explorer', earned: userStats.programsCompleted >= 1 || userStats.programsInProgress >= 1 },
                            { icon: '🤝', name: 'Stakeholder Mapper', earned: userStats.programsCompleted >= 1 },
                            { icon: '📚', name: 'Evidence Seeker', earned: userStats.programsCompleted >= 2 },
                            { icon: '📊', name: 'Indicator Architect', earned: userStats.programsCompleted >= 3 },
                            { icon: '🏆', name: 'Program Designer', earned: userStats.programsCompleted >= 5 },
                        ].map((badge, index) => (
                            <div
                                key={index}
                                className={`text-center p-4 rounded-xl ${badge.earned
                                        ? 'bg-white/20'
                                        : 'bg-white/5 opacity-50'
                                    }`}
                            >
                                <div className="text-3xl mb-2">{badge.icon}</div>
                                <div className="text-xs font-medium">{badge.name}</div>
                                {badge.earned && (
                                    <div className="text-xs text-green-300 mt-1">✓ Earned</div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
