'use client';

import { motion } from 'framer-motion';

interface AIButtonProps {
    onClick: () => void;
    loading?: boolean;
    label?: string;
    icon?: string;
    className?: string;
}

export default function AIButton({
    onClick,
    loading = false,
    label = 'Refine with AI',
    icon = '✨',
    className = ''
}: AIButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={loading}
            className={`
        relative px-6 py-3 rounded-xl font-semibold text-white
        bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400
        shadow-lg hover:shadow-xl
        disabled:opacity-70 disabled:cursor-not-allowed
        overflow-hidden
        ${className}
      `}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
        >
            {/* Shimmer Effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={loading ? { x: '100%' } : { x: '-100%' }}
                transition={loading ? { repeat: Infinity, duration: 1.5, ease: 'linear' } : {}}
            />

            {/* Content */}
            <span className="relative flex items-center gap-2">
                {loading ? (
                    <>
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                            ⚡
                        </motion.span>
                        Processing...
                    </>
                ) : (
                    <>
                        <span>{icon}</span>
                        {label}
                    </>
                )}
            </span>
        </motion.button>
    );
}
