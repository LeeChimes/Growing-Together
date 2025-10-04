import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Database } from './database.types';

const getEnvVar = (key: string): string | undefined => {
  const globalObj: any = typeof globalThis !== 'undefined' ? globalThis : undefined;

  const fromProcess = globalObj?.process?.env?.[key];
  const fromExpoConfig = Constants?.expoConfig?.extra?.[key];
  const fromManifest2 = (Constants as any)?.manifest2?.extra?.[key];
  const fromManifest = (Constants as any)?.manifest?.extra?.[key];
  const fromGlobal = globalObj?.[key];

  return fromProcess ?? fromExpoConfig ?? fromManifest2 ?? fromManifest ?? fromGlobal;
};

// Supabase configuration with fallbacks for development
if (typeof globalThis !== 'undefined' && !globalThis.__import_meta_env__) {
  globalThis.__import_meta_env__ = {
    EXPO_PUBLIC_SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter that works on both web and native
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(`supabase_${key}`);
    } else if (Platform.OS !== 'web') {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(`supabase_${key}`, value);
    } else if (Platform.OS !== 'web') {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(`supabase_${key}`);
    } else if (Platform.OS !== 'web') {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { db: { schema: 'public' } }
);

// Auth helper functions
export const authHelpers = {
  async signUpWithJoinCode(email: string, password: string, joinCode: string) {
    // First verify the join code exists
    const { data: joinCodeData, error: joinCodeError } = await supabase
      .from('join_codes')
      .select('*')
      .eq('code', joinCode)
      .single();

    if (joinCodeError || !joinCodeData) {
      throw new Error('Invalid or expired join code');
    }

    // Check if join code is still valid
    if (joinCodeData.expires_at && new Date(joinCodeData.expires_at) < new Date()) {
      throw new Error('Join code has expired');
    }

    if (joinCodeData.max_uses && joinCodeData.uses_count >= joinCodeData.max_uses) {
      throw new Error('Join code has reached maximum uses');
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