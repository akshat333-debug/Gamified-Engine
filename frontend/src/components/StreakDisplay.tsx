'use client';

import { motion } from 'framer-motion';

interface StreakDisplayProps {
    currentStreak: number;
    longestStreak?: number;
}

export default function StreakDisplay({ currentStreak, longestStreak = 0 }: StreakDisplayProps) {
    const isOnFire = currentStreak >= 7;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-xl p-4 ${isOnFire
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    : 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800'
                }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-4xl">
                        {isOnFire ? '🔥' : '⚡'}
                    </div>
                    <div>
                        <div className={`text-2xl font-bold ${isOnFire ? 'text-white' : 'text-orange-600'}`}>
                            {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
                        </div>
                        <div className={`text-sm ${isOnFire ? 'text-orange-100' : 'text-orange-500'}`}>
                            Current Streak
                        </div>
                    </div>
                </div>

                {longestStreak > 0 && (
                    <div className={`text-right ${isOnFire ? 'text-orange-100' : 'text-orange-500'}`}>
                        <div className="text-sm">Best</div>
                        <div className="font-bold">{longestStreak} days</div>
                    </div>
                )}
            </div>

            {/* Streak Progress */}
            <div className="mt-3">
                <div className="flex gap-1">
                    {[...Array(7)].map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 h-2 rounded-full ${i < (currentStreak % 7 || (currentStreak >= 7 ? 7 : 0))
                                    ? isOnFire ? 'bg-white' : 'bg-orange-500'
                                    : isOnFire ? 'bg-white/30' : 'bg-orange-200'
                                }`}
                        />
                    ))}
                </div>
                <div className={`text-xs mt-1 ${isOnFire ? 'text-orange-100' : 'text-orange-400'}`}>
                    {currentStreak >= 7
                        ? '🎉 You\'re on fire! Keep it up!'
                        : `${7 - (currentStreak % 7)} more days for bonus XP`}
                </div>
            </div>
        </motion.div>
    );
}
