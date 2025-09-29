import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase, authHelpers } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, joinCode: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    const { user } = await authHelpers.signIn(email, password);
    set({ user });
    await get().refreshProfile();
    set({ isLoading: false });
  },

  signUp: async (email: string, password: string, joinCode: string, fullName: string) => {
    set({ isLoading: true });
    const { user } = await authHelpers.signUpWithJoinCode(email, password, joinCode);
    
    if (user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          role: user.user_metadata.role || 'member',
          is_approved: false,
        });
        
      if (profileError) throw profileError;
      
      set({ user });
      await get().refreshProfile();
    }
    set({ isLoading: false });
  },

  signOut: async () => {
    set({ isLoading: true });
    await authHelpers.signOut();
    set({ user: null, profile: null });
    set({ isLoading: false });
  },

  refreshProfile: async () => {
    try {
      const profile = await authHelpers.getCurrentProfile();
      set({ profile });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user });
        await get().refreshProfile();
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          set({ user: session.user });
          await get().refreshProfile();
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null });
        }
      });
      
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isInitialized: true });
    }
  },
}));