'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Program } from '@/types';
import { ProgramCard } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProgramTitle, setNewProgramTitle] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Wait for auth to load, then load programs
    if (!authLoading) {
      loadPrograms();
    }
  }, [authLoading, user]);

  const loadPrograms = async () => {
    try {
      // Pass user_id to filter programs if logged in
      const data = await api.listPrograms(user?.id);
      setPrograms(data);
    } catch (error) {
      console.error('Failed to load programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    // Require login to create programs
    if (!user) {
      router.push('/login');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateProgram = async () => {
    if (!newProgramTitle.trim()) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setCreating(true);
    try {
      const program = await api.createProgram({
        title: newProgramTitle,
        description: newProgramDescription || undefined,
        user_id: user.id, // Associate with logged-in user
      });
      setPrograms([program, ...programs]);
      setShowCreateModal(false);
      setNewProgramTitle('');
      setNewProgramDescription('');
      // Navigate to the first step
      window.location.href = `/program/${program.id}/step-1`;
    } catch (error) {
      console.error('Failed to create program:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
      await api.deleteProgram(id);
      setPrograms(programs.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete program:', error);
    }
  };

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Welcome Banner for logged-in users */}
      {user && profile && (
        <motion.div
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome, {profile.full_name || 'Program Designer'}! 👋</h2>
              <p className="text-indigo-100">Ready to design impactful education programs?</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{profile.total_xp} XP</div>
              <div className="text-indigo-200">Level {profile.level}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Guest Banner */}
      {!user && (
        <motion.div
          className="bg-gradient-to-r from-gray-600 to-gray-800 rounded-2xl p-6 mb-8 text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome to LogicForge! 🔮</h2>
              <p className="text-gray-300">Sign in to create and save your programs</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Sign In to Get Started
            </button>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">Design Impactful Programs</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create evidence-based education programs with AI-powered guidance.
          Follow our 5-step framework to build measurable interventions.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-3xl font-bold">{programs.length}</div>
          <div className="text-indigo-100">{user ? 'Your Programs' : 'Demo Programs'}</div>
        </div>
        <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-3xl font-bold">
            {programs.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-green-100">Completed</div>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl p-6 text-white">
          <div className="text-4xl mb-2">🚀</div>
          <div className="text-3xl font-bold">
            {programs.filter(p => p.status === 'in_progress').length}
          </div>
          <div className="text-orange-100">In Progress</div>
        </div>
      </motion.div>

      {/* Programs Section */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          {user ? 'Your Programs' : 'Sample Programs'}
        </h2>
        <motion.button
          onClick={handleCreateClick}
          className="btn-primary flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>➕</span> New Program
          {!user && <span className="text-xs opacity-75">(Requires Sign In)</span>}
        </motion.button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onDelete={handleDeleteProgram}
            />
          ))}
        </div>
      ) : (
        <motion.div
          className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {user ? 'No programs yet' : 'Sign in to see your programs'}
          </h3>
          <p className="text-gray-500 mb-6">
            {user
              ? 'Create your first program to get started!'
              : 'Create an account to design and save your programs'}
          </p>
          <button
            onClick={handleCreateClick}
            className="btn-primary"
          >
            {user ? 'Create Your First Program' : 'Sign In to Get Started'}
          </button>
        </motion.div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Create New Program</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Title *
              </label>
              <input
                type="text"
                value={newProgramTitle}
                onChange={(e) => setNewProgramTitle(e.target.value)}
                placeholder="e.g., Literacy Enhancement Initiative"
                className="input-field"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={newProgramDescription}
                onChange={(e) => setNewProgramDescription(e.target.value)}
                placeholder="Brief description of your program..."
                className="textarea-field"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProgram}
                disabled={!newProgramTitle.trim() || creating}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create & Start'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
