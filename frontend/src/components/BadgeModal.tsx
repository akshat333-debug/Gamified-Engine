'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/types';

interface BadgeModalProps {
    badge: Badge | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function BadgeModal({ badge, isOpen, onClose }: BadgeModalProps) {
    if (!badge) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <motion.div
                            className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 pointer-events-auto"
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 10 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            {/* Confetti Animation */}
                            <motion.div
                                className="absolute -top-10 left-1/2 -translate-x-1/2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <span className="text-6xl">🎉</span>
                            </motion.div>

                            {/* Badge Icon */}
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 flex items-center justify-center shadow-lg"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                            >
                                <span className="text-5xl">{badge.icon}</span>
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                className="text-2xl font-bold text-center text-gray-800 mb-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Badge Unlocked!
                            </motion.h2>

                            {/* Badge Name */}
                            <motion.div
                                className="text-center mb-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-full">
                                    {badge.name}
                                </span>
                            </motion.div>

                            {/* Description */}
                            <motion.p
                                className="text-gray-600 text-center mb-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                {badge.description}
                            </motion.p>

                            {/* Continue Button */}
                            <motion.button
                                onClick={onClose}
                                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Continue 🚀
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
