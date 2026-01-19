'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ProgressTimelineProps {
    data?: { date: string; programs: number; xp: number }[];
}

const DEFAULT_DATA = [
    { date: 'Week 1', programs: 2, xp: 450 },
    { date: 'Week 2', programs: 5, xp: 1200 },
    { date: 'Week 3', programs: 7, xp: 1850 },
    { date: 'Week 4', programs: 12, xp: 3200 },
    { date: 'Week 5', programs: 15, xp: 4100 },
    { date: 'Week 6', programs: 18, xp: 5300 },
    { date: 'Week 7', programs: 22, xp: 6750 },
    { date: 'Week 8', programs: 25, xp: 8200 },
];

export default function ProgressTimeline({ data = DEFAULT_DATA }: ProgressTimelineProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Progress Over Time</h3>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorPrograms" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="programs"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="url(#colorPrograms)"
                            name="Programs Completed"
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="xp"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#colorXp)"
                            name="XP Earned"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-sm text-gray-600">Programs Completed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-gray-600">XP Earned</span>
                </div>
            </div>
        </div>
    );
}
