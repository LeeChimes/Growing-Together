
import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/design';
import { Avatar } from '../src/design';
import { useAuthStore } from '../src/store/authStore';
import { Logo } from '../src/design/Logo';
import { queryClient } from '../src/lib/queryClient';
import { initializeDatabase } from '../src/lib/database';
import { startAutoSync } from '../src/lib/sync';
import { useNotifications } from '../src/hooks/useNotifications';
import { PerformanceMonitor } from '../src/lib/performance';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { View, ActivityIndicator, Platform } from 'react-native';

function RootLayoutContent() {
  const { user, profile, isLoading, isInitialized, initialize } = useAuthStore();
  const [dbInitialized, setDbInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  
  // Initialize notifications - now safe because QueryClientProvider is above
  const { isInitialized: notificationsInitialized } = useNotifications();

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize performance monitoring
        PerformanceMonitor.startMonitoring();
        
        // Initialize SQLite database (skip on web during debug)
        if (Platform.OS !== 'web') {
          await initializeDatabase();
        }
        setDbInitialized(true);
        
        // Initialize auth
        await initialize();
        
        // Start auto-sync (skip on web during debug)
        if (Platform.OS !== 'web') {
          startAutoSync();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();
  }, []);

  // Handle navigation after initialization
  useEffect(() => {
    if (!dbInitialized || !isInitialized || isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // User not logged in, redirect to auth
      router.replace('/auth');
    } else if (user && inAuthGroup) {
      // User logged in but on auth page, redirect to home
      router.replace('/home');
    }
  }, [user, dbInitialized, isInitialized, isLoading, segments]);

  if (!dbInitialized || !isInitialized || isLoading) {
    return (
      <ThemeProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
          <Tabs 
            screenOptions={{
              headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Logo width={140} />
                </View>
              ),
              headerRight: () => {
                // Force update when profile avatar changes by binding to key
                const key = (profile?.avatar_url || profile?.full_name || user?.email || 'User') as string;
                return (
                  <View style={{ paddingRight: 12 }} key={key}>
                    <Avatar name={profile?.full_name || user?.email || 'User'} imageUri={profile?.avatar_url as any} size="small" />
                  </View>
                );
              },
              tabBarActiveTintColor: '#22c55e',
              tabBarInactiveTintColor: '#6b7280',
              // Use consistent defaults to avoid clipping
              tabBarStyle: {
                paddingBottom: 10,
                paddingTop: 6,
                height: 66,
              },
              tabBarItemStyle: {
                paddingVertical: 0,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
                marginBottom: 0,
              },
            }}
          >
        {/* Hide auth and other non-tab screens */}
        <Tabs.Screen 
          name="index" 
          options={{ 
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }} 
        />
        <Tabs.Screen 
          name="auth" 
          options={{ 
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }} 
        />
        <Tabs.Screen 
          name="plants" 
          options={{ 
            href: null,
          }} 
        />
        <Tabs.Screen 
          name="tasks" 
          options={{ 
            href: null,
          }} 
        />
        <Tabs.Screen 
          name="rules" 
          options={{ 
            href: null,
          }} 
        />
        <Tabs.Screen 
          name="documents" 
          options={{ 
            href: null,
          }} 
        />
        <Tabs.Screen 
          name="inspections" 
          options={{ 
            href: null,
          }} 
        />
        
        {/* Tab screens */}
        <Tabs.Screen 
          name="home" 
          options={{ 
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={22} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="diary" 
          options={{ 
            title: 'Diary',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={22} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="events" 
          options={{ 
            title: 'Events',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={22} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="community" 
          options={{ 
            title: 'Community',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={22} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="gallery" 
          options={{ 
            title: 'Gallery',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="images" size={22} color={color} />
            ),
          }} 
        />
        
        <Tabs.Screen 
          name="more" 
          options={{ 
            title: 'More',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ellipsis-horizontal" size={22} color={color} />
            ),
          }} 
        />
          </Tabs>
          <StatusBar style="dark" />
        </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('Root level error:', error, errorInfo);
    }}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
