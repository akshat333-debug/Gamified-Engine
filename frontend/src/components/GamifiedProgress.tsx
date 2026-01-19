'use client';

import { motion } from 'framer-motion';
import { STEPS, StepConfig } from '@/types';

interface GamifiedProgressProps {
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export default function GamifiedProgress({ currentStep, onStepClick }: GamifiedProgressProps) {
    const getStepStatus = (stepNumber: number) => {
        if (stepNumber < currentStep) return 'completed';
        if (stepNumber === currentStep) return 'active';
        return 'locked';
    };

    return (
        <div className="w-full py-8">
            <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                    />
                </div>

                {/* Steps */}
                {STEPS.map((step, index) => {
                    const status = getStepStatus(step.number);
                    const isClickable = status !== 'locked' && onStepClick;

                    return (
                        <div key={step.number} className="relative z-10 flex flex-col items-center">
                            <motion.button
                                onClick={() => isClickable && onStepClick(step.number)}
                                disabled={status === 'locked'}
                                className={`
                  w-16 h-16 rounded-full flex items-center justify-center text-2xl
                  shadow-lg transition-all duration-300 cursor-pointer
                  ${status === 'completed'
                                        ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white'
                                        : status === 'active'
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-200'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }
                `}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{
                                    scale: status === 'active' ? 1.1 : 1,
                                    opacity: 1
                                }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                whileHover={isClickable ? { scale: 1.15 } : {}}
                                whileTap={isClickable ? { scale: 0.95 } : {}}
                            >
                                {status === 'completed' ? '✓' : step.icon}
                            </motion.button>

                            <motion.div
                                className="mt-4 text-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                            >
                                <p className={`font-semibold text-sm ${status === 'locked' ? 'text-gray-400' : 'text-gray-800'
                                    }`}>
                                    {step.title}
                                </p>
                                <p className="text-xs text-gray-500 max-w-24">
                                    {step.description}
                                </p>
                            </motion.div>

                            {/* Lock Icon for Locked Steps */}
                            {status === 'locked' && (
                                <motion.div
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.1 + 0.3 }}
                                >
                                    🔒
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
