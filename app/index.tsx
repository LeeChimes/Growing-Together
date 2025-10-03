import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const router = useRouter();
  const { user, isLoading, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    // Redirect based on auth state
    if (user) {
      router.replace('/home');
    } else {
      router.replace('/auth');
    }
  }, [user, isLoading, isInitialized]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );
}

