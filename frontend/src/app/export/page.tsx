'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Program } from '@/types';
import axios from 'axios';

export default function ExportPage() {
    const { user } = useAuth();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const data = await api.listPrograms(user?.id);
                setPrograms(data);
                if (data.length > 0 && typeof data[0].id === 'number') setSelectedProgram(data[0].id);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPrograms();
    }, [user?.id]);

    const handleExport = async (format: string, donorType?: string) => {
        if (!selectedProgram) {
            setMessage({ type: 'error', text: 'Please select a program first' });
            return;
        }

        setExporting(format + (donorType || ''));
        setMessage(null);

        try {
            let url = `${API_URL}/api/export/${selectedProgram}`;
            let filename = `program-${selectedProgram}`;

            switch (format) {
                case 'pdf':
                    url += '/pdf';
                    filename += '.pdf';
                    break;
                case 'csv':
                    url += '/csv';
                    filename += '.csv';
                    break;
                case 'json':
                    url += '/json';
                    filename += '.json';
                    break;
                case 'donor':
                    url += `/donor/${donorType}`;
                    filename += `-${donorType}.txt`;
                    break;
            }

            const response = await axios.get(url, { responseType: 'blob' });

            // Create download link
            const blob = new Blob([response.data]);
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setMessage({ type: 'success', text: `Successfully exported as ${format.toUpperCase()}${donorType ? ` (${donorType.toUpperCase()})` : ''}` });
        } catch (error: any) {
            console.error('Export error:', error);
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Export failed. Please try again.' });
        } finally {
            setExporting(null);
        }
    };

    const exportFormats = [
        {
            id: 'pdf',
            name: 'PDF Document',
            icon: '📄',
            description: 'Comprehensive programme design document with all details',
            color: '#ef4444'
        },
        {
            id: 'csv',
            name: 'CSV Spreadsheet',
            icon: '📊',
            description: 'Outcomes and indicators in spreadsheet format',
            color: '#22c55e'
        },
        {
            id: 'json',
            name: 'JSON Data',
            icon: '🔗',
            description: 'Complete programme data for integration',
            color: '#f59e0b'
        }
    ];

    const donorFormats = [
        {
            id: 'usaid',
            name: 'USAID Format',
            icon: '🇺🇸',
            description: 'Standard USAID Results Framework format',
            color: '#3b82f6'
        },
        {
            id: 'gates',
            name: 'Gates Foundation',
            icon: '🏛️',
            description: 'Gates Foundation reporting template',
            color: '#8b5cf6'
        },
        {
            id: 'dfid',
            name: 'FCDO/DFID Format',
            icon: '🇬🇧',
            description: 'UK FCDO logframe format',
            color: '#06b6d4'
        }
    ];

    if (loading) {
        return (
            <div className="export-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your programs...</p>
                </div>
                <style jsx>{styles}</style>
            </div>
        );
    }

    return (
        <div className="export-page">
            <motion.div
                className="export-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="header">
                    <h1>📥 Export Center</h1>
                    <p>Export your programme designs in various formats for different purposes</p>
                </div>

                {/* Program Selector */}
                <div className="program-selector">
                    <label>Select Programme to Export:</label>
                    <select
                        value={selectedProgram || ''}
                        onChange={(e) => setSelectedProgram(Number(e.target.value))}
                    >
                        <option value="" disabled>Choose a programme...</option>
                        {programs.map((program) => (
                            <option key={program.id} value={program.id}>
                                {program.title || `Program ${program.id}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Message Display */}
                {message && (
                    <motion.div
                        className={`message ${message.type}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {message.type === 'success' ? '✅' : '❌'} {message.text}
                    </motion.div>
                )}

                {/* Standard Formats */}
                <section className="export-section">
                    <h2>📁 Standard Formats</h2>
                    <div className="format-grid">
                        {exportFormats.map((format, index) => (
                            <motion.div
                                key={format.id}
                                className="format-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="format-icon" style={{ background: `${format.color}20` }}>
                                    <span>{format.icon}</span>
                                </div>
                                <div className="format-info">
                                    <h3>{format.name}</h3>
                                    <p>{format.description}</p>
                                </div>
                                <button
                                    className="export-btn"
                                    style={{ background: format.color }}
                                    onClick={() => handleExport(format.id)}
                                    disabled={!selectedProgram || exporting === format.id}
                                >
                                    {exporting === format.id ? (
                                        <>Exporting...</>
                                    ) : (
                                        <>⬇️ Export</>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Donor Formats */}
                <section className="export-section">
                    <h2>🏢 Donor-Specific Formats</h2>
                    <p className="section-desc">Export in formats tailored for specific donors and funders</p>
                    <div className="format-grid">
                        {donorFormats.map((format, index) => (
                            <motion.div
                                key={format.id}
                                className="format-card donor-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="format-icon" style={{ background: `${format.color}20` }}>
                                    <span>{format.icon}</span>
                                </div>
                                <div className="format-info">
                                    <h3>{format.name}</h3>
                                    <p>{format.description}</p>
                                </div>
                                <button
                                    className="export-btn"
                                    style={{ background: format.color }}
                                    onClick={() => handleExport('donor', format.id)}
                                    disabled={!selectedProgram || exporting === 'donor' + format.id}
                                >
                                    {exporting === 'donor' + format.id ? (
                                        <>Exporting...</>
                                    ) : (
                                        <>⬇️ Export</>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* No Programs State */}
                {programs.length === 0 && (
                    <div className="no-programs">
                        <span>📋</span>
                        <h3>No Programmes Found</h3>
                        <p>Create a programme first or use a template to get started</p>
                        <a href="/templates" className="template-link">Browse Templates →</a>
                    </div>
                )}
            </motion.div>

            <style jsx>{styles}</style>
        </div>
    );
}

const styles = `
  .export-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
    padding: 40px 20px;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    color: #888;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(76, 201, 240, 0.2);
    border-top-color: #4cc9f0;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .export-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 40px;
  }

  .header h1 {
    font-size: 2.5rem;
    color: #fff;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #4cc9f0 0%, #7b68ee 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header p {
    color: #888;
    font-size: 1.1rem;
  }

  .program-selector {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 25px;
    margin-bottom: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .program-selector label {
    display: block;
    color: #fff;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .program-selector select {
    width: 100%;
    padding: 14px 18px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23888' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 15px center;
    background-size: 20px;
  }

  .program-selector select:focus {
    outline: none;
    border-color: #4cc9f0;
  }

  .message {
    padding: 15px 20px;
    border-radius: 10px;
    margin-bottom: 25px;
    font-weight: 500;
  }

  .message.success {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  .message.error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  .export-section {
    margin-bottom: 40px;
  }

  .export-section h2 {
    color: #fff;
    font-size: 1.4rem;
    margin-bottom: 10px;
  }

  .section-desc {
    color: #888;
    margin-bottom: 20px;
    font-size: 0.95rem;
  }

  .format-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }

  .format-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 25px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 15px;
    transition: all 0.3s;
  }

  .format-card:hover {
    border-color: rgba(76, 201, 240, 0.3);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }

  .format-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .format-info h3 {
    color: #fff;
    font-size: 1.1rem;
    margin: 0;
  }

  .format-info p {
    color: #888;
    font-size: 0.9rem;
    margin: 5px 0 0 0;
    line-height: 1.4;
  }

  .export-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.95rem;
    margin-top: auto;
  }

  .export-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .export-btn:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  }

  .no-programs {
    text-align: center;
    padding: 60px 20px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 20px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
  }

  .no-programs span {
    font-size: 3rem;
    display: block;
    margin-bottom: 15px;
  }

  .no-programs h3 {
    color: #fff;
    margin-bottom: 10px;
  }

  .no-programs p {
    color: #888;
    margin-bottom: 20px;
  }

  .template-link {
    color: #4cc9f0;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
  }

  .template-link:hover {
    color: #7b68ee;
  }

  @media (max-width: 768px) {
    .header h1 {
      font-size: 2rem;
    }

    .format-grid {
      grid-template-columns: 1fr;
    }
  }
`;
