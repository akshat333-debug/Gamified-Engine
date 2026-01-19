'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import XPBar from '@/components/XPBar';
import Leaderboard from '@/components/Leaderboard';
import StreakDisplay from '@/components/StreakDisplay';
import ProgramStatusChart from '@/components/charts/ProgramStatusChart';
import ProgressTimeline from '@/components/charts/ProgressTimeline';
import StakeholderChart from '@/components/charts/StakeholderChart';

// Mock user stats (would come from auth context in production)
const USER_STATS = {
    xp: 850,
    level: 2,
    streak: 5,
    longestStreak: 12,
    programsCompleted: 3,
    programsInProgress: 2,
};

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
                            <p className="text-gray-500 text-sm">Track your progress and achievements</p>
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
                        <XPBar currentXP={USER_STATS.xp} level={USER_STATS.level} />
                    </motion.div>

                    {/* Streak */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <StreakDisplay
                            currentStreak={USER_STATS.streak}
                            longestStreak={USER_STATS.longestStreak}
                        />
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-4 shadow-lg border border-gray-100"
                    >
                        <h3 className="text-gray-500 text-sm mb-3">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-3xl font-bold text-indigo-600">
                                    {USER_STATS.programsCompleted}
                                </div>
                                <div className="text-sm text-gray-500">Completed</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-amber-500">
                                    {USER_STATS.programsInProgress}
                                </div>
                                <div className="text-sm text-gray-500">In Progress</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <ProgramStatusChart />
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
                            { icon: '🔍', name: 'Problem Explorer', earned: true },
                            { icon: '🤝', name: 'Stakeholder Mapper', earned: true },
                            { icon: '📚', name: 'Evidence Seeker', earned: true },
                            { icon: '📊', name: 'Indicator Architect', earned: false },
                            { icon: '🏆', name: 'Program Designer', earned: false },
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
