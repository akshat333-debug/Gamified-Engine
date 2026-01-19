'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Program } from '@/types';
import api from '@/lib/api';

interface Activity {
    id: string;
    program_id: string;
    outcome_id?: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    status: 'planned' | 'in_progress' | 'completed' | 'delayed';
    responsible_person?: string;
    resources_needed?: string;
    progress_percentage: number;
}

const STATUS_COLORS = {
    planned: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    delayed: 'bg-red-500',
};

const STATUS_LABELS = {
    planned: 'Planned',
    in_progress: 'In Progress',
    completed: 'Completed',
    delayed: 'Delayed',
};

export default function ActivitiesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newActivity, setNewActivity] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        responsible_person: '',
        status: 'planned',
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            loadPrograms();
        }
    }, [authLoading, user]);

    useEffect(() => {
        if (selectedProgram) {
            loadActivities(selectedProgram);
        }
    }, [selectedProgram]);

    const loadPrograms = async () => {
        try {
            const userPrograms = await api.listPrograms(user?.id);
            setPrograms(userPrograms);
            if (userPrograms.length > 0) {
                setSelectedProgram(userPrograms[0].id);
            }
        } catch (error) {
            console.error('Failed to load programs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadActivities = async (programId: string) => {
        try {
            const res = await fetch(`http://localhost:8000/api/activities/program/${programId}`);
            const data = await res.json();
            setActivities(data);
        } catch (error) {
            console.error('Failed to load activities:', error);
        }
    };

    const handleAddActivity = async () => {
        if (!newActivity.title || !newActivity.start_date || !newActivity.end_date) return;

        try {
            const res = await fetch('http://localhost:8000/api/activities/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newActivity,
                    program_id: selectedProgram,
                }),
            });

            if (res.ok) {
                const created = await res.json();
                setActivities([...activities, created]);
                setShowAddModal(false);
                setNewActivity({
                    title: '',
                    description: '',
                    start_date: '',
                    end_date: '',
                    responsible_person: '',
                    status: 'planned',
                });
            }
        } catch (error) {
            console.error('Failed to create activity:', error);
        }
    };

    const handleUpdateStatus = async (activityId: string, newStatus: string) => {
        try {
            const res = await fetch(`http://localhost:8000/api/activities/${activityId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setActivities(activities.map(a =>
                    a.id === activityId ? { ...a, status: newStatus as Activity['status'] } : a
                ));
            }
        } catch (error) {
            console.error('Failed to update activity:', error);
        }
    };

    // Calculate timeline range
    const getTimelineRange = () => {
        if (activities.length === 0) return { start: new Date(), end: new Date(), days: 30 };

        const dates = activities.flatMap(a => [new Date(a.start_date), new Date(a.end_date)]);
        const start = new Date(Math.min(...dates.map(d => d.getTime())));
        const end = new Date(Math.max(...dates.map(d => d.getTime())));
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return { start, end, days: Math.max(days, 30) };
    };

    const getActivityPosition = (activity: Activity, timeline: { start: Date; days: number }) => {
        const startDate = new Date(activity.start_date);
        const endDate = new Date(activity.end_date);
        const daysDiff = (startDate.getTime() - timeline.start.getTime()) / (1000 * 60 * 60 * 24);
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;

        return {
            left: `${(daysDiff / timeline.days) * 100}%`,
            width: `${(duration / timeline.days) * 100}%`,
        };
    };

    const timeline = getTimelineRange();

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">📅</div>
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
                            <h1 className="text-2xl font-bold text-gray-900">📅 Activity Tracker</h1>
                            <p className="text-gray-500 text-sm">Plan and track program activities with timeline view</p>
                        </div>
                        <Link href="/" className="btn-secondary">← Back</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Program Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6 mb-8"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Program</label>
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="input-field"
                            >
                                {programs.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary"
                            disabled={!selectedProgram}
                        >
                            + Add Activity
                        </button>
                    </div>
                </motion.div>

                {programs.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow text-gray-500">
                        <span className="text-4xl mb-4 block">📋</span>
                        <p>Create a program first to track activities</p>
                        <Link href="/" className="btn-primary mt-4 inline-block">Create Program</Link>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow text-gray-500">
                        <span className="text-4xl mb-4 block">📅</span>
                        <p>No activities yet. Add your first activity!</p>
                    </div>
                ) : (
                    <>
                        {/* Gantt Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
                        >
                            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Timeline View</h2>

                            {/* Timeline Header */}
                            <div className="flex border-b border-gray-200 pb-2 mb-4">
                                <div className="w-48 flex-shrink-0 font-medium text-gray-600">Activity</div>
                                <div className="flex-1 flex justify-between text-xs text-gray-500">
                                    <span>{timeline.start.toLocaleDateString()}</span>
                                    <span>{timeline.end.toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Timeline Rows */}
                            <div className="space-y-3">
                                {activities.map(activity => {
                                    const position = getActivityPosition(activity, timeline);
                                    return (
                                        <div key={activity.id} className="flex items-center">
                                            <div className="w-48 flex-shrink-0 pr-4">
                                                <div className="font-medium text-gray-800 truncate">{activity.title}</div>
                                                <div className="text-xs text-gray-500">{activity.responsible_person || 'Unassigned'}</div>
                                            </div>
                                            <div className="flex-1 h-8 bg-gray-100 rounded-lg relative">
                                                <div
                                                    className={`absolute top-0 h-full rounded-lg ${STATUS_COLORS[activity.status]} transition-all`}
                                                    style={{ left: position.left, width: position.width }}
                                                >
                                                    <div className="h-full flex items-center justify-center text-white text-xs font-medium truncate px-2">
                                                        {activity.progress_percentage}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Activity List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-lg p-6"
                        >
                            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Activity Details</h2>
                            <div className="space-y-4">
                                {activities.map(activity => (
                                    <div key={activity.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800">{activity.title}</h3>
                                                {activity.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                    <span>📅 {activity.start_date} → {activity.end_date}</span>
                                                    {activity.responsible_person && (
                                                        <span>👤 {activity.responsible_person}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <select
                                                value={activity.status}
                                                onChange={(e) => handleUpdateStatus(activity.id, e.target.value)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium text-white ${STATUS_COLORS[activity.status]}`}
                                            >
                                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </main>

            {/* Add Activity Modal */}
            {showAddModal && (
                <motion.div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowAddModal(false)}
                >
                    <motion.div
                        className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Activity</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Title *</label>
                                <input
                                    type="text"
                                    value={newActivity.title}
                                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g., Teacher Training Workshop"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newActivity.description}
                                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                    className="textarea-field"
                                    placeholder="Activity details..."
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        value={newActivity.start_date}
                                        onChange={(e) => setNewActivity({ ...newActivity, start_date: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="date"
                                        value={newActivity.end_date}
                                        onChange={(e) => setNewActivity({ ...newActivity, end_date: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Person</label>
                                <input
                                    type="text"
                                    value={newActivity.responsible_person}
                                    onChange={(e) => setNewActivity({ ...newActivity, responsible_person: e.target.value })}
                                    className="input-field"
                                    placeholder="Name of responsible person"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddActivity}
                                disabled={!newActivity.title || !newActivity.start_date || !newActivity.end_date}
                                className="btn-primary flex-1 disabled:opacity-50"
                            >
                                Add Activity
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
