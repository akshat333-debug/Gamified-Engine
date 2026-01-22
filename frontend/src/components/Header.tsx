'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
    const { user, profile, signOut } = useAuth();

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl">🔮</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        LogicForge
                    </span>
                </Link>
                <nav className="flex items-center gap-3">
                    <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
                        Programs
                    </Link>
                    <Link href="/templates" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
                        📋 Templates
                    </Link>
                    <Link href="/toc-builder" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
                        🔗 ToC
                    </Link>
                    <Link href="/benchmarks" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
                        📚 Benchmarks
                    </Link>
                    <Link href="/activities" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
                        📅 Activities
                    </Link>
                    <Link href="/forms" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
                        📝 Forms
                    </Link>
                    <Link href="/export" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
                        📥 Export
                    </Link>
                    <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm">
                        📊 Analytics
                    </Link>

                    {user ? (
                        <>
                            {/* XP Badge - only show when logged in */}
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
                                <span className="text-sm font-medium text-indigo-700">
                                    {profile?.total_xp || 0} XP
                                </span>
                                <span className="text-xs text-indigo-500">
                                    Lvl {profile?.level || 1}
                                </span>
                            </div>

                            {/* User Menu */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                    {profile?.full_name || user.email?.split('@')[0]}
                                </span>
                                <button
                                    onClick={() => signOut()}
                                    className="px-4 py-2 text-gray-600 hover:text-red-600 text-sm font-medium transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow text-sm font-medium"
                        >
                            Sign In
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
