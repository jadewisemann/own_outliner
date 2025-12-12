
import type { StateCreator } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { OutlinerState } from '@/types/outliner';

export interface AuthSlice {
    user: User | null;
    session: Session | null;
    isAuthLoading: boolean;
    initializeAuth: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const createAuthSlice: StateCreator<OutlinerState, [], [], AuthSlice> = (set) => ({
    user: null,
    session: null,
    isAuthLoading: true,

    initializeAuth: async () => {
        set({ isAuthLoading: true });

        // Check active session
        const { data: { session } } = await supabase.auth.getSession();
        set({
            user: session?.user ?? null,
            session: session,
            isAuthLoading: false
        });

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
            set({
                user: session?.user ?? null,
                session: session,
                isAuthLoading: false
            });
        });
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
    }
});
