'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ReactFlow, {
    Node,
    Edge,
    addEdge,
    Connection,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';

// Custom node types with colors
const NODE_TYPES = {
    impact: { color: '#dc2626', label: 'Impact', emoji: '🎯' },
    outcome: { color: '#7c3aed', label: 'Outcome', emoji: '📊' },
    output: { color: '#2563eb', label: 'Output', emoji: '📦' },
    activity: { color: '#059669', label: 'Activity', emoji: '⚡' },
    input: { color: '#d97706', label: 'Input', emoji: '💰' },
};

const initialNodes: Node[] = [
    {
        id: 'impact-1',
        type: 'default',
        position: { x: 400, y: 50 },
        data: { label: '🎯 Long-term Impact', type: 'impact' },
        style: { background: '#fee2e2', border: '2px solid #dc2626', borderRadius: '12px', padding: '10px' },
    },
    {
        id: 'outcome-1',
        type: 'default',
        position: { x: 200, y: 150 },
        data: { label: '📊 Outcome 1', type: 'outcome' },
        style: { background: '#ede9fe', border: '2px solid #7c3aed', borderRadius: '12px', padding: '10px' },
    },
    {
        id: 'outcome-2',
        type: 'default',
        position: { x: 600, y: 150 },
        data: { label: '📊 Outcome 2', type: 'outcome' },
        style: { background: '#ede9fe', border: '2px solid #7c3aed', borderRadius: '12px', padding: '10px' },
    },
    {
        id: 'output-1',
        type: 'default',
        position: { x: 100, y: 270 },
        data: { label: '📦 Output 1', type: 'output' },
        style: { background: '#dbeafe', border: '2px solid #2563eb', borderRadius: '12px', padding: '10px' },
    },
    {
        id: 'output-2',
        type: 'default',
        position: { x: 300, y: 270 },
        data: { label: '📦 Output 2', type: 'output' },
        style: { background: '#dbeafe', border: '2px solid #2563eb', borderRadius: '12px', padding: '10px' },
    },
    {
        id: 'activity-1',
        type: 'default',
        position: { x: 200, y: 390 },
        data: { label: '⚡ Activity 1', type: 'activity' },
        style: { background: '#d1fae5', border: '2px solid #059669', borderRadius: '12px', padding: '10px' },
    },
    {
        id: 'input-1',
        type: 'default',
        position: { x: 200, y: 500 },
        data: { label: '💰 Resources/Inputs', type: 'input' },
        style: { background: '#fef3c7', border: '2px solid #d97706', borderRadius: '12px', padding: '10px' },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1', source: 'outcome-1', target: 'impact-1', animated: true, style: { stroke: '#7c3aed' } },
    { id: 'e2', source: 'outcome-2', target: 'impact-1', animated: true, style: { stroke: '#7c3aed' } },
    { id: 'e3', source: 'output-1', target: 'outcome-1', style: { stroke: '#2563eb' } },
    { id: 'e4', source: 'output-2', target: 'outcome-1', style: { stroke: '#2563eb' } },
    { id: 'e5', source: 'activity-1', target: 'output-1', style: { stroke: '#059669' } },
    { id: 'e6', source: 'activity-1', target: 'output-2', style: { stroke: '#059669' } },
    { id: 'e7', source: 'input-1', target: 'activity-1', style: { stroke: '#d97706' } },
];

export default function TocBuilderPage() {
    const router = useRouter();
    const flowRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedType, setSelectedType] = useState<keyof typeof NODE_TYPES>('outcome');
    const [newNodeLabel, setNewNodeLabel] = useState('');
    const [nodeCounter, setNodeCounter] = useState(10);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
        [setEdges],
    );

    const addNode = () => {
        if (!newNodeLabel.trim()) return;

        const nodeType = NODE_TYPES[selectedType];
        const newNode: Node = {
            id: `${selectedType}-${nodeCounter}`,
            type: 'default',
            position: { x: 400, y: 300 },
            data: { label: `${nodeType.emoji} ${newNodeLabel}`, type: selectedType },
            style: {
                background: getBackgroundColor(selectedType),
                border: `2px solid ${nodeType.color}`,
                borderRadius: '12px',
                padding: '10px',
            },
        };

        setNodes((nds) => [...nds, newNode]);
        setNodeCounter((c) => c + 1);
        setNewNodeLabel('');
    };

    const getBackgroundColor = (type: string) => {
        const colors: Record<string, string> = {
            impact: '#fee2e2',
            outcome: '#ede9fe',
            output: '#dbeafe',
            activity: '#d1fae5',
            input: '#fef3c7',
        };
        return colors[type] || '#f3f4f6';
    };

    const exportToImage = async () => {
        if (flowRef.current) {
            try {
                const dataUrl = await toPng(flowRef.current, {
                    backgroundColor: '#ffffff',
                    quality: 1,
                });
                const link = document.createElement('a');
                link.download = 'theory-of-change.png';
                link.href = dataUrl;
                link.click();
            } catch (error) {
                console.error('Export failed:', error);
            }
        }
    };

    const clearCanvas = () => {
        if (confirm('Clear all nodes and edges?')) {
            setNodes([]);
            setEdges([]);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">🔗 Theory of Change Builder</h1>
                            <p className="text-gray-500 text-sm">Visualize your program logic model</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={exportToImage} className="btn-primary">
                                📥 Export PNG
                            </button>
                            <Link href="/" className="btn-secondary">← Back</Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="h-[calc(100vh-80px)]">
                {/* Add Node Panel */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-24 left-4 z-10 bg-white rounded-xl shadow-lg p-4 w-72"
                >
                    <h3 className="font-semibold text-gray-800 mb-3">Add Node</h3>
                    <div className="space-y-3">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as keyof typeof NODE_TYPES)}
                            className="input-field text-sm"
                        >
                            {Object.entries(NODE_TYPES).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value.emoji} {value.label}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={newNodeLabel}
                            onChange={(e) => setNewNodeLabel(e.target.value)}
                            placeholder="Node label..."
                            className="input-field text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addNode()}
                        />
                        <button onClick={addNode} className="btn-primary w-full text-sm">
                            + Add to Canvas
                        </button>
                        <button onClick={clearCanvas} className="btn-secondary w-full text-sm text-red-600 border-red-300 hover:bg-red-50">
                            🗑️ Clear All
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-xs font-medium text-gray-500 mb-2">LEGEND</h4>
                        <div className="space-y-1">
                            {Object.entries(NODE_TYPES).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: value.color }}></div>
                                    <span>{value.emoji} {value.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* React Flow Canvas */}
                <div ref={flowRef} className="h-full w-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        attributionPosition="bottom-right"
                    >
                        <Controls />
                        <MiniMap
                            nodeColor={(node) => NODE_TYPES[node.data?.type as keyof typeof NODE_TYPES]?.color || '#ccc'}
                            maskColor="rgba(0,0,0,0.1)"
                        />
                        <Background color="#e5e7eb" gap={20} />
                        <Panel position="top-right">
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs text-gray-600">
                                <p>💡 Drag nodes to position</p>
                                <p>🔗 Connect by dragging from handles</p>
                                <p>🗑️ Select + Delete to remove</p>
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>
            </main>
        </div>
    );
}
