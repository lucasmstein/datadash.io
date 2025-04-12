import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    });
  },
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        session: data.session,
        user: data.user,
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },
  signInWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Note: We don't set the session here because OAuth redirects to a new page
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },
  signOut: async () => {
    try {
      // Clear local state first
      set({ user: null, session: null });
      
      // Then attempt server-side logout
      await supabase.auth.signOut();
    } catch (error) {
      // Even if server-side logout fails, we've already cleared local state
      console.error('Error during sign out:', error);
    }
  },
}));