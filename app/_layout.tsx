
import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/design';
import { Logo } from '../src/design/Logo';
import { useAuthStore } from '../src/store/authStore';
import { queryClient } from '../src/lib/queryClient';
import { initializeDatabase } from '../src/lib/database';
import { startAutoSync } from '../src/lib/sync';
import { useNotifications } from '../src/hooks/useNotifications';
import { PerformanceMonitor } from '../src/lib/performance';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutContent() {
  const { user, isLoading, isInitialized, initialize } = useAuthStore();
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
        
        // Initialize SQLite database
        await initializeDatabase();
        setDbInitialized(true);
        
        // Initialize auth
        await initialize();
        
        // Start auto-sync
        startAutoSync();
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
              headerTitle: () => <Logo width={160} />,
              tabBarActiveTintColor: '#22c55e',
              tabBarInactiveTintColor: '#6b7280',
              tabBarStyle: {
                paddingBottom: 8,
                paddingTop: 8,
                height: 64,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
              },
            }}
          >
        {/* Hide auth and other non-tab screens */}
        <Tabs.Screen 
          name="auth" 
          options={{ 
            href: null,
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
              <Ionicons name="home" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="diary" 
          options={{ 
            title: 'Diary',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="events" 
          options={{ 
            title: 'Events',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="community" 
          options={{ 
            title: 'Community',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }} 
        />
        <Tabs.Screen 
          name="gallery" 
          options={{ 
            title: 'Gallery',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="images" size={size} color={color} />
            ),
          }} 
        />
        
        <Tabs.Screen 
          name="more" 
          options={{ 
            title: 'More',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ellipsis-horizontal" size={size} color={color} />
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
