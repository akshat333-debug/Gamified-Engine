'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Program } from '@/types';

interface ProgramCardProps {
    program: Program;
    onDelete?: (id: string) => void;
}

export default function ProgramCard({ program, onDelete }: ProgramCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getProgressPercentage = () => {
        return ((program.current_step - 1) / 4) * 100;
    };

    return (
        <motion.div
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            layout
        >
            {/* Progress Bar */}
            <div className="h-2 bg-gray-100">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage()}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">{program.title}</h3>
                        {program.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{program.description}</p>
                        )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                        {program.status.replace('_', ' ')}
                    </span>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((step) => (
                            <div
                                key={step}
                                className={`w-2 h-2 rounded-full ${step <= program.current_step
                                        ? 'bg-indigo-500'
                                        : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-gray-500">
                        Step {program.current_step} of 5
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        href={`/program/${program.id}/step-${program.current_step}`}
                        className="flex-1 text-center py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                        {program.status === 'completed' ? 'View' : 'Continue'}
                    </Link>
                    {onDelete && (
                        <button
                            onClick={() => onDelete(program.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Last Updated */}
                <p className="text-xs text-gray-400 mt-4">
                    Updated {new Date(program.updated_at).toLocaleDateString()}
                </p>
            </div>
        </motion.div>
    );
}
