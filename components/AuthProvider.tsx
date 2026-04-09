'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'user' | 'restaurant';
  tier: 'free' | 'premium' | 'annual' | 'featured' | 'restaurant_premium';
  plan_uses_count: number;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isPremium: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  openAuth: (mode?: 'signin' | 'signup') => void;
  closeAuth: () => void;
  authOpen: false | 'signin' | 'signup';
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState<false | 'signin' | 'signup'>(false);

  const loadProfile = useCallback(
    async (uid: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (data) setProfile(data as Profile);
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id);
      else setProfile(null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const value: AuthCtx = {
    user,
    session,
    profile,
    loading,
    isPremium: profile?.tier === 'premium' || profile?.tier === 'annual',
    signOut,
    refreshProfile,
    openAuth: (mode = 'signin') => setAuthOpen(mode),
    closeAuth: () => setAuthOpen(false),
    authOpen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
