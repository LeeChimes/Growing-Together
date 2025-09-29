import { createClient } from '@supabase/supabase-js';
// Conditional import for web compatibility
let SecureStore: any;

if (typeof window === 'undefined') {
  // Native platform
  SecureStore = require('expo-secure-store');
} else {
  // Web platform - use localStorage
  SecureStore = {
    setItemAsync: async (key: string, value: string) => {
      localStorage.setItem(`secure_${key}`, value);
    },
    getItemAsync: async (key: string) => {
      return localStorage.getItem(`secure_${key}`);
    },
    deleteItemAsync: async (key: string) => {
      localStorage.removeItem(`secure_${key}`);
    },
  };
}
import { Database } from './database.types';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string): string | null => {
    return SecureStore.getItemAsync(key) as any;
  },
  setItem: (key: string, value: string): void => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): void => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper functions
export const authHelpers = {
  async signUpWithJoinCode(email: string, password: string, joinCode: string) {
    // First verify the join code exists
    const { data: joinCodeData, error: joinCodeError } = await supabase
      .from('join_codes')
      .select('*')
      .eq('code', joinCode)
      .eq('is_active', true)
      .single();

    if (joinCodeError || !joinCodeData) {
      throw new Error('Invalid or expired join code');
    }

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          join_code: joinCode,
          role: joinCodeData.role || 'member',
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getCurrentProfile() {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },
};