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

export const useAuthStore = create<AuthState>((set) => {
  const store: AuthState = {
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
          loading: false,
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

        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },

    signOut: async () => {
      try {
        set({ session: null, user: null });
        await supabase.auth.signOut();
      } catch (error) {
        set({ session: null, user: null });
        console.error('Erro ao sair:', error);
      }
    },
  };

  // Verifica sessão inicial ao carregar a aplicação
  supabase.auth.getSession().then(({ data }) => {
    if (data?.session) {
      set({
        session: data.session,
        user: data.session.user,
        loading: false,
      });
    } else {
      set({ session: null, user: null, loading: false });
    }
  });

  return store;
});