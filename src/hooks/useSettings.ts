import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Database } from '../lib/database.types';

export interface AccessibilitySettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
}

export interface UserSettings {
  accessibility: AccessibilitySettings;
  notifications: any; // Already handled by notification hooks
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    allowMentions: boolean;
  };
}

const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  theme: 'system',
  fontSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  screenReader: false,
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  accessibility: DEFAULT_ACCESSIBILITY_SETTINGS,
  notifications: {},
  privacy: {
    showEmail: false,
    showPhone: false,
    allowMentions: true,
  },
};

const ACCESSIBILITY_STORAGE_KEY = 'accessibility_settings';
const USER_SETTINGS_STORAGE_KEY = 'user_settings';

export const useAccessibilitySettings = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY_SETTINGS);

  const { data, isLoading } = useQuery({
    queryKey: ['accessibility-settings'],
    queryFn: async (): Promise<AccessibilitySettings> => {
      try {
        const stored = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
        if (stored) {
          return { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...JSON.parse(stored) };
        }
        return DEFAULT_ACCESSIBILITY_SETTINGS;
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
        return DEFAULT_ACCESSIBILITY_SETTINGS;
      }
    },
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<AccessibilitySettings>): Promise<AccessibilitySettings> => {
      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(updatedSettings));
      return updatedSettings;
    },
    onSuccess: (updatedSettings) => {
      setSettings(updatedSettings);
    },
  });

  return {
    settings: data || DEFAULT_ACCESSIBILITY_SETTINGS,
    isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};

export const useUserProfile = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (updates: {
      full_name?: string;
      plot_number?: string;
      phone?: string;
      emergency_contact?: string;
      avatar_url?: string;
    }) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      // First verify current password by attempting to sign in
      const { user } = useAuthStore.getState();
      if (!user?.email) throw new Error('No user email found');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Current password is incorrect');

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
  });
};

export const useDeleteAccount = () => {
  const { signOut } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('No user logged in');

      // Delete user profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Delete auth user (requires admin privileges or custom function)
      // For now, we'll just mark the profile as deleted
      // In a real app, you'd need a server-side function to delete the auth user
      
      await signOut();
    },
  });
};

export const usePrivacySettings = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState(DEFAULT_USER_SETTINGS.privacy);

  const { data, isLoading } = useQuery({
    queryKey: ['privacy-settings', user?.id],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(`${USER_SETTINGS_STORAGE_KEY}_${user?.id}`);
        if (stored) {
          const userSettings: UserSettings = JSON.parse(stored);
          return userSettings.privacy || DEFAULT_USER_SETTINGS.privacy;
        }
        return DEFAULT_USER_SETTINGS.privacy;
      } catch (error) {
        console.error('Failed to load privacy settings:', error);
        return DEFAULT_USER_SETTINGS.privacy;
      }
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<typeof DEFAULT_USER_SETTINGS.privacy>) => {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Save to AsyncStorage
      const currentUserSettings = await AsyncStorage.getItem(`${USER_SETTINGS_STORAGE_KEY}_${user?.id}`);
      const userSettings: UserSettings = currentUserSettings 
        ? { ...DEFAULT_USER_SETTINGS, ...JSON.parse(currentUserSettings) }
        : DEFAULT_USER_SETTINGS;
      
      userSettings.privacy = updatedSettings;
      
      await AsyncStorage.setItem(`${USER_SETTINGS_STORAGE_KEY}_${user?.id}`, JSON.stringify(userSettings));
      
      return updatedSettings;
    },
    onSuccess: (updatedSettings) => {
      setSettings(updatedSettings);
    },
  });

  return {
    settings: data || DEFAULT_USER_SETTINGS.privacy,
    isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};

// Font size utility functions
export const getFontSizeMultiplier = (fontSize: AccessibilitySettings['fontSize']): number => {
  switch (fontSize) {
    case 'small':
      return 0.9;
    case 'normal':
      return 1.0;
    case 'large':
      return 1.1;
    case 'extra-large':
      return 1.25;
    default:
      return 1.0;
  }
};

// Theme utility functions
export const getThemeColors = (theme: AccessibilitySettings['theme'], highContrast: boolean) => {
  const baseColors = {
    light: {
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#1f2937',
      textSecondary: '#6b7280',
      primary: '#22c55e',
      border: '#e5e7eb',
    },
    dark: {
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#94a3b8',
      primary: '#22c55e',
      border: '#334155',
    },
  };

  const selectedTheme = theme === 'system' ? 'light' : theme; // For now, default system to light
  const colors = baseColors[selectedTheme];

  if (highContrast) {
    return {
      ...colors,
      text: selectedTheme === 'light' ? '#000000' : '#ffffff',
      border: selectedTheme === 'light' ? '#000000' : '#ffffff',
    };
  }

  return colors;
};