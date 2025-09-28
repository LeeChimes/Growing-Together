
import React, { useEffect, useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/design';
import { Logo } from '../src/design/Logo';
import { useAuthStore } from '../src/store/authStore';
import { queryClient } from '../src/lib/queryClient';
import { initializeDatabase } from '../src/lib/database';
import { startAutoSync } from '../src/lib/sync';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const { user, isLoading, isInitialized, initialize } = useAuthStore();
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
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

  if (!dbInitialized || !isInitialized || isLoading) {
    return (
      <ThemeProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </ThemeProvider>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <ThemeProvider>
      <StatusBar style="dark" />
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
    </ThemeProvider>
  );
}
