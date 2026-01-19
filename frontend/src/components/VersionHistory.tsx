'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface Version {
    id: string;
    program_id: number;
    version_number: number;
    changes_summary: string;
    created_by: string;
    created_at: string;
    data_snapshot: object;
}

interface VersionHistoryProps {
    programId: number;
    isOpen: boolean;
    onClose: () => void;
    onRestore?: (version: Version) => void;
}

export default function VersionHistory({ programId, isOpen, onClose, onRestore }: VersionHistoryProps) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const fetchVersions = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/collaboration/versions/${programId}`);
            setVersions(response.data);
        } catch (error) {
            console.error('Error fetching versions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchVersions();
        }
    }, [isOpen, programId]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRestore = async (version: Version) => {
        if (confirm(`Are you sure you want to restore to version ${version.version_number}?`)) {
            try {
                await axios.post(`${API_URL}/api/collaboration/versions/${version.id}/restore`);
                if (onRestore) {
                    onRestore(version);
                }
                onClose();
            } catch (error) {
                console.error('Error restoring version:', error);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="version-overlay" onClick={onClose}>
            <motion.div
                className="version-modal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="version-header">
                    <h3>📜 Version History</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="version-content">
                    {loading ? (
                        <div className="loading">Loading versions...</div>
                    ) : versions.length === 0 ? (
                        <div className="no-versions">
                            <p>📋 No version history yet</p>
                            <span>Changes will be tracked automatically</span>
                        </div>
                    ) : (
                        <div className="version-timeline">
                            {versions.map((version, index) => (
                                <motion.div
                                    key={version.id}
                                    className={`version-item ${selectedVersion?.id === version.id ? 'selected' : ''} ${index === 0 ? 'current' : ''}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedVersion(version)}
                                >
                                    <div className="version-indicator">
                                        <div className="version-dot" />
                                        {index !== versions.length - 1 && <div className="version-line" />}
                                    </div>

                                    <div className="version-details">
                                        <div className="version-header-row">
                                            <span className="version-number">
                                                v{version.version_number}
                                                {index === 0 && <span className="current-badge">Current</span>}
                                            </span>
                                            <span className="version-date">{formatDate(version.created_at)}</span>
                                        </div>
                                        <p className="version-summary">{version.changes_summary}</p>
                                        <span className="version-author">by {version.created_by}</span>

                                        {selectedVersion?.id === version.id && index !== 0 && (
                                            <motion.div
                                                className="version-actions"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                            >
                                                <button
                                                    className="restore-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRestore(version);
                                                    }}
                                                >
                                                    🔄 Restore this version
                                                </button>
                                                <button
                                                    className="preview-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Could open a preview modal
                                                    }}
                                                >
                                                    👁️ Preview
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <style jsx>{`
          .version-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 20px;
          }

          .version-modal {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 20px;
            width: 100%;
            max-width: 600px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          }

          .version-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 25px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .version-header h3 {
            margin: 0;
            color: #fff;
            font-size: 1.3rem;
          }

          .close-btn {
            background: none;
            border: none;
            color: #888;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 5px;
            transition: all 0.2s;
          }

          .close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
          }

          .version-content {
            flex: 1;
            overflow-y: auto;
            padding: 25px;
          }

          .loading, .no-versions {
            text-align: center;
            color: #888;
            padding: 40px;
          }

          .no-versions p {
            font-size: 1.2rem;
            margin-bottom: 8px;
          }

          .version-timeline {
            position: relative;
          }

          .version-item {
            display: flex;
            gap: 15px;
            cursor: pointer;
            padding: 10px;
            border-radius: 12px;
            transition: background 0.2s;
          }

          .version-item:hover {
            background: rgba(255, 255, 255, 0.05);
          }

          .version-item.selected {
            background: rgba(76, 201, 240, 0.1);
            border: 1px solid rgba(76, 201, 240, 0.3);
          }

          .version-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 20px;
          }

          .version-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #4cc9f0;
            border: 3px solid #1a1a2e;
            box-shadow: 0 0 10px rgba(76, 201, 240, 0.5);
          }

          .version-item.current .version-dot {
            background: #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
          }

          .version-line {
            flex: 1;
            width: 2px;
            background: linear-gradient(180deg, #4cc9f0 0%, rgba(76, 201, 240, 0.2) 100%);
            margin-top: 5px;
          }

          .version-details {
            flex: 1;
            padding-bottom: 20px;
          }

          .version-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .version-number {
            color: #fff;
            font-weight: 700;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .current-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #fff;
            font-size: 0.7rem;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 20px;
          }

          .version-date {
            color: #666;
            font-size: 0.85rem;
          }

          .version-summary {
            color: #c0c0c0;
            margin: 0 0 8px 0;
            font-size: 0.95rem;
            line-height: 1.4;
          }

          .version-author {
            color: #7b68ee;
            font-size: 0.8rem;
          }

          .version-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
          }

          .restore-btn, .preview-btn {
            padding: 8px 15px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.2s;
          }

          .restore-btn {
            background: linear-gradient(135deg, #4cc9f0 0%, #7b68ee 100%);
            color: #fff;
          }

          .restore-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(76, 201, 240, 0.3);
          }

          .preview-btn {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .preview-btn:hover {
            background: rgba(255, 255, 255, 0.15);
          }
        `}</style>
            </motion.div>
        </div>
    );
}
