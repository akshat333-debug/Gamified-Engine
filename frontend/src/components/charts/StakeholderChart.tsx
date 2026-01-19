'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StakeholderChartProps {
    data?: { category: string; high: number; medium: number; low: number }[];
}

const DEFAULT_DATA = [
    { category: 'Teachers', high: 12, medium: 8, low: 3 },
    { category: 'Parents', high: 8, medium: 15, low: 5 },
    { category: 'Govt Officials', high: 4, medium: 6, low: 10 },
    { category: 'NGO Partners', high: 10, medium: 12, low: 2 },
    { category: 'Students', high: 6, medium: 10, low: 8 },
];

export default function StakeholderChart({ data = DEFAULT_DATA }: StakeholderChartProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Stakeholder Engagement by Priority</h3>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <YAxis
                            type="category"
                            dataKey="category"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            width={80}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                        <Bar dataKey="high" stackId="a" fill="#ef4444" name="High Priority" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="medium" stackId="a" fill="#f59e0b" name="Medium Priority" />
                        <Bar dataKey="low" stackId="a" fill="#6b7280" name="Low Priority" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-sm text-gray-600">High</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500" />
                    <span className="text-sm text-gray-600">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-500" />
                    <span className="text-sm text-gray-600">Low</span>
                </div>
            </div>
        </div>
    );
}
