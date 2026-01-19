'use client';

import { motion } from 'framer-motion';

interface LeaderboardEntry {
    rank: number;
    name: string;
    organization: string;
    xp: number;
    level: number;
    avatar?: string;
    isCurrentUser?: boolean;
}

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
}

const RANK_ICONS = ['🥇', '🥈', '🥉'];

// Mock data for demo
const MOCK_ENTRIES: LeaderboardEntry[] = [
    { rank: 1, name: 'Priya Sharma', organization: 'Pratham', xp: 4850, level: 5 },
    { rank: 2, name: 'Rahul Verma', organization: 'Teach For India', xp: 3720, level: 4 },
    { rank: 3, name: 'Anjali Patel', organization: 'Akshara Foundation', xp: 3100, level: 4 },
    { rank: 4, name: 'Vikram Singh', organization: 'Room to Read', xp: 2890, level: 3 },
    { rank: 5, name: 'Meera Krishnan', organization: 'Azim Premji', xp: 2450, level: 3 },
    { rank: 6, name: 'Arjun Reddy', organization: 'CRY', xp: 2100, level: 3 },
    { rank: 7, name: 'Sunita Devi', organization: 'Pratham', xp: 1850, level: 2 },
    { rank: 8, name: 'Demo User', organization: 'LogicForge', xp: 850, level: 2, isCurrentUser: true },
];

export default function Leaderboard({ entries = MOCK_ENTRIES }: LeaderboardProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    🏆 Leaderboard
                </h3>
                <p className="text-purple-200 text-sm">Top program designers this month</p>
            </div>

            <div className="divide-y divide-gray-100">
                {entries.map((entry, index) => (
                    <motion.div
                        key={entry.rank}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors ${entry.isCurrentUser ? 'bg-indigo-50' : ''
                            }`}
                    >
                        {/* Rank */}
                        <div className="w-8 text-center">
                            {entry.rank <= 3 ? (
                                <span className="text-2xl">{RANK_ICONS[entry.rank - 1]}</span>
                            ) : (
                                <span className="text-gray-400 font-semibold">#{entry.rank}</span>
                            )}
                        </div>

                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                    entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                                        'bg-gradient-to-br from-indigo-400 to-purple-500'
                            }`}>
                            {entry.name.charAt(0)}
                        </div>

                        {/* Name & Org */}
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
                                {entry.name}
                                {entry.isCurrentUser && (
                                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                                        You
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 truncate">{entry.organization}</div>
                        </div>

                        {/* XP & Level */}
                        <div className="text-right">
                            <div className="font-bold text-indigo-600">{entry.xp.toLocaleString()} XP</div>
                            <div className="text-xs text-gray-500">Level {entry.level}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="px-6 py-3 bg-gray-50 text-center">
                <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    View Full Leaderboard →
                </button>
            </div>
        </div>
    );
}
