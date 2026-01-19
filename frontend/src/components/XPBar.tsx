'use client';

import { motion } from 'framer-motion';

interface XPBarProps {
    currentXP: number;
    level: number;
    nextLevelXP?: number;
}

const LEVELS = [
    { level: 1, xpRequired: 0, title: 'Rookie' },
    { level: 2, xpRequired: 200, title: 'Explorer' },
    { level: 3, xpRequired: 500, title: 'Strategist' },
    { level: 4, xpRequired: 1000, title: 'Architect' },
    { level: 5, xpRequired: 2000, title: 'Master' },
    { level: 6, xpRequired: 4000, title: 'Legend' },
    { level: 7, xpRequired: 7000, title: 'Champion' },
    { level: 8, xpRequired: 10000, title: 'Grandmaster' },
];

export default function XPBar({ currentXP, level }: XPBarProps) {
    const currentLevel = LEVELS.find(l => l.level === level) || LEVELS[0];
    const nextLevel = LEVELS.find(l => l.level === level + 1);

    const xpInCurrentLevel = nextLevel
        ? currentXP - currentLevel.xpRequired
        : currentLevel.xpRequired;
    const xpNeededForNextLevel = nextLevel
        ? nextLevel.xpRequired - currentLevel.xpRequired
        : currentLevel.xpRequired;
    const progress = nextLevel
        ? (xpInCurrentLevel / xpNeededForNextLevel) * 100
        : 100;

    return (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                        {level}
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Level {level}</div>
                        <div className="font-semibold text-indigo-600">{currentLevel.title}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        {currentXP.toLocaleString()} XP
                    </div>
                    {nextLevel && (
                        <div className="text-xs text-gray-500">
                            {(nextLevel.xpRequired - currentXP).toLocaleString()} XP to Level {nextLevel.level}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
                >
                    <div className="absolute inset-0 bg-white/30 animate-pulse" />
                </motion.div>
            </div>

            {/* Level Indicators */}
            <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Level {level}</span>
                {nextLevel && <span>Level {nextLevel.level}</span>}
            </div>
        </div>
    );
}
