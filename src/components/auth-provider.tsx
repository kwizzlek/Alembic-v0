'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
  initialSession?: Session | null;
};

export function AuthProvider({ children, initialSession = null }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [loading, setLoading] = useState(!initialSession);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const verifyAndSetSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Verify the session by getting the user
      const { data: { user }, error } = await supabase.auth.getUser(currentSession.access_token);
      if (error || !user) {
        console.error('Session verification failed:', error);
        setSession(null);
        setUser(null);
      } else {
        const verifiedSession = { ...currentSession, user };
        setSession(verifiedSession);
        setUser(user);
      }
      setLoading(false);
    };

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // For auth state changes, we still want to verify the session
        const { data: { user }, error } = await supabase.auth.getUser(session.access_token);
        if (!error && user) {
          const verifiedSession = { ...session, user };
          setSession(verifiedSession);
          setUser(user);
        } else {
          setSession(null);
          setUser(null);
        }
      } else {
        setSession(null);
        setUser(null);
      }
    });

    // Initial verification
    verifyAndSetSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, [initialSession, supabase.auth]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
