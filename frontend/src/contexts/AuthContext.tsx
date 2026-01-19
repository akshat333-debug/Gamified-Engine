'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isAuthConfigured } from '@/lib/supabase';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    organization_id: string | null;
    role: 'admin' | 'program_manager' | 'viewer';
    total_xp: number;
    level: number;
    current_streak: number;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isConfigured: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo profile for when auth is not configured
const DEMO_PROFILE: UserProfile = {
    id: 'demo-user',
    email: 'demo@logicforge.app',
    full_name: 'Demo User',
    avatar_url: null,
    organization_id: null,
    role: 'program_manager',
    total_xp: 850,
    level: 2,
    current_streak: 5,
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(
        isAuthConfigured ? null : DEMO_PROFILE
    );
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(isAuthConfigured);

    const fetchProfile = async (userId: string) => {
        try {
            const mockProfile: UserProfile = {
                id: userId,
                email: user?.email || '',
                full_name: user?.user_metadata?.full_name || null,
                avatar_url: null,
                organization_id: null,
                role: 'program_manager',
                total_xp: 850,
                level: 2,
                current_streak: 5,
            };
            setProfile(mockProfile);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        // Skip if Supabase is not configured
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(isAuthConfigured ? null : DEMO_PROFILE);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        if (!supabase) return { error: new Error('Auth not configured') };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        if (!supabase) return { error: new Error('Auth not configured') };
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });
        return { error };
    };

    const signOut = async () => {
        if (!supabase) {
            setProfile(DEMO_PROFILE);
            return;
        }
        await supabase.auth.signOut();
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            session,
            loading,
            isConfigured: isAuthConfigured,
            signIn,
            signUp,
            signOut,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
